import type { Metadata } from "next";
import { CheckCircle2, ClipboardList, Clock, Download, Gauge, Inbox, Star } from "lucide-react";
import { KpiCard } from "@/components/app/kpi-card";
import { CategoryBreakdown, PriorityBreakdown, StatusBreakdown } from "@/components/charts/metrics";
import { RangeFilter } from "@/components/charts/range-filter";
import { TrendChart } from "@/components/charts/trend-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireManager } from "@/lib/auth";
import { resolveRange } from "@/lib/date-range";
import { formatDate, formatDuration } from "@/lib/utils";
import { normalizeSearchParams } from "@/lib/validation";
import { buttonVariants } from "@/components/ui/button";
import { toActor } from "@/server/actions/helpers";
import { getSocietyMetrics, getTrend } from "@/server/services/stats";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireManager();
  const actor = toActor(user);
  const params = normalizeSearchParams(await searchParams);
  const range = resolveRange(params);
  // Every metric and chart below uses the same range, so the numbers always agree.
  const [m, trend] = await Promise.all([getSocietyMetrics(actor, range), getTrend(actor, range)]);
  const exportQuery = new URLSearchParams(
    range.key === "custom" ? { range: "custom", from: range.fromInput!, to: range.toInput! } : { range: range.key },
  ).toString();

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Complaints created ${formatDate(range.from)} – ${formatDate(range.to)} (${range.label.toLowerCase()}).`}
        actions={
          <a href={`/manager/analytics/export?${exportQuery}`} className={buttonVariants({ variant: "outline" })} download>
            <Download aria-hidden />
            Export CSV
          </a>
        }
      />
      <Card className="mb-6 p-4 sm:p-5">
        <RangeFilter range={range.key} from={range.fromInput} to={range.toInput} />
      </Card>

      <section aria-label="Totals for the selected period" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total complaints" value={m.total} icon={ClipboardList} />
        <KpiCard label="Resolved" value={m.resolved} icon={CheckCircle2} tone="success" />
        <KpiCard label="Open" value={m.open} icon={Inbox} tone="info" hint={`${m.inProgress} more in progress`} />
        <KpiCard
          label="Resolution rate"
          value={m.resolutionRate === null ? "—" : `${Math.round(m.resolutionRate * 100)}%`}
          icon={Gauge}
          tone="accent"
        />
        <KpiCard label="Avg. resolution" value={formatDuration(m.avgResolutionHours)} icon={Clock} tone="warning" />
        <KpiCard
          label="Avg. rating"
          value={m.averageRating === null ? "—" : m.averageRating.toFixed(1)}
          icon={Star}
          tone="navy"
          hint={`${m.ratingCount} rating${m.ratingCount === 1 ? "" : "s"}`}
        />
      </section>

      <Card className="mt-6">
        <CardHeader title="Complaint trend" description={`Submitted vs resolved per ${trend.granularity}`} />
        <CardBody>
          <TrendChart data={trend.buckets} granularity={trend.granularity} />
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="By category" />
          <CardBody>
            <CategoryBreakdown m={m} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="By priority" />
          <CardBody>
            <PriorityBreakdown m={m} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="By current status" />
          <CardBody>
            <StatusBreakdown m={m} />
          </CardBody>
        </Card>
      </div>
      <p className="mt-4 text-[12px] text-muted">
        Definitions: Open = open or assigned · Resolved = resolved or closed · Resolution rate = resolved ÷ total · Average resolution time uses
        each resolved complaint&apos;s submission and resolution timestamps.
      </p>
    </>
  );
}
