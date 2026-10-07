import mongoose from "mongoose";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTaskAction, deleteTaskAction } from "@/lib/task-actions";
import { getDueDateStatus } from "@/lib/task-utils";
import { canUserViewAllTasks, getUserRoleInWorkspace } from "@/lib/workspace-permissions";
import DashboardLayout from "@/components/DashboardLayout";
import TaskBoard from "@/components/TaskBoard";
import TaskForm from "@/components/TaskForm";
import Task from "@/models/Task";
import User from "@/models/User";
import Workspace from "@/models/Workspace";

const statusOrder = ["todo", "in_progress", "done"] as const;

type SearchParamsValue = string | string[] | undefined;
type SearchParamsMap = Record<string, SearchParamsValue>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: SearchParamsMap | Promise<SearchParamsMap>;
}) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const workspaces = await Workspace.find({
    $or: [{ owner: userObjectId }, { "members.userId": userObjectId }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const resolvedParams: SearchParamsMap = searchParams ? await Promise.resolve(searchParams) : {};
  const statusFilter = typeof resolvedParams.status === "string" ? resolvedParams.status : "all";
  const assigneeFilter = typeof resolvedParams.assignee === "string" ? resolvedParams.assignee : "all";
  const tagFilter = typeof resolvedParams.tag === "string" ? resolvedParams.tag : "all";
  const searchFilter = typeof resolvedParams.search === "string" ? resolvedParams.search.trim() : "";
  const normalizedSearch = searchFilter ? searchFilter.replace(/\s+/g, " ").toLowerCase() : "";
  const sortFilter = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "newest";

  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const baseQuery: Record<string, unknown> = { workspace: { $in: workspaceIds } };

  // Check if user can view all tasks (admin/owner) or only their own
  const canViewAll = await Promise.all(
    workspaceIds.map((id) => canUserViewAllTasks(userId, String(id)))
  );
  const hasAdminAccess = canViewAll.some((v) => v);

  // Get user's role in the first workspace for display
  const userRole = workspaceIds.length > 0
    ? await getUserRoleInWorkspace(userId, String(workspaceIds[0]))
    : null;

  // If not admin, only show tasks assigned to them or created by them
  if (!hasAdminAccess) {
    baseQuery.$or = [
      { assignee: new mongoose.Types.ObjectId(userId) },
      { createdBy: new mongoose.Types.ObjectId(userId) },
    ];
  }

  if (statusFilter !== "all") {
    baseQuery.status = statusFilter;
  }

  if (assigneeFilter !== "all") {
    if (assigneeFilter === "unassigned") {
      baseQuery.assignee = null;
    } else {
      baseQuery.assignee = new mongoose.Types.ObjectId(assigneeFilter);
    }
  }

  if (normalizedSearch) {
    baseQuery.$text = { $search: normalizedSearch };
  }

  const query: Record<string, unknown> = { ...baseQuery };
  if (tagFilter !== "all") {
    query.tags = tagFilter;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { updatedAt: -1 },
    oldest: { updatedAt: 1 },
    priority: { priority: -1 },
    title: { title: 1 },
  };
  const activeSort = normalizedSearch ? { score: { $meta: "textScore" } } : sortMap[sortFilter] ?? sortMap.newest;

  const tasks = workspaceIds.length
    ? await Task.find(query)
        .populate("workspace", "name")
        .populate("assignee", "name email")
        .sort(activeSort)
        .lean()
    : [];

  // Convert Mongoose objects to plain objects for client component
  const plainTasks = tasks.map((task) => ({
    ...task,
    _id: String(task._id),
    createdBy: task.createdBy ? String(task.createdBy) : task.createdBy,
    workspace: task.workspace ? {
      ...task.workspace,
      _id: typeof task.workspace._id === 'object' ? String(task.workspace._id) : task.workspace._id,
    } : task.workspace,
    assignee: task.assignee ? {
      ...task.assignee,
      _id: typeof task.assignee._id === 'object' ? String(task.assignee._id) : task.assignee._id,
    } : task.assignee,
    comments: Array.isArray(task.comments) ? task.comments.map((comment: any) => ({
      ...comment,
      _id: comment._id ? String(comment._id) : comment._id,
      user: comment.user ? String(comment.user) : comment.user,
    })) : [],
  }));

  const tagSourceTasks = workspaceIds.length
    ? await Task.find(baseQuery).select("tags").lean()
    : [];

  // Collect all unique user IDs from workspaces
  const workspaceMemberMap = new Map<string, Array<{ id: string; name: string }>>();
  const memberOptions: Array<{ id: string; name: string }> = [];
  const seenMemberIds = new Set<string>();
  const userIds: string[] = [];

  for (const workspace of workspaces) {
    const workspaceId = String(workspace._id);
    const workspaceMemberOptions: Array<{ id: string; name: string }> = [];
    const workspaceUserIds: string[] = [];
    const workspaceSeenIds = new Set<string>();

    // Add members
    for (const member of workspace.members ?? []) {
      const userId = member.userId ? String(member.userId) : "";
      if (userId && !workspaceSeenIds.has(userId)) {
        workspaceSeenIds.add(userId);
        workspaceUserIds.push(userId);
        if (!seenMemberIds.has(userId)) {
          seenMemberIds.add(userId);
          userIds.push(userId);
        }
      }
    }

    // Add owner
    if (workspace.owner && !workspaceSeenIds.has(String(workspace.owner))) {
      const ownerId = String(workspace.owner);
      workspaceSeenIds.add(ownerId);
      workspaceUserIds.push(ownerId);
      if (!seenMemberIds.has(ownerId)) {
        seenMemberIds.add(ownerId);
        userIds.push(ownerId);
      }
    }

    // Fetch user names for this workspace's members
    const users = workspaceUserIds.length > 0
      ? await User.find({ _id: { $in: workspaceUserIds } }).select("_id name").lean()
      : [];

    const userMap = new Map(users.map((u) => [String(u._id), u.name || "Unknown"]));

    // Build member options for this workspace
    for (const userId of workspaceUserIds) {
      workspaceMemberOptions.push({ id: userId, name: userMap.get(userId) || "Unknown" });
    }

    workspaceMemberMap.set(workspaceId, workspaceMemberOptions);
  }

  // Fetch user names for all unique users across all workspaces
  const allUsers = userIds.length > 0
    ? await User.find({ _id: { $in: userIds } }).select("_id name").lean()
    : [];

  const allUserMap = new Map(allUsers.map((u) => [String(u._id), u.name || "Unknown"]));

  // Build global member options for filter dropdown
  for (const userId of userIds) {
    memberOptions.push({ id: userId, name: allUserMap.get(userId) || "Unknown" });
  }

  const tagOptions = Array.from(
    new Set(tagSourceTasks.flatMap((task: { tags?: string[] }) => (Array.isArray(task.tags) ? task.tags : []))),
  ).sort();

  const buildStatusLabel = (status: string) =>
    status === "in_progress" ? "In progress" : status === "done" ? "Done" : "To do";

  return (
    <DashboardLayout>
      <main id="main-content" className="min-h-screen px-4 py-10 text-slate-800">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">TaskFlow</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">Board & task filters</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/dashboard" prefetch={true} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
                  Dashboard
                </Link>
              </div>
            </div>
          </header>

        <TaskForm 
          workspaces={workspaces.map(w => ({ _id: String(w._id), name: w.name }))}
          workspaceMemberMap={Object.fromEntries(workspaceMemberMap)}
          createTaskAction={createTaskAction}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filter & sort</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="/tasks" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Clear filters
              </a>
            </div>
          </div>

          <form method="get" className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
              <input
                name="search"
                defaultValue={searchFilter}
                placeholder="Search title, description, or tags"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Assignee</label>
              <select
                name="assignee"
                defaultValue={assigneeFilter}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              >
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tag</label>
              <select
                name="tag"
                defaultValue={tagFilter}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              >
                <option value="all">All tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Sort</label>
              <select
                name="sort"
                defaultValue={sortFilter}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 md:col-span-2 xl:col-span-5"
            >
              Apply filters
            </button>
          </form>
        </section>

        {/* Role indicator banner */}
        <div className={`rounded-2xl border p-4 text-sm ${
          hasAdminAccess
            ? "bg-sky-50 border-sky-200 text-sky-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <p className="font-medium">
            {hasAdminAccess
              ? `👑 ${userRole === "owner" ? "Owner" : "Admin"} view: You can see all tasks in your workspaces.`
              : `👤 Member view: You can only see tasks assigned to you or created by you.`}
          </p>
        </div>

        <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-500">Loading task board...</div>}>
          <TaskBoard tasks={plainTasks as any} canEdit={true} />
        </Suspense>
      </div>
    </main>
    </DashboardLayout>
  );
}
