import { test, expect } from "@playwright/test";
import type { Checkout } from "../lib/client";

// Synthetic API projections only. These tests never allocate a provider quote or send funds.
function checkout(): Checkout {
  return {
    bill: { id: "bill-test", merchant: "Synthetic dinner", currency: "USD", originalTotal: "20", extra: "0", diners: 2, totalUnits: "20000000", fxRate: "1", fxDate: "2026-11-11", fxSource: "test", mode: "live", hasReceipt: false, createdAt: Date.now() },
    share: { id: "share-test", position: 1, amountUnits: "10000000", status: "unpaid" },
    attempts: [],
    live: { enabled: false, reason: "Live payments await funded verification.", methods: { zcash: false, confidential: false, solana: false } },
  };
}
test("live gates keep payment requests and simulation separate", async ({ page }) => {
  const data = checkout();
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.goto("/pay?id=share-test");
  await expect(page.getByText("Live payments await funded verification.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get payment quote" })).toBeDisabled();
  const refundExplanation = page.getByText("Copy a transparent receive address from your Zcash wallet, starting with t1 or t3. Confirm your wallet can receive at it. Unified and shielded addresses are not supported for refunds.", { exact: true });
  await expect(refundExplanation).toBeHidden();
  await page.getByText("Which address should I use?", { exact: true }).click();
  await expect(refundExplanation).toBeVisible();
  await expect(page.getByText("Demo · No real payments")).toHaveCount(0);
  await expect(page.getByText("Simulate successful payment")).toHaveCount(0);
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await page.getByRole("radio", { name: /NEAR Confidential balance/ }).check();
  await expect(page.getByText("Confidential USDC is not available yet.")).toBeVisible();
});

test("allocated instructions survive gate closure, expire, and retain late-payment history", async ({ page }) => {
  let data = checkout();
  data.share.status = "pending";
  const syntheticUri = "zcash:synthetic-test-address?amount=0.01234567";
  data.attempts = [{ id: "attempt-old", method: "zcash", mode: "live", status: "pending", createdAt: Date.now(), expiresAt: Date.now() + 60_000, payment: { state: "ready", amount: "0.01234567", symbol: "ZEC", address: "synthetic-test-address", uri: syntheticUri, statusMessage: "Awaiting payment." } }];
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.route("**/api/shares/share-test/refresh", (route) => route.fulfill({ json: data }));
  await page.goto("/pay?id=share-test");
  await expect(page.getByText("0.01234567", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scan in VIZOR or Zodl" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open .* wallet/ })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Zcash payment request with the exact amount" })).toBeVisible();
  await expect(page.getByLabel("Payment address", { exact: true })).toHaveValue("synthetic-test-address");
  await expect(page.getByRole("button", { name: "Copy address", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toBeVisible();
  await expect(page.getByText("On this phone? Open VIZOR or Zodl, choose Send, and paste the address and exact ZEC amount below.")).toBeVisible();
  const walletLink = page.getByRole("link", { name: "Try mobile wallet link", includeHidden: true });
  await expect(walletLink).toBeHidden();
  await page.getByText("Other ways to pay", { exact: true }).click();
  await expect(walletLink).toBeVisible();
  await expect(walletLink).toHaveAttribute("href", syntheticUri);
  await expect(page.getByText(/requires a compatible installed mobile wallet and Safari or Chrome/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulate successful payment" })).toHaveCount(0);
  data.attempts[0].expiresAt = Date.now() - 1;
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("heading", { name: "Quote expired" })).toBeVisible();
  await expect(page.getByRole("img", { name: /payment request with the exact amount/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy address", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toHaveCount(0);
  await expect(page.getByLabel("Payment address", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Other ways to pay", { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
  await page.getByText("Payment request history (1)").click();
  await expect(page.getByText("Request 1 · Zcash · pending")).toBeVisible();
  data = { ...data, share: { ...data.share, status: "paid" }, attempts: [{ ...data.attempts[0], status: "paid" }] };
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("heading", { name: "Payment complete" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const method of ["zcash", "solana"] as const) {
  test(`${method} funding controls follow readiness and expire on the device clock`, async ({ page }) => {
    await page.clock.install();
    const data = checkout();
    data.share.status = "pending";
    data.attempts = [{ id: "readiness-test", method, mode: "live", status: "pending", createdAt: Date.now(), expiresAt: Date.now() + 60_000, payment: { state: "unknown", amount: "0.01234567", symbol: method === "solana" ? "USDC" : "ZEC", address: "synthetic-address", uri: `${method}:synthetic-address?amount=0.01234567` } }];
    await page.route("**/api/shares/share-test", route => route.fulfill({ json: data }));
    await page.route("**/api/shares/share-test/refresh", route => route.fulfill({ json: data }));
    const qr = page.getByRole("img", { name: /payment request with the exact amount/ });
    const copyAddress = page.getByRole("button", { name: "Copy address", exact: true });
    const copyAmount = page.getByRole("button", { name: "Copy exact amount" });
    async function expectNoFunding() {
      await expect(qr).toHaveCount(0);
      await expect(copyAddress).toHaveCount(0);
      await expect(copyAmount).toHaveCount(0);
      await expect(page.getByLabel("Payment address", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Other ways to pay", { exact: true })).toHaveCount(0);
      await expect(page.locator(`a[href^="${method}:"]`)).toHaveCount(0);
    }
    await page.goto("/pay?id=share-test");
    await expect(page.getByRole("heading", { name: "Checking payment" })).toBeVisible();
    await expectNoFunding();
    data.attempts[0].payment!.state = "ready";
    await page.getByRole("button", { name: "Refresh payment status" }).click();
    await expect(qr).toBeVisible();
    await expect(copyAddress).toBeVisible();
    await expect(copyAmount).toBeVisible();
    for (const control of [qr, copyAddress, copyAmount]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.clock.fastForward(61_000);
    await expect(page.getByRole("heading", { name: "Quote expired" })).toBeVisible();
    await expectNoFunding();
    data.attempts[0].payment!.state = "processing";
    await page.getByRole("button", { name: "Refresh payment status" }).click();
    await expect(page.getByRole("heading", { name: "Checking payment" })).toBeVisible();
    await expectNoFunding();
  });
}

test("request creation keeps exact request fields and refresh errors preserve history", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false, solana: false } };
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  let submitted: Record<string, string> | undefined;
  await page.route("**/api/shares/share-test/attempts", async (route) => {
    submitted = route.request().postDataJSON();
    data.share.status = "pending";
    data.attempts = [{ id: "attempt-new", mode: "live", method: "zcash", status: "pending", expiresAt: Date.now() + 60_000, createdAt: Date.now(), payment: { state: "unknown", amount: "0.01", symbol: "ZEC", statusMessage: "Checking allocation." } }];
    await route.fulfill({ json: data });
  });
  await page.route("**/api/shares/share-test/refresh", (route) => route.fulfill({ status: 503, json: { error: "Provider unavailable. Try refreshing again." } }));
  await page.goto("/pay?id=share-test");
  await page.getByLabel("Refund address").fill("synthetic-refund-address");
  await page.getByRole("button", { name: "Get payment quote" }).click();
  await expect(page.getByRole("heading", { name: "Checking payment" })).toBeVisible();
  expect(submitted?.method).toBe("zcash");
  expect(submitted?.refundAddress).toBe("synthetic-refund-address");
  expect(submitted?.requestKey).toMatch(/^[a-f0-9-]{36}$/);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.locator(".live-payment").getByRole("alert")).toHaveText("Provider unavailable. Try refreshing again.");
  await expect(page.getByText("Payment request history (1)")).toBeVisible();
});

test("interrupted quote creation retries the same request rather than duplicating it", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false, solana: false } };
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  const keys: string[] = [];
  await page.route("**/api/shares/share-test/attempts", async (route) => {
    keys.push(route.request().postDataJSON().requestKey);
    if (keys.length === 1) return route.fulfill({ status: 503, json: { error: "Request interrupted. Retry to check the same payment request." } });
    data.share.status = "pending";
    data.attempts = [{ id: "same-attempt", mode: "live", method: "zcash", status: "pending", expiresAt: Date.now() + 60_000, createdAt: Date.now(), payment: { state: "unknown", amount: "", symbol: "ZEC", statusMessage: "Checking allocation." } }];
    await route.fulfill({ json: data });
  });
  await page.goto("/pay?id=share-test");
  await page.getByLabel("Refund address").fill("synthetic-refund-address");
  await page.getByRole("button", { name: "Get payment quote" }).click();
  await expect(page.getByText("Request interrupted. Retry to check the same payment request.")).toBeVisible();
  await page.getByRole("button", { name: "Retry payment request" }).click();
  await expect(page.getByRole("heading", { name: "Checking payment" })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
  await expect(page.getByText("Payment request history (1)")).toBeVisible();
});

test("processing and incomplete payments never offer another send or quote", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false, solana: false } };
  data.share.status = "pending";
  data.attempts = [{ id: "in-progress", mode: "live", method: "zcash", status: "pending", expiresAt: Date.now() + 60_000, createdAt: Date.now(), payment: { state: "processing", amount: "0.01", symbol: "ZEC", statusMessage: "A deposit is being processed.", uri: "zcash:synthetic-test-address?amount=0.01", address: "synthetic-test-address" } }];
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.route("**/api/shares/share-test/refresh", (route) => route.fulfill({ json: data }));
  await page.goto("/pay?id=share-test");
  await expect(page.getByRole("region", { name: "Current payment request" }).getByText("A deposit is being processed.")).toBeVisible();
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
  data.attempts[0].payment!.state = "incomplete";
  data.attempts[0].payment!.statusMessage = "The deposit is insufficient.";
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("region", { name: "Current payment request" }).getByText("The deposit is insufficient.")).toBeVisible();
  await expect(page.getByText(/do not top it up/)).toBeVisible();
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy address", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: /payment request with the exact amount/ })).toHaveCount(0);
  await expect(page.getByText("Other ways to pay", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
});

test("confidential wallet connection and spending review require separate user actions", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: false, confidential: true, solana: false } };
  const requests: string[] = [];
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.route("**/api/shares/share-test/prepare", (route) => { requests.push("prepare"); return route.fulfill({ status: 500, json: { error: "Unexpected automatic prepare" } }); });
  await page.route("**/api/shares/share-test/submit", (route) => { requests.push("submit"); return route.fulfill({ status: 500, json: { error: "Unexpected automatic submit" } }); });
  await page.goto("/pay?id=share-test");
  await page.getByRole("radio", { name: /NEAR Confidential balance/ }).check();
  await expect(page.getByRole("button", { name: "Connect NEAR wallet" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Get payment quote" })).toBeDisabled();
  await expect(page.getByText(/near.com passkey accounts are not supported/)).toBeVisible();
  await expect(page.getByText(/^Connected account:/)).toHaveCount(0);
  expect(requests).toEqual([]);
  // A server-provided ready quote still cannot sign itself, including on reload.
  data.share.status = "pending";
  data.attempts = [{ id: "confidential-test", method: "confidential", mode: "live", status: "pending", createdAt: Date.now(), expiresAt: Date.now() + 60_000, payment: { state: "ready", amount: "10.000001", symbol: "USDC", statusMessage: "Review this payment in your wallet." } }];
  await page.reload();
  await expect(page.getByRole("button", { name: "Connect NEAR wallet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review USDC payment" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign and submit payment" })).toHaveCount(0);
  expect(requests).toEqual([]);
});

for (const status of ["failed", "refunded"] as const) {
  test(`closed ${status} live request cannot create another quote or sign again`, async ({ page }) => {
    const data = checkout();
    data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: true, solana: false } };
    data.share.status = status;
    data.attempts = [{ id: "closed-test", method: "confidential", mode: "live", status, createdAt: Date.now(), expiresAt: Date.now() + 60_000, payment: { state: status, amount: "10.000001", symbol: "USDC", statusMessage: "The prior request is closed." } }];
    await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
    await page.goto("/pay?id=share-test");
    await expect(page.getByText("Ask the organizer to review this payment before paying again.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Get payment quote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Review USDC payment" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign and submit payment" })).toHaveCount(0);
    await expect(page.getByText("Payment request history (1)")).toBeVisible();
  });
}


test("Solana quote uses the gated method and exposes a Solana Pay request", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: false, confidential: false, solana: true } };
  const uri = "solana:synthetic-address?amount=10.000001&spl-token=synthetic-token";
  let submitted: Record<string, string> | undefined;
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.route("**/api/shares/share-test/attempts", async (route) => {
    submitted = route.request().postDataJSON();
    data.share.status = "pending";
    data.attempts = [{ id: "solana-test", mode: "live", method: "solana", status: "pending", expiresAt: Date.now() + 60_000, createdAt: Date.now(), payment: { state: "ready", amount: "10.000001", symbol: "USDC", address: "synthetic-address", uri } }];
    await route.fulfill({ json: data });
  });
  await page.goto("/pay?id=share-test");
  await page.getByRole("radio", { name: /Solana wallet/ }).check();
  await expect(page.getByText(/Standard transfers reveal your wallet and amount/)).toBeVisible();
  await page.getByLabel("Refund address").fill("synthetic-refund");
  await page.getByRole("button", { name: "Get payment quote" }).click();
  expect(submitted?.method).toBe("solana");
  expect(submitted?.refundAddress).toBe("synthetic-refund");
  await expect(page.getByRole("heading", { name: "Scan in your Solana wallet" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open .* wallet/ })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Solana payment request with the exact amount" })).toBeVisible();
  await expect(page.getByLabel("Payment address", { exact: true })).toHaveValue("synthetic-address");
  await expect(page.getByRole("button", { name: "Copy address", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toBeVisible();
  await expect(page.getByText("On this phone? Open your Solana wallet, choose Send, select USDC on Solana, and paste the address and exact amount below.")).toBeVisible();
  await expect(page.getByText(/On another device, scan this QR/)).toBeVisible();
  await expect(page.getByText("Other ways to pay", { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="solana:"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("owner live testing labels checkout and organizer as real funds", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, testing: true, reason: "Wallet, refund and settlement acceptance is incomplete.", methods: {zcash: true, solana: true, confidential: false} };
  await page.route("**/api/shares/share-test", route => route.fulfill({json: data}));
  await page.goto("/pay?id=share-test");
  await expect(page.getByText("Live testing · Real funds", {exact: true})).toBeVisible();
  await expect(page.getByText("Wallet, refund and settlement acceptance is incomplete.", {exact: true})).toBeVisible();
  await expect(page.getByText("Demo · No real payments", {exact: true})).toHaveCount(0);
  await page.route("**/api/bills/bill-test", route => route.fulfill({json: {...data, shares: [], receivingAddress: null}}));
  await page.goto("/bill?id=bill-test");
  await expect(page.getByText("Live testing · Real funds", {exact: true})).toBeVisible();
});

test("sample stays visibly demo during owner live testing", async ({ page }) => {
  await page.route("**/api/config", route => route.fulfill({json: {live: {enabled: true, testing: true}}}));
  await page.goto("/");
  await expect(page.getByText("Live testing · Real funds", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: "Try a sample bill"}).click();
  await expect(page.getByText("Demo · No real payments", {exact: true})).toBeVisible();
  await expect(page.getByText("Live testing · Real funds", {exact: true})).toHaveCount(0);
});
