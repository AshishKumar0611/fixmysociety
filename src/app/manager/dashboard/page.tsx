import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, Clock, Gauge, Star, Activity } from "lucide-react";
import { RecentComplaintList } from "@/components/app/complaint-list";
import { CategoryBreakdown, KpiRow, StatusBreakdown } from "@/components/charts/metrics";
import { TrendChart } from "@/components/charts/trend-chart";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { resolveRange } from "@/lib/date-range";
import { formatDuration, formatLongDate, formatRelative, greeting } from "@/lib/utils";
import { toActor } from "@/server/actions/helpers";
import { listComplaints } from "@/server/services/complaints";
import { countUrgentUnresolved, getRecentActivity, getSocietyMetrics, getTrend, getUrgentUnresolved } from "@/server/services/stats";

export const metadata: Metadata = { title: "Manager dashboard" };

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Gauge; label: string; value: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="text-[22px] font-bold leading-tight tracking-tight text-ink">{value}</p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
    </div>
  );
}

export default async function ManagerDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireManager();
  const actor = toActor(user);
  const range = resolveRange({ range: "30" });
  const [m, trend, urgent, urgentCount, activity, recent, { denied }] = await Promise.all([
    getSocietyMetrics(actor),
    getTrend(actor, range),
    getUrgentUnresolved(actor, 6),
    countUrgentUnresolved(actor),
    getRecentActivity(actor, 8),
    listComplaints(actor, { sort: "newest", page: 1 }, 5),
    searchParams,
  ]);
  const now = new Date();
  const topCategory = [...m.byCategory].sort((a, b) => b.count - a.count)[0];

  return (
    <>
      {denied ? (
        <div className="mb-4">
          <FormMessage>That page is only available to residents.</FormMessage>
        </div>
      ) : null}
      <PageHeader
        eyebrow={formatLongDate(now)}
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description={`Operations overview for ${user.society.name}`}
        actions={
          <>
            <LinkButton href="/manager/analytics" variant="outline">
              <BarChart3 aria-hidden />
              Analytics
            </LinkButton>
            <LinkButton href="/manager/complaints?status=OPEN">Review open complaints</LinkButton>
          </>
        }
      />

      <KpiRow m={m} />

      <section aria-label="Performance" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Metric
          icon={Gauge}
          label="Resolution rate"
          value={m.resolutionRate === null ? "—" : `${Math.round(m.resolutionRate * 100)}%`}
          hint="Resolved or closed ÷ all complaints"
        />
        <Metric icon={Clock} label="Avg. resolution time" value={formatDuration(m.avgResolutionHours)} hint="Submission to resolution" />
        <Metric
          icon={Star}
          label="Resident rating"
          value={m.averageRating === null ? "—" : `${m.averageRating.toFixed(1)} / 5`}
          hint={`${m.ratingCount} rating${m.ratingCount === 1 ? "" : "s"} received`}
        />
        <Metric
          icon={AlertTriangle}
          label="High-priority unresolved"
          value={String(urgentCount)}
          hint={topCategory && topCategory.count > 0 ? `Most common category: ${topCategory.category.replace("_", " ").toLowerCase()}` : "No complaints yet"}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Complaint volume" description="Submitted vs resolved, last 30 days" />
          <CardBody>
            <TrendChart data={trend.buckets} granularity={trend.granularity} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Priority attention"
            description="Unresolved High and Urgent complaints"
            action={
              <Link href="/manager/complaints?sort=priority" className="text-sm font-semibold text-secondary hover:underline">
                View queue
              </Link>
            }
          />
          {urgent.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nothing urgent" description="There are no unresolved high or urgent complaints." />
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {urgent.map((c) => (
                <li key={c.id}>
                  <Link href={`/manager/complaints/${c.id}`} className="block px-4 py-3 hover:bg-surface-muted sm:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold text-secondary">{c.complaintNumber}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-ink">{c.title}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
                      <span className="truncate">
                        {c.resident.unitNumber ?? c.resident.name} · open {formatRelative(c.createdAt, now)}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Status distribution" description="All complaints by current status" />
          <CardBody>
            <StatusBreakdown m={m} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Complaints by category" description="All complaints, most common first" />
          <CardBody>
            <CategoryBreakdown m={m} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent submissions"
            action={
              <Link href="/manager/complaints" className="text-sm font-semibold text-secondary hover:underline">
                View all
              </Link>
            }
          />
          {recent.items.length === 0 ? (
            <EmptyState icon={Activity} title="No complaints yet" description="New complaints from residents will appear here." />
          ) : (
            <div className="mt-3">
              <RecentComplaintList rows={recent.items} basePath="/manager/complaints" showResident />
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent activity" description="Latest status updates across the society" />
          {activity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" />
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-3 sm:px-6">
                  <div className="pt-0.5">
                    <StatusBadge status={a.newStatus} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/manager/complaints/${a.complaint.id}`} className="text-sm font-medium text-ink hover:text-secondary hover:underline">
                      <span className="font-mono text-[13px] text-secondary">{a.complaint.complaintNumber}</span> {a.complaint.title}
                    </Link>
                    <p className="truncate text-[13px] text-muted">{a.description}</p>
                    <p className="text-[12px] text-muted">
                      {a.changedBy.name} · {formatRelative(a.createdAt, now)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
