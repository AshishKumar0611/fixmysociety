import { expect, test } from "@playwright/test";
import { MANAGER, newSession, RESIDENT } from "./helpers";

const WIDTHS = [375, 390, 768, 1024, 1440];

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow at ${page.viewportSize()?.width}px on ${page.url()}`).toBeLessThanOrEqual(0);
}

test("public pages have no horizontal overflow", async ({ page }) => {
  for (const width of [320, ...WIDTHS]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/login", "/register", "/privacy"]) {
      await page.goto(path);
      await noHorizontalOverflow(page);
    }
  }
});

test("resident and manager pages are usable at every breakpoint", async ({ browser }) => {
  const resident = await newSession(browser, RESIDENT);
  const manager = await newSession(browser, MANAGER);
  for (const width of WIDTHS) {
    for (const [page, paths] of [
      [resident, ["/resident/dashboard", "/resident/complaints", "/resident/complaints/new"]],
      [manager, ["/manager/dashboard", "/manager/complaints", "/manager/analytics", "/manager/residents"]],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await noHorizontalOverflow(page);
      }
    }
  }
});

test("mobile navigation drawer and bottom bar work", async ({ browser }) => {
  const page = await newSession(browser, RESIDENT, { width: 375, height: 800 });
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Announcements" }).click();
  await expect(page).toHaveURL(/\/resident\/announcements/);
  await expect(drawer).toBeHidden();

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  const bottom = page.getByRole("navigation", { name: "Primary" });
  await bottom.getByRole("link", { name: "Raise" }).click();
  await expect(page).toHaveURL(/\/resident\/complaints\/new/);
  await expect(bottom.getByRole("link", { name: "Raise" })).toHaveAttribute("aria-current", "page");
});

test("mobile complaint list renders as cards", async ({ browser }) => {
  const page = await newSession(browser, MANAGER, { width: 390, height: 844 });
  await page.goto("/manager/complaints");
  await expect(page.getByRole("table", { name: "Society complaints", includeHidden: true })).toBeHidden();
  await expect(page.locator("ul.md\\:hidden > li").first()).toBeVisible();
});

test("dark mode toggle persists", async ({ browser }) => {
  const page = await newSession(browser, RESIDENT);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
