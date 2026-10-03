"use client";

import Link from "next/link";
import type { TaskStatsSummary } from "@/lib/task-stats";

export default function TaskStatsPanel({ stats }: { stats: TaskStatsSummary }) {
  const statusCards = [
    { label: "To do", value: stats.tasksByStatus.todo, tone: "bg-slate-100 text-slate-700" },
    { label: "In progress", value: stats.tasksByStatus.in_progress, tone: "bg-amber-100 text-amber-800" },
    { label: "Done", value: stats.tasksByStatus.done, tone: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <section aria-label="Task statistics" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Overview</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Task statistics</h2>
        </div>
        <Link href="/tasks" prefetch={true} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
          Open board
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {statusCards.map((card) => (
          <article key={card.label} className={`rounded-2xl border border-slate-200 p-4 ${card.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            <p className="mt-4 text-3xl font-bold">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Total tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalTasks}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Due this week</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.dueThisWeek}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-base font-semibold text-slate-900">Top assignees</h3>
        <ul className="mt-3 space-y-2" aria-label="Top assignees by task count">
          {stats.topAssignees.length === 0 ? (
            <li className="text-sm text-slate-500">No assignments yet.</li>
          ) : (
            stats.topAssignees.map((assignee) => (
              <li key={assignee.userId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
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
