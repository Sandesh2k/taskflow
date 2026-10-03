import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function SignUpPage() {
  const session = await getSafeSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="signup" />

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
