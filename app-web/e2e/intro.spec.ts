import { test, expect } from "@playwright/test";

test("intro pauses, resumes without replaying old words, and settles without moving the action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const root = page.locator(".animated-intro");
  const phrases = page.locator(".animated-intro-phrase");
  await expect(page.getByRole("button", { name: "Pause animation" })).toBeVisible();
  const initial = await page.locator(".upload-area").boundingBox();
  await expect(phrases.nth(1)).toHaveCSS("opacity", "1", { timeout: 8000 });
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(root).toHaveAttribute("data-motion-state", "paused");
  const times = await phrases.evaluateAll(elements => elements.map(element => element.getAnimations()[0]?.currentTime));
  await page.waitForTimeout(350);
  expect(await phrases.evaluateAll(elements => elements.map(element => element.getAnimations()[0]?.currentTime))).toEqual(times);
  await page.getByRole("button", { name: "Resume animation" }).click();
  await page.waitForTimeout(450);
  await expect(phrases.nth(0)).toHaveCSS("opacity", "0");
  await expect(phrases.nth(1)).toHaveCSS("opacity", "1");
  await expect(root).toHaveAttribute("data-motion-state", "complete", { timeout: 15000 });
  await expect(phrases.nth(3)).toHaveCSS("opacity", "1");
  const final = await page.locator(".upload-area").boundingBox();
  expect(Math.abs(initial!.y - final!.y)).toBeLessThan(1);
  await page.getByRole("button", { name: "Replay animation" }).click();
  await expect(phrases.nth(0)).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await expect(page.getByRole("heading", { name: "Bill details" })).toBeFocused();
  await page.getByRole("button", { name: "Back", exact: false }).first().click();
  await expect(page.getByRole("heading", { name: /^Photograph a receipt/ })).toBeFocused();
});

test("reduced motion keeps a readable static introduction and narrow layouts fit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 664 });
  await page.goto("/");
  await expect(page.locator(".animated-intro-static")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("button", { name: /animation/ })).toHaveCount(0);
  await expect(page.getByText("One private payment link for each friend.")).toBeVisible();
  expect(await page.locator(".animated-intro").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await expect(page.getByRole("heading", { name: "Bill details" })).toBeVisible();
});
