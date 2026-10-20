"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { key: string; label: string; submitted: number; resolved: number };

const SERIES = [
  { key: "submitted", label: "Submitted", color: "var(--chart-1)" },
  { key: "resolved", label: "Resolved", color: "var(--chart-2)" },
] as const;

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey?: string | number; value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-line bg-surface px-3 py-2 text-[13px] shadow-[var(--shadow-raised)]">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {SERIES.map((s) => {
        const v = payload.find((p) => p.dataKey === s.key)?.value ?? 0;
        return (
          <p key={s.key} className="flex items-center gap-2 text-ink">
            <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}: <span className="font-semibold tabular-nums">{v}</span>
          </p>
        );
      })}
    </div>
  );
}

/** Complaints submitted vs resolved over time (one shared y-axis, legend + tooltip + table view). */
export function TrendChart({ data, granularity }: { data: TrendPoint[]; granularity: "day" | "week" }) {
  const totals = {
    submitted: data.reduce((a, d) => a + d.submitted, 0),
    resolved: data.reduce((a, d) => a + d.resolved, 0),
  };
  const tickEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label} <span className="font-semibold tabular-nums">{totals[s.key]}</span>
          </li>
        ))}
      </ul>
      <div className="h-56 w-full sm:h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              interval={tickEvery - 1}
              minTickGap={8}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} width={44} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }} />
            <Area type="linear" dataKey="submitted" stroke="none" fill="var(--chart-1)" fillOpacity={0.1} isAnimationActive={false} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: s.color }}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer font-semibold text-secondary">View as table</summary>
        <div className="relative mt-2 max-h-64 overflow-auto rounded-[8px] border border-line">
          <table className="w-full text-left">
            <caption className="sr-only">Complaints submitted and resolved per {granularity}</caption>
            <thead className="sticky top-0 bg-surface-muted text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">{granularity === "week" ? "Week starting" : "Date"}</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Submitted</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d) => (
                <tr key={d.key}>
                  <td className="px-3 py-1.5">{d.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.submitted}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
