/**
 * Repeatable demo seed. Safe to run many times:
 * - societies and users are upserted by their unique code/email;
 * - complaints are keyed by complaint number and skipped if they already exist,
 *   so history, comments, feedback and notifications are never duplicated;
 * - announcements are skipped if one with the same title already exists.
 *
 * All people, flats and societies are fictional.
 */
import { PrismaClient, type ComplaintCategory, type ComplaintPriority, type ComplaintStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === "production";
const password = process.env.SEED_DEMO_PASSWORD || (isProduction ? "" : "Demo@2026");
if (!password) {
  console.error("Refusing to seed in production without SEED_DEMO_PASSWORD set.");
  process.exit(1);
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (days: number, hours = 0) => new Date(now - days * DAY - hours * HOUR);

const RANK: Record<ComplaintPriority, number> = { LOW: 0, NORMAL: 1, HIGH: 2, URGENT: 3 };

type SeedComplaint = {
  number: number;
  resident: string; // email
  category: ComplaintCategory;
  title: string;
  description: string;
  location: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  daysAgo: number;
  assignee?: string; // manager email
  /** Hours from submission to each later step: assigned, in progress, resolved, closed. */
  steps?: number[];
  resolution?: string;
  comments?: { author: string; body: string; internal?: boolean; afterHours: number }[];
  feedback?: { rating: number; comment?: string };
};

async function upsertSociety(data: {
  name: string;
  code: string;
  joinCode: string;
  description: string;
  locality: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}) {
  return prisma.society.upsert({ where: { code: data.code }, update: {}, create: data });
}

async function upsertUser(
  passwordHash: string,
  societyId: string,
  u: { email: string; name: string; role: "RESIDENT" | "MANAGER"; unit?: string; phone?: string; active?: boolean },
) {
  return prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: {
      email: u.email,
      name: u.name,
      role: u.role,
      societyId,
      unitNumber: u.unit ?? null,
      phone: u.phone ?? null,
      isActive: u.active ?? true,
      passwordHash,
    },
  });
}

async function seedComplaints(
  society: { id: string; code: string },
  users: Map<string, { id: string; name: string }>,
  list: SeedComplaint[],
) {
  let created = 0;
  for (const c of list) {
    const complaintNumber = `${society.code}-${c.number}`;
    if (await prisma.complaint.findUnique({ where: { complaintNumber } })) continue;

    const resident = users.get(c.resident)!;
    const assignee = c.assignee ? users.get(c.assignee)! : undefined;
    const createdAt = ago(c.daysAgo, 3);
    const at = (hours: number) => new Date(createdAt.getTime() + hours * HOUR);

    // Build the true lifecycle for the final status.
    const path: ComplaintStatus[] = ["OPEN"];
    if (c.status !== "OPEN") path.push("ASSIGNED");
    if (["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(c.status)) path.push("IN_PROGRESS");
    if (["RESOLVED", "CLOSED"].includes(c.status)) path.push("RESOLVED");
    if (c.status === "CLOSED") path.push("CLOSED");
    const steps = c.steps ?? [2, 20, 44, 70];

    const history = path.map((status, i) => {
      const time = i === 0 ? createdAt : at(steps[i - 1]!);
      const description =
        status === "OPEN"
          ? "Complaint submitted by resident."
          : status === "ASSIGNED"
            ? `Assigned to ${assignee!.name}.`
            : status === "IN_PROGRESS"
              ? "Work has started on this issue."
              : status === "RESOLVED"
                ? `Resolved: ${c.resolution}`
                : "Closed after resident confirmation.";
      return {
        previousStatus: i === 0 ? null : path[i - 1]!,
        newStatus: status,
        changedById: i === 0 ? resident.id : assignee!.id,
        description,
        createdAt: time,
      };
    });
    const last = history[history.length - 1]!;
    const resolvedEntry = history.find((h) => h.newStatus === "RESOLVED");

    await prisma.complaint.create({
      data: {
        complaintNumber,
        societyId: society.id,
        residentId: resident.id,
        assignedManagerId: assignee?.id ?? null,
        category: c.category,
        title: c.title,
        description: c.description,
        location: c.location,
        priority: c.priority,
        priorityRank: RANK[c.priority],
        status: c.status,
        resolutionNote: resolvedEntry ? c.resolution : null,
        createdAt,
        updatedAt: last.createdAt,
        resolvedAt: resolvedEntry?.createdAt ?? null,
        history: { create: history },
        comments: {
          create: (c.comments ?? []).map((m) => ({
            authorId: users.get(m.author)!.id,
            body: m.body,
            isInternal: m.internal ?? false,
            createdAt: at(m.afterHours),
            updatedAt: at(m.afterHours),
          })),
        },
        ...(c.feedback && resolvedEntry
          ? {
              feedback: {
                create: {
                  residentId: resident.id,
                  rating: c.feedback.rating,
                  comment: c.feedback.comment,
                  createdAt: at(steps[2]! + 6),
                },
              },
            }
          : {}),
        notifications: {
          create: history.slice(1).map((h) => ({
            recipientId: resident.id,
            title:
              h.newStatus === "RESOLVED"
                ? `${complaintNumber} has been resolved`
                : `${complaintNumber} is now ${h.newStatus.replace("_", " ").toLowerCase()}`,
            message: `“${c.title}”: ${h.description}`,
            link: `/resident/complaints/__ID__`,
            createdAt: h.createdAt,
            // Older updates are already read; the last few days stay unread.
            readAt: h.createdAt.getTime() < now - 3 * DAY ? h.createdAt : null,
          })),
        },
      },
    });
    created++;
  }

  // Fill in notification links now that complaint ids exist.
  const placeholders = await prisma.notification.findMany({
    where: { link: "/resident/complaints/__ID__" },
    select: { id: true, complaintId: true },
  });
  for (const n of placeholders) {
    await prisma.notification.update({
      where: { id: n.id },
      data: { link: `/resident/complaints/${n.complaintId}` },
    });
  }

  // Keep the society's sequence ahead of every seeded number so new complaints never collide.
  const maxNumber = Math.max(...list.map((c) => c.number));
  const current = await prisma.society.findUniqueOrThrow({ where: { id: society.id } });
  if (current.complaintSeq < maxNumber) {
    await prisma.society.update({ where: { id: society.id }, data: { complaintSeq: maxNumber } });
  }
  return created;
}

async function seedAnnouncements(
  societyId: string,
  authorId: string,
  list: { title: string; message: string; daysAgo: number; expiresInDays?: number; isActive?: boolean }[],
) {
  for (const a of list) {
    const exists = await prisma.announcement.findFirst({ where: { societyId, title: a.title } });
    if (exists) continue;
    await prisma.announcement.create({
      data: {
        societyId,
        authorId,
        title: a.title,
        message: a.message,
        publishedAt: ago(a.daysAgo),
        expiresAt: a.expiresInDays !== undefined ? new Date(now + a.expiresInDays * DAY) : null,
        isActive: a.isActive ?? true,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  // ---------------------------------------------------------------- Greenview
  const greenview = await upsertSociety({
    name: "Greenview Residency",
    code: "GVR",
    joinCode: "GREEN2026",
    description: "A 4-tower residential community with 180 apartments, a clubhouse and landscaped gardens.",
    locality: "Sector 45, Gurugram",
    address: "Greenview Residency, Sector 45, Gurugram, Haryana",
    contactEmail: "office@greenview.demo",
    contactPhone: "+91 98100 00000",
  });

  const gvUsers = [
    { email: "manager@greenview.demo", name: "Priya Menon", role: "MANAGER" as const, phone: "+91 98100 00001" },
    { email: "facilities@greenview.demo", name: "Rahul Verma", role: "MANAGER" as const, phone: "+91 98100 00002" },
    { email: "resident@greenview.demo", name: "Aarav Sharma", role: "RESIDENT" as const, unit: "A-101", phone: "+91 98100 10101" },
    { email: "neha.kapoor@greenview.demo", name: "Neha Kapoor", role: "RESIDENT" as const, unit: "B-204" },
    { email: "rohan.iyer@greenview.demo", name: "Rohan Iyer", role: "RESIDENT" as const, unit: "C-302" },
    { email: "fatima.khan@greenview.demo", name: "Fatima Khan", role: "RESIDENT" as const, unit: "A-405" },
    { email: "vikram.singh@greenview.demo", name: "Vikram Singh", role: "RESIDENT" as const, unit: "B-110" },
    { email: "meera.nair@greenview.demo", name: "Meera Nair", role: "RESIDENT" as const, unit: "D-208" },
    { email: "sanjay.patel@greenview.demo", name: "Sanjay Patel", role: "RESIDENT" as const, unit: "D-012", active: false },
  ];
  const gv = new Map<string, { id: string; name: string }>();
  for (const u of gvUsers) gv.set(u.email, await upsertUser(passwordHash, greenview.id, u));

  const M1 = "manager@greenview.demo";
  const M2 = "facilities@greenview.demo";
  const R1 = "resident@greenview.demo";

  const gvCreated = await seedComplaints(greenview, gv, [
    {
      number: 1001, resident: R1, category: "PLUMBING", priority: "HIGH", status: "CLOSED", daysAgo: 58,
      title: "Kitchen sink leaking under the cabinet",
      description: "Water is dripping from the pipe joint under the kitchen sink and the cabinet base is getting damp.",
      location: "Tower A, Flat A-101, kitchen", assignee: M2, steps: [3, 20, 30, 80],
      resolution: "Plumber replaced the worn washer and resealed the trap joint. No leakage after a 2-hour test.",
      feedback: { rating: 5, comment: "Fixed the next day. Very happy with the quick response." },
    },
    {
      number: 1002, resident: "neha.kapoor@greenview.demo", category: "LIFT", priority: "URGENT", status: "RESOLVED", daysAgo: 41,
      title: "Tower B lift stuck between floors",
      description: "The Tower B lift stopped between the 3rd and 4th floors this morning. Residents were stuck for 10 minutes.",
      location: "Tower B, passenger lift 1", assignee: M1, steps: [0.5, 1, 6],
      resolution: "AMC technician replaced the faulty door sensor and ran a full safety check. Lift certified safe.",
      comments: [
        { author: M1, body: "The lift vendor has been called and is on the way.", afterHours: 0.7 },
        { author: M1, body: "Vendor says the door sensor is faulty — replacement in stock.", internal: true, afterHours: 2 },
      ],
      feedback: { rating: 4, comment: "Good response, but we need regular maintenance checks." },
    },
    {
      number: 1003, resident: "rohan.iyer@greenview.demo", category: "ELECTRICAL", priority: "NORMAL", status: "RESOLVED", daysAgo: 33,
      title: "Corridor lights not working on 3rd floor",
      description: "Three corridor lights outside C-301 to C-304 have not worked for two days. It is very dark at night.",
      location: "Tower C, 3rd floor corridor", assignee: M2, steps: [4, 26, 50],
      resolution: "Replaced three LED tube lights and a loose connection at the distribution board.",
    },
    {
      number: 1004, resident: "fatima.khan@greenview.demo", category: "CLEANING", priority: "LOW", status: "CLOSED", daysAgo: 27,
      title: "Staircase not cleaned for a week",
      description: "The staircase between the 3rd and 5th floors of Tower A has dust and litter. It hasn't been cleaned recently.",
      location: "Tower A, staircase floors 3–5", assignee: M1, steps: [6, 24, 30, 72],
      resolution: "Housekeeping roster updated; staircase cleaned and added to the daily checklist.",
      feedback: { rating: 4 },
    },
    {
      number: 1005, resident: "vikram.singh@greenview.demo", category: "WATER_SUPPLY", priority: "HIGH", status: "RESOLVED", daysAgo: 19,
      title: "Low water pressure in bathroom",
      description: "Water pressure in both bathrooms has been very low since Monday, especially in the mornings.",
      location: "Tower B, Flat B-110", assignee: M2, steps: [2, 8, 30],
      resolution: "Cleaned the clogged inlet filter and adjusted the pressure valve on the B-wing line.",
      feedback: { rating: 3, comment: "Better now, though mornings are still a bit slow." },
    },
    {
      number: 1006, resident: R1, category: "SECURITY", priority: "HIGH", status: "IN_PROGRESS", daysAgo: 9,
      title: "Main gate CCTV camera not recording",
      description: "The camera facing the main gate has shown a blank screen on the guard room monitor for three days.",
      location: "Main gate, guard room", assignee: M1, steps: [3, 30],
      comments: [
        { author: M1, body: "We have raised a service request with the CCTV vendor. Visit expected this week.", afterHours: 31 },
        { author: R1, body: "Thank you. Please also check the camera near the visitor parking.", afterHours: 40 },
        { author: M1, body: "Vendor quote received: ₹4,500 for DVR port replacement. Approve from maintenance fund.", internal: true, afterHours: 50 },
      ],
    },
    {
      number: 1007, resident: "meera.nair@greenview.demo", category: "WASTE_MANAGEMENT", priority: "NORMAL", status: "IN_PROGRESS", daysAgo: 6,
      title: "Garbage not collected from D-wing",
      description: "Dry waste bins in the D-wing basement have not been emptied for two days and are overflowing.",
      location: "Tower D, basement bin area", assignee: M2, steps: [5, 20],
    },
    {
      number: 1008, resident: "neha.kapoor@greenview.demo", category: "COMMON_AREA", priority: "LOW", status: "ASSIGNED", daysAgo: 5,
      title: "Broken swing in children's play area",
      description: "One of the swings in the play area has a broken chain. It could hurt a child.",
      location: "Central garden, play area", assignee: M1, steps: [18],
    },
    {
      number: 1009, resident: R1, category: "ELECTRICAL", priority: "URGENT", status: "ASSIGNED", daysAgo: 2,
      title: "Sparks from the meter box in the lobby",
      description: "Small sparks and a burning smell are coming from the electricity meter panel in the Tower A lobby.",
      location: "Tower A, ground floor lobby", assignee: M2, steps: [1],
      comments: [{ author: M2, body: "Electrician dispatched. Please keep children away from the panel.", afterHours: 1.5 }],
    },
    {
      number: 1010, resident: "rohan.iyer@greenview.demo", category: "PLUMBING", priority: "NORMAL", status: "OPEN", daysAgo: 1,
      title: "Water seepage on bedroom wall",
      description: "There is a damp patch spreading on the bedroom wall next to the bathroom. Paint is starting to peel.",
      location: "Tower C, Flat C-302, master bedroom",
    },
    {
      number: 1011, resident: "fatima.khan@greenview.demo", category: "LIFT", priority: "HIGH", status: "OPEN", daysAgo: 0,
      title: "Tower A lift making grinding noise",
      description: "The Tower A service lift makes a loud grinding noise between floors 2 and 5.",
      location: "Tower A, service lift",
    },
    {
      number: 1012, resident: "vikram.singh@greenview.demo", category: "OTHER", priority: "LOW", status: "OPEN", daysAgo: 3,
      title: "Request for additional visitor parking signage",
      description: "Visitors often park in residents' slots. Clearer visitor parking signs near the entrance would help.",
      location: "Visitor parking, near main gate",
    },
    {
      number: 1013, resident: "meera.nair@greenview.demo", category: "CLEANING", priority: "NORMAL", status: "RESOLVED", daysAgo: 12,
      title: "Clubhouse washroom needs cleaning",
      description: "The ladies' washroom in the clubhouse has not been cleaned and the soap dispensers are empty.",
      location: "Clubhouse, ground floor washroom", assignee: M1, steps: [2, 5, 9],
      resolution: "Washroom deep-cleaned and dispensers refilled. Added to the housekeeping checklist.",
    },
    {
      number: 1014, resident: R1, category: "WATER_SUPPLY", priority: "NORMAL", status: "RESOLVED", daysAgo: 15,
      title: "No hot water from the solar heater",
      description: "The solar water heater supply to A-101 has had no hot water for the last two days.",
      location: "Tower A, Flat A-101", assignee: M2, steps: [4, 22, 46],
      resolution: "Air lock in the solar line cleared and the valve on the terrace replaced.",
    },
  ]);

  await seedAnnouncements(greenview.id, gv.get(M1)!.id, [
    {
      title: "Water tank cleaning on Saturday",
      message: "Overhead water tanks for all towers will be cleaned this Saturday from 10 AM to 2 PM. Please store water in advance.",
      daysAgo: 1, expiresInDays: 5,
    },
    {
      title: "Annual general meeting",
      message: "The annual general meeting will be held in the clubhouse next Sunday at 11 AM. Agenda: maintenance budget and security upgrades.",
      daysAgo: 4, expiresInDays: 10,
    },
    {
      title: "New housekeeping schedule",
      message: "Common staircases are now cleaned daily before 9 AM. Please report missed areas through FixMySociety.",
      daysAgo: 10,
    },
    {
      title: "Diwali decoration guidelines",
      message: "Please avoid hanging decorative lights from common-area electrical points.",
      daysAgo: 40, isActive: false,
    },
  ]);

  // Manager notifications for the newest open complaints.
  const newestOpen = await prisma.complaint.findMany({
    where: { societyId: greenview.id, status: "OPEN" },
    select: { id: true, complaintNumber: true, title: true, createdAt: true },
  });
  for (const c of newestOpen) {
    for (const managerEmail of [M1, M2]) {
      const recipientId = gv.get(managerEmail)!.id;
      const exists = await prisma.notification.findFirst({
        where: { recipientId, complaintId: c.id, title: { startsWith: "New complaint" } },
      });
      if (!exists) {
        await prisma.notification.create({
          data: {
            recipientId,
            complaintId: c.id,
            title: `New complaint ${c.complaintNumber}`,
            message: c.title,
            link: `/manager/complaints/${c.id}`,
            createdAt: c.createdAt,
          },
        });
      }
    }
  }

  // ------------------------------------------------------------- Lakeside (for isolation tests)
  const lakeside = await upsertSociety({
    name: "Lakeside Towers",
    code: "LKT",
    joinCode: "LAKE2026",
    description: "A fictional second society used to demonstrate data isolation between societies.",
    locality: "Whitefield, Bengaluru",
    address: "Lakeside Towers, Whitefield, Bengaluru, Karnataka",
    contactEmail: "office@lakeside.demo",
    contactPhone: "+91 98450 00000",
  });
  const lk = new Map<string, { id: string; name: string }>();
  for (const u of [
    { email: "manager@lakeside.demo", name: "Anil Joshi", role: "MANAGER" as const },
    { email: "resident@lakeside.demo", name: "Kavya Rao", role: "RESIDENT" as const, unit: "L-501" },
  ]) {
    lk.set(u.email, await upsertUser(passwordHash, lakeside.id, u));
  }
  const lkCreated = await seedComplaints(lakeside, lk, [
    {
      number: 2001, resident: "resident@lakeside.demo", category: "SECURITY", priority: "HIGH", status: "OPEN", daysAgo: 2,
      title: "Lakeside gate intercom not working",
      description: "The intercom at the Lakeside main gate does not ring the flats.",
      location: "Lakeside main gate",
    },
    {
      number: 2002, resident: "resident@lakeside.demo", category: "PLUMBING", priority: "NORMAL", status: "IN_PROGRESS", daysAgo: 6,
      title: "Lakeside terrace drain blocked",
      description: "Rainwater collects on the terrace because the drain is blocked.",
      location: "Lakeside terrace", assignee: "manager@lakeside.demo", steps: [4, 24],
    },
  ]);

  console.log(
    `Seed complete. New complaints: Greenview ${gvCreated}, Lakeside ${lkCreated}. ` +
      `Demo password: ${process.env.SEED_DEMO_PASSWORD ? "(from SEED_DEMO_PASSWORD)" : password}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
