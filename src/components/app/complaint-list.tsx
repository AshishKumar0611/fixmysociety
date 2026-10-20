import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from "@prisma/client";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export type ComplaintRow = {
  id: string;
  complaintNumber: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: Date;
  location?: string;
  resident?: { name: string; unitNumber: string | null } | null;
  assignedManager?: { name: string } | null;
};

/** Desktop table (≥768px) — on phones the same data renders as ComplaintCards. */
export function ComplaintTable({
  rows,
  basePath,
  showResident = false,
  caption,
}: {
  rows: ComplaintRow[];
  basePath: string;
  showResident?: boolean;
  caption: string;
}) {
  return (
    <div className="relative hidden overflow-x-auto md:block">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-surface-muted text-[12px] font-semibold uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 lg:px-6">ID</th>
            {showResident ? <th scope="col" className="px-4 py-3">Resident</th> : null}
            <th scope="col" className="px-4 py-3">Title</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right lg:px-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id} className="transition-colors duration-150 hover:bg-surface-muted">
              <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[13px] font-semibold text-secondary lg:px-6">
                {c.complaintNumber}
              </td>
              {showResident ? (
                <td className="px-4 py-3.5">
                  <span className="block font-medium text-ink">{c.resident?.name}</span>
                  <span className="text-[12px] text-muted">{c.resident?.unitNumber ?? "—"}</span>
                </td>
              ) : null}
              <td className="max-w-[280px] px-4 py-3.5">
                <Link href={`${basePath}/${c.id}`} className="line-clamp-2 font-medium text-ink hover:text-secondary hover:underline">
                  {c.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-muted">{CATEGORY_LABELS[c.category]}</td>
              <td className="px-4 py-3.5">
                <PriorityBadge priority={c.priority} />
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-muted">{formatDate(c.createdAt)}</td>
              <td className="px-4 py-3.5">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3.5 text-right lg:px-6">
                <Link
                  href={`${basePath}/${c.id}`}
                  className="inline-flex h-9 items-center gap-1 rounded-[8px] px-3 text-[13px] font-semibold text-secondary hover:bg-secondary-soft"
                  aria-label={`View details for ${c.complaintNumber}`}
                >
                  View details
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComplaintCard({ c, basePath, showResident }: { c: ComplaintRow; basePath: string; showResident?: boolean }) {
  return (
    <Link
      href={`${basePath}/${c.id}`}
      className="block rounded-[12px] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-secondary/40 active:bg-surface-muted"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] font-semibold text-secondary">{c.complaintNumber}</span>
        <StatusBadge status={c.status} />
      </div>
      <p className="mt-2 font-semibold leading-snug text-ink">{c.title}</p>
      {showResident && c.resident ? (
        <p className="mt-1 text-[13px] text-muted">
          {c.resident.name}
          {c.resident.unitNumber ? ` · ${c.resident.unitNumber}` : ""}
        </p>
      ) : c.location ? (
        <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{c.location}</span>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <PriorityBadge priority={c.priority} />
        <span>{CATEGORY_LABELS[c.category]}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(c.createdAt)}</span>
      </div>
      <span className="sr-only">View details</span>
    </Link>
  );
}

export function ComplaintCards({ rows, basePath, showResident }: { rows: ComplaintRow[]; basePath: string; showResident?: boolean }) {
  return (
    <ul className="space-y-3 md:hidden">
      {rows.map((c) => (
        <li key={c.id}>
          <ComplaintCard c={c} basePath={basePath} showResident={showResident} />
        </li>
      ))}
    </ul>
  );
}

/** Compact list for dashboards: ID, title, category, date, priority, status and a details link. */
export function RecentComplaintList({ rows, basePath, showResident }: { rows: ComplaintRow[]; basePath: string; showResident?: boolean }) {
  return (
    <ul className="divide-y divide-line border-t border-line">
      {rows.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}/${c.id}`}
            className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-muted sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono text-[13px] font-semibold text-secondary">{c.complaintNumber}</span>
                <span className="truncate font-medium text-ink">{c.title}</span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {showResident && c.resident ? `${c.resident.name}${c.resident.unitNumber ? ` (${c.resident.unitNumber})` : ""} · ` : ""}
                {CATEGORY_LABELS[c.category]} · {formatDate(c.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <PriorityBadge priority={c.priority} />
              <StatusBadge status={c.status} />
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-secondary">
              <span className="hidden lg:inline">View details</span>
              <span className="sr-only lg:hidden">View details for {c.complaintNumber}</span>
              <ChevronRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
