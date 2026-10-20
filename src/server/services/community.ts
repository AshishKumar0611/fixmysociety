import type { ComplaintCategory } from "@prisma/client";
import { prisma, containsInsensitive } from "@/lib/db";
import { notify } from "./notifications";
import { assertManager, ServiceError, type Actor } from "./types";

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

/** Announcements residents should currently see: active, published, not expired, own society only. */
export async function listActiveAnnouncements(actor: Actor, take?: number) {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      societyId: actor.societyId,
      isActive: true,
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      message: true,
      publishedAt: true,
      expiresAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function listAllAnnouncements(actor: Actor) {
  assertManager(actor);
  return prisma.announcement.findMany({
    where: { societyId: actor.societyId },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      publishedAt: true,
      expiresAt: true,
      isActive: true,
      author: { select: { name: true } },
    },
  });
}

export async function createAnnouncement(
  actor: Actor,
  input: { title: string; message: string; publishedAt?: Date; expiresAt?: Date },
) {
  assertManager(actor);
  const publishedAt = input.publishedAt ?? new Date();
  await prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({
      data: {
        societyId: actor.societyId,
        authorId: actor.id,
        title: input.title,
        message: input.message,
        publishedAt,
        expiresAt: input.expiresAt,
        isActive: true,
      },
      select: { id: true, title: true },
    });
    // Notify residents now if it is already live. (Scheduled announcements simply appear when due.)
    if (publishedAt <= new Date()) {
      const residents = await tx.user.findMany({
        where: { societyId: actor.societyId, role: "RESIDENT", isActive: true },
        select: { id: true },
      });
      await notify(
        tx,
        residents.map((r) => r.id),
        {
          title: `New announcement: ${announcement.title}`,
          message: input.message.length > 140 ? `${input.message.slice(0, 139)}…` : input.message,
          link: "/resident/announcements",
        },
      );
    }
  });
}

export async function setAnnouncementActive(actor: Actor, id: string, isActive: boolean) {
  assertManager(actor);
  const { count } = await prisma.announcement.updateMany({
    where: { id, societyId: actor.societyId },
    data: { isActive },
  });
  if (count !== 1) throw new ServiceError("Announcement not found.", "NOT_FOUND");
}

export async function deleteAnnouncement(actor: Actor, id: string) {
  assertManager(actor);
  const { count } = await prisma.announcement.deleteMany({ where: { id, societyId: actor.societyId } });
  if (count !== 1) throw new ServiceError("Announcement not found.", "NOT_FOUND");
}

// ---------------------------------------------------------------------------
// Resident directory
// ---------------------------------------------------------------------------

export async function listResidents(
  actor: Actor,
  filters: { q?: string; status?: "active" | "inactive" },
) {
  assertManager(actor);
  return prisma.user.findMany({
    where: {
      societyId: actor.societyId,
      role: "RESIDENT",
      ...(filters.status ? { isActive: filters.status === "active" } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: containsInsensitive(filters.q) },
              { unitNumber: containsInsensitive(filters.q) },
              { email: containsInsensitive(filters.q) },
            ],
          }
        : {}),
    },
    orderBy: [{ unitNumber: "asc" }, { name: "asc" }],
    // Explicit allow-list: never selects passwordHash or session data.
    select: {
      id: true,
      name: true,
      email: true,
      unitNumber: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { complaints: true } },
    },
  });
}

export async function setResidentActive(actor: Actor, residentId: string, isActive: boolean) {
  assertManager(actor);
  const resident = await prisma.user.findFirst({
    where: { id: residentId, societyId: actor.societyId, role: "RESIDENT" },
    select: { id: true },
  });
  if (!resident) throw new ServiceError("Resident not found.", "NOT_FOUND");
  await prisma.$transaction([
    prisma.user.update({ where: { id: resident.id }, data: { isActive } }),
    // Deactivation signs the resident out everywhere immediately.
    ...(isActive ? [] : [prisma.session.deleteMany({ where: { userId: resident.id } })]),
  ]);
}

// ---------------------------------------------------------------------------
// Society settings
// ---------------------------------------------------------------------------

export async function getSociety(actor: Actor) {
  return prisma.society.findUniqueOrThrow({
    where: { id: actor.societyId },
    select: {
      id: true,
      name: true,
      code: true,
      joinCode: true,
      description: true,
      locality: true,
      address: true,
      contactEmail: true,
      contactPhone: true,
      enabledCategories: true,
    },
  });
}

export async function updateSocietySettings(
  actor: Actor,
  input: {
    name: string;
    description?: string;
    locality?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    enabledCategories: ComplaintCategory[];
  },
) {
  assertManager(actor);
  await prisma.society.update({
    where: { id: actor.societyId },
    data: {
      name: input.name,
      description: input.description ?? null,
      locality: input.locality ?? null,
      address: input.address ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      enabledCategories: input.enabledCategories.join(","),
    },
  });
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => JOIN_CODE_ALPHABET[b % JOIN_CODE_ALPHABET.length]).join("");
}

export async function regenerateJoinCode(actor: Actor) {
  assertManager(actor);
  const joinCode = generateJoinCode();
  await prisma.society.update({ where: { id: actor.societyId }, data: { joinCode } });
  return joinCode;
}
