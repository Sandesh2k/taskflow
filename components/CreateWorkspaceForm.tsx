"use client";

import React from "react";

interface Props {
  createWorkspaceAction: (formData: FormData) => void;
}

export default function CreateWorkspaceForm({ createWorkspaceAction }: Props) {
  return (
    <form action={createWorkspaceAction} className="space-y-4">
      <div>
        <label htmlFor="workspace-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Workspace name
        </label>
        <input
          id="workspace-name"
          name="name"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          placeholder="Marketing team"
          required
        />
      </div>

      <div>
        <label htmlFor="workspace-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          id="workspace-description"
          name="description"
          rows={3}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          placeholder="Campaign planning and launch coordination"
        />
      </div>

      <div>
        <label htmlFor="member-emails" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Invite members (optional)
        </label>
        <input
          id="member-emails"
          name="memberEmails"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
          placeholder="email1@example.com, email2@example.com"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Separate multiple email addresses with commas</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 shadow-sm hover:shadow-md"
        >
          Create Workspace
        </button>
      </div>
    </form>
  );
}
