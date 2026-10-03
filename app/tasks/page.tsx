import mongoose from "mongoose";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTaskAction, deleteTaskAction, updateTaskStatusAction } from "@/lib/task-actions";
import Task from "@/models/Task";
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

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(session.user.id);
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
  const sortFilter = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "newest";

  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const query: Record<string, unknown> = { workspace: { $in: workspaceIds } };

  if (statusFilter !== "all") {
    query.status = statusFilter;
  }

  if (assigneeFilter !== "all") {
    if (assigneeFilter === "unassigned") {
      query.assignee = null;
    } else {
      query.assignee = new mongoose.Types.ObjectId(assigneeFilter);
    }
  }

  if (tagFilter !== "all") {
    query.tags = tagFilter;
  }

  if (searchFilter) {
    query.title = { $regex: searchFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { updatedAt: -1 },
    oldest: { updatedAt: 1 },
    priority: { priority: -1 },
    title: { title: 1 },
  };
  const activeSort = sortMap[sortFilter] ?? sortMap.newest;

  const tasks = workspaceIds.length
    ? await Task.find(query)
        .populate("workspace", "name")
        .populate("assignee", "name email")
        .sort(activeSort)
        .lean()
    : [];

  const memberOptions: Array<{ id: string; name: string }> = [];
  const seenMemberIds = new Set<string>();

  for (const workspace of workspaces) {
    for (const member of workspace.members ?? []) {
      const userId = member.userId ? String(member.userId) : "";
      if (!userId || seenMemberIds.has(userId)) {
        continue;
      }

      seenMemberIds.add(userId);
      memberOptions.push({ id: userId, name: "Member" });
    }

    if (workspace.owner) {
      const ownerId = String(workspace.owner);
      if (!seenMemberIds.has(ownerId)) {
        seenMemberIds.add(ownerId);
        memberOptions.push({ id: ownerId, name: "Owner" });
      }
    }
  }

  const tagOptions = Array.from(
    new Set(tasks.flatMap((task: { tags?: string[] }) => (Array.isArray(task.tags) ? task.tags : []))),
  ).sort();

  const buildStatusLabel = (status: string) =>
    status === "in_progress" ? "In progress" : status === "done" ? "Done" : "To do";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">TaskFlow</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Board & task filters</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create a task</h2>
          <form action={createTaskAction} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="task-workspace" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Workspace
                </label>
                <select
                  id="task-workspace"
                  name="workspaceId"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                  defaultValue={workspaces[0]?._id ? String(workspaces[0]._id) : ""}
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
                <label htmlFor="task-assignee" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Assignee
                </label>
                <select
                  id="task-assignee"
                  name="assignee"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                  defaultValue=""
                >
                  <option value="">Unassigned</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="task-title"
                name="title"
                placeholder="Prepare sprint review"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="task-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="task-description"
                name="description"
                rows={4}
                placeholder="Add markdown details, checklists, and notes..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="task-tags" className="mb-1.5 block text-sm font-medium text-slate-700">
                Tags
              </label>
              <input
                id="task-tags"
                name="tags"
                placeholder="design, backend, qa"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  id="task-status"
                  name="status"
                  defaultValue="todo"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
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
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Add task
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                placeholder="Search title"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 md:col-span-2 xl:col-span-5"
            >
              Apply filters
            </button>
          </form>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {statusOrder.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);

            return (
              <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{buildStatusLabel(status)}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No tasks here.
                    </div>
                  ) : (
                    columnTasks.map((task: { _id?: unknown; title?: string; status?: string; priority?: string; workspace?: { name?: string } | string; assignee?: { name?: string } | string; tags?: string[] }) => {
                      const assigneeName =
                        typeof task.assignee === "string" ? task.assignee : task.assignee?.name ?? "Unassigned";

                      return (
                        <article key={String(task._id)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/tasks/${String(task._id)}`} className="font-semibold text-slate-900 hover:text-sky-700">
                              {task.title}
                            </Link>
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              {task.priority}
                            </span>
                          </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-white px-2 py-1">{assigneeName}</span>
                            <span className="rounded-full bg-white px-2 py-1">
                              {typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace"}
                            </span>
                          </div>

                          {task.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {task.tags.map((tag: string) => (
                                <span key={`${String(task._id)}-${tag}`} className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <form action={updateTaskStatusAction} className="mt-3 flex gap-2">
                            <input type="hidden" name="taskId" value={String(task._id)} />
                            <select
                              name="status"
                              defaultValue={task.status}
                              className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                            >
                              <option value="todo">To do</option>
                              <option value="in_progress">In progress</option>
                              <option value="done">Done</option>
                            </select>
                            <button type="submit" className="rounded-xl bg-slate-900 px-2.5 py-2 text-xs font-medium text-white hover:bg-slate-800">
                              Save
                            </button>
                          </form>

                          <form action={deleteTaskAction} className="mt-2">
                            <input type="hidden" name="taskId" value={String(task._id)} />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              Delete task
                            </button>
                          </form>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
