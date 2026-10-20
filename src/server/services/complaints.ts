import { Prisma, type ComplaintCategory, type ComplaintStatus } from "@prisma/client";
import { prisma, containsInsensitive } from "@/lib/db";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PAGE_SIZE,
  PRIORITY_RANK,
  STATUS_LABELS,
} from "@/lib/constants";
import type { ComplaintFilters, ComplaintInput } from "@/lib/validation";
import { canTransition, isFeedbackEligible, requiresResolutionNote } from "@/lib/workflow";
import { activeManagerIds, notify } from "./notifications";
import { assertManager, assertResident, ServiceError, type Actor } from "./types";

export type UploadedImage = { fileName: string; mimeType: string; bytes: Uint8Array };

const residentLink = (id: string) => `/resident/complaints/${id}`;
const managerLink = (id: string) => `/manager/complaints/${id}`;

export function parseEnabledCategories(value: string): ComplaintCategory[] {
  const set = new Set(value.split(",").map((v) => v.trim()));
  return CATEGORIES.filter((c) => set.has(c));
}

/** Converts a YYYY-MM-DD string to the start/end of that day in IST. */
function istDayBoundary(date: string, end: boolean) {
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00.000"}+05:30`);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists complaints visible to the actor. Residents only ever see their own;
 * managers see every complaint in their own society. The scope comes from the
 * session, never from request parameters.
 */
export async function listComplaints(actor: Actor, filters: ComplaintFilters, pageSize = PAGE_SIZE) {
  const where: Prisma.ComplaintWhereInput = { societyId: actor.societyId };
  if (actor.role === "RESIDENT") where.residentId = actor.id;

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: istDayBoundary(filters.from, false) } : {}),
      ...(filters.to ? { lte: istDayBoundary(filters.to, true) } : {}),
    };
  }
  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { complaintNumber: containsInsensitive(q) },
      { title: containsInsensitive(q) },
      ...(actor.role === "MANAGER"
        ? [{ resident: { name: containsInsensitive(q) } }, { resident: { unitNumber: containsInsensitive(q) } }]
        : []),
    ];
  }

  const orderBy: Prisma.ComplaintOrderByWithRelationInput[] =
    filters.sort === "oldest"
      ? [{ createdAt: "asc" }]
      : filters.sort === "priority"
        ? [{ priorityRank: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const total = await prisma.complaint.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, pageCount);

  const items = await prisma.complaint.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      complaintNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      location: true,
      createdAt: true,
      resident: { select: { name: true, unitNumber: true } },
      assignedManager: { select: { name: true } },
    },
  });

  return { items, total, page, pageCount, pageSize };
}

export type ComplaintListItem = Awaited<ReturnType<typeof listComplaints>>["items"][number];

/**
 * Full complaint detail with access control:
 * - residents: only their own complaint, and internal notes are filtered out in the query itself;
 * - managers: any complaint in their society, including internal notes.
 * Returns null when the complaint does not exist OR the actor may not see it (no information leak).
 */
export async function getComplaintDetail(actor: Actor, id: string) {
  const isResident = actor.role === "RESIDENT";
  return prisma.complaint.findFirst({
    where: { id, societyId: actor.societyId, ...(isResident ? { residentId: actor.id } : {}) },
    select: {
      id: true,
      complaintNumber: true,
      title: true,
      description: true,
      category: true,
      location: true,
      priority: true,
      status: true,
      preferredContact: true,
      resolutionNote: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      resident: { select: { id: true, name: true, unitNumber: true, email: !isResident, phone: !isResident } },
      assignedManager: { select: { id: true, name: true } },
      history: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          previousStatus: true,
          newStatus: true,
          description: true,
          createdAt: true,
          changedBy: { select: { name: true, role: true } },
        },
      },
      comments: {
        where: isResident ? { isInternal: false } : {},
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          isInternal: true,
          createdAt: true,
          author: { select: { id: true, name: true, role: true } },
        },
      },
      feedback: { select: { rating: true, comment: true, createdAt: true } },
      attachments: { select: { id: true, fileName: true, mimeType: true, size: true } },
    },
  });
}

export type ComplaintDetail = NonNullable<Awaited<ReturnType<typeof getComplaintDetail>>>;

export async function listManagers(actor: Actor) {
  assertManager(actor);
  return prisma.user.findMany({
    where: { societyId: actor.societyId, role: "MANAGER", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Resident mutations
// ---------------------------------------------------------------------------

/**
 * Creates a complaint for the signed-in resident. The resident and society come from the
 * session. The complaint, its initial history entry, attachment and notifications are
 * written in one transaction so they can never get out of sync.
 */
export async function createComplaint(actor: Actor, input: ComplaintInput, photo?: UploadedImage) {
  assertResident(actor);

  const society = await prisma.society.findUnique({
    where: { id: actor.societyId },
    select: { enabledCategories: true },
  });
  if (!society) throw new ServiceError("Your society could not be found.", "NOT_FOUND");
  if (!parseEnabledCategories(society.enabledCategories).includes(input.category)) {
    throw new ServiceError("That category is not available in your society.", "INVALID", {
      category: ["Choose one of the available categories."],
    });
  }

  // Idempotency: a repeated submission with the same key returns the original complaint.
  if (input.submissionKey) {
    const existing = await prisma.complaint.findUnique({
      where: { residentId_submissionKey: { residentId: actor.id, submissionKey: input.submissionKey } },
      select: { id: true, complaintNumber: true },
    });
    if (existing) return { ...existing, duplicate: true };
  }

  try {
    const complaint = await prisma.$transaction(async (tx) => {
      const seq = await tx.society.update({
        where: { id: actor.societyId },
        data: { complaintSeq: { increment: 1 } },
        select: { code: true, complaintSeq: true },
      });
      const complaintNumber = `${seq.code}-${seq.complaintSeq}`;

      const created = await tx.complaint.create({
        data: {
          complaintNumber,
          societyId: actor.societyId,
          residentId: actor.id,
          category: input.category,
          title: input.title,
          description: input.description,
          location: input.location,
          priority: input.priority,
          priorityRank: PRIORITY_RANK[input.priority],
          preferredContact: input.preferredContact,
          submissionKey: input.submissionKey,
          status: "OPEN",
          history: {
            create: {
              previousStatus: null,
              newStatus: "OPEN",
              changedById: actor.id,
              description: "Complaint submitted by resident.",
            },
          },
          ...(photo
            ? {
                attachments: {
                  create: {
                    uploadedById: actor.id,
                    fileName: photo.fileName,
                    mimeType: photo.mimeType,
                    size: photo.bytes.byteLength,
                    data: Buffer.from(photo.bytes),
                  },
                },
              }
            : {}),
        },
        select: { id: true, complaintNumber: true, title: true },
      });

      await notify(tx, [actor.id], {
        title: `Complaint ${created.complaintNumber} received`,
        message: `We've logged “${created.title}”. You'll be notified as the status changes.`,
        link: residentLink(created.id),
        complaintId: created.id,
      });
      await notify(tx, await activeManagerIds(tx, actor.societyId), {
        title: `New complaint ${created.complaintNumber}`,
        message: `${actor.name} reported: ${created.title} (${CATEGORY_LABELS[input.category]}).`,
        link: managerLink(created.id),
        complaintId: created.id,
      });
      return created;
    });
    return { id: complaint.id, complaintNumber: complaint.complaintNumber, duplicate: false };
  } catch (error) {
    // Two identical submissions raced past the idempotency check: return the winner.
    if (
      input.submissionKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.complaint.findUnique({
        where: { residentId_submissionKey: { residentId: actor.id, submissionKey: input.submissionKey } },
        select: { id: true, complaintNumber: true },
      });
      if (existing) return { ...existing, duplicate: true };
    }
    throw error;
  }
}

export async function submitFeedback(
  actor: Actor,
  input: { complaintId: string; rating: number; comment?: string },
) {
  assertResident(actor);
  const complaint = await prisma.complaint.findFirst({
    where: { id: input.complaintId, residentId: actor.id, societyId: actor.societyId },
    select: { id: true, status: true, complaintNumber: true, feedback: { select: { id: true } } },
  });
  if (!complaint) throw new ServiceError("Complaint not found.", "NOT_FOUND");
  if (!isFeedbackEligible(complaint.status)) {
    throw new ServiceError("You can rate a complaint once it has been resolved.", "INVALID");
  }
  if (complaint.feedback) throw new ServiceError("You have already rated this complaint.", "CONFLICT");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.feedback.create({
        data: {
          complaintId: complaint.id,
          residentId: actor.id,
          rating: input.rating,
          comment: input.comment,
        },
      });
      await notify(tx, await activeManagerIds(tx, actor.societyId), {
        title: `Feedback on ${complaint.complaintNumber}`,
        message: `${actor.name} rated the resolution ${input.rating}/5.`,
        link: managerLink(complaint.id),
        complaintId: complaint.id,
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ServiceError("You have already rated this complaint.", "CONFLICT");
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Shared mutations
// ---------------------------------------------------------------------------

export async function addComment(
  actor: Actor,
  input: { complaintId: string; body: string; isInternal: boolean },
) {
  const isResident = actor.role === "RESIDENT";
  // Residents can never create internal notes, whatever the form submits.
  const isInternal = isResident ? false : input.isInternal;

  const complaint = await prisma.complaint.findFirst({
    where: {
      id: input.complaintId,
      societyId: actor.societyId,
      ...(isResident ? { residentId: actor.id } : {}),
    },
    select: { id: true, status: true, complaintNumber: true, residentId: true, assignedManagerId: true },
  });
  if (!complaint) throw new ServiceError("Complaint not found.", "NOT_FOUND");
  if (complaint.status === "CLOSED" && isResident) {
    throw new ServiceError("This complaint is closed and no longer accepts comments.", "INVALID");
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaintComment.create({
      data: { complaintId: complaint.id, authorId: actor.id, body: input.body, isInternal },
    });
    if (isResident) {
      const recipients = complaint.assignedManagerId
        ? [complaint.assignedManagerId]
        : await activeManagerIds(tx, actor.societyId);
      await notify(tx, recipients, {
        title: `New comment on ${complaint.complaintNumber}`,
        message: `${actor.name}: ${truncate(input.body, 120)}`,
        link: managerLink(complaint.id),
        complaintId: complaint.id,
      });
    } else if (!isInternal) {
      await notify(tx, [complaint.residentId], {
        title: `Update on ${complaint.complaintNumber}`,
        message: `${actor.name} replied: ${truncate(input.body, 120)}`,
        link: residentLink(complaint.id),
        complaintId: complaint.id,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Manager mutations
// ---------------------------------------------------------------------------

async function findManagedComplaint(actor: Actor, complaintId: string) {
  assertManager(actor);
  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId, societyId: actor.societyId },
    select: {
      id: true,
      status: true,
      complaintNumber: true,
      title: true,
      residentId: true,
      assignedManagerId: true,
    },
  });
  if (!complaint) throw new ServiceError("Complaint not found.", "NOT_FOUND");
  return complaint;
}

export async function updateComplaintStatus(
  actor: Actor,
  input: { complaintId: string; status: ComplaintStatus; note?: string; resolutionNote?: string },
) {
  const complaint = await findManagedComplaint(actor, input.complaintId);
  const from = complaint.status;
  const to = input.status;

  if (from === to) throw new ServiceError(`The complaint is already ${STATUS_LABELS[to]}.`, "INVALID");
  if (!canTransition(from, to)) {
    throw new ServiceError(
      `A complaint cannot move from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`,
      "INVALID",
      { status: ["This status change is not allowed."] },
    );
  }
  if (requiresResolutionNote(to) && (input.resolutionNote?.trim().length ?? 0) < 10) {
    throw new ServiceError("Add a resolution note before resolving.", "INVALID", {
      resolutionNote: ["A resolution note of at least 10 characters is required to resolve a complaint."],
    });
  }

  const now = new Date();
  const data: Prisma.ComplaintUncheckedUpdateManyInput = {
    status: to,
  };
  if (to === "RESOLVED") {
    data.resolvedAt = now;
    data.resolutionNote = input.resolutionNote!.trim();
  }
  if (from === "RESOLVED" && to === "IN_PROGRESS") {
    // Reopened: the earlier resolution no longer applies.
    data.resolvedAt = null;
    data.resolutionNote = null;
  }
  if (to === "OPEN") data.assignedManagerId = null;
  if ((to === "ASSIGNED" || to === "IN_PROGRESS") && !complaint.assignedManagerId) {
    data.assignedManagerId = actor.id;
  }

  const description =
    to === "RESOLVED"
      ? `Resolved: ${input.resolutionNote!.trim()}`
      : input.note?.trim() ||
        (from === "RESOLVED" && to === "IN_PROGRESS"
          ? "Complaint reopened for further work."
          : `Status changed to ${STATUS_LABELS[to]}.`);

  await prisma.$transaction(async (tx) => {
    // Conditional update guards against two managers changing the same complaint at once.
    const { count } = await tx.complaint.updateMany({
      where: { id: complaint.id, societyId: actor.societyId, status: from },
      data,
    });
    if (count !== 1) {
      throw new ServiceError("This complaint was updated by someone else. Refresh and try again.", "CONFLICT");
    }
    await tx.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        previousStatus: from,
        newStatus: to,
        changedById: actor.id,
        description,
      },
    });
    await notify(tx, [complaint.residentId], {
      title:
        to === "RESOLVED"
          ? `${complaint.complaintNumber} has been resolved`
          : `${complaint.complaintNumber} is now ${STATUS_LABELS[to]}`,
      message:
        to === "RESOLVED"
          ? `“${complaint.title}” was marked resolved. Please rate how it was handled.`
          : `“${complaint.title}”: ${description}`,
      link: residentLink(complaint.id),
      complaintId: complaint.id,
    });
  });
}

export async function assignComplaint(actor: Actor, input: { complaintId: string; managerId: string }) {
  const complaint = await findManagedComplaint(actor, input.complaintId);
  if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
    throw new ServiceError("Resolved or closed complaints cannot be reassigned.", "INVALID");
  }

  // The assignee must be an active manager of the SAME society.
  const assignee = await prisma.user.findFirst({
    where: { id: input.managerId, societyId: actor.societyId, role: "MANAGER", isActive: true },
    select: { id: true, name: true },
  });
  if (!assignee) {
    throw new ServiceError("Choose a manager from your society.", "INVALID", {
      managerId: ["Choose a manager from your society."],
    });
  }
  if (assignee.id === complaint.assignedManagerId) {
    throw new ServiceError(`Already assigned to ${assignee.name}.`, "INVALID");
  }

  const newStatus: ComplaintStatus = complaint.status === "OPEN" ? "ASSIGNED" : complaint.status;
  const description = complaint.assignedManagerId
    ? `Reassigned to ${assignee.name}.`
    : `Assigned to ${assignee.name}.`;

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.complaint.updateMany({
      where: { id: complaint.id, societyId: actor.societyId, status: complaint.status },
      data: { assignedManagerId: assignee.id, status: newStatus },
    });
    if (count !== 1) {
      throw new ServiceError("This complaint was updated by someone else. Refresh and try again.", "CONFLICT");
    }
    await tx.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        previousStatus: complaint.status,
        newStatus,
        changedById: actor.id,
        description,
      },
    });
    await notify(tx, [complaint.residentId], {
      title: `${complaint.complaintNumber} has been assigned`,
      message: `“${complaint.title}” is now being handled by ${assignee.name}.`,
      link: residentLink(complaint.id),
      complaintId: complaint.id,
    });
    if (assignee.id !== actor.id) {
      await notify(tx, [assignee.id], {
        title: `${complaint.complaintNumber} assigned to you`,
        message: `${actor.name} assigned you “${complaint.title}”.`,
        link: managerLink(complaint.id),
        complaintId: complaint.id,
      });
    }
  });
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
