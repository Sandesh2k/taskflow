import { marked } from "marked";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { addTaskCommentAction, deleteTaskAction, deleteTaskCommentAction, updateTaskAction } from "@/lib/task-actions";
import { getDueDateStatus } from "@/lib/task-utils";
import { canUserViewTask, canUserAssignTasks } from "@/lib/workspace-permissions";
import DashboardLayout from "@/components/DashboardLayout";
import Task from "@/models/Task";
import User from "@/models/User";
import Workspace from "@/models/Workspace";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(params);
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  await connectToDatabase();

  const task = await Task.findById(id)
    .populate("workspace", "name owner members")
    .populate("assignee", "name email")
    .lean();

  if (!task) {
    notFound();
  }

  // Check if user has permission to view this task
  const canView = await canUserViewTask(userId, id);
  if (!canView) {
    notFound();
  }

  const taskWorkspace = typeof task.workspace === "string" ? null : task.workspace;
  const workspaceId = typeof task.workspace === "string" ? task.workspace : task.workspace && typeof task.workspace === "object" && "_id" in task.workspace ? String(task.workspace._id) : "";
  if (!workspaceId) {
    notFound();
  }
  const assigneeId = typeof task.assignee === "string"
    ? task.assignee
    : task.assignee && typeof task.assignee === "object" && "_id" in task.assignee
      ? String(task.assignee._id)
      : "";

  const memberIds = new Set<string>();

  if (taskWorkspace) {
    if (taskWorkspace.owner) {
      memberIds.add(String(taskWorkspace.owner));
    }

    for (const member of taskWorkspace.members ?? []) {
      memberIds.add(String(member.userId));
    }
  }

  const memberUsers = memberIds.size
    ? await User.find({ _id: { $in: Array.from(memberIds) } }, { _id: 1, name: 1, email: 1 }).lean()
    : [];

  const memberMap = new Map(memberUsers.map((user) => [String(user._id), user]));
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const commentAuthorIds = comments.map((comment: { user?: unknown }) => String(comment.user));
  const authorUsers = commentAuthorIds.length
    ? await User.find({ _id: { $in: commentAuthorIds } }, { _id: 1, name: 1, email: 1 }).lean()
    : [];

  const authorMap = new Map(authorUsers.map((user: { _id?: unknown; name?: string; email?: string }) => [String(user._id), user]));

  const content = marked.parse(task.description ?? "", { gfm: true, breaks: true });
  const descriptionHtml = typeof content === "string" ? content : String(content);
  const dueDateStatus = getDueDateStatus(task.dueDate, task.status, task.updatedAt);

  const workspaceMembers = taskWorkspace ? taskWorkspace.members ?? [] : [];
  const assigneeOptionsMap = new Map<string, { _id: string; name: string }>();

  if (taskWorkspace?.owner) {
    assigneeOptionsMap.set(String(taskWorkspace.owner), {
      _id: String(taskWorkspace.owner),
      name: memberMap.get(String(taskWorkspace.owner))?.name ?? "Owner",
    });
  }

  for (const member of workspaceMembers) {
    const memberId = String(member.userId ?? "");
    if (!memberId) continue;

    assigneeOptionsMap.set(memberId, {
      _id: memberId,
      name: memberMap.get(memberId)?.name ?? "Member",
    });
  }

  const assigneeOptions = Array.from(assigneeOptionsMap.values());

  // Check if user can edit task (admin/owner can edit all, members can only change status)
  const canEditTask = await canUserAssignTasks(userId, workspaceId);

  return (
    <DashboardLayout>
      <main className="min-h-screen px-4 py-10 text-slate-800">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">TaskFlow</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">{task.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/tasks" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Back to tasks
                </Link>
                <Link href="/dashboard" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  Dashboard
                </Link>
              </div>
            </div>
          </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{task.priority}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{task.status}</span>
              {dueDateStatus.text ? (
                <span className={`rounded-full px-2 py-1 ${dueDateStatus.color}`}>
                  {dueDateStatus.text}
                </span>
              ) : null}
            </div>

            <div
              className="prose prose-slate max-w-none prose-headings:mt-4 prose-p:my-2 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: descriptionHtml || "<p>No description provided.</p>" }}
            />

            {task.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string) => (
                  <span key={`${String(task._id)}-${tag}`} className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-semibold text-slate-900">Comments</h2>

              <div className="mt-4 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
                ) : (
                  comments.map((comment: { user?: unknown; message?: string; createdAt?: string | Date }, index: number) => {
                    const author = authorMap.get(String(comment.user));
                    const authorName = author?.name ?? "Unknown user";

                    return (
                      <div key={`${String(task._id)}-comment-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                          <div className="flex items-center gap-2">
                            <time className="text-xs text-slate-500">
                              {new Date(comment.createdAt ?? Date.now()).toLocaleString()}
                            </time>
                            {canEditTask && (
                              <form action={deleteTaskCommentAction}>
                                <input type="hidden" name="taskId" value={String(task._id)} />
                                <input type="hidden" name="commentIndex" value={index} />
                                <button
                                  type="submit"
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700">{comment.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form action={addTaskCommentAction} className="mt-4 space-y-3">
                <input type="hidden" name="taskId" value={String(task._id)} />
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Write a comment..."
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400"
                />
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  Post comment
                </button>
              </form>
            </div>
          </article>

          <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {canEditTask ? "Edit task" : "Update status"}
              </h2>
              {!canEditTask && (
                <p className="mt-1 text-xs text-slate-500">As a member, you can only change the task status.</p>
              )}
              <form action={updateTaskAction} className="mt-4 space-y-3">
                <input type="hidden" name="taskId" value={String(task._id)} />
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="title" value={task.title} />
                <input type="hidden" name="description" value={task.description ?? ""} />
                <input type="hidden" name="tags" value={(task.tags ?? []).join(", ")} />
                <input type="hidden" name="dueDate" value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""} />
                <input type="hidden" name="priority" value={task.priority} />
                <input type="hidden" name="assignee" value={assigneeId} />

                {canEditTask ? (
                  <>
                    <div>
                      <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Title
                      </label>
                      <input
                        id="task-title"
                        name="title"
                        defaultValue={task.title}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="task-description" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Description
                      </label>
                      <textarea
                        id="task-description"
                        name="description"
                        rows={6}
                        defaultValue={task.description ?? ""}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-tags-edit" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Tags
                      </label>
                      <input
                        id="task-tags-edit"
                        name="tags"
                        defaultValue={(task.tags ?? []).join(", ")}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-due-date-edit" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Due date
                      </label>
                      <input
                        id="task-due-date-edit"
                        name="dueDate"
                        type="date"
                        defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-assignee-edit" className="mb-1.5 block text-sm font-medium text-slate-700">
                        Assignee
                      </label>
                      <select
                        id="task-assignee-edit"
                        name="assignee"
                        defaultValue={assigneeId}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((member) => (
                      <option key={String(member._id)} value={String(member._id)}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      id="task-status"
                      name="status"
                      defaultValue={task.status}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                    >
                      <option value="todo" disabled={task.status === "done"}>To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done" disabled={task.status === "todo"}>Done</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      defaultValue={task.priority}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                  </>
                ) : (
                  // Member view - only status can be changed
                  <div>
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      id="task-status"
                      name="status"
                      defaultValue={task.status}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:bg-white"
                    >
                      <option value="todo" disabled={task.status === "done"}>To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done" disabled={task.status === "todo"}>Done</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Save changes
                </button>
              </form>
            </div>

            {canEditTask && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete task</h3>
                <form action={deleteTaskAction} className="mt-3">
                  <input type="hidden" name="taskId" value={String(task._id)} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Delete task
                  </button>
                </form>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
    </DashboardLayout>
  );
}
