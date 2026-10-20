import { CheckCircle2, ClipboardList, Inbox, Wrench } from "lucide-react";
import type { ComplaintStatus } from "@prisma/client";
import { KpiCard } from "@/components/app/kpi-card";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { getSocietyMetrics } from "@/server/services/stats";
import { BarList } from "./bar-list";

export type SocietyMetrics = Awaited<ReturnType<typeof getSocietyMetrics>>;

export function KpiRow({ m }: { m: SocietyMetrics }) {
  return (
    <section aria-label="Complaint totals" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <KpiCard label="Total complaints" value={m.total} icon={ClipboardList} tone="navy" />
      <KpiCard label="Open complaints" value={m.open} icon={Inbox} tone="info" hint="Open or assigned" />
      <KpiCard label="In Progress" value={m.inProgress} icon={Wrench} tone="warning" />
      <KpiCard label="Resolved" value={m.resolved} icon={CheckCircle2} tone="success" hint="Resolved or closed" />
    </section>
  );
}

const STATUS_BAR: Record<ComplaintStatus, string> = {
  OPEN: "bg-info",
  ASSIGNED: "bg-secondary",
  IN_PROGRESS: "bg-warning",
  RESOLVED: "bg-success",
  CLOSED: "bg-muted",
};

export function StatusBreakdown({ m }: { m: SocietyMetrics }) {
  return (
    <BarList
      sort={false}
      data={STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], value: m.statusCounts[s], colorClass: STATUS_BAR[s] }))}
    />
  );
}

export function CategoryBreakdown({ m }: { m: SocietyMetrics }) {
  return (
    <BarList data={m.byCategory.filter((c) => c.count > 0).map((c) => ({ key: c.category, label: CATEGORY_LABELS[c.category], value: c.count }))} />
  );
}

export function PriorityBreakdown({ m }: { m: SocietyMetrics }) {
  return (
    <BarList sort={false} data={m.byPriority.map((p) => ({ key: p.priority, label: PRIORITY_LABELS[p.priority], value: p.count }))} />
  );
}
