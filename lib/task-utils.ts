export function getDueDateStatus(
  dueDate?: Date | string | null,
  status?: string,
  updatedAt?: Date | string | null,
): { color: string; text: string } {
  if (!dueDate) {
    return { color: "bg-slate-100 text-slate-700", text: "" };
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return { color: "bg-slate-100 text-slate-700", text: "" };
  }

  const now = new Date();
  const isOverdue = due < now;
  const isDone = status === "done";

  // Use consistent date format to avoid hydration errors
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (isDone) {
    const updated = updatedAt ? new Date(updatedAt) : now;
    const completedOnTime = updated <= due;
    return {
      color: completedOnTime ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
      text: `Due: ${formatDate(due)}`,
    };
  }

  if (isOverdue && (status === "todo" || status === "in_progress")) {
    return {
      color: "bg-rose-100 text-rose-800",
      text: `Overdue: ${formatDate(due)}`,
    };
  }

  return {
    color: "bg-amber-100 text-amber-800",
    text: `Due: ${formatDate(due)}`,
  };
}
