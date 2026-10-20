import type { ComplaintStatus } from "@prisma/client";

/**
 * The complaint lifecycle. Every status change is checked against this map on the server.
 *
 *   OPEN ──► ASSIGNED ──► IN_PROGRESS ──► RESOLVED ──► CLOSED
 *     └─────────┴──────────────┴──────────────┘
 *   RESOLVED can be reopened (back to IN_PROGRESS) if the fix did not hold.
 */
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  // Forward moves are listed first; they are offered first in the manager's status menu.
  OPEN: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"],
  ASSIGNED: ["IN_PROGRESS", "RESOLVED", "OPEN"],
  IN_PROGRESS: ["RESOLVED", "ASSIGNED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export function canTransition(from: ComplaintStatus, to: ComplaintStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: ComplaintStatus) {
  return ALLOWED_TRANSITIONS[from];
}

/** Resolving always needs a resident-visible resolution note. */
export function requiresResolutionNote(to: ComplaintStatus) {
  return to === "RESOLVED";
}

/** Residents may rate a complaint once it has been resolved (or resolved and closed). */
export function isFeedbackEligible(status: ComplaintStatus) {
  return status === "RESOLVED" || status === "CLOSED";
}
