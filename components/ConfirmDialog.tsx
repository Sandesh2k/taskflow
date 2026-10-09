"use client";

import { useEffect } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "warning",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconText: "text-red-600 dark:text-red-400",
      confirmBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: "error",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconText: "text-amber-600 dark:text-amber-400",
      confirmBg: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: "info",
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconText: "text-sky-600 dark:text-sky-400",
      confirmBg: "bg-sky-600 hover:bg-sky-700",
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-[24px] ${styles.iconText}`}>
                {styles.icon}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-xl ${styles.confirmBg} transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
