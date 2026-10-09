import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default async function HomePage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 lg:px-12 py-6">
          <Logo />
          <ThemeToggle />
        </header>

        <section className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4">
          <div className="w-full max-w-4xl space-y-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-400 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Modern sprint workflows
            </div>

            {/* Hero text */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-7xl">
                Plan work.{" "}
                <span className="bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-purple-400">
                  Ship faster.
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl leading-relaxed">
                A collaborative task manager for team planning, execution, and progress tracking.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:from-sky-500 hover:to-sky-600 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 dark:from-sky-500 dark:to-sky-600 dark:hover:from-sky-400 dark:hover:to-sky-500 sm:text-base"
              >
                Create account
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md sm:text-base"
              >
                Sign in
              </Link>
            </div>

            {/* Features preview */}
            <div className="grid gap-6 sm:grid-cols-3 pt-8">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[24px] text-sky-600 dark:text-sky-400">dashboard</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Dashboard</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Track progress at a glance</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[24px] text-purple-600 dark:text-purple-400">groups</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Teams</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Collaborate seamlessly</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[24px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Tasks</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Organize your workflow</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
