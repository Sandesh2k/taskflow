import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
      <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
          </div>
          <span className="font-semibold text-lg text-slate-900 dark:text-slate-100 tracking-tight">TaskFlow</span>
      </Link>
  );
}
