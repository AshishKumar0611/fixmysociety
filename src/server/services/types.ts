import type { Role } from "@prisma/client";

/**
 * The authenticated user performing an operation. Services accept this instead of
 * reading cookies themselves, so they can be unit-tested and so ownership/society
 * checks always come from the session — never from user-submitted form fields.
 */
export type Actor = {
  id: string;
  role: Role;
  societyId: string;
  name: string;
};

/** Expected, user-facing failure (validation, permission, not found). */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "FORBIDDEN" | "INVALID" | "CONFLICT" = "INVALID",
    public fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function assertManager(actor: Actor) {
  if (actor.role !== "MANAGER") throw new ServiceError("Only managers can do that.", "FORBIDDEN");
}

export function assertResident(actor: Actor) {
  if (actor.role !== "RESIDENT") throw new ServiceError("Only residents can do that.", "FORBIDDEN");
}
