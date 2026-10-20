import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ContactMethod,
} from "@prisma/client";

export const APP_NAME = "FixMySociety";
export const TAGLINE = "Your Community. Better Managed.";

export const CATEGORIES: readonly ComplaintCategory[] = [
  "PLUMBING",
  "ELECTRICAL",
  "CLEANING",
  "LIFT",
  "SECURITY",
  "WATER_SUPPLY",
  "WASTE_MANAGEMENT",
  "COMMON_AREA",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  CLEANING: "Cleaning",
  LIFT: "Lift and Elevator",
  SECURITY: "Security",
  WATER_SUPPLY: "Water Supply",
  WASTE_MANAGEMENT: "Waste Management",
  COMMON_AREA: "Common Area",
  OTHER: "Other",
};

export const PRIORITIES: readonly ComplaintPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

/** Higher number = more urgent; used for priority sorting. */
export const PRIORITY_RANK: Record<ComplaintPriority, number> = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3,
};

export const STATUSES: readonly ComplaintStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const STATUS_DESCRIPTIONS: Record<ComplaintStatus, string> = {
  OPEN: "Submitted and waiting for the management team to review it.",
  ASSIGNED: "A manager has taken ownership of this complaint.",
  IN_PROGRESS: "Work to fix this issue is under way.",
  RESOLVED: "The management team has marked this issue as fixed.",
  CLOSED: "This complaint is complete and closed.",
};

/** Dashboard groupings, used consistently everywhere metrics are shown. */
export const OPEN_STATUSES: ComplaintStatus[] = ["OPEN", "ASSIGNED"];
export const ACTIVE_STATUSES: ComplaintStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS"];
export const RESOLVED_STATUSES: ComplaintStatus[] = ["RESOLVED", "CLOSED"];

export const CONTACT_METHODS: readonly ContactMethod[] = ["IN_APP", "PHONE", "EMAIL"] as const;

export const CONTACT_LABELS: Record<ContactMethod, string> = {
  IN_APP: "In-app updates only",
  PHONE: "Phone call",
  EMAIL: "Email",
};

export const PAGE_SIZE = 10;

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const SESSION_COOKIE = "fms_session";
export const SESSION_TTL_DAYS = 7;
export const FLASH_COOKIE = "fms_flash";
