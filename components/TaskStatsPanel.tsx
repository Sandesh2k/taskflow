"use client";

import Link from "next/link";
import type { TaskStatsSummary } from "@/lib/task-stats";

export default function TaskStatsPanel({ stats }: { stats: TaskStatsSummary }) {
  const statusCards = [
    { label: "Queued", value: stats.tasksByStatus.todo, tone: "bg-sky-50 text-sky-700 border-sky-200" },
    { label: "Active", value: stats.tasksByStatus.in_progress, tone: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Closed", value: stats.tasksByStatus.done, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100) 
    : 0;

  return (
    <section aria-label="Task statistics" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Overview</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Task statistics</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {statusCards.map((card) => (
          <article key={card.label} className={`rounded-2xl border p-4 ${card.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            <p className="mt-4 text-3xl font-bold">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Total scope</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalTasks}</p>
            </div>
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-sky-600"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
                {completionRate}%
              </span>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl border-2 p-4 shadow-sm ${stats.dueThisWeek > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Due this week</p>
          <p className={`mt-2 text-3xl font-bold ${stats.dueThisWeek > 0 ? "text-red-700" : "text-slate-900"}`}>{stats.dueThisWeek}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Top assignees</h3>
        <ul className="mt-3 space-y-2" aria-label="Top assignees by task count">
          {stats.topAssignees.length === 0 ? (
            <li className="text-sm text-slate-500">No assignments yet.</li>
          ) : (
            stats.topAssignees.map((assignee) => (
              <li key={assignee.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-800">{assignee.name}</span>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">{assignee.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
