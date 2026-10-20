import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  navy: "bg-secondary-soft text-primary dark:text-secondary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  error: "bg-error-soft text-error",
  accent: "bg-accent-soft text-accent",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[8px]", tones[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-ink sm:text-[32px]">{value}</p>
      {hint ? <p className="mt-2 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}
