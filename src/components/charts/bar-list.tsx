import { cn } from "@/lib/utils";

export type BarDatum = { key: string; label: string; value: number; colorClass?: string };

/**
 * Horizontal bar breakdown for a single measure. Every bar is directly labelled with its
 * value, so the chart needs no legend or tooltip and reads the same for screen readers
 * (it is a list of label/value pairs).
 */
export function BarList({
  data,
  total,
  emptyText = "No data for this period.",
  sort = true,
}: {
  data: BarDatum[];
  total?: number;
  emptyText?: string;
  sort?: boolean;
}) {
  const rows = sort ? [...data].sort((a, b) => b.value - a.value) : data;
  const max = Math.max(...rows.map((d) => d.value), 0);
  const sum = total ?? rows.reduce((a, d) => a + d.value, 0);
  if (sum === 0) return <p className="py-6 text-center text-sm text-muted">{emptyText}</p>;

  return (
    <ul className="space-y-2.5">
      {rows.map((d) => {
        const pct = sum ? Math.round((d.value / sum) * 100) : 0;
        return (
          <li key={d.key} className="grid grid-cols-[minmax(92px,128px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-ink" title={d.label}>
              {d.label}
            </span>
            <span className="relative h-5" aria-hidden>
              <span
                className={cn("absolute inset-y-0.5 left-0 rounded-r-[4px]", d.colorClass ?? "bg-chart-1")}
                style={{ width: max ? `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` : 0 }}
              />
            </span>
            <span className="min-w-14 text-right tabular-nums text-ink">
              <span className="font-semibold">{d.value}</span>
              <span className="ml-1 text-[12px] text-muted">({pct}%)</span>
              <span className="sr-only"> complaints</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
