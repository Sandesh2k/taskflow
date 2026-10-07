"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { normalizeTags } from "@/lib/task-stats";
import { canUserAssignTasks } from "@/lib/workspace-permissions";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const taskPrioritySchema = z.enum(["low", "medium", "high"]);

const parseTags = (value: string) => normalizeTags(value);

const createTaskSchema = z.object({
  workspaceId: z.string().min(1, "Select a workspace."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  description: z.string().trim().max(1000).default(""),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assignee: z.string().optional().default(""),
  tags: z.string().default(""),
  dueDate: z.string().optional().default(""),
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
    dueDate: String(formData.get("dueDate") ?? ""),
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

  // Check if user can assign tasks (admin/owner only)
  if (parsed.data.assignee) {
    const canAssign = await canUserAssignTasks(userId, parsed.data.workspaceId);
    if (!canAssign) {
      // Non-admins can only assign to themselves
      if (parsed.data.assignee !== userId) {
        redirect("/tasks");
      }
    }
  }

  const assigneeId = parsed.data.assignee ? new mongoose.Types.ObjectId(parsed.data.assignee) : null;
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  await connectToDatabase();

  await Task.create({
    workspace: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    title: parsed.data.title,
    description: parsed.data.description || undefined,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee: assigneeId,
    tags: parseTags(parsed.data.tags),
    dueDate,
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
    dueDate: String(formData.get("dueDate") ?? ""),
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

  // Check if user is admin/owner
  const canAssign = await canUserAssignTasks(session.user.id, parsed.data.workspaceId);

  // If not admin/owner, only allow status updates
  if (!canAssign) {
    // Check if user is trying to modify fields other than status
    const currentTask = await Task.findById(parsed.data.taskId).lean();
    if (!currentTask) {
      redirect("/tasks");
    }

    // Only allow status to change, all other fields must remain the same
    const isOnlyStatusChanging = 
      String(currentTask.workspace) === parsed.data.workspaceId &&
      currentTask.title === parsed.data.title &&
      currentTask.description === parsed.data.description &&
      currentTask.priority === parsed.data.priority &&
      String(currentTask.assignee || "") === parsed.data.assignee &&
      JSON.stringify(currentTask.tags || []) === JSON.stringify(parseTags(parsed.data.tags));

    if (!isOnlyStatusChanging) {
      redirect(`/tasks/${taskId}`);
    }
  } else {
    // Admin/owner can assign tasks to anyone
    if (parsed.data.assignee) {
      if (parsed.data.assignee !== session.user.id) {
        // Admin assigning to someone else is allowed
      }
    }
  }

  const assigneeId = parsed.data.assignee ? new mongoose.Types.ObjectId(parsed.data.assignee) : null;
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  // Validate status transitions: prevent Todo -> Done and Done -> Todo
  const currentTask = await Task.findById(parsed.data.taskId).lean();
  if (!currentTask) {
    redirect("/tasks");
  }

  if (currentTask.status === "todo" && parsed.data.status === "done") {
    redirect(`/tasks/${taskId}`);
  }
  if (currentTask.status === "done" && parsed.data.status === "todo") {
    redirect(`/tasks/${taskId}`);
  }

  await connectToDatabase();

  await Task.findByIdAndUpdate(parsed.data.taskId, {
    workspace: new mongoose.Types.ObjectId(parsed.data.workspaceId),
    title: parsed.data.title,
    description: parsed.data.description || "",
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignee: assigneeId,
    tags: parseTags(parsed.data.tags),
    dueDate,
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

  // Validate status transitions: prevent Todo -> Done and Done -> Todo
  if (task.status === "todo" && status === "done") {
    redirect("/tasks");
  }
  if (task.status === "done" && status === "todo") {
    redirect("/tasks");
  }

  await connectToDatabase();

  await Task.findByIdAndUpdate(taskId, { status });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  redirect("/tasks");
}

export async function updateTaskStatusById(taskId: string, status: string) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!taskId || !taskStatusSchema.safeParse(status).success) {
    return { success: false, error: "Invalid input" };
  }

  const task = await ensureTaskAccess(session.user.id, taskId);

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  // Validate status transitions: prevent Todo -> Done and Done -> Todo
  if (task.status === "todo" && status === "done") {
    return { success: false, error: "Invalid status transition" };
  }
  if (task.status === "done" && status === "todo") {
    return { success: false, error: "Invalid status transition" };
  }

  await connectToDatabase();

  await Task.findByIdAndUpdate(taskId, { status });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);

  return { success: true };
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

  // Check if user is admin/owner - only they can delete tasks
  const workspaceId = typeof task.workspace === "string" ? task.workspace : String(task.workspace._id);
  const canDelete = await canUserAssignTasks(session.user.id, workspaceId);
  
  if (!canDelete) {
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

export async function deleteTaskCommentAction(formData: FormData) {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const taskId = String(formData.get("taskId") ?? "");
  const commentIndex = Number(formData.get("commentIndex") ?? "");

  if (!taskId || isNaN(commentIndex)) {
    redirect("/tasks");
  }

  const task = await ensureTaskAccess(session.user.id, taskId);

  if (!task) {
    redirect("/tasks");
  }

  // Check if user is admin/owner - only they can delete comments
  const workspaceId = typeof task.workspace === "string" ? task.workspace : String(task.workspace._id);
  const canDelete = await canUserAssignTasks(session.user.id, workspaceId);
  
  if (!canDelete) {
    redirect(`/tasks/${taskId}`);
  }

  await connectToDatabase();

  const taskDoc = await Task.findById(taskId).lean();
  if (!taskDoc || !Array.isArray(taskDoc.comments)) {
    redirect(`/tasks/${taskId}`);
  }

  // Remove the comment at the specified index
  taskDoc.comments.splice(commentIndex, 1);

  await Task.findByIdAndUpdate(taskId, { comments: taskDoc.comments });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}`);
}
