"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateTaskStatusById } from "@/lib/task-actions";
import { getDueDateStatus } from "@/lib/task-utils";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  priority: string;
  workspace: { name?: string } | string;
  assignee: { name?: string } | string;
  tags?: string[];
  dueDate?: Date | string | null;
  updatedAt?: Date | string | null;
}

interface TaskBoardProps {
  tasks: Task[];
  canEdit?: boolean;
  onDelete?: (taskId: string) => void;
}

const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];

function SortableTask({ task, onDelete, canEdit }: { task: Task; onDelete?: (taskId: string) => void; canEdit?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assigneeName = typeof task.assignee === "string" ? task.assignee : task.assignee?.name ?? "Unassigned";
  const workspaceName = typeof task.workspace === "string" ? task.workspace : task.workspace?.name ?? "Workspace";
  const dueDateStatus = getDueDateStatus(task.dueDate, task.status, task.updatedAt);

  const priorityStyles = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  } as const;

  const statusStyles = {
    todo: "bg-slate-100 text-slate-700",
    in_progress: "bg-amber-100 text-amber-800",
    done: "bg-emerald-100 text-emerald-800",
  } as const;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
  const avatarColorIndex = assigneeName.length % avatarColors.length;

  return (
    <div ref={setNodeRef} style={style} {...(canEdit ? attributes : {})} {...(canEdit ? listeners : {})} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${canEdit ? "cursor-move hover:shadow-md" : "cursor-default"} transition-shadow`} suppressHydrationWarning>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/tasks/${task._id}`} prefetch={true} className="font-semibold text-slate-900 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
          {task.title}
        </Link>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityStyles[task.priority as keyof typeof priorityStyles] || priorityStyles.medium}`}>
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColors[avatarColorIndex]}`}>
          {getInitials(assigneeName)}
        </div>
        <span className="text-slate-600">{assigneeName}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-500">{workspaceName}</span>
        {dueDateStatus.text ? (
          <>
            <span className="text-slate-400">•</span>
            <span className={`rounded-full px-2 py-0.5 ${dueDateStatus.color}`}>
              {dueDateStatus.text}
            </span>
          </>
        ) : null}
      </div>

      {task.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag: string) => (
            <span key={`${task._id}-${tag}`} className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 border border-sky-200">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {onDelete && (
        <button
          onClick={() => onDelete(task._id)}
          className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          Delete task
        </button>
      )}
    </div>
  );
}

function DroppableColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusStyles = {
    todo: "border-slate-200",
    in_progress: "border-amber-200",
    done: "border-emerald-200",
  } as const;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border ${statusStyles[status]} bg-white p-4 shadow-sm transition-colors ${isOver ? "bg-slate-50" : ""}`}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export default function TaskBoard({ tasks, canEdit = true, onDelete }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = {
    todo: localTasks.filter((task) => task.status === "todo"),
    in_progress: localTasks.filter((task) => task.status === "in_progress"),
    done: localTasks.filter((task) => task.status === "done"),
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    const task = localTasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (!statusOrder.includes(newStatus)) return;

    const task = localTasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Validate status transitions: prevent Todo -> Done and Done -> Todo
    if (task.status === "todo" && newStatus === "done") {
      return;
    }
    if (task.status === "done" && newStatus === "todo") {
      return;
    }

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    // Server update
    const result = await updateTaskStatusById(taskId, newStatus);

    if (!result.success) {
      // Revert on error
      setLocalTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t))
      );
    }
  };

  const buildStatusLabel = (status: TaskStatus) =>
    status === "in_progress" ? "In progress" : status === "done" ? "Done" : "To do";

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 xl:grid-cols-3" suppressHydrationWarning>
        {statusOrder.map((status) => (
          <DroppableColumn key={status} status={status}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{buildStatusLabel(status)}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {tasksByStatus[status].length}
              </span>
            </div>

            <SortableContext items={tasksByStatus[status]} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 min-h-[100px]">
                {tasksByStatus[status].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    No tasks here.
                  </div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <SortableTask key={task._id} task={task} onDelete={onDelete} canEdit={canEdit} />
                  ))
                )}
              </div>
            </SortableContext>
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-lg rotate-3 opacity-90">
            <p className="font-semibold text-slate-900">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
