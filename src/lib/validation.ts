import { z } from "zod";
import { CATEGORIES, CONTACT_METHODS, PRIORITIES, STATUSES } from "./constants";

// Shared Zod schemas. The same schemas run in the browser (instant feedback)
// and on the server (the source of truth), so the rules never drift apart.

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const emailSchema = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string({ error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(200),
});

export const registerSchema = z
  .object({
    name: trimmed(2, 80, "Full name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    joinCode: trimmed(4, 20, "Society join code").transform((v) => v.toUpperCase()),
    unitNumber: trimmed(1, 20, "Unit number"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const complaintSchema = z.object({
  category: z.enum(CATEGORIES, { error: "Choose a category." }),
  title: trimmed(5, 100, "Title"),
  description: trimmed(10, 2000, "Description"),
  location: trimmed(2, 120, "Location"),
  priority: z.enum(PRIORITIES, { error: "Choose a priority." }).default("NORMAL"),
  preferredContact: z.enum(CONTACT_METHODS).default("IN_APP"),
  submissionKey: z.string().trim().max(64).optional(),
});
export type ComplaintInput = z.infer<typeof complaintSchema>;

export const statusUpdateSchema = z
  .object({
    complaintId: z.string().min(1),
    status: z.enum(STATUSES, { error: "Choose a valid status." }),
    note: optionalText(1000, "Update note"),
    resolutionNote: optionalText(1000, "Resolution note"),
  })
  .refine((d) => d.status !== "RESOLVED" || (d.resolutionNote?.length ?? 0) >= 10, {
    message: "A resolution note of at least 10 characters is required to resolve a complaint.",
    path: ["resolutionNote"],
  });

export const assignSchema = z.object({
  complaintId: z.string().min(1),
  managerId: z.string().min(1, "Choose a manager."),
});

export const commentSchema = z.object({
  complaintId: z.string().min(1),
  body: trimmed(1, 1000, "Comment"),
  isInternal: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const feedbackSchema = z.object({
  complaintId: z.string().min(1),
  rating: z.coerce
    .number({ error: "Choose a rating." })
    .int("Choose a rating.")
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  comment: optionalText(500, "Feedback"),
});

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return d;
  });

export const announcementSchema = z
  .object({
    title: trimmed(3, 120, "Title"),
    message: trimmed(10, 2000, "Message"),
    publishedAt: optionalDate,
    expiresAt: optionalDate,
  })
  .refine((d) => !d.expiresAt || d.expiresAt > (d.publishedAt ?? new Date()), {
    message: "Expiry must be after the publication date.",
    path: ["expiresAt"],
  });

export const profileSchema = z.object({
  name: trimmed(2, 80, "Full name"),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[+0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number."),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const societySettingsSchema = z.object({
  name: trimmed(2, 100, "Society name"),
  description: optionalText(500, "Description"),
  locality: optionalText(100, "Locality"),
  address: optionalText(200, "Address"),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .pipe(z.email("Enter a valid email address.").optional()),
  contactPhone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[+0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number."),
  enabledCategories: z
    .array(z.enum(CATEGORIES))
    .min(1, "Keep at least one complaint category enabled."),
});

/** Query-string filters for complaint lists. Invalid values fall back to safe defaults. */
export const complaintFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(STATUSES).optional().catch(undefined),
  category: z.enum(CATEGORIES).optional().catch(undefined),
  priority: z.enum(PRIORITIES).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  sort: z.enum(["newest", "oldest", "priority"]).default("newest").catch("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
});
export type ComplaintFilters = z.infer<typeof complaintFiltersSchema>;

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

/** Converts Next.js searchParams (string | string[] | undefined) into plain strings. */
export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeSearchParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params)
      .map(([k, v]) => [k, firstParam(v)])
      .filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string>;
}

/** Only allow same-site relative redirect targets, to prevent open redirects. */
export function safeRedirectPath(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
