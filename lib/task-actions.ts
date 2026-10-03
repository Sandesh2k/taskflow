"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const taskPrioritySchema = z.enum(["low", "medium", "high"]);

const parseTags = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.toLowerCase())
        .slice(0, 8),
    ),
  );

const createTaskSchema = z.object({
  workspaceId: z.string().min(1, "Select a workspace."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  description: z.string().trim().max(1000).default(""),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assignee: z.string().optional().default(""),
  tags: z.string().default(""),
});

const updateTaskSchema = createTaskSchema.extend({
  taskId: z.string().min(1, "Task ID is required."),
});

const commentSchema = z.object({
  taskId: z.string().min(1, "Task ID is required."),
  message: z.string().trim().min(1, "Comment cannot be empty.").max(1200),
});

async function ensureWorkspaceAccess(userId: string, workspaceId?: string) {
  if (!workspaceId) {
    return null;
  }

  await connectToDatabase();

  const workspace = await Workspace.findOne({
    _id: new mongoose.Types.ObjectId(workspaceId),
    $or: [{ owner: new mongoose.Types.ObjectId(userId) }, { "members.userId": new mongoose.Types.ObjectId(userId) }],
  }).lean();

  return workspace;
}

async function ensureTaskAccess(userId: string, taskId: string) {
  if (!taskId) {
    return null;
  }

  await connectToDatabase();

  const task = await Task.findById(taskId).lean();

  if (!task) {
    return null;
  }

  const workspace = await Workspace.findOne({
    _id: task.workspace,
    $or: [{ owner: new mongoose.Types.ObjectId(userId) }, { "members.userId": new mongoose.Types.ObjectId(userId) }],
  }).lean();

  if (!workspace) {
    return null;
  }

  return task;
}

export async function createTaskAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawData = {
    workspaceId: String(formData.get("workspaceId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "todo"),
    priority: String(formData.get("priority") ?? "medium"),
    assignee: String(formData.get("assignee") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  };

  const parsed = createTaskSchema.safeParse(rawData);

  if (!parsed.success) {
    redirect("/tasks");
  }

  const userId = session.user.id;
  const workspace = await ensureWorkspaceAccess(userId, parsed.data.workspaceId);

  if (!workspace) {
    redirect("/tasks");
  }

  const assigneeId = parsed.data.assignee ? new mongoose.Types.ObjectId(parsed.data.assignee) : null;

  await connectToDatabase();

  await Task.create({
    workspace: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    title: parsed.data.title,
    description: parsed.data.description || undefined,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee: assigneeId,
    tags: parseTags(parsed.data.tags),
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function updateTaskAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const taskId = String(formData.get("taskId") ?? "");

  const rawData = {
    taskId,
    workspaceId: String(formData.get("workspaceId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "todo"),
    priority: String(formData.get("priority") ?? "medium"),
    assignee: String(formData.get("assignee") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  };

  const parsed = updateTaskSchema.safeParse(rawData);

  if (!parsed.success) {
    redirect(taskId ? `/tasks/${taskId}` : "/tasks");
  }

  const task = await ensureTaskAccess(session.user.id, parsed.data.taskId);

  if (!task) {
    redirect("/tasks");
  }

  const workspace = await ensureWorkspaceAccess(session.user.id, parsed.data.workspaceId);

  if (!workspace) {
    redirect("/tasks");
  }

  const assigneeId = parsed.data.assignee ? new mongoose.Types.ObjectId(parsed.data.assignee) : null;

  await connectToDatabase();

  await Task.findByIdAndUpdate(parsed.data.taskId, {
    workspace: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    title: parsed.data.title,
    description: parsed.data.description || "",
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee: assigneeId,
    tags: parseTags(parsed.data.tags),
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${parsed.data.taskId}`);
  redirect(`/tasks/${parsed.data.taskId}`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "todo");

  if (!taskId || !taskStatusSchema.safeParse(status).success) {
    redirect("/tasks");
  }

  const task = await ensureTaskAccess(session.user.id, taskId);

  if (!task) {
    redirect("/tasks");
  }

  await connectToDatabase();

  await Task.findByIdAndUpdate(taskId, { status });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  redirect("/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const taskId = String(formData.get("taskId") ?? "");

  if (!taskId) {
    redirect("/tasks");
  }

  const task = await ensureTaskAccess(session.user.id, taskId);

  if (!task) {
    redirect("/tasks");
  }

  await connectToDatabase();
  await Task.findByIdAndDelete(taskId);

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function addTaskCommentAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawData = {
    taskId: String(formData.get("taskId") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = commentSchema.safeParse(rawData);

  if (!parsed.success) {
    redirect("/tasks");
  }

  const task = await ensureTaskAccess(session.user.id, parsed.data.taskId);

  if (!task) {
    redirect("/tasks");
  }

  await connectToDatabase();

  await Task.findByIdAndUpdate(parsed.data.taskId, {
    $push: {
      comments: {
        user: new mongoose.Types.ObjectId(session.user.id),
        message: parsed.data.message,
        createdAt: new Date(),
      },
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${parsed.data.taskId}`);
  redirect(`/tasks/${parsed.data.taskId}`);
}
