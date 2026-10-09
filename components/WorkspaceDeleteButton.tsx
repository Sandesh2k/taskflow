"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function WorkspaceDeleteButton({ workspaceId, deleteWorkspaceAction }: { workspaceId: string; deleteWorkspaceAction: (formData: FormData) => void; }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleConfirm = () => {
    // submit the form programmatically
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form action={deleteWorkspaceAction} ref={formRef} style={{ display: "none" }}>
        <input type="hidden" name="workspaceId" value={workspaceId} />
      </form>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        Delete
      </button>

      <ConfirmDialog
        isOpen={open}
        title="Delete workspace"
        message="Are you sure you want to delete this workspace and all its tasks? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => { setOpen(false); handleConfirm(); }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
