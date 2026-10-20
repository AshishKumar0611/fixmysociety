import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import type { SessionUser } from "@/lib/auth";
import { FLASH_COOKIE } from "@/lib/constants";
import { fieldErrorsOf } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";
import { ServiceError, type Actor } from "../services/types";

export type { ActionState };

export function toActor(user: SessionUser): Actor {
  return { id: user.id, role: user.role, societyId: user.societyId, name: user.name };
}

export function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export function validationFailure(error: z.ZodError, values?: Record<string, string>): ActionState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: fieldErrorsOf(error),
    values,
    at: Date.now(),
  };
}

/**
 * Converts an error into a safe, user-facing result. Expected ServiceErrors show their
 * message; anything unexpected is logged on the server and shown as a generic message,
 * so stack traces and database details never reach the browser.
 */
export function failure(error: unknown, values?: Record<string, string>): ActionState {
  if (error instanceof ServiceError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors, values, at: Date.now() };
  }
  console.error("[action] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again.", values, at: Date.now() };
}

export function success(message: string): ActionState {
  return { ok: true, message, at: Date.now() };
}

/** One-time message shown as a toast on the next page (readable by client JS, contains no secrets). */
export async function setFlash(message: string, tone: "success" | "error" | "info" = "success") {
  const jar = await cookies();
  jar.set(FLASH_COOKIE, encodeURIComponent(JSON.stringify({ message, tone })), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}
