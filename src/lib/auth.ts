import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";
import { isProduction } from "./env";

/**
 * Session design:
 * - A random 256-bit token is stored only in an httpOnly, SameSite=Lax cookie.
 * - The database stores the SHA-256 hash of the token, so a leaked database cannot be replayed as sessions.
 * - Every protected page, server action and route handler re-validates the session against the database.
 */

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | undefined;

/** Compares against a throwaway hash so login takes similar time whether or not the email exists. */
export async function burnPasswordCheck(password: string) {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_ROUNDS);
  await bcrypt.compare(password, await dummyHash);
  return false;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  // Opportunistic cleanup of this user's expired sessions.
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Fields that are safe to pass around the app. Never includes passwordHash. */
const sessionUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  societyId: true,
  unitNumber: true,
  phone: true,
  isActive: true,
  society: { select: { id: true, name: true, code: true } },
} as const;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  societyId: string;
  unitNumber: string | null;
  phone: string | null;
  isActive: boolean;
  society: { id: string; name: string; code: string };
};

/** Returns the signed-in user, or null. Cached per request so repeated calls are free. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, user: { select: sessionUserSelect } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) return null;
  return session.user;
});

export function homePathFor(role: Role) {
  return role === "MANAGER" ? "/manager/dashboard" : "/resident/dashboard";
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Use at the top of every protected page and server action.
 * Users with the wrong role are sent to their own dashboard rather than seeing the page.
 */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) redirect(`${homePathFor(user.role)}?denied=1`);
  return user;
}

export const requireResident = () => requireRole("RESIDENT");
export const requireManager = () => requireRole("MANAGER");
