import { expect, test } from "@playwright/test";
import { login, MANAGER, RESIDENT } from "./helpers";

test("landing page renders with key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Maintenance Issues, Finally Under Control." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore the Demo" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Small Problems Shouldn't Become Big Frustrations." })).toBeVisible();
  await expect(page.getByText(`© ${new Date().getFullYear()} FixMySociety`)).toBeVisible();
  await page.getByRole("link", { name: "See How It Works" }).click();
  await expect(page.getByRole("heading", { name: "Three steps from problem to resolution" })).toBeInViewport();
});

test("login works with a valid development account", async ({ page }) => {
  await login(page, RESIDENT);
  await expect(page).toHaveURL(/\/resident\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Aarav");
});

test("invalid login is rejected with a generic message", async ({ page }) => {
  await login(page, RESIDENT, "wrong-password-1");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await login(page, "nobody@nowhere.test", "whatever123");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("deactivated accounts cannot sign in", async ({ page }) => {
  await login(page, "sanjay.patel@greenview.demo");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("logout ends the session", async ({ page }) => {
  await login(page, MANAGER);
  await expect(page).toHaveURL(/\/manager\/dashboard/);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/manager/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fmanager%2Fdashboard/);
});

test("protected routes reject unauthenticated users", async ({ page, request }) => {
  for (const path of ["/resident/dashboard", "/resident/complaints/new", "/manager/complaints", "/manager/analytics"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
  const csv = await request.get("/manager/analytics/export", { maxRedirects: 0 });
  expect(csv.status()).toBe(307);
});

test("a forged session cookie is not accepted", async ({ page, context }) => {
  await context.addCookies([{ name: "fms_session", value: "forged-token-value", domain: "localhost", path: "/" }]);
  await page.goto("/resident/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("residents cannot access manager routes and vice versa", async ({ page }) => {
  await login(page, RESIDENT);
  await expect(page).toHaveURL(/\/resident\/dashboard/);
  await page.goto("/manager/complaints");
  await expect(page).toHaveURL(/\/resident\/dashboard\?denied=1/);
  await expect(page.getByText("only available to society managers")).toBeVisible();
  const csv = await page.request.get("/manager/analytics/export");
  expect(csv.status()).toBe(404);
});

test("demo mode offers one-click demo access", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Manager demo" }).click();
  await expect(page).toHaveURL(/\/manager\/dashboard/);
});

test("a new resident can register with a join code but never as a manager", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Test Resident");
  await page.getByLabel("Email address").fill(`e2e.${Date.now()}@test.demo`);
  await page.getByLabel("Society join code").fill("WRONGCODE");
  await page.getByLabel("Flat / unit number").fill("Z-101");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Password123");
  await page.getByLabel("Confirm password").fill("Password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Check the join code with your society manager.")).toBeVisible();

  await page.getByLabel("Society join code").fill("green2026");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Password123");
  await page.getByLabel("Confirm password").fill("Password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/resident\/dashboard/);
  await expect(page.getByText("No complaints yet")).toBeVisible();
  await page.goto("/resident/profile");
  await expect(page.getByText("Resident", { exact: true })).toBeVisible();
});
