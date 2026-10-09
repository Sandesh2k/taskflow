"use client";

import { useRef, useState } from "react";
import TaskBoard from "./TaskBoard";
import ConfirmDialog from "./ConfirmDialog";

export default function TaskBoardWrapper({ tasks, deleteTaskAction }: { tasks: any[]; deleteTaskAction: (formData: FormData) => void; }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleDelete = (taskId: string) => {
    setPendingTaskId(taskId);
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    setConfirmOpen(false);
    if (!pendingTaskId) return;
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form action={deleteTaskAction} ref={formRef} style={{ display: "none" }}>
        <input type="hidden" name="taskId" value={pendingTaskId ?? ""} />
      </form>

      <TaskBoard tasks={tasks} canEdit={true} onDelete={handleDelete} />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
