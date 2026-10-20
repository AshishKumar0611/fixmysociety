import type { ComplaintCategory, ComplaintPriority, ComplaintStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ACTIVE_STATUSES,
  CATEGORIES,
  OPEN_STATUSES,
  PRIORITIES,
  RESOLVED_STATUSES,
  STATUSES,
} from "@/lib/constants";
import { assertManager, type Actor } from "./types";

// ---------------------------------------------------------------------------
// Metric definitions (used consistently across dashboards, analytics and tests)
//
//   Open         = OPEN + ASSIGNED        (waiting for work to start)
//   In progress  = IN_PROGRESS
//   Resolved     = RESOLVED + CLOSED      (fixed; CLOSED is only reachable from RESOLVED)
//   Resolution rate      = Resolved ÷ Total, or null when there are no complaints
//   Avg resolution time  = mean(resolvedAt − createdAt) over resolved complaints with a resolvedAt
// ---------------------------------------------------------------------------

export type StatusCounts = Record<ComplaintStatus, number>;

export function emptyStatusCounts(): StatusCounts {
  return Object.fromEntries(STATUSES.map((s) => [s, 0])) as StatusCounts;
}

export function summarize(counts: StatusCounts) {
  const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const open = OPEN_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const inProgress = counts.IN_PROGRESS;
  const resolved = RESOLVED_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  return {
    total,
    open,
    inProgress,
    resolved,
    resolutionRate: total === 0 ? null : resolved / total,
  };
}

export function averageHours(pairs: { createdAt: Date; resolvedAt: Date | null }[]) {
  const durations = pairs
    .filter((p): p is { createdAt: Date; resolvedAt: Date } => p.resolvedAt !== null)
    .map((p) => (p.resolvedAt.getTime() - p.createdAt.getTime()) / 3_600_000)
    .filter((h) => h >= 0);
  if (durations.length === 0) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** YYYY-MM-DD of a timestamp in IST. */
export function istDateKey(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Buckets complaint creation dates into a continuous series between `from` and `to`.
 * Uses daily buckets up to 45 days and weekly buckets beyond that so charts stay readable.
 */
export function buildTrend(created: Date[], resolved: Date[], from: Date, to: Date) {
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
  const step = days > 45 ? 7 : 1;
  const startKey = istDateKey(from);
  const start = new Date(`${startKey}T00:00:00.000+05:30`).getTime();
  const buckets: { key: string; label: string; submitted: number; resolved: number }[] = [];
  for (let t = start; t <= to.getTime(); t += step * DAY_MS) {
    const d = new Date(t);
    buckets.push({
      key: istDateKey(d),
      label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(d),
      submitted: 0,
      resolved: 0,
    });
  }
  const indexOf = (date: Date) => Math.floor((date.getTime() - start) / (step * DAY_MS));
  for (const c of created) {
    const i = indexOf(c);
    if (i >= 0 && i < buckets.length) buckets[i]!.submitted++;
  }
  for (const r of resolved) {
    const i = indexOf(r);
    if (i >= 0 && i < buckets.length) buckets[i]!.resolved++;
  }
  return { buckets, granularity: step === 7 ? ("week" as const) : ("day" as const) };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function statusCounts(where: Prisma.ComplaintWhereInput) {
  const rows = await prisma.complaint.groupBy({ by: ["status"], where, _count: { _all: true } });
  const counts = emptyStatusCounts();
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

export async function getResidentStats(actor: Actor) {
  return summarize(await statusCounts({ residentId: actor.id, societyId: actor.societyId }));
}

export async function getRecentComplaintsForResident(actor: Actor, take = 5) {
  return prisma.complaint.findMany({
    where: { residentId: actor.id, societyId: actor.societyId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      complaintNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      createdAt: true,
      location: true,
      resident: { select: { name: true, unitNumber: true } },
      assignedManager: { select: { name: true } },
    },
  });
}

export type DateRange = { from: Date; to: Date };

/**
 * Society-wide metrics for managers. When `range` is given, every metric and chart is
 * restricted to complaints CREATED within it, so all numbers on a page agree.
 */
export async function getSocietyMetrics(actor: Actor, range?: DateRange) {
  assertManager(actor);
  const where: Prisma.ComplaintWhereInput = {
    societyId: actor.societyId,
    ...(range ? { createdAt: { gte: range.from, lte: range.to } } : {}),
  };

  const [counts, byCategoryRows, byPriorityRows, resolvedPairs, ratingAgg] = await Promise.all([
    statusCounts(where),
    prisma.complaint.groupBy({ by: ["category"], where, _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["priority"], where, _count: { _all: true } }),
    prisma.complaint.findMany({
      where: { ...where, status: { in: RESOLVED_STATUSES }, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.feedback.aggregate({
      where: { complaint: where },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const byCategory = CATEGORIES.map((category) => ({
    category,
    count: byCategoryRows.find((r) => r.category === category)?._count._all ?? 0,
  }));
  const byPriority = PRIORITIES.map((priority) => ({
    priority,
    count: byPriorityRows.find((r) => r.priority === priority)?._count._all ?? 0,
  }));

  return {
    ...summarize(counts),
    statusCounts: counts,
    byCategory: byCategory as { category: ComplaintCategory; count: number }[],
    byPriority: byPriority as { priority: ComplaintPriority; count: number }[],
    avgResolutionHours: averageHours(resolvedPairs),
    averageRating: ratingAgg._avg.rating,
    ratingCount: ratingAgg._count._all,
  };
}

export async function getTrend(actor: Actor, range: DateRange) {
  assertManager(actor);
  const [created, resolved] = await Promise.all([
    prisma.complaint.findMany({
      where: { societyId: actor.societyId, createdAt: { gte: range.from, lte: range.to } },
      select: { createdAt: true },
    }),
    prisma.complaint.findMany({
      where: { societyId: actor.societyId, resolvedAt: { gte: range.from, lte: range.to } },
      select: { resolvedAt: true },
    }),
  ]);
  return buildTrend(
    created.map((c) => c.createdAt),
    resolved.map((r) => r.resolvedAt!),
    range.from,
    range.to,
  );
}

export async function getUrgentUnresolved(actor: Actor, take = 6) {
  assertManager(actor);
  return prisma.complaint.findMany({
    where: {
      societyId: actor.societyId,
      status: { in: ACTIVE_STATUSES },
      priority: { in: ["HIGH", "URGENT"] },
    },
    orderBy: [{ priorityRank: "desc" }, { createdAt: "asc" }],
    take,
    select: {
      id: true,
      complaintNumber: true,
      title: true,
      priority: true,
      status: true,
      createdAt: true,
      resident: { select: { name: true, unitNumber: true } },
    },
  });
}

export async function countUrgentUnresolved(actor: Actor) {
  return prisma.complaint.count({
    where: {
      societyId: actor.societyId,
      status: { in: ACTIVE_STATUSES },
      priority: { in: ["HIGH", "URGENT"] },
    },
  });
}

export async function getRecentActivity(actor: Actor, take = 8) {
  assertManager(actor);
  return prisma.complaintStatusHistory.findMany({
    where: { complaint: { societyId: actor.societyId } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      previousStatus: true,
      newStatus: true,
      description: true,
      createdAt: true,
      changedBy: { select: { name: true, role: true } },
      complaint: { select: { id: true, complaintNumber: true, title: true } },
    },
  });
}

/** Rows for CSV export: no internal notes, no resident names, emails or phone numbers. */
export async function getExportRows(actor: Actor, range: DateRange) {
  assertManager(actor);
  return prisma.complaint.findMany({
    where: { societyId: actor.societyId, createdAt: { gte: range.from, lte: range.to } },
    orderBy: { createdAt: "asc" },
    select: {
      complaintNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      location: true,
      createdAt: true,
      resolvedAt: true,
      resident: { select: { unitNumber: true } },
      assignedManager: { select: { name: true } },
      feedback: { select: { rating: true } },
    },
  });
}
