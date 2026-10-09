"use client";

import { useState } from "react";
import Modal from "./Modal";
import TaskForm from "./TaskForm";

export default function CreateTaskModal({ workspaces, workspaceMemberMap, createTaskAction }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create a task</h2>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500">
          Add Task
        </button>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Task">
        <TaskForm workspaces={workspaces} workspaceMemberMap={workspaceMemberMap} createTaskAction={createTaskAction} />
      </Modal>
    </div>
  );
}
