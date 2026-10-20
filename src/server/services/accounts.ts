import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ServiceError, type Actor } from "./types";

// ---------------------------------------------------------------------------
// Login rate limiting (database-backed so it works across serverless instances)
// ---------------------------------------------------------------------------

export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxPerEmail: 5,
  maxPerIp: 20,
  lockMs: 15 * 60 * 1000,
};

export async function isLocked(keys: string[]) {
  const rows = await prisma.loginAttempt.findMany({
    where: { key: { in: keys }, lockedUntil: { gt: new Date() } },
    select: { lockedUntil: true },
  });
  if (rows.length === 0) return null;
  return new Date(Math.max(...rows.map((r) => r.lockedUntil!.getTime())));
}

export async function recordFailure(key: string, max: number) {
  const now = new Date();
  const existing = await prisma.loginAttempt.findUnique({ where: { key } });
  const windowExpired = !existing || now.getTime() - existing.windowStart.getTime() > RATE_LIMIT.windowMs;
  const count = windowExpired ? 1 : existing.count + 1;
  const lockedUntil = count >= max ? new Date(now.getTime() + RATE_LIMIT.lockMs) : null;
  await prisma.loginAttempt.upsert({
    where: { key },
    create: { key, count, windowStart: now, lockedUntil },
    update: { count, lockedUntil, ...(windowExpired ? { windowStart: now } : {}) },
  });
}

export async function clearFailures(key: string) {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}

// ---------------------------------------------------------------------------
// Registration and profile
// ---------------------------------------------------------------------------

/**
 * Public registration always creates a RESIDENT. The society is found from the join
 * code a manager shares, so nobody can pick a role or a society they do not belong to.
 */
export async function registerResident(input: {
  name: string;
  email: string;
  passwordHash: string;
  joinCode: string;
  unitNumber: string;
}) {
  const society = await prisma.society.findUnique({
    where: { joinCode: input.joinCode },
    select: { id: true },
  });
  if (!society) {
    throw new ServiceError("That join code is not valid.", "INVALID", {
      joinCode: ["Check the join code with your society manager."],
    });
  }
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "RESIDENT",
        societyId: society.id,
        unitNumber: input.unitNumber,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ServiceError("An account with this email already exists.", "CONFLICT", {
        email: ["An account with this email already exists. Try signing in."],
      });
    }
    throw error;
  }
}

/** Only name and phone are self-editable; role, society, email and unit are not. */
export async function updateProfile(actor: Actor, input: { name: string; phone?: string }) {
  await prisma.user.update({
    where: { id: actor.id },
    data: { name: input.name, phone: input.phone ?? null },
  });
}

export async function changePassword(
  actor: Actor,
  input: { currentPassword: string; newPassword: string },
  currentSessionTokenHash?: string,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw new ServiceError("Your current password is incorrect.", "INVALID", {
      currentPassword: ["Your current password is incorrect."],
    });
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { passwordHash } }),
    // Sign out other devices; keep the current session.
    prisma.session.deleteMany({
      where: {
        userId: actor.id,
        ...(currentSessionTokenHash ? { tokenHash: { not: currentSessionTokenHash } } : {}),
      },
    }),
  ]);
}
