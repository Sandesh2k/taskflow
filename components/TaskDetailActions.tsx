"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export function DeleteCommentButton({
  taskId,
  commentIndex,
  deleteTaskCommentAction,
}: {
  taskId: string;
  commentIndex: number;
  deleteTaskCommentAction: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleConfirm = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form action={deleteTaskCommentAction} ref={formRef} style={{ display: "none" }}>
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="commentIndex" value={String(commentIndex)} />
      </form>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
      >
        Delete
      </button>

      <ConfirmDialog
        isOpen={open}
        title="Delete comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setOpen(false);
          handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export function DeleteTaskButton({
  taskId,
  deleteTaskAction,
}: {
  taskId: string;
  deleteTaskAction: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleConfirm = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form action={deleteTaskAction} ref={formRef} style={{ display: "none" }}>
        <input type="hidden" name="taskId" value={taskId} />
      </form>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-red-300 dark:border-red-700 bg-red-600 dark:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 dark:hover:bg-red-800 shadow-sm hover:shadow-md"
      >
        Delete task
      </button>

      <ConfirmDialog
        isOpen={open}
        title="Delete task"
        message="This will permanently remove the task and all associated comments. Are you sure you want to continue?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setOpen(false);
          handleConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
