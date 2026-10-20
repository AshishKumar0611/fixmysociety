import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { registerResident, isLocked, recordFailure, RATE_LIMIT } from "@/server/services/accounts";
import { createAnnouncement, listActiveAnnouncements, listResidents } from "@/server/services/community";
import {
  addComment,
  assignComplaint,
  createComplaint,
  getComplaintDetail,
  listComplaints,
  submitFeedback,
  updateComplaintStatus,
} from "@/server/services/complaints";
import { getResidentStats, getSocietyMetrics } from "@/server/services/stats";
import type { Actor } from "@/server/services/types";

// Runs against the seeded test database (see global-setup.ts).

async function actor(email: string): Promise<Actor> {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { id: u.id, role: u.role, societyId: u.societyId, name: u.name };
}

const input = (title: string) => ({
  category: "PLUMBING" as const,
  title,
  description: "Water is leaking steadily from the pipe joint.",
  location: "Tower A, A-101",
  priority: "HIGH" as const,
  preferredContact: "IN_APP" as const,
});

let resident: Actor; // Aarav, Greenview
let neighbour: Actor; // Neha, Greenview
let manager: Actor; // Priya, Greenview
let otherManager: Actor; // Anil, Lakeside
let otherResident: Actor; // Kavya, Lakeside
let facilities: Actor; // Rahul, Greenview

beforeAll(async () => {
  resident = await actor("resident@greenview.demo");
  neighbour = await actor("neha.kapoor@greenview.demo");
  manager = await actor("manager@greenview.demo");
  facilities = await actor("facilities@greenview.demo");
  otherManager = await actor("manager@lakeside.demo");
  otherResident = await actor("resident@lakeside.demo");
});

afterAll(() => prisma.$disconnect());

describe("complaint creation", () => {
  it("creates a complaint with OPEN status, initial history and notifications", async () => {
    const before = await prisma.notification.count();
    const { id, complaintNumber } = await createComplaint(resident, input("Integration test leak"));
    const c = await prisma.complaint.findUniqueOrThrow({ where: { id }, include: { history: true } });

    expect(complaintNumber).toMatch(/^GVR-\d+$/);
    expect(c.status).toBe("OPEN");
    expect(c.residentId).toBe(resident.id);
    expect(c.societyId).toBe(resident.societyId);
    expect(c.history).toHaveLength(1);
    expect(c.history[0]).toMatchObject({ previousStatus: null, newStatus: "OPEN", changedById: resident.id });
    // One for the resident + one for each of the two active Greenview managers.
    expect(await prisma.notification.count()).toBe(before + 3);
  });

  it("generates unique complaint numbers, even for concurrent submissions", async () => {
    const results = await Promise.all([1, 2, 3, 4].map((i) => createComplaint(resident, input(`Concurrent leak ${i}`))));
    const numbers = results.map((r) => r.complaintNumber);
    expect(new Set(numbers).size).toBe(4);
  });

  it("ignores duplicate submissions with the same submission key", async () => {
    const first = await createComplaint(resident, { ...input("Double click test"), submissionKey: "key-123" });
    const second = await createComplaint(resident, { ...input("Double click test"), submissionKey: "key-123" });
    expect(second.id).toBe(first.id);
    expect(second.duplicate).toBe(true);
    expect(await prisma.complaint.count({ where: { title: "Double click test" } })).toBe(1);
  });

  it("does not let managers create resident complaints", async () => {
    await expect(createComplaint(manager, input("Manager complaint"))).rejects.toThrow(/residents/);
  });

  it("rejects categories the society has disabled", async () => {
    await prisma.society.update({ where: { id: resident.societyId }, data: { enabledCategories: "ELECTRICAL" } });
    await expect(createComplaint(resident, input("Disabled category"))).rejects.toThrow(/not available/);
    await prisma.society.update({
      where: { id: resident.societyId },
      data: { enabledCategories: "PLUMBING,ELECTRICAL,CLEANING,LIFT,SECURITY,WATER_SUPPLY,WASTE_MANAGEMENT,COMMON_AREA,OTHER" },
    });
  });
});

describe("access control", () => {
  it("residents cannot read another resident's complaint", async () => {
    const neighbours = await prisma.complaint.findFirstOrThrow({ where: { residentId: neighbour.id } });
    expect(await getComplaintDetail(resident, neighbours.id)).toBeNull();
    expect(await getComplaintDetail(neighbour, neighbours.id)).not.toBeNull();
  });

  it("resident lists only contain their own complaints", async () => {
    const { items, total } = await listComplaints(resident, { sort: "newest", page: 1 }, 100);
    expect(total).toBeGreaterThan(0);
    const owners = await prisma.complaint.findMany({ where: { id: { in: items.map((i) => i.id) } }, select: { residentId: true } });
    expect(owners.every((o) => o.residentId === resident.id)).toBe(true);
  });

  it("managers see their whole society but nothing from other societies", async () => {
    const lakeside = await prisma.complaint.findFirstOrThrow({ where: { societyId: otherManager.societyId } });
    expect(await getComplaintDetail(manager, lakeside.id)).toBeNull();
    const { items } = await listComplaints(manager, { sort: "newest", page: 1 }, 200);
    expect(items.some((i) => i.complaintNumber.startsWith("LKT"))).toBe(false);
    expect(items.some((i) => i.resident?.name === "Neha Kapoor")).toBe(true);
  });

  it("a manager cannot update a complaint in another society", async () => {
    const lakeside = await prisma.complaint.findFirstOrThrow({ where: { societyId: otherManager.societyId, status: "OPEN" } });
    await expect(updateComplaintStatus(manager, { complaintId: lakeside.id, status: "ASSIGNED" })).rejects.toThrow(/not found/i);
    await expect(addComment(manager, { complaintId: lakeside.id, body: "hi", isInternal: false })).rejects.toThrow(/not found/i);
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: lakeside.id } })).status).toBe("OPEN");
  });

  it("residents cannot change complaint status or assign", async () => {
    const own = await prisma.complaint.findFirstOrThrow({ where: { residentId: resident.id, status: "OPEN" } });
    await expect(updateComplaintStatus(resident, { complaintId: own.id, status: "RESOLVED", resolutionNote: "Fixed it myself." })).rejects.toThrow(/managers/);
    await expect(assignComplaint(resident, { complaintId: own.id, managerId: manager.id })).rejects.toThrow(/managers/);
  });

  it("cannot assign a complaint to a manager from another society", async () => {
    const own = await prisma.complaint.findFirstOrThrow({ where: { societyId: manager.societyId, status: "OPEN" } });
    await expect(assignComplaint(manager, { complaintId: own.id, managerId: otherManager.id })).rejects.toThrow(/your society/);
  });

  it("other societies' residents never see this society's announcements", async () => {
    const lakesideAnnouncements = await listActiveAnnouncements(otherResident);
    expect(lakesideAnnouncements.some((a) => a.title.includes("Water tank"))).toBe(false);
    expect((await listActiveAnnouncements(resident)).some((a) => a.title.includes("Water tank"))).toBe(true);
  });

  it("resident directory exposes no password hashes and stays in-society", async () => {
    const rows = await listResidents(manager, {});
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows.every((r) => !("passwordHash" in r))).toBe(true);
    expect(rows.some((r) => r.email.endsWith("lakeside.demo"))).toBe(false);
  });
});

describe("status workflow", () => {
  it("runs the full lifecycle with accurate history, timestamps and notifications", async () => {
    const { id } = await createComplaint(resident, input("Lifecycle test"));
    await assignComplaint(manager, { complaintId: id, managerId: facilities.id });
    await updateComplaintStatus(facilities, { complaintId: id, status: "IN_PROGRESS", note: "Plumber on the way." });

    await expect(updateComplaintStatus(manager, { complaintId: id, status: "RESOLVED" })).rejects.toThrow(/resolution note/i);
    await expect(updateComplaintStatus(manager, { complaintId: id, status: "CLOSED" })).rejects.toThrow(/cannot move/);

    const residentNotesBefore = await prisma.notification.count({ where: { recipientId: resident.id, complaintId: id } });
    await updateComplaintStatus(manager, { complaintId: id, status: "RESOLVED", resolutionNote: "Replaced the pipe joint and tested." });

    const c = await prisma.complaint.findUniqueOrThrow({ where: { id }, include: { history: { orderBy: { createdAt: "asc" } } } });
    expect(c.status).toBe("RESOLVED");
    expect(c.resolvedAt).not.toBeNull();
    expect(c.resolutionNote).toBe("Replaced the pipe joint and tested.");
    expect(c.assignedManagerId).toBe(facilities.id);
    expect(c.history.map((h) => [h.previousStatus, h.newStatus])).toEqual([
      [null, "OPEN"],
      ["OPEN", "ASSIGNED"],
      ["ASSIGNED", "IN_PROGRESS"],
      ["IN_PROGRESS", "RESOLVED"],
    ]);
    expect(await prisma.notification.count({ where: { recipientId: resident.id, complaintId: id } })).toBe(residentNotesBefore + 1);

    // Reopen clears the resolution, then resolve and close again.
    await updateComplaintStatus(manager, { complaintId: id, status: "IN_PROGRESS" });
    const reopened = await prisma.complaint.findUniqueOrThrow({ where: { id } });
    expect(reopened.resolvedAt).toBeNull();
    expect(reopened.resolutionNote).toBeNull();
  });
});

describe("comments and feedback", () => {
  it("internal notes are never returned to residents", async () => {
    const { id } = await createComplaint(resident, input("Internal note test"));
    await addComment(manager, { complaintId: id, body: "Internal: budget approval needed", isInternal: true });
    await addComment(manager, { complaintId: id, body: "We will visit tomorrow.", isInternal: false });

    const asResident = await getComplaintDetail(resident, id);
    expect(asResident!.comments.map((c) => c.body)).toEqual(["We will visit tomorrow."]);
    const asManager = await getComplaintDetail(manager, id);
    expect(asManager!.comments).toHaveLength(2);
  });

  it("residents cannot create internal notes", async () => {
    const { id } = await createComplaint(resident, input("Resident internal attempt"));
    await addComment(resident, { complaintId: id, body: "Trying to be sneaky", isInternal: true });
    const comment = await prisma.complaintComment.findFirstOrThrow({ where: { complaintId: id } });
    expect(comment.isInternal).toBe(false);
  });

  it("feedback is only accepted once, after resolution, from the owner", async () => {
    const { id } = await createComplaint(resident, input("Feedback test"));
    await expect(submitFeedback(resident, { complaintId: id, rating: 5 })).rejects.toThrow(/once it has been resolved/);

    await updateComplaintStatus(manager, { complaintId: id, status: "RESOLVED", resolutionNote: "Fixed the leaking joint." });
    await expect(submitFeedback(neighbour, { complaintId: id, rating: 1 })).rejects.toThrow(/not found/i);
    await submitFeedback(resident, { complaintId: id, rating: 4, comment: "Quick fix" });
    await expect(submitFeedback(resident, { complaintId: id, rating: 5 })).rejects.toThrow(/already rated/);
    expect(await prisma.feedback.count({ where: { complaintId: id } })).toBe(1);
  });
});

describe("statistics", () => {
  it("dashboard metrics update after mutations", async () => {
    const before = await getResidentStats(resident);
    const societyBefore = await getSocietyMetrics(manager);
    const { id } = await createComplaint(resident, input("Stats test"));
    const after = await getResidentStats(resident);
    expect(after.total).toBe(before.total + 1);
    expect(after.open).toBe(before.open + 1);

    await updateComplaintStatus(manager, { complaintId: id, status: "RESOLVED", resolutionNote: "Resolved during the stats test." });
    const resolved = await getResidentStats(resident);
    expect(resolved.open).toBe(before.open);
    expect(resolved.resolved).toBe(before.resolved + 1);
    const societyAfter = await getSocietyMetrics(manager);
    expect(societyAfter.total).toBe(societyBefore.total + 1);
    expect(societyAfter.byCategory.reduce((a, c) => a + c.count, 0)).toBe(societyAfter.total);
  });

  it("search and filters operate on the authorised dataset", async () => {
    const byStatus = await listComplaints(manager, { status: "CLOSED", sort: "newest", page: 1 }, 100);
    expect(byStatus.items.every((i) => i.status === "CLOSED")).toBe(true);
    const search = await listComplaints(manager, { q: "gvr-1002", sort: "newest", page: 1 });
    expect(search.items.map((i) => i.complaintNumber)).toEqual(["GVR-1002"]);
    const byUnit = await listComplaints(manager, { q: "B-204", sort: "newest", page: 1 }, 100);
    expect(byUnit.items.every((i) => i.resident?.unitNumber === "B-204")).toBe(true);
    const priority = await listComplaints(manager, { sort: "priority", page: 1 }, 100);
    expect(priority.items[0]!.priority).toBe("URGENT");
    // A resident searching for someone else's complaint number finds nothing.
    expect((await listComplaints(resident, { q: "GVR-1002", sort: "newest", page: 1 })).total).toBe(0);
  });

  it("pagination clamps out-of-range pages", async () => {
    const r = await listComplaints(manager, { sort: "newest", page: 9999 }, 5);
    expect(r.page).toBe(r.pageCount);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it("an empty society produces zeros without crashing", async () => {
    const society = await prisma.society.create({ data: { name: "Empty Society", code: "EMP", joinCode: "EMPTY123" } });
    const m = await prisma.user.create({ data: { name: "Empty Manager", email: "empty@manager.test", passwordHash: "x", role: "MANAGER", societyId: society.id } });
    const metrics = await getSocietyMetrics({ id: m.id, role: "MANAGER", societyId: society.id, name: m.name });
    expect(metrics).toMatchObject({ total: 0, resolutionRate: null, avgResolutionHours: null, averageRating: null });
  });
});

describe("accounts and announcements", () => {
  it("public registration always creates a resident in the join-code society", async () => {
    const u = await registerResident({ name: "New Resident", email: "new.resident@test.demo", passwordHash: "hash", joinCode: "GREEN2026", unitNumber: "C-999" });
    const created = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(created.role).toBe("RESIDENT");
    expect(created.societyId).toBe(resident.societyId);
    await expect(registerResident({ name: "X", email: "x@test.demo", passwordHash: "h", joinCode: "WRONG", unitNumber: "1" })).rejects.toThrow(/join code/);
    await expect(registerResident({ name: "Dup", email: "new.resident@test.demo", passwordHash: "h", joinCode: "GREEN2026", unitNumber: "1" })).rejects.toThrow(/already exists/);
  });

  it("locks an email after repeated failed logins", async () => {
    const key = "email:locked@test.demo";
    for (let i = 0; i < RATE_LIMIT.maxPerEmail - 1; i++) await recordFailure(key, RATE_LIMIT.maxPerEmail);
    expect(await isLocked([key])).toBeNull();
    await recordFailure(key, RATE_LIMIT.maxPerEmail);
    expect(await isLocked([key])).toBeInstanceOf(Date);
  });

  it("publishing an announcement notifies active residents only", async () => {
    const activeResidents = await prisma.user.count({ where: { societyId: manager.societyId, role: "RESIDENT", isActive: true } });
    const before = await prisma.notification.count({ where: { title: { startsWith: "New announcement" } } });
    await createAnnouncement(manager, { title: "Lift maintenance", message: "Lift B will be serviced on Monday morning." });
    expect(await prisma.notification.count({ where: { title: { startsWith: "New announcement" } } })).toBe(before + activeResidents);
    await expect(createAnnouncement(resident, { title: "Fake", message: "Residents cannot publish this." })).rejects.toThrow(/managers/);
  });
});
