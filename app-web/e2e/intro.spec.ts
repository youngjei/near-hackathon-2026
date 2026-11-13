import { test, expect } from "@playwright/test";

test("intro pauses, resumes without replaying old words, and loops with a longer final hold without moving the action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const root = page.locator(".animated-intro");
  const phrases = page.locator(".animated-intro-phrase");
  await expect(page.getByRole("button", { name: "Pause animation" })).toBeVisible();
  const initial = await page.locator(".upload-area").boundingBox();
  await expect(phrases.nth(1)).toHaveCSS("opacity", "1", { timeout: 8000 });
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(root).toHaveAttribute("data-motion-state", "paused");
  await expect.poll(() => phrases.evaluateAll(elements => elements.every(element => element.getAnimations()[0]?.playState === "paused"))).toBe(true);
  const times = await phrases.evaluateAll(elements => elements.map(element => element.getAnimations()[0]?.currentTime));
  await page.waitForTimeout(350);
  expect(await phrases.evaluateAll(elements => elements.map(element => element.getAnimations()[0]?.currentTime))).toEqual(times);
  await page.getByRole("button", { name: "Resume animation" }).click();
  await page.waitForTimeout(450);
  await expect(phrases.nth(0)).toHaveCSS("opacity", "0");
  await expect(phrases.nth(1)).toHaveCSS("opacity", "1");
  await expect(phrases.nth(3)).toHaveCSS("opacity", "1", { timeout: 12000 });
  await page.waitForTimeout(3200);
  await expect(phrases.nth(3)).toHaveCSS("opacity", "1");
  const final = await page.locator(".upload-area").boundingBox();
  expect(Math.abs(initial!.y - final!.y)).toBeLessThan(1);
  await expect(phrases.nth(0)).toHaveCSS("opacity", "1", { timeout: 6000 });
  await expect(root).toHaveAttribute("data-motion-state", "running");
  await expect(page.getByRole("button", { name: "Replay animation" })).toHaveCount(0);
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
  await expect(page.getByText("Each friend gets a private link to pay their share.")).toBeVisible();
  expect(await page.locator(".animated-intro").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await expect(page.getByRole("heading", { name: "Bill details" })).toBeVisible();
});

test("phrase handoffs never leave an empty or dim headline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation" }).click();
  const samples = await page.locator(".animated-intro").evaluate(element => {
    const animations = element.getAnimations({ subtree: true });
    const words = Array.from(element.querySelectorAll(".animated-intro-phrase"));
    const samples = [];
    for (let time = 1000; time <= 29000; time += 50) {
      animations.forEach(animation => { animation.currentTime = time; });
      const opacities = words.map(word => Number(getComputedStyle(word).opacity));
      samples.push({ total: opacities.reduce((a, b) => a + b, 0), strongest: Math.max(...opacities) });
    }
    return samples;
  });
  for (const sample of samples) {
    expect(sample.total).toBeCloseTo(1, 2);
    expect(sample.strongest).toBeGreaterThanOrEqual(.49);
  }
});

test("pixel story follows its steps and desktop dividers share a baseline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [1280, 960, 761, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const pictures = Array.from(document.querySelectorAll(".receipt-story > svg"), el => el.getBoundingClientRect());
      const numbers = Array.from(document.querySelectorAll(".step-index"), el => el.getBoundingClientRect());
      return { left: box(".workflow-steps").top, right: box(".start-sample").top,
        offsets: pictures.map((rect, index) => Math.abs(rect.x + rect.width / 2 - numbers[index].x - numbers[index].width / 2)),
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    if (width > 760) expect(Math.abs(geometry.left - geometry.right)).toBeLessThan(1);
    expect(geometry.offsets.every(offset => offset < 1)).toBe(true);
    expect(geometry.overflow).toBe(false);
  }
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/site.webmanifest?v=petrol-1");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png?v=petrol-1");
});

test("neighbor previews preserve every phrase's line breaks when the screen resizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Pause animation" }).click();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1280, 960, 761, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const comparisons = await page.evaluate(() => {
      const lines = (element: Element) => {
        const rows = new Map<number, string>();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (let i = 0; i < (node.textContent?.length || 0); i++) {
            const range = document.createRange();
            range.setStart(node, i); range.setEnd(node, i + 1);
            const y = Math.round(range.getBoundingClientRect().top - element.getBoundingClientRect().top);
            rows.set(y, (rows.get(y) || "") + node.textContent![i]);
          }
        }
        return [...rows.values()].map(line => line.trim()).filter(Boolean);
      };
      const phrases = [...document.querySelectorAll(".animated-intro-phrase")];
      return [...document.querySelectorAll(".animated-intro-peek-group")].flatMap((group, index) => [
        { actual: lines(group.querySelector(".animated-intro-trail > span")!), expected: lines(phrases[(index + 3) % 4]) },
        { actual: lines(group.querySelector(".animated-intro-upcoming > span")!), expected: lines(phrases[(index + 1) % 4]) },
      ]);
    });
    for (const comparison of comparisons) expect(comparison.actual).toEqual(comparison.expected);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
