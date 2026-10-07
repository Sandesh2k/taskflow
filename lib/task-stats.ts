import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface TaskStatEntry {
  status: TaskStatus;
  count: number;
}

export interface TopAssigneeStat {
  userId: string;
  name: string;
  count: number;
}

export interface TaskStatsSummary {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  dueThisWeek: number;
  topAssignees: TopAssigneeStat[];
}

export function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizeTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.toLowerCase())
        .slice(0, 8),
    ),
  );
}

export function buildStatusCounts(tasks: Array<{ status?: string; count?: number }>): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };

  for (const task of tasks) {
    const status = (task.status ?? "todo") as TaskStatus;
    const count = typeof task.count === "number" ? task.count : 1;

    if (status in counts) {
      counts[status] += count;
    }
  }

  return counts;
}

export function isDueThisWeek(dueDate?: Date | string | null): boolean {
  if (!dueDate) return false;

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + 7);

  return due >= startOfToday && due <= endOfWeek;
}

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

export function summarizeTopAssignees(tasks: Array<{ assignee?: string | null; assigneeName?: string }>): TopAssigneeStat[] {
  const counts = new Map<string, { userId: string; name: string; count: number }>();

  for (const task of tasks) {
    const userId = String(task.assignee ?? "");
    if (!userId) continue;

    const current = counts.get(userId) ?? {
      userId,
      name: task.assigneeName ?? "Unassigned",
      count: 0,
    };

    current.count += 1;
    counts.set(userId, current);
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5)
    .map((item) => ({ userId: item.userId, name: item.name, count: item.count }));
}

export function buildAssigneeOptions(
  ownerId?: string | null,
  workspaceMembers: Array<{ userId?: string | { _id?: string } }> = [],
  memberNames: Map<string, string> = new Map(),
): Array<{ _id: string; name: string }> {
  const options = new Map<string, { _id: string; name: string }>();

  if (ownerId) {
    options.set(String(ownerId), {
      _id: String(ownerId),
      name: memberNames.get(String(ownerId)) ?? "Owner",
    });
  }

  for (const member of workspaceMembers) {
    const memberId = String(member.userId ?? "");
    if (!memberId) continue;

    options.set(memberId, {
      _id: memberId,
      name: memberNames.get(memberId) ?? "Member",
    });
  }

  return Array.from(options.values());
}

export function appendCommentToTaskList(
  currentComments: Array<{ message?: string; user?: string | null; createdAt?: Date | string }>,
  message: string,
  userId: string,
  timestamp = new Date(),
) {
  return [
    ...currentComments,
    {
      message: message.trim(),
      user: userId,
      createdAt: timestamp,
    },
  ];
}

export async function getTaskStatsForUser(userId: string): Promise<TaskStatsSummary> {
  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const workspaces = await Workspace.find({
    $or: [{ owner: userObjectId }, { "members.userId": userObjectId }],
  })
    .select("_id")
    .lean();

  const workspaceIds = workspaces.map((workspace) => workspace._id);

  if (!workspaceIds.length) {
    return {
      totalTasks: 0,
      tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
      dueThisWeek: 0,
      topAssignees: [],
    };
  }

  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const [result] = await Task.aggregate([
    { $match: { workspace: { $in: workspaceIds } } },
    {
      $facet: {
        statusCounts: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ],
        dueThisWeek: [
          {
            $match: {
              dueDate: {
                $gte: startOfWeek,
                $lte: endOfWeek,
              },
            },
          },
          { $count: "count" },
        ],
        topAssignees: [
          { $match: { assignee: { $ne: null } } },
          {
            $group: {
              _id: "$assignee",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: 0,
              userId: { $toString: "$_id" },
              name: "$user.name",
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  const statusCounts = buildStatusCounts(Array.isArray(result?.statusCounts) ? result.statusCounts : []);

  return {
    totalTasks: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    tasksByStatus: statusCounts,
    dueThisWeek: Array.isArray(result?.dueThisWeek) && result.dueThisWeek.length ? result.dueThisWeek[0].count : 0,
    topAssignees: Array.isArray(result?.topAssignees) ? result.topAssignees : [],
  };
}
