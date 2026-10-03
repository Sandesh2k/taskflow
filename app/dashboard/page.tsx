import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

async function createWorkspace(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return;
  }

  await connectToDatabase();

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workspace";

  await Workspace.create({
    name,
    slug,
    description: description || undefined,
    owner: new mongoose.Types.ObjectId(session.user.id),
    members: [{ userId: new mongoose.Types.ObjectId(session.user.id), role: "owner" }],
  });

  revalidatePath("/dashboard");
}

async function createTask(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "todo");
  const priority = String(formData.get("priority") ?? "medium");

  if (!workspaceId || !title) {
    return;
  }

  await connectToDatabase();

  await Task.create({
    workspace: new mongoose.Types.ObjectId(workspaceId),
    title,
    description: description || undefined,
    status: status === "todo" || status === "in_progress" || status === "done" ? status : "todo",
    priority: priority === "low" || priority === "medium" || priority === "high" ? priority : "medium",
    createdBy: new mongoose.Types.ObjectId(session.user.id),
  });

  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
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

  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const tasks = workspaceIds.length
    ? await Task.find({ workspace: { $in: workspaceIds } })
        .populate("workspace", "name")
        .populate("assignee", "name email")
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean()
    : [];

  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">TaskFlow</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Welcome back, {session.user.name ?? session.user.email}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "To do", value: todoCount, tone: "bg-slate-100 text-slate-700" },
            { label: "In progress", value: inProgressCount, tone: "bg-amber-100 text-amber-800" },
            { label: "Done", value: doneCount, tone: "bg-emerald-100 text-emerald-800" },
          ].map((card) => (
            <article key={card.label} className={`rounded-2xl border border-slate-200 p-5 ${card.tone}`}>
              <p className="text-sm font-medium uppercase tracking-[0.12em]">{card.label}</p>
              <p className="mt-4 text-3xl font-bold">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create workspace
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Your workspaces</h2>
              <div className="mt-4 space-y-3">
                {workspaces.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No workspaces yet. Create one to start planning work.
                  </p>
                ) : (
                  workspaces.map((workspace) => (
                    <div key={String(workspace._id)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{workspace.name}</p>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">/{workspace.slug}</p>
                        </div>
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                          {workspace.members?.length ?? 1} member{(workspace.members?.length ?? 1) === 1 ? "" : "s"}
                        </span>
                      </div>
                      {workspace.description ? (
                        <p className="mt-2 text-sm text-slate-600">{workspace.description}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Quick task</h2>
              <form action={createTask} className="mt-4 space-y-3">
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
                  Add task
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Recent tasks</h2>
              <div className="mt-4 space-y-3">
                {tasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Create a workspace and add your first task.
                  </p>
                ) : (
                  tasks.map((task) => {
                    const workspaceName = typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace";
                    const assigneeName = typeof task.assignee === "string" ? task.assignee : task.assignee?.name ?? "Unassigned";
                    const badgeStyles = {
                      todo: "bg-slate-100 text-slate-700",
                      in_progress: "bg-amber-100 text-amber-800",
                      done: "bg-emerald-100 text-emerald-800",
                    } as const;

                    return (
                      <article key={String(task._id)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${badgeStyles[task.status as keyof typeof badgeStyles]}`}>
                            {task.status === "in_progress" ? "In progress" : task.status === "done" ? "Done" : "To do"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2 py-1">{workspaceName}</span>
                          <span className="rounded-full bg-white px-2 py-1">{task.priority}</span>
                          <span className="rounded-full bg-white px-2 py-1">{assigneeName}</span>
                        </div>
                        {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
