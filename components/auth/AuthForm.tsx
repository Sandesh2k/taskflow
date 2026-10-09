"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!isLogin) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Unable to create your account.");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Header Block */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? "Sign in to continue to your workspace." : "Set up your profile and start organizing work."}
        </p>
      </div>

      {!isLogin && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
            className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_2px_rgba(59,130,246,0.35)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:bg-slate-600"
            placeholder="Alex Morgan"
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_2px_rgba(59,130,246,0.35)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:bg-slate-600"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_2px_rgba(59,130,246,0.35)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:bg-slate-600"
          placeholder="At least 8 characters"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</p>
      ) : null}

      <div className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full h-10 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 text-white text-sm font-semibold shadow-sm hover:from-sky-500 hover:to-sky-400 active:scale-[0.99] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
        >
          {isSubmitting ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Sign in" : "Create account"}
        </button>
      </div>
    </form>
  );
}
