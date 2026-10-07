import dynamic from "next/dynamic";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import DashboardLayout from "@/components/DashboardLayout";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTaskAction } from "@/lib/task-actions";
import { getDueDateStatus } from "@/lib/task-utils";
import { getTaskStatsForUser } from "@/lib/task-stats";
import { canUserAssignTasks } from "@/lib/workspace-permissions";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

const DashboardStats = dynamic(() => import("@/components/TaskStatsPanel"), {
  loading: () => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-500">Loading overview...</div>,
});

async function createWorkspace(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const memberEmails = String(formData.get("memberEmails") ?? "").trim();

  if (!name) {
    return;
  }

  await connectToDatabase();

  // Generate unique slug with random suffix to avoid duplicates
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "workspace";

  // Check if slug exists and add random suffix if needed
  let slugExists = await Workspace.findOne({ slug });
  let attempts = 0;
  while (slugExists && attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    slug = `${slug}-${randomSuffix}`;
    slugExists = await Workspace.findOne({ slug });
    attempts++;
  }

  // Parse member emails and find corresponding users
  const members = [{ userId: new mongoose.Types.ObjectId(session.user.id), role: "owner" as const }];

  if (memberEmails) {
    const User = (await import("@/models/User")).default;
    const emails = memberEmails.split(",").map((e) => e.trim()).filter((e) => e);
    
    for (const email of emails) {
      const user = await User.findOne({ email }).select("_id").lean();
      if (user) {
        members.push({
          userId: user._id,
          role: "member" as const,
        });
      }
    }
  }

  await Workspace.create({
    name,
    slug,
    description: description || undefined,
    owner: new mongoose.Types.ObjectId(session.user.id),
    members,
  });

  revalidatePath("/dashboard");
}

async function deleteWorkspace(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!workspaceId) {
    redirect("/dashboard");
  }

  await connectToDatabase();

  const workspace = await Workspace.findById(workspaceId).lean();

  if (!workspace) {
    redirect("/dashboard");
  }

  // Check if user is owner
  if (String(workspace.owner) !== session.user.id) {
    redirect("/dashboard");
  }

  // Delete all tasks in the workspace
  await Task.deleteMany({ workspace: new mongoose.Types.ObjectId(workspaceId) });

  // Delete the workspace
  await Workspace.findByIdAndDelete(workspaceId);

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/dashboard");
}

export default async function DashboardPage() {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(session.user.id);
  const workspaces = await Workspace.find({
    $or: [{ owner: userObjectId }, { "members.userId": userObjectId }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const baseQuery: Record<string, unknown> = { workspace: { $in: workspaceIds } };

  // Check if user can view all tasks (admin/owner) or only their own
  const canViewAll = await Promise.all(
    workspaceIds.map((id) => canUserAssignTasks(session.user.id, String(id)))
  );
  const hasAdminAccess = canViewAll.some((v) => v);

  // If not admin, only show tasks assigned to them or created by them
  if (!hasAdminAccess) {
    baseQuery.$or = [
      { assignee: new mongoose.Types.ObjectId(session.user.id) },
      { createdBy: new mongoose.Types.ObjectId(session.user.id) },
    ];
  }

  const tasks = workspaceIds.length
    ? await Task.find(baseQuery)
        .populate("workspace", "name")
        .populate("assignee", "name email")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean()
    : [];

  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const stats = await getTaskStatsForUser(session.user.id);

  return (
    <DashboardLayout>
      <main id="main-content" className="min-h-screen px-4 py-8 text-slate-800">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">TaskFlow</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Welcome back, {session.user.name ?? session.user.email}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/tasks"
                prefetch={true}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                New Task
              </Link>
              <LogoutButton />
            </div>
          </header>

        <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-500">Loading overview...</div>}>
          <DashboardStats stats={stats} />
        </Suspense>

        {/*<section className="grid gap-4 md:grid-cols-3">*/}
        {/*  {[*/}
        {/*    { label: "To do", value: todoCount, tone: "bg-slate-100 text-slate-700" },*/}
        {/*    { label: "In progress", value: inProgressCount, tone: "bg-amber-100 text-amber-800" },*/}
        {/*    { label: "Done", value: doneCount, tone: "bg-emerald-100 text-emerald-800" },*/}
        {/*  ].map((card) => (*/}
        {/*    <article key={card.label} className={`rounded-2xl border border-slate-200 p-5 ${card.tone}`}>*/}
        {/*      <p className="text-sm font-medium uppercase tracking-[0.12em]">{card.label}</p>*/}
        {/*      <p className="mt-4 text-3xl font-bold">{card.value}</p>*/}
        {/*    </article>*/}
        {/*  ))}*/}
        {/*</section>*/}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Create workspace</h2>
              <form action={createWorkspace} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="workspace-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Workspace name
                  </label>
                  <input
                    id="workspace-name"
                    name="name"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="Marketing team"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="workspace-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="workspace-description"
                    name="description"
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="Campaign planning and launch coordination"
                  />
                </div>

                <div>
                  <label htmlFor="member-emails" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Invite members (optional)
                  </label>
                  <input
                    id="member-emails"
                    name="memberEmails"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <p className="mt-1 text-xs text-slate-500">Separate multiple email addresses with commas</p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Initialize Workspace
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Active workspaces</h2>
              <div className="mt-4 space-y-3">
                {workspaces.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No workspaces yet. Create one to start planning work.
                  </p>
                ) : (
                  <>
                    {workspaces.slice(0, 5).map((workspace) => {
                      const isOwner = String(workspace.owner) === session.user.id;
                      const getInitials = (name: string) => {
                        return name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                      };
                      const avatarColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
                      const avatarColorIndex = workspace.name.length % avatarColors.length;

                      return (
                        <div key={String(workspace._id)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColors[avatarColorIndex]}`}>
                                {getInitials(workspace.name)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{workspace.name}</p>
                                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">/{workspace.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                Active
                              </span>
                              {isOwner && (
                                <form action={deleteWorkspace}>
                                  <input type="hidden" name="workspaceId" value={String(workspace._id)} />
                                  <button
                                    type="submit"
                                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                                  >
                                    Delete
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                          {workspace.description ? (
                            <p className="mt-2 text-sm text-slate-600">{workspace.description}</p>
                          ) : null}
                        </div>
                      );
                    })}
                    {workspaces.length > 5 && (
                      <Link href="/tasks" className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
                        View all {workspaces.length} workspaces
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Quick task</h2>
              <form action={createTaskAction} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="task-workspace" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Workspace
                  </label>
                  <select
                    id="task-workspace"
                    name="workspaceId"
                    defaultValue={workspaces[0]?._id ? String(workspaces[0]._id) : ""}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    required
                  >
                    {workspaces.length === 0 ? (
                      <option value="">Create a workspace first</option>
                    ) : (
                      workspaces.map((workspace) => (
                        <option key={String(workspace._id)} value={String(workspace._id)}>
                          {workspace.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Task title
                  </label>
                  <input
                    id="task-title"
                    name="title"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="Finalize launch checklist"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="task-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Details
                  </label>
                  <textarea
                    id="task-description"
                    name="description"
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="Outline milestones and ownership before Friday."
                  />
                </div>

                <div>
                  <label htmlFor="task-due-date" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Due date
                  </label>
                  <input
                    id="task-due-date"
                    name="dueDate"
                    type="date"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      id="task-status"
                      name="status"
                      defaultValue="todo"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    >
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done" disabled>Done</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      defaultValue="medium"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Create Task
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent tasks</h2>

              </div>
              <div className="mt-4 space-y-3">
                {tasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Create a workspace and add your first task.
                  </p>
                ) : (
                  tasks.map((task) => {
                    const workspaceName = typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace";
                    const assigneeName = typeof task.assignee === "string" ? task.assignee : task.assignee?.name ?? "Unassigned";
                    const priorityStyles = {
                      high: "bg-red-50 text-red-700 border-red-200",
                      medium: "bg-blue-50 text-blue-700 border-blue-200",
                      low: "bg-slate-100 text-slate-600 border-slate-200",
                    } as const;
                    const statusStyles = {
                      todo: "bg-slate-100 text-slate-700",
                      in_progress: "bg-amber-100 text-amber-800",
                      done: "bg-emerald-100 text-emerald-800",
                    } as const;
                    const dueDateStatus = getDueDateStatus(task.dueDate, task.status, task.updatedAt);

                    const getInitials = (name: string) => {
                      return name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                    };
                    const avatarColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
                    const avatarColorIndex = assigneeName.length % avatarColors.length;

                    return (
                      <article key={String(task._id)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityStyles[task.priority as keyof typeof priorityStyles] || priorityStyles.medium}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColors[avatarColorIndex]}`}>
                            {getInitials(assigneeName)}
                          </div>
                          <span className="text-slate-600">{assigneeName}</span>
                          <span className="text-slate-400">•</span>
                          <span className={`rounded-full px-2 py-0.5 ${statusStyles[task.status as keyof typeof statusStyles]}`}>
                            {task.status === "in_progress" ? "In progress" : task.status === "done" ? "Done" : "To do"}
                          </span>
                          {dueDateStatus.text ? (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className={`rounded-full px-2 py-0.5 ${dueDateStatus.color}`}>
                                {dueDateStatus.text}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
                      </article>
                    );
                  })
                )}
              </div>
              {tasks.length > 0 && (
                <Link href="/tasks" className="mt-4 flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
                  Explore Kanban Board
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
    </DashboardLayout>
  );
}
