import { marked } from "marked";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { deleteTaskAction, updateTaskAction } from "@/lib/task-actions";
import Task from "@/models/Task";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(params);
  const session = await getSafeSession();

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();

  const task = await Task.findById(id).populate("workspace", "name").populate("assignee", "name email").lean();

  if (!task) {
    notFound();
  }

  const content = marked.parse(task.description ?? "", { gfm: true, breaks: true });
  const descriptionHtml = typeof content === "string" ? content : String(content);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-4xl space-y-6">
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
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{task.priority}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{task.status}</span>
            </div>

            <div
              className="prose prose-slate max-w-none prose-headings:mt-4 prose-p:my-2 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: descriptionHtml || "<p>No description provided.</p>" }}
            />
          </article>

          <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Edit task</h2>
              <form action={updateTaskAction} className="mt-4 space-y-3">
                <input type="hidden" name="taskId" value={String(task._id)} />
                <input type="hidden" name="workspaceId" value={String(task.workspace)} />

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
                      defaultValue={task.priority}
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
                  className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Save changes
                </button>
              </form>
            </div>

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
          </aside>
        </section>
      </div>
    </main>
  );
}
