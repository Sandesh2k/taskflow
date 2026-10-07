import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendCommentToTaskList,
  buildAssigneeOptions,
  buildStatusCounts,
  isDueThisWeek,
  normalizeSearchTerm,
  normalizeTags,
  summarizeTopAssignees,
} from "../lib/task-stats";
import { isValidPerformanceMeasureRange } from "../lib/performance-guard";

describe("task stats utilities", () => {
  it("normalizes tags into clean lowercase values", () => {
    assert.deepEqual(normalizeTags(" Design, design, Backend , QA, QA "), ["design", "backend", "qa"]);
  });

  it("counts tasks grouped by status", () => {
    const counts = buildStatusCounts([
      { status: "todo" },
      { status: "todo" },
      { status: "in_progress" },
      { status: "done" },
      { status: "done" },
      { status: "done", count: 2 },
    ]);

    assert.deepEqual(counts, { todo: 2, in_progress: 1, done: 4 });
  });

  it("flags tasks that are due this week", () => {
    const today = new Date();
    const nearFuture = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    const farFuture = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);

    assert.equal(isDueThisWeek(today), true);
    assert.equal(isDueThisWeek(nearFuture), true);
    assert.equal(isDueThisWeek(farFuture), false);
  });

  it("normalizes a full-text search phrase for task lookups", () => {
    assert.equal(normalizeSearchTerm("  Design   sprint  review  "), "design sprint review");
    assert.equal(normalizeSearchTerm("   "), "");
  });

  it("summarizes the top assignees by count", () => {
    const topAssignees = summarizeTopAssignees([
      { assignee: "user-1", assigneeName: "Alice" },
      { assignee: "user-1", assigneeName: "Alice" },
      { assignee: "user-2", assigneeName: "Bob" },
      { assignee: "user-3", assigneeName: "Chloe" },
    ]);

    assert.deepEqual(topAssignees, [
      { userId: "user-1", name: "Alice", count: 2 },
      { userId: "user-2", name: "Bob", count: 1 },
      { userId: "user-3", name: "Chloe", count: 1 },
    ]);
  });

  it("deduplicates workspace members and preserves owner names", () => {
    const options = buildAssigneeOptions(
      "owner-1",
      [{ userId: "owner-1" }, { userId: "member-2" }, { userId: "member-2" }],
      new Map([
        ["owner-1", "Aiden"],
        ["member-2", "Maya"],
      ]),
    );

    assert.deepEqual(options, [
      { _id: "owner-1", name: "Aiden" },
      { _id: "member-2", name: "Maya" },
    ]);
  });

  it("appends a valid comment to the task timeline", () => {
    const nextComments = appendCommentToTaskList(
      [{ user: "user-1", message: "First note", createdAt: new Date("2026-01-01") }],
      " Second review needed ",
      "user-2",
      new Date("2026-02-02"),
    );

    assert.equal(nextComments.length, 2);
    assert.equal(nextComments[1].message, "Second review needed");
    assert.equal(nextComments[1].user, "user-2");
  });

  it("rejects invalid performance ranges that would create a negative timestamp", () => {
    assert.equal(isValidPerformanceMeasureRange(-1, 10), false);
    assert.equal(isValidPerformanceMeasureRange(10, 5), false);
    assert.equal(isValidPerformanceMeasureRange(10, 20), true);
  });
});
