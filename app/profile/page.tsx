import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { LogoutButton } from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import DashboardLayout from "@/components/DashboardLayout";
import User from "@/models/User";

async function updateProfile(formData: FormData) {
  "use server";

  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(session.user.id, { name });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function ProfilePage() {
  const session = await getSafeSession();

  if (!session?.user) {
    redirect("/login");
  }

  await connectToDatabase();
  const currentUser = await User.findById(session.user.id).lean();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
  const userName = currentUser?.name ?? session.user.name ?? session.user.email ?? "User";
  const avatarColorIndex = userName.length % avatarColors.length;

  return (
    <DashboardLayout userName={userName}>
      <main className="w-full bg-slate-50 dark:bg-slate-950 flex-1">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col w-full gap-8">
          {/* Profile Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-slate-800 dark:to-slate-900 p-6 lg:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative z-10 flex flex-col">
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Profile</h1>
              <p className="text-base text-slate-100 dark:text-slate-300 mt-2">Manage your account settings</p>
            </div>
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/20 dark:bg-emerald-500/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-white/20 dark:bg-sky-500/20 blur-3xl pointer-events-none"></div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex flex-col items-center text-center">
                <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg ${avatarColors[avatarColorIndex]} ring-4 ring-white dark:ring-slate-800`}>
                  {getInitials(userName)}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{userName}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{session.user.email}</p>
                <a
                  href="/dashboard"
                  className="mt-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Back to dashboard
                </a>
              </div>
            </div>

            {/* Update Profile Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">edit</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Profile</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information</p>
                </div>
              </div>

              <form action={updateProfile} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    defaultValue={String(currentUser?.name ?? session.user.name ?? "")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email address
                  </label>
                  <p className="text-slate-900 dark:text-slate-100">{session.user.email}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Settings Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6 lg:col-span-3">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-slate-600 dark:text-slate-400">settings</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage your preferences</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30">
                      <span className="material-symbols-outlined text-[20px] text-sky-600 dark:text-sky-400">dark_mode</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Appearance</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Toggle theme</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4 hover:border-red-300 dark:hover:border-red-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                      <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400">logout</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Sign out</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Log out of account</p>
                    </div>
                  </div>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
