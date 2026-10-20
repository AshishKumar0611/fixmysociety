import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = process.env.SEED_DEMO_PASSWORD || "Demo@2026";
export const RESIDENT = "resident@greenview.demo";
export const NEIGHBOUR = "neha.kapoor@greenview.demo";
export const MANAGER = "manager@greenview.demo";
export const OTHER_MANAGER = "manager@lakeside.demo";

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function newSession(browser: Browser, email: string, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await login(page, email);
  await expect(page).toHaveURL(/\/(resident|manager)\/dashboard/);
  return page;
}

/** Waits for a toast with the given text (toasts live in the polite live region). */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[aria-live=polite]").getByText(text).first()).toBeVisible();
}

export function statusBadge(page: Page) {
  return page.locator("h1").locator("xpath=preceding-sibling::div[1]").locator("span[title]");
}

export async function createComplaint(page: Page, title: string) {
  await page.goto("/resident/complaints/new");
  await page.getByLabel("Category").selectOption("PLUMBING");
  await page.getByLabel("Location").fill("Tower A, Flat A-101, kitchen");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Water drips from the pipe under the kitchen sink all day.");
  await page.getByRole("button", { name: "Submit complaint" }).click();
  await expect(page).toHaveURL(/\/resident\/complaints\/c[a-z0-9]+$/);
  return page.url().split("/").pop()!;
}
