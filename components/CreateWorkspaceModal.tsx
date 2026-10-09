"use client";

import { useState } from "react";
import Modal from "./Modal";
import CreateWorkspaceForm from "./CreateWorkspaceForm";

export default function CreateWorkspaceModal({ createWorkspaceAction }: { createWorkspaceAction: (formData: FormData) => void; }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-[22px] text-purple-600 dark:text-purple-400">add_business</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Workspace</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set up a new workspace</p>
        </div>
      </div>

      <div className="mt-4">
        <button onClick={() => setOpen(true)} className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 shadow-sm hover:shadow-md">
          Create Workspace
        </button>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Workspace">
        <CreateWorkspaceForm createWorkspaceAction={createWorkspaceAction} />
      </Modal>
    </div>
  );
}
