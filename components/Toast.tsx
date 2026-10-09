"use client";

import { useEffect, useState } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type = "success", duration = 6000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-emerald-500 dark:bg-emerald-600",
    error: "bg-red-500 dark:bg-red-600",
    warning: "bg-amber-500 dark:bg-amber-600",
    info: "bg-sky-500 dark:bg-sky-600",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  return (
    <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className={`${typeStyles[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px]`}>
        <span className="material-symbols-outlined text-[20px]">{icons[type]}</span>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
