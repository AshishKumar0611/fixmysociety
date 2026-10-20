import type { ComplaintStatus, Role } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  previousStatus: ComplaintStatus | null;
  newStatus: ComplaintStatus;
  description: string;
  createdAt: Date;
  changedBy: { name: string; role: Role };
};

const dot: Record<ComplaintStatus, string> = {
  OPEN: "bg-info",
  ASSIGNED: "bg-secondary",
  IN_PROGRESS: "bg-warning",
  RESOLVED: "bg-success",
  CLOSED: "bg-muted",
};

/** Chronological timeline rendered strictly from recorded status-history rows. */
export function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-6" aria-label="Status history">
      {events.map((e, i) => {
        const isLast = i === events.length - 1;
        const isStatusChange = e.previousStatus !== e.newStatus;
        return (
          <li key={e.id} className="relative pl-8">
            {!isLast ? <span className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-0.5 bg-line" aria-hidden /> : null}
            <span
              className={cn(
                "absolute left-0 top-1 size-4 rounded-full ring-4 ring-surface",
                dot[e.newStatus],
                isLast && "ring-[color-mix(in_srgb,var(--secondary)_18%,var(--surface))]",
              )}
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              {isStatusChange ? (
                <StatusBadge status={e.newStatus} />
              ) : (
                <span className="text-sm font-semibold text-ink">Update</span>
              )}
              <time dateTime={new Date(e.createdAt).toISOString()} className="text-[12px] text-muted">
                {formatDateTime(e.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 text-sm text-ink">{e.description}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {e.previousStatus && isStatusChange
                ? `${STATUS_LABELS[e.previousStatus]} → ${STATUS_LABELS[e.newStatus]} · `
                : ""}
              by {e.changedBy.name} ({e.changedBy.role === "MANAGER" ? "Manager" : "Resident"})
            </p>
          </li>
        );
      })}
    </ol>
  );
}
