import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { resolveRange } from "@/lib/date-range";
import { toActor } from "@/server/actions/helpers";
import { getExportRows } from "@/server/services/stats";

/** Neutralises spreadsheet formula injection and escapes CSV special characters. */
function csvCell(value: string | number | null | undefined) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") return new Response("Not found", { status: 404 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const range = resolveRange(params);
  const rows = await getExportRows(toActor(user), range);

  const header = ["Complaint ID", "Title", "Category", "Priority", "Status", "Location", "Unit", "Assigned to", "Submitted (UTC)", "Resolved (UTC)", "Resolution hours", "Rating"];
  const lines = rows.map((r) =>
    [
      r.complaintNumber,
      r.title,
      CATEGORY_LABELS[r.category],
      PRIORITY_LABELS[r.priority],
      STATUS_LABELS[r.status],
      r.location,
      r.resident.unitNumber,
      r.assignedManager?.name,
      r.createdAt.toISOString(),
      r.resolvedAt?.toISOString(),
      r.resolvedAt ? ((r.resolvedAt.getTime() - r.createdAt.getTime()) / 3_600_000).toFixed(1) : "",
      r.feedback?.rating,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fixmysociety-complaints-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
