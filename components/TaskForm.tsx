"use client";

import { useState } from "react";

interface WorkspaceMember {
  id: string;
  name: string;
}

interface Workspace {
  _id: string;
  name: string;
}

interface TaskFormProps {
  workspaces: Workspace[];
  workspaceMemberMap: Record<string, WorkspaceMember[]>;
  createTaskAction: (formData: FormData) => void;
}

export default function TaskForm({ workspaces, workspaceMemberMap, createTaskAction }: TaskFormProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]?._id || "");

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorkspace(e.target.value);
  };

  const currentMembers = workspaceMemberMap[selectedWorkspace] || [];

  return (
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
              value={selectedWorkspace}
              onChange={handleWorkspaceChange}
              required
            >
              {workspaces.length === 0 ? (
                <option value="">Create a workspace first</option>
              ) : (
                workspaces.map((workspace) => (
                  <option key={workspace._id} value={workspace._id}>
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
              {currentMembers.map((member: WorkspaceMember) => (
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

        <div>
          <label htmlFor="task-due-date" className="mb-1.5 block text-sm font-medium text-slate-700">
            Due date
          </label>
          <input
            id="task-due-date"
            name="dueDate"
            type="date"
            required
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
  );
}
