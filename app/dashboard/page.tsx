import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getSafeSession } from "@/lib/auth";
import { getTaskStatsForUser } from "@/lib/task-stats";

export default async function DashboardPage() {
  const session = await getSafeSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const stats = await getTaskStatsForUser(userId);
  const userName = session.user.name ?? session.user.email ?? "User";
  const completionRate = stats.totalTasks > 0 ? Math.round((stats.doneCount / stats.totalTasks) * 100) : 0;

  return (
    <DashboardLayout userName={userName}>
      <main className="w-full bg-slate-50 dark:bg-slate-950 flex-1">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col w-full gap-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 dark:from-slate-800 dark:to-slate-900 p-6 lg:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative z-10 flex flex-col">
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-base text-slate-100 dark:text-slate-300 mt-2">Welcome back, {userName}</p>
              </div>
              <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/20 dark:bg-sky-500/20 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-white/20 dark:bg-purple-500/20 blur-3xl pointer-events-none"></div>
            </div>

            {/* Stats Grid */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Task statistics and metrics</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Todo Card */}
                <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px] text-slate-600 dark:text-slate-400">schedule</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">To Do</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.todoCount || 0}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {stats.totalTasks > 0 ? Math.round((stats.todoCount / stats.totalTasks) * 100) : 0}% of total
                  </div>
                </div>

                {/* In Progress Card */}
                <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px] text-sky-600 dark:text-sky-400">progress_activity</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">In Progress</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.inProgressCount || 0}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {stats.totalTasks > 0 ? Math.round((stats.inProgressCount / stats.totalTasks) * 100) : 0}% of total
                  </div>
                </div>

                {/* Done Card */}
                <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.doneCount || 0}</span>
                  </div>
                  <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {completionRate}% completion rate
                  </div>
                </div>

                {/* Workspaces Card */}
                <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px] text-purple-600 dark:text-purple-400">workspaces</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Workspaces</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.workspaceCount || 0}</span>
                  </div>
                  <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Active workspaces
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions & Productivity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-sky-600 dark:text-sky-400">bolt</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Get started quickly</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/workspaces"
                      className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          <span className="material-symbols-outlined text-[22px]">add_business</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">New Workspace</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Create a workspace</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">arrow_forward</span>
                    </Link>
                    <Link
                      href="/tasks"
                      className="group flex items-center justify-between p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all border border-sky-200 dark:border-sky-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <span className="material-symbols-outlined text-[22px]">add_task</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">New Task</span>
                          <span className="text-xs text-sky-600 dark:text-sky-400">Add a task</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-sky-600 dark:text-sky-400">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Productivity Insights */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">analytics</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Productivity</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Your performance metrics</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{completionRate}%</span>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="flex flex-col gap-3 p-5 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Completion Rate</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{completionRate}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${completionRate}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{stats.doneCount || 0} completed</span>
                      <span>{stats.totalTasks || 0} total tasks</span>
                    </div>
                  </div>

                  {/* Metrics Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Total Tasks</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTasks || 0}</span>
                      </div>
                      <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">done</span> {stats.doneCount || 0} done
                      </div>
                    </div>
                    <div className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Workspaces</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.workspaceCount || 0}</span>
                      </div>
                      <div className="mt-1 text-xs text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">sync</span> Active
                      </div>
                    </div>
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
