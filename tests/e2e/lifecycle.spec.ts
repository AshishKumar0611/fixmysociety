import { expect, test } from "@playwright/test";
import { createComplaint, expectToast, MANAGER, NEIGHBOUR, newSession, OTHER_MANAGER, RESIDENT, statusBadge } from "./helpers";

test("invalid complaint submissions are rejected with field errors", async ({ browser }) => {
  const page = await newSession(browser, RESIDENT);
  await page.goto("/resident/complaints/new");
  await page.getByRole("button", { name: "Submit complaint" }).click();
  await expect(page.getByText("Choose a category.")).toBeVisible();
  await expect(page.getByText("Title must be at least 5 characters.")).toBeVisible();
  await expect(page.getByText("Description must be at least 10 characters.")).toBeVisible();
  await expect(page).toHaveURL(/\/new$/);
  // Focus moves to the first invalid field for keyboard and screen-reader users.
  await expect(page.getByLabel("Category")).toBeFocused();
});

test("full complaint lifecycle: resident → manager → resident", async ({ browser }) => {
  const resident = await newSession(browser, RESIDENT);
  const statsBefore = Number(await resident.getByText("Total Complaints").locator("xpath=../..").locator("p").nth(1).innerText());

  const id = await createComplaint(resident, "E2E: kitchen pipe leaking");
  await expectToast(resident, /submitted/);
  await expect(statusBadge(resident)).toContainText("Open");
  await expect(resident.locator('ol[aria-label="Status history"] > li')).toHaveCount(1);
  const number = await resident.locator("span.font-mono").first().innerText();
  expect(number).toMatch(/^GVR-\d+$/);

  await resident.goto("/resident/dashboard");
  await expect(resident.getByText("Total Complaints").locator("xpath=../..").locator("p").nth(1)).toHaveText(String(statsBefore + 1));

  const manager = await newSession(browser, MANAGER);
  await manager.goto("/manager/notifications");
  await expect(manager.getByText(`New complaint ${number}`)).toBeVisible();

  await manager.goto("/manager/complaints?q=" + number);
  await expect(manager.locator("tbody tr")).toHaveCount(1);
  await manager.getByRole("link", { name: `View details for ${number}` }).click();
  await expect(manager).toHaveURL(new RegExp(`/manager/complaints/${id}$`));

  await manager.getByLabel("Assign to").selectOption({ label: "Rahul Verma" });
  await manager.getByRole("button", { name: "Assign" }).click();
  await expectToast(manager, "Complaint assigned.");
  await expect(statusBadge(manager)).toContainText("Assigned");

  await manager.getByLabel("New status").selectOption("IN_PROGRESS");
  await manager.getByLabel("Update note").fill("Plumber booked for this afternoon.");
  await manager.getByRole("button", { name: "Update status" }).click();
  await expect(statusBadge(manager)).toContainText("In Progress");

  // Resolution notes are required.
  await manager.getByLabel("New status").selectOption("RESOLVED");
  await manager.getByRole("button", { name: "Mark as resolved" }).click();
  await expect(manager.locator("#resolutionNote-error")).toContainText("resolution note");
  await expect(statusBadge(manager)).toContainText("In Progress");
  await expect(manager.getByLabel("New status")).toHaveValue("RESOLVED");

  await manager.getByLabel("Resolution note").fill("Replaced the corroded joint and tested for 30 minutes.");
  await manager.getByRole("button", { name: "Mark as resolved" }).click();
  await expect(statusBadge(manager)).toContainText("Resolved");
  await expect(manager.getByRole("heading", { name: "Resolution note" })).toBeVisible();

  await manager.getByLabel(/Add a reply/).fill("INTERNAL-ONLY: plumber invoice ₹850");
  await manager.getByLabel(/Internal note/).check();
  await manager.getByRole("button", { name: "Post" }).click();
  await expectToast(manager, "Internal note added.");
  await manager.getByLabel(/Add a reply/).fill("All fixed — please let us know if it leaks again.");
  await manager.getByRole("button", { name: "Post" }).click();
  await expectToast(manager, "Comment posted.");

  // Resident view: full accurate timeline, public reply visible, internal note hidden.
  await resident.goto(`/resident/complaints/${id}`);
  await expect(statusBadge(resident)).toContainText("Resolved");
  const timeline = resident.locator('ol[aria-label="Status history"] > li');
  await expect(timeline).toHaveCount(4);
  await expect(timeline.nth(3)).toContainText("Replaced the corroded joint");
  await expect(resident.getByText("All fixed — please let us know")).toBeVisible();
  await expect(resident.getByText("INTERNAL-ONLY")).toHaveCount(0);
  expect(await resident.content()).not.toContain("INTERNAL-ONLY");

  await resident.goto("/resident/notifications");
  await expect(resident.getByText(`${number} has been resolved`)).toBeVisible();

  // Feedback once resolved, exactly once.
  await resident.goto(`/resident/complaints/${id}`);
  await resident.locator('label:has(input[name=rating][value="5"])').click();
  await resident.getByLabel("Comments").fill("Fast and tidy work.");
  await resident.getByRole("button", { name: "Submit feedback" }).click();
  await expectToast(resident, "Thank you for your feedback!");
  await expect(resident.getByText("5/5")).toBeVisible();
  await expect(resident.getByRole("button", { name: "Submit feedback" })).toHaveCount(0);

  // Refreshing nested routes keeps working.
  await resident.reload();
  await expect(statusBadge(resident)).toContainText("Resolved");
  await manager.reload();
  await expect(manager.getByText("Fast and tidy work.")).toBeVisible();
});

test("feedback is not offered before a complaint is resolved", async ({ browser }) => {
  const resident = await newSession(browser, RESIDENT);
  await createComplaint(resident, "E2E: not yet resolved");
  await expect(resident.getByRole("button", { name: "Submit feedback" })).toHaveCount(0);
});

test("residents and other societies cannot read restricted complaints", async ({ browser }) => {
  const resident = await newSession(browser, RESIDENT);
  const id = await createComplaint(resident, "E2E: private complaint");

  const neighbour = await newSession(browser, NEIGHBOUR);
  // Streaming pages keep a 200 status once the shell is sent; the not-found UI replaces the content.
  await neighbour.goto(`/resident/complaints/${id}`);
  await expect(neighbour.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(neighbour.getByText("E2E: private complaint")).toHaveCount(0);
  expect(await neighbour.content()).not.toContain("E2E: private complaint");

  const otherSociety = await newSession(browser, OTHER_MANAGER);
  await otherSociety.goto(`/manager/complaints/${id}`);
  await expect(otherSociety.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect(await otherSociety.content()).not.toContain("E2E: private complaint");
  await otherSociety.goto("/manager/complaints?q=E2E");
  await expect(otherSociety.getByText("E2E: private complaint")).toHaveCount(0);

  const attachmentProbe = await neighbour.request.get(`/api/attachments/${id}`);
  expect(attachmentProbe.status()).toBe(404);
});

test("search, filters and clear filters work on the manager queue", async ({ browser }) => {
  const manager = await newSession(browser, MANAGER);
  await manager.goto("/manager/complaints");
  await manager.getByLabel("Status").selectOption("CLOSED");
  await expect(manager).toHaveURL(/status=CLOSED/);
  const rows = manager.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  for (const badge of await rows.locator("span[title]").allInnerTexts()) expect(badge).toContain("Closed");

  await manager.getByRole("link", { name: /Clear filters/ }).click();
  await expect(manager).toHaveURL(/\/manager\/complaints$/);

  await manager.getByLabel("Search").fill("CCTV");
  await manager.getByRole("button", { name: "Search" }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Main gate CCTV camera not recording");

  await manager.goto("/manager/complaints?q=zzzz-no-match");
  await expect(manager.getByText("No complaints match these filters")).toBeVisible();
});

test("notifications can be marked as read", async ({ browser }) => {
  const resident = await newSession(browser, RESIDENT);
  await resident.goto("/resident/notifications");
  await expect(resident.getByText(/\d+ unread/)).toBeVisible();
  await resident.getByRole("button", { name: "Mark all as read" }).click();
  await expect(resident.getByText("All caught up")).toBeVisible();
  await expect(resident.locator("header a[aria-label='Notifications']")).toBeVisible();
});

test("manager announcements reach residents of the same society only", async ({ browser }) => {
  const manager = await newSession(browser, MANAGER);
  await manager.goto("/manager/announcements");
  await manager.getByLabel("Title").fill("E2E: Generator test on Sunday");
  await manager.getByLabel("Message").fill("The backup generator will be tested on Sunday at 10 AM.");
  await manager.getByRole("button", { name: "Publish announcement" }).click();
  await expectToast(manager, "Announcement published to residents.");

  const resident = await newSession(browser, RESIDENT);
  await resident.goto("/resident/announcements");
  await expect(resident.getByText("E2E: Generator test on Sunday")).toBeVisible();

  const lakeside = await newSession(browser, "resident@lakeside.demo");
  await lakeside.goto("/resident/announcements");
  await expect(lakeside.getByText("E2E: Generator test on Sunday")).toHaveCount(0);
});

test("analytics filters and CSV export work", async ({ browser }) => {
  const manager = await newSession(browser, MANAGER);
  await manager.goto("/manager/analytics?range=7");
  await expect(manager.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expect(manager.getByText(/\(last 7 days\)/)).toBeVisible();
  const csv = await manager.request.get("/manager/analytics/export?range=90");
  expect(csv.status()).toBe(200);
  const body = await csv.text();
  expect(body).toContain("Complaint ID,Title,Category");
  expect(body).not.toContain("INTERNAL-ONLY");
  expect(body).not.toContain("@greenview.demo");
});
