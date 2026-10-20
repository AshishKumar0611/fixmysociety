import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** True when the configured database is PostgreSQL (production) rather than SQLite (local). */
export const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

/**
 * Case-insensitive `contains` filter that works on both providers.
 * SQLite's LIKE is already case-insensitive for ASCII; PostgreSQL needs `mode: "insensitive"`.
 */
export function containsInsensitive(value: string) {
  return isPostgres ? { contains: value, mode: "insensitive" as const } : { contains: value };
}
