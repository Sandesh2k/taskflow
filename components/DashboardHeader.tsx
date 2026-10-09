"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search") as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathname === "/tasks") {
      const url = new URL(window.location.href);
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      } else {
        url.searchParams.delete("search");
      }
      router.push(url.pathname + url.search);
    } else {
      router.push(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-6 hidden lg:flex">
      <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 w-96">
        <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">search</span>
        <input
          id="global-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
        />
        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium shrink-0">⌘K</span>
      </form>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
