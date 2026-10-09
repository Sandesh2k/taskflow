import { marked } from "marked";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { addTaskCommentAction, deleteTaskAction, deleteTaskCommentAction, updateTaskAction } from "@/lib/task-actions";
import { getDueDateStatus } from "@/lib/task-utils";
import { canUserViewTask, canUserAssignTasks } from "@/lib/workspace-permissions";
import DashboardLayout from "@/components/DashboardLayout";
import { DeleteCommentButton, DeleteTaskButton } from "@/components/TaskDetailActions";
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

  const userName = session.user.name ?? session.user.email ?? "User";

  // Check if user can edit task (admin/owner can edit all, members can only change status)
  const canEditTask = await canUserAssignTasks(userId, workspaceId);

  return (
    <DashboardLayout userName={userName}>
      <main className="w-full bg-slate-50 dark:bg-slate-950 flex-1">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col w-full gap-8">
            {/* Task Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 dark:from-slate-800 dark:to-slate-900 p-6 lg:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative z-10 flex flex-col">
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{task.title}</h1>
                <p className="text-base text-slate-100 dark:text-slate-300 mt-2">Task details and management</p>
              </div>
              <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/20 dark:bg-sky-500/20 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-white/20 dark:bg-purple-500/20 blur-3xl pointer-events-none"></div>
            </div>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="space-y-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300 font-medium">{typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace"}</span>
                  <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 text-sky-700 dark:text-sky-400 font-medium">{task.priority}</span>
                  <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 text-purple-700 dark:text-purple-400 font-medium">{task.status}</span>
                  {dueDateStatus.text ? (
                    <span className={`rounded-full px-3 py-1.5 font-medium ${dueDateStatus.color}`}>
                      {dueDateStatus.text}
                    </span>
                  ) : null}
                </div>

                <div
                  className="prose prose-slate dark:prose-invert max-w-none prose-headings:mt-4 prose-p:my-2 prose-li:my-1"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml || "<p>No description provided.</p>" }}
                />

                {task.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag: string) => (
                      <span key={`${String(task._id)}-${tag}`} className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Comments</h2>

                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet. Start the conversation.</p>
                    ) : (
                      comments.map((comment: { user?: unknown; message?: string; createdAt?: string | Date }, index: number) => {
                        const author = authorMap.get(String(comment.user));
                        const authorName = author?.name ?? "Unknown user";

                        return (
                          <div key={`${String(task._id)}-comment-${index}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{authorName}</p>
                              <div className="flex items-center gap-2">
                                <time className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(comment.createdAt ?? Date.now()).toLocaleString()}
                                </time>
                                {canEditTask && (
                                  <DeleteCommentButton
                                    taskId={String(task._id)}
                                    commentIndex={index}
                                    deleteTaskCommentAction={deleteTaskCommentAction}
                                  />
                                )}
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{comment.message}</p>
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
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    />
                    <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 shadow-sm hover:shadow-md">
                      Post comment
                    </button>
                  </form>
                </div>
              </article>

              <aside className="space-y-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-sky-600 dark:text-sky-400">edit</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {canEditTask ? "Edit task" : "Update status"}
                      </h2>
                      {!canEditTask && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">As a member, you can only change the task status.</p>
                      )}
                    </div>
                  </div>
                  <form action={updateTaskAction} className="space-y-4">
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
                      <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Title
                      </label>
                      <input
                        id="task-title"
                        name="title"
                        defaultValue={task.title}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="task-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Description
                      </label>
                      <textarea
                        id="task-description"
                        name="description"
                        rows={6}
                        defaultValue={task.description ?? ""}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-tags-edit" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tags
                      </label>
                      <input
                        id="task-tags-edit"
                        name="tags"
                        defaultValue={(task.tags ?? []).join(", ")}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-due-date-edit" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Due date
                      </label>
                      <input
                        id="task-due-date-edit"
                        name="dueDate"
                        type="date"
                        defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="task-assignee-edit" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Assignee
                      </label>
                      <select
                        id="task-assignee-edit"
                        name="assignee"
                        defaultValue={assigneeId}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((member) => (
                      <option key={String(member._id)} value={String(member._id)}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      id="task-status"
                      name="status"
                      defaultValue={task.status}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value="todo" disabled={task.status === "done"}>To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done" disabled={task.status === "todo"}>Done</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      name="priority"
                      defaultValue={task.priority}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      id="task-status"
                      name="status"
                      defaultValue={task.status}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value="todo" disabled={task.status === "done"}>To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done" disabled={task.status === "todo"}>Done</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 shadow-sm hover:shadow-md"
                >
                  Save changes
                </button>
              </form>
            </div>

            {canEditTask && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-3">Delete task</h3>
                <DeleteTaskButton taskId={String(task._id)} deleteTaskAction={deleteTaskAction} />
              </div>
            )}
          </aside>
        </section>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
