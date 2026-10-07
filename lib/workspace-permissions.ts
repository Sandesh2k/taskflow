import { connectToDatabase } from "@/lib/db";
import Workspace, { WorkspaceRole } from "@/models/Workspace";
import mongoose from "mongoose";

export async function getUserRoleInWorkspace(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  await connectToDatabase();

  const workspace = await Workspace.findById(workspaceId).lean();

  if (!workspace) {
    return null;
  }

  // Check if user is owner
  if (String(workspace.owner) === userId) {
    return "owner";
  }

  // Check if user is a member
  const member = workspace.members?.find((m) => String(m.userId) === userId);
  if (member) {
    return member.role;
  }

  return null;
}

export async function canUserAssignTasks(userId: string, workspaceId: string): Promise<boolean> {
  const role = await getUserRoleInWorkspace(userId, workspaceId);
  return role === "owner" || role === "admin";
}

export async function canUserViewAllTasks(userId: string, workspaceId: string): Promise<boolean> {
  const role = await getUserRoleInWorkspace(userId, workspaceId);
  return role === "owner" || role === "admin";
}

export async function canUserViewTask(userId: string, taskId: string): Promise<boolean> {
  await connectToDatabase();
  
  const Task = (await import("@/models/Task")).default;
  const task = await Task.findById(taskId).lean();

  if (!task) {
    return false;
  }

  const role = await getUserRoleInWorkspace(userId, String(task.workspace));

  // Owner and admin can see all tasks
  if (role === "owner" || role === "admin") {
    return true;
  }

  // Members can only see tasks assigned to them or created by them
  const isAssignee = task.assignee && String(task.assignee) === userId;
  const isCreator = String(task.createdBy) === userId;

  return isAssignee || isCreator;
}
