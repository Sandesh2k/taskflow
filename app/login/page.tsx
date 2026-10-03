import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="login" />

        <p className="text-center text-sm text-slate-600">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-sky-700 hover:text-sky-800">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
