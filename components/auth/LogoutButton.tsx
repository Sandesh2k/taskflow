"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleSignOut = () => {
    const callbackUrl = typeof window === "undefined" ? "/login" : `${window.location.origin}/login`;
    void signOut({ callbackUrl });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      Log out
    </button>
  );
}
