import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import WorkspaceDeleteButton from "@/components/WorkspaceDeleteButton";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";

async function createWorkspace(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const memberEmails = String(formData.get("memberEmails") ?? "").trim();

  if (!name) {
    redirect(`/workspaces?toast=${encodeURIComponent("Workspace name is required")}&toastType=error`);
  }

  await connectToDatabase();

  // Generate unique slug with random suffix to avoid duplicates
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "workspace";

  // Check if slug exists and add random suffix if needed
  let slugExists = await Workspace.findOne({ slug });
  let attempts = 0;
  while (slugExists && attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    slug = `${slug}-${randomSuffix}`;
    slugExists = await Workspace.findOne({ slug });
    attempts++;
  }

  // Parse member emails and find corresponding users
  const members: Array<{ userId: mongoose.Types.ObjectId; role: "owner" | "member" }> = [
    { userId: new mongoose.Types.ObjectId(session.user.id), role: "owner" },
  ];

  if (memberEmails) {
    const User = (await import("@/models/User")).default;
    const emails = memberEmails.split(",").map((e) => e.trim()).filter((e) => e);
    
    for (const email of emails) {
      const user = await User.findOne({ email }).select("_id").lean();
      if (user) {
        members.push({
          userId: user._id,
          role: "member" as const,
        });
      }
    }
  }

  await Workspace.create({
    name,
    slug,
    description: description || undefined,
    owner: new mongoose.Types.ObjectId(session.user.id),
    members,
  });
  revalidatePath("/workspaces");
  revalidatePath("/dashboard");
  redirect(`/workspaces?toast=${encodeURIComponent("Workspace created successfully")}&toastType=success`);
}

async function deleteWorkspace(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!workspaceId) {
    redirect(`/workspaces?toast=${encodeURIComponent("Missing workspace id")}&toastType=error`);
  }

  await connectToDatabase();

  const workspace = await Workspace.findById(workspaceId).lean();

  if (!workspace) {
    redirect(`/workspaces?toast=${encodeURIComponent("Workspace not found")}&toastType=error`);
  }

  // Check if user is owner
  if (String(workspace.owner) !== session.user.id) {
    redirect(`/workspaces?toast=${encodeURIComponent("Insufficient permissions to delete workspace")}&toastType=error`);
  }

  // Delete all tasks in the workspace
  await Task.deleteMany({ workspace: new mongoose.Types.ObjectId(workspaceId) });

  // Delete the workspace
  await Workspace.findByIdAndDelete(workspaceId);
  revalidatePath("/workspaces");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect(`/workspaces?toast=${encodeURIComponent("Workspace deleted successfully")}&toastType=success`);
}

export default async function WorkspacesPage() {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userName = session.user.name ?? session.user.email ?? "User";

  await connectToDatabase();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const workspaces = await Workspace.find({
    $or: [{ owner: userObjectId }, { "members.userId": userObjectId }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <DashboardLayout userName={userName}>
      <main id="main-content" className="w-full bg-slate-50 dark:bg-slate-950 flex-1">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col w-full gap-8">
            {/* Welcome Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 dark:from-slate-800 dark:to-slate-900 p-6 lg:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative z-10 flex flex-col">
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Workspaces</h1>
                <p className="text-base text-slate-100 dark:text-slate-300 mt-2">Manage your team workspaces</p>
              </div>
              <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/20 dark:bg-purple-500/20 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-white/20 dark:bg-sky-500/20 blur-3xl pointer-events-none"></div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
            <CreateWorkspaceModal createWorkspaceAction={createWorkspace} />

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-slate-600 dark:text-slate-400">workspaces</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Workspaces</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {workspaces.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 text-center">
                    <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2">folder_open</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No workspaces yet. Create one to start planning work.</p>
                  </div>
                ) : (
                  workspaces.map((workspace) => {
                    const isOwner = String(workspace.owner) === userId;
                    const getInitials = (name: string) => {
                      return name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                    };
                    const avatarColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
                    const avatarColorIndex = workspace.name.length % avatarColors.length;

                    return (
                      <div key={String(workspace._id)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColors[avatarColorIndex]}`}>
                              {getInitials(workspace.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{workspace.name}</p>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">/{workspace.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                            {isOwner && (
                              <WorkspaceDeleteButton workspaceId={String(workspace._id)} deleteWorkspaceAction={deleteWorkspace} />
                            )}
                          </div>
                        </div>
                        {workspace.description ? (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{workspace.description}</p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
