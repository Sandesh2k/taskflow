import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              TaskFlow
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Plan work. Ship faster.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                A collaborative task manager for team planning, execution, and progress tracking.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Core workflow</h2>
            <ul className="mt-5 space-y-4 text-sm text-slate-700">
              <li className="rounded-xl bg-white p-3 shadow-sm">Organize tasks by status and priority</li>
              <li className="rounded-xl bg-white p-3 shadow-sm">Assign work across teams and people</li>
              <li className="rounded-xl bg-white p-3 shadow-sm">Track progress and recent activity</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
