"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName = "User" }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/workspaces", label: "Workspaces", icon: "domain" },
    { href: "/tasks", label: "Tasks", icon: "checklist" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-slate-200 shadow-lg hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 transition-all"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-[24px] text-slate-700 dark:text-slate-300">
          {isOpen ? "close" : "menu"}
        </span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Top Section */}
          <div className="flex flex-col">
            {/* Logo/Brand */}
            <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <span className="font-semibold text-lg text-slate-900 dark:text-slate-100 tracking-tight">TaskFlow</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="px-4 pt-6">
              <div className="px-3 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Menu</span>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Section - Profile */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/30 text-sky-700 dark:text-sky-400 flex items-center justify-center font-semibold text-sm">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-500 truncate">View profile</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
