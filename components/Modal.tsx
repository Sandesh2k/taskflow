"use client";

import { ReactNode, useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="p-6">
          {title ? <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3> : null}
          <div className="mt-4">{children}</div>
          <button aria-hidden onClick={onClose} className="sr-only" />
        </div>
      </div>
    </div>
  );
}
