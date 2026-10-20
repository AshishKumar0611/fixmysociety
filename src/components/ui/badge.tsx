import type { ComplaintPriority, ComplaintStatus } from "@prisma/client";
import { PRIORITY_LABELS, STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<ComplaintStatus, string> = {
  OPEN: "bg-info-soft text-info ring-info/25",
  ASSIGNED: "bg-secondary-soft text-secondary ring-secondary/25",
  IN_PROGRESS: "bg-warning-soft text-warning ring-warning/25",
  RESOLVED: "bg-success-soft text-success ring-success/25",
  CLOSED: "bg-neutral-soft text-muted ring-line",
};

const statusDots: Record<ComplaintStatus, string> = {
  OPEN: "bg-info",
  ASSIGNED: "bg-secondary",
  IN_PROGRESS: "bg-warning",
  RESOLVED: "bg-success",
  CLOSED: "bg-muted",
};

const pill =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ring-inset";

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  return (
    <span className={cn(pill, statusStyles[status], className)} title={STATUS_DESCRIPTIONS[status]}>
      <span className={cn("size-1.5 rounded-full", statusDots[status])} aria-hidden />
      <span className="sr-only">Status: </span>
      {STATUS_LABELS[status]}
    </span>
  );
}

const priorityStyles: Record<ComplaintPriority, string> = {
  LOW: "bg-neutral-soft text-muted ring-line",
  NORMAL: "bg-surface text-ink ring-line",
  HIGH: "bg-warning-soft text-warning ring-warning/25",
  URGENT: "bg-error-soft text-error ring-error/25",
};

export function PriorityBadge({ priority, className }: { priority: ComplaintPriority; className?: string }) {
  return (
    <span className={cn(pill, priorityStyles[priority], className)}>
      <span className="sr-only">Priority: </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "error" | "info" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-neutral-soft text-muted ring-line",
    success: "bg-success-soft text-success ring-success/25",
    warning: "bg-warning-soft text-warning ring-warning/25",
    error: "bg-error-soft text-error ring-error/25",
    info: "bg-info-soft text-info ring-info/25",
    accent: "bg-accent-soft text-accent ring-accent/25",
  }[tone];
  return <span className={cn(pill, tones, className)}>{children}</span>;
}
