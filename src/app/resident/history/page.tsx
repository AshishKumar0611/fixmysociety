import type { Metadata } from "next";
import Link from "next/link";
import { History, Star } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireResident } from "@/lib/auth";
import { CATEGORY_LABELS, RESOLVED_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };

export default async function ResidentHistoryPage() {
  const user = await requireResident();
  const items = await prisma.complaint.findMany({
    where: { residentId: user.id, societyId: user.societyId, status: { in: RESOLVED_STATUSES } },
    orderBy: { resolvedAt: "desc" },
    take: 100,
    select: {
      id: true,
      complaintNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      feedback: { select: { rating: true } },
    },
  });

  return (
    <>
      <PageHeader title="Complaint history" description="Complaints that have been resolved or closed, with how long each one took." />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={History} title="No resolved complaints yet" description="Once the management team resolves one of your complaints, it will be listed here." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((c) => {
              const hours = c.resolvedAt ? (c.resolvedAt.getTime() - c.createdAt.getTime()) / 3_600_000 : null;
              return (
                <li key={c.id}>
                  <Link href={`/resident/complaints/${c.id}`} className="flex flex-col gap-2 px-4 py-4 hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold text-secondary">{c.complaintNumber}</span>
                        <StatusBadge status={c.status} />
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <p className="mt-1 font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {CATEGORY_LABELS[c.category]} · Raised {formatDate(c.createdAt)}
                        {c.resolvedAt ? ` · Resolved ${formatDate(c.resolvedAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-[13px] sm:flex-col sm:items-end sm:gap-1">
                      <span className="text-muted">Took <span className="font-semibold text-ink">{formatDuration(hours)}</span></span>
                      {c.feedback ? (
                        <span className="inline-flex items-center gap-1 text-ink" aria-label={`You rated ${c.feedback.rating} out of 5`}>
                          <Star className="size-4 fill-[#F5A524] text-[#F5A524]" aria-hidden />
                          {c.feedback.rating}/5
                        </span>
                      ) : (
                        <span className="font-semibold text-secondary">Rate this fix</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
