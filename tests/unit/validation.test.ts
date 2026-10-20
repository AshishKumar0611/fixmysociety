import { describe, expect, it } from "vitest";
import {
  complaintFiltersSchema,
  complaintSchema,
  feedbackSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  safeRedirectPath,
  statusUpdateSchema,
} from "@/lib/validation";

const validComplaint = {
  category: "PLUMBING",
  title: "Kitchen tap leaking",
  description: "The kitchen tap has been leaking for two days.",
  location: "Tower A, A-101",
};

describe("complaint validation", () => {
  it("accepts a valid complaint and defaults priority to NORMAL", () => {
    const r = complaintSchema.parse(validComplaint);
    expect(r.priority).toBe("NORMAL");
    expect(r.preferredContact).toBe("IN_APP");
  });

  it("rejects missing or too-short fields", () => {
    const r = complaintSchema.safeParse({ ...validComplaint, title: "abc", description: "", location: " " });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["title", "description", "location"]));
  });

  it("rejects unknown categories and priorities", () => {
    expect(complaintSchema.safeParse({ ...validComplaint, category: "ROOF" }).success).toBe(false);
    expect(complaintSchema.safeParse({ ...validComplaint, priority: "CRITICAL" }).success).toBe(false);
  });

  it("trims whitespace", () => {
    expect(complaintSchema.parse({ ...validComplaint, title: "  Kitchen tap leaking  " }).title).toBe("Kitchen tap leaking");
  });
});

describe("status update validation", () => {
  it("requires a resolution note to resolve", () => {
    expect(statusUpdateSchema.safeParse({ complaintId: "x", status: "RESOLVED" }).success).toBe(false);
    expect(statusUpdateSchema.safeParse({ complaintId: "x", status: "RESOLVED", resolutionNote: "short" }).success).toBe(false);
    expect(
      statusUpdateSchema.safeParse({ complaintId: "x", status: "RESOLVED", resolutionNote: "Replaced the washer." }).success,
    ).toBe(true);
  });

  it("does not require a note for other statuses", () => {
    expect(statusUpdateSchema.safeParse({ complaintId: "x", status: "IN_PROGRESS" }).success).toBe(true);
  });
});

describe("account validation", () => {
  it("normalises login email", () => {
    expect(loginSchema.parse({ email: "  User@Example.COM ", password: "x" }).email).toBe("user@example.com");
  });

  it("enforces password rules and confirmation", () => {
    const base = { name: "Test User", email: "t@example.com", joinCode: "green2026", unitNumber: "A-1" };
    expect(registerSchema.safeParse({ ...base, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "longpassword", confirmPassword: "longpassword" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "Password123", confirmPassword: "Password124" }).success).toBe(false);
    const ok = registerSchema.parse({ ...base, password: "Password123", confirmPassword: "Password123" });
    expect(ok.joinCode).toBe("GREEN2026");
  });

  it("drops role and society fields from profile updates", () => {
    const parsed = profileSchema.parse({ name: "Aarav", role: "MANAGER", societyId: "other" } as Record<string, unknown>);
    expect(parsed).toEqual({ name: "Aarav", phone: undefined });
    expect("role" in parsed).toBe(false);
  });

  it("validates feedback ratings", () => {
    expect(feedbackSchema.safeParse({ complaintId: "x", rating: "0" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ complaintId: "x", rating: "6" }).success).toBe(false);
    expect(feedbackSchema.parse({ complaintId: "x", rating: "4" }).rating).toBe(4);
  });
});

describe("filters and redirects", () => {
  it("falls back to safe defaults for invalid filter values", () => {
    const f = complaintFiltersSchema.parse({ status: "HACKED", page: "-5", sort: "drop table", from: "nope" });
    expect(f).toMatchObject({ status: undefined, page: 1, sort: "newest", from: undefined });
  });

  it("only allows relative same-site redirects", () => {
    expect(safeRedirectPath("/resident/complaints", "/")).toBe("/resident/complaints");
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
    expect(safeRedirectPath("//evil.example", "/")).toBe("/");
    expect(safeRedirectPath("/\\evil.example", "/")).toBe("/");
  });
});
