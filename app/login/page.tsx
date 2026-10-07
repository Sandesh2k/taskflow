import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import Logo from "@/components/Logo";

export default async function LoginPage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      <section className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <AuthForm mode="login" />

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
