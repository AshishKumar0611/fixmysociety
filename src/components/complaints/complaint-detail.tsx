import Link from "next/link";
import { ArrowLeft, CheckCircle2, ImageIcon, Star } from "lucide-react";
import type { Role } from "@prisma/client";
import { StatusTimeline } from "@/components/app/status-timeline";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CATEGORY_LABELS, CONTACT_LABELS, STATUS_DESCRIPTIONS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ComplaintDetail } from "@/server/services/complaints";
import { CommentThread } from "./comment-thread";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Complaint detail layout shared by residents and managers. What each role can see is decided
 * by the server query (getComplaintDetail); this component only renders what it is given.
 */
export function ComplaintDetailView({
  complaint,
  viewerRole,
  backHref,
  backLabel,
  sidePanel,
  feedbackSlot,
}: {
  complaint: ComplaintDetail;
  viewerRole: Role;
  backHref: string;
  backLabel: string;
  sidePanel?: React.ReactNode;
  feedbackSlot?: React.ReactNode;
}) {
  const c = complaint;
  const canComment = viewerRole === "MANAGER" || c.status !== "CLOSED";
  const comments = c.comments.map((m) => ({ ...m, when: formatDateTime(m.createdAt) }));

  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-secondary">{c.complaintNumber}</span>
          <StatusBadge status={c.status} />
          <PriorityBadge priority={c.priority} />
        </div>
        <h1 className="mt-2 text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{STATUS_DESCRIPTIONS[c.status]}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Complaint details" />
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Category">{CATEGORY_LABELS[c.category]}</Detail>
                <Detail label="Location">{c.location}</Detail>
                <Detail label="Submitted">{formatDateTime(c.createdAt)}</Detail>
                <Detail label="Assigned to">{c.assignedManager?.name ?? <span className="text-muted">Not yet assigned</span>}</Detail>
                <Detail label="Preferred contact">{CONTACT_LABELS[c.preferredContact]}</Detail>
                {c.resolvedAt ? <Detail label="Resolved">{formatDateTime(c.resolvedAt)}</Detail> : null}
                {viewerRole === "MANAGER" ? (
                  <Detail label="Resident">
                    {c.resident.name}
                    {c.resident.unitNumber ? ` · ${c.resident.unitNumber}` : ""}
                    {"email" in c.resident && c.resident.email ? (
                      <span className="block text-[13px] text-muted">{c.resident.email}</span>
                    ) : null}
                    {"phone" in c.resident && c.resident.phone ? (
                      <span className="block text-[13px] text-muted">{c.resident.phone}</span>
                    ) : null}
                  </Detail>
                ) : null}
              </dl>
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted">Description</h3>
                <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">{c.description}</p>
              </div>
              {c.attachments.length > 0 ? (
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-muted">
                    <ImageIcon className="size-3.5" aria-hidden />
                    Photo
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {c.attachments.map((a) => (
                      <a key={a.id} href={`/api/attachments/${a.id}`} target="_blank" rel="noopener" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated, private image route */}
                        <img
                          src={`/api/attachments/${a.id}`}
                          alt={`Photo attached to ${c.complaintNumber}: ${a.fileName}`}
                          className="h-40 w-auto max-w-full rounded-[10px] border border-line object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {c.resolutionNote ? (
            <Card className="border-success/30">
              <CardBody className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                <div>
                  <h2 className="text-base font-semibold text-ink">Resolution note</h2>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">{c.resolutionNote}</p>
                  {c.resolvedAt ? <p className="mt-1 text-[12px] text-muted">Resolved on {formatDate(c.resolvedAt)}</p> : null}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {feedbackSlot ?? null}
          {c.feedback ? (
            <Card>
              <CardHeader title="Resident feedback" />
              <CardBody>
                <p className="flex items-center gap-1" aria-label={`Rated ${c.feedback.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={n <= c.feedback!.rating ? "size-5 fill-[#F5A524] text-[#F5A524]" : "size-5 text-line"}
                      aria-hidden
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold">{c.feedback.rating}/5</span>
                </p>
                {c.feedback.comment ? <p className="mt-2 text-sm text-ink">“{c.feedback.comment}”</p> : null}
                <p className="mt-1 text-[12px] text-muted">Submitted {formatDate(c.feedback.createdAt)}</p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Comments"
              description={
                viewerRole === "MANAGER"
                  ? "Replies are visible to the resident. Internal notes are visible to managers only."
                  : "Conversation with your management team."
              }
            />
            <CommentThread complaintId={c.id} comments={comments} viewerRole={viewerRole} canComment={canComment} />
          </Card>
        </div>

        <div className="space-y-6">
          {sidePanel}
          <Card>
            <CardHeader title="Status history" description="Every recorded change, oldest first" />
            <CardBody>
              <StatusTimeline events={c.history} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
