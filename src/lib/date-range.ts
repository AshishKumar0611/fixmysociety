import { z } from "zod";

export const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
] as const;

const rangeSchema = z.object({
  range: z.enum(["7", "30", "90", "custom"]).default("30").catch("30"),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
});

const DAY = 86_400_000;

/**
 * Resolves analytics filters into concrete [from, to] timestamps (IST day boundaries).
 * Invalid or reversed custom ranges fall back to the last 30 days.
 */
export function resolveRange(params: Record<string, string | undefined>, now = new Date()) {
  const p = rangeSchema.parse(params);
  if (p.range === "custom" && p.from && p.to) {
    const from = new Date(`${p.from}T00:00:00.000+05:30`);
    const to = new Date(`${p.to}T23:59:59.999+05:30`);
    if (from <= to && to.getTime() - from.getTime() <= 366 * DAY) {
      return { key: "custom" as const, from, to, label: `${p.from} to ${p.to}`, fromInput: p.from, toInput: p.to };
    }
  }
  const days = p.range === "custom" ? 30 : Number(p.range);
  const key = (p.range === "custom" ? "30" : p.range) as "7" | "30" | "90";
  return {
    key,
    // Start of the IST day (days - 1) days ago, so "last 7 days" means today plus the six days before.
    from: new Date(new Date(`${istToday(now)}T00:00:00.000+05:30`).getTime() - (days - 1) * DAY),
    to: now,
    label: RANGE_OPTIONS.find((o) => o.value === key)!.label,
    fromInput: undefined,
    toInput: undefined,
  };
}

function istToday(now: Date) {
  return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}
