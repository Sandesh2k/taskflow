import mongoose from "mongoose";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createTaskAction } from "@/lib/task-actions";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

export default async function TasksPage() {
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

  const tasks = workspaces.length
    ? await Task.find({ workspace: { $in: workspaces.map((workspace) => workspace._id) } })
        .populate("workspace", "name")
        .populate("assignee", "name email")
        .sort({ updatedAt: -1 })
        .lean()
    : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">TaskFlow</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">All tasks</h1>
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
          <h2 className="text-lg font-semibold text-slate-900">Task list</h2>
          <div className="mt-4 space-y-3">
            {tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                There are no tasks yet in your workspaces.
              </p>
            ) : (
              tasks.map((task) => {
                const workspaceName = typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace";
                const assigneeName = typeof task.assignee === "string" ? task.assignee : task.assignee?.name ?? "Unassigned";

                return (
                  <article key={String(task._id)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2 py-1">{workspaceName}</span>
                          <span className="rounded-full bg-white px-2 py-1">{task.priority}</span>
                          <span className="rounded-full bg-white px-2 py-1">{assigneeName}</span>
                        </div>
                      </div>

                      <Link
                        href={`/tasks/${String(task._id)}`}
                        className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        Open task
                      </Link>
                    </div>

                    {task.description ? <p className="mt-3 text-sm text-slate-600">{task.description}</p> : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
