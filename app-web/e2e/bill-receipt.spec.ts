import { test, expect } from "@playwright/test";
import type { Dashboard } from "../lib/client";

const dinner = (): Dashboard => ({
  bill: { id: "receipt-test", merchant: "Dinner in Dubai", currency: "AED", originalTotal: "200.00", extra: "20.00", diners: 4, totalUnits: "59910000", fxRate: "0.2723", fxDate: "2026-11-12", fxSource: "Fixture rate", mode: "demo", hasReceipt: false, createdAt: Date.UTC(2026, 10, 12, 10) },
  receivingAddress: null,
  shares: [1, 2, 3].map(position => ({ id: `friend-${position}`, position, amountUnits: position === 3 ? "14970000" : "14980000", status: "unpaid" })),
});

test("digital receipt shows stored amounts and follows repayment updates", async ({ page }) => {
  const data = dinner();
  await page.route("**/api/bills/receipt-test", route => route.fulfill({ json: data }));
  await page.goto("/bill?id=receipt-test");
  const receipt = page.getByRole("article", { name: "Bill receipt" });
  await expect(receipt).toBeVisible();
  await expect(receipt.getByText("200.00 AED")).toBeVisible();
  await expect(receipt.getByText("20.00 AED")).toBeVisible();
  await expect(receipt.getByText("59.91 USDC")).toBeVisible();
  await expect(receipt.getByText("44.93 USDC", { exact: true })).toBeVisible();
  await expect(receipt.getByText("14.98 USDC", { exact: true })).toBeVisible();
  await expect(receipt.getByText("Received in demo")).toBeVisible();
  await expect(receipt.getByText("1 AED = 0.2723 USD")).toBeVisible();
  await expect(page.locator('summary').filter({ hasText: "Bill details" })).toHaveCount(0);
  data.shares[0].status = "paid";
  await expect(receipt.locator('.receipt-received')).toHaveText("14.98USDC", { timeout: 12000 });
  await expect(receipt.getByText("29.95 USDC left")).toBeVisible();
  await expect(receipt.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  for (const width of [1280, 960, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `../outputs/bill-receipt-${width}.png`, fullPage: true });
  }
  data.shares[0].status = "refunded";
  await expect(receipt.getByText("44.93 USDC left")).toBeVisible({ timeout: 12000 });
});

test("receipt handles large totals and live status without demo wording", async ({ page }) => {
  const data = dinner();
  data.bill = { ...data.bill, merchant: "A long dinner title with friends visiting from several different countries", originalTotal: "99999999.99", extra: "0", totalUnits: "27229999997200", mode: "live", hasReceipt: false };
  data.shares = data.shares.map(s => ({ ...s, amountUnits: "6807499990000", status: "paid" }));
  await page.route("**/api/bills/receipt-test", route => route.fulfill({ json: data }));
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/bill?id=receipt-test");
  const receipt = page.getByRole("article", { name: "Bill receipt" });
  await expect(receipt.getByText("Everyone has paid", { exact: true })).toBeVisible();
  await expect(receipt.getByText(/demo/i)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `../outputs/bill-receipt-large.png`, fullPage: true });
});
