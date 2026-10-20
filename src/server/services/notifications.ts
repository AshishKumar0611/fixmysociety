import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Actor } from "./types";

type Tx = Prisma.TransactionClient | PrismaClient;

export type NewNotification = {
  title: string;
  message: string;
  link?: string;
  complaintId?: string;
};

/** Creates the same in-app notification for several recipients (skipping duplicates). */
export async function notify(tx: Tx, recipientIds: string[], n: NewNotification) {
  const unique = [...new Set(recipientIds)];
  if (unique.length === 0) return;
  await tx.notification.createMany({
    data: unique.map((recipientId) => ({ recipientId, ...n })),
  });
}

export async function activeManagerIds(tx: Tx, societyId: string) {
  const managers = await tx.user.findMany({
    where: { societyId, role: "MANAGER", isActive: true },
    select: { id: true },
  });
  return managers.map((m) => m.id);
}

export async function listNotifications(actor: Actor, limit = 50) {
  return prisma.notification.findMany({
    where: { recipientId: actor.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, message: true, link: true, readAt: true, createdAt: true },
  });
}

export async function unreadCount(actor: Actor) {
  return prisma.notification.count({ where: { recipientId: actor.id, readAt: null } });
}

/** Marks one notification read — only if it belongs to the actor. */
export async function markNotificationRead(actor: Actor, id: string) {
  await prisma.notification.updateMany({
    where: { id, recipientId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(actor: Actor) {
  const { count } = await prisma.notification.updateMany({
    where: { recipientId: actor.id, readAt: null },
    data: { readAt: new Date() },
  });
  return count;
}
