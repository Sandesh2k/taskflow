import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SignUpPage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden flex items-center justify-center p-6">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {/* Top Branding Bar */}
          <header className="flex items-center justify-between pb-6 mb-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <span className="font-semibold text-lg text-slate-900 dark:text-slate-100 tracking-tight">TaskFlow</span>
            </Link>
            <ThemeToggle />
          </header>

          {/* Auth Form */}
          <AuthForm mode="signup" />

          {/* Bottom Helper Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?
            </span>
            <Link href="/login" className="ml-1 text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
