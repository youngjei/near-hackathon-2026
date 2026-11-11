import { test, expect } from "@playwright/test";
import type { Checkout } from "../lib/client";

// Synthetic API projections only. These tests never allocate a provider quote or send funds.
function checkout(): Checkout {
  return {
    bill: { id: "bill-test", merchant: "Synthetic dinner", currency: "USD", originalTotal: "20", extra: "0", diners: 2, totalUnits: "20000000", fxRate: "1", fxDate: "2026-11-11", fxSource: "test", mode: "live", hasReceipt: false, createdAt: Date.now() },
    share: { id: "share-test", position: 1, amountUnits: "10000000", status: "unpaid" },
    attempts: [],
    live: { enabled: false, reason: "Live payments await funded verification.", methods: { zcash: false, confidential: false } },
  };
}
test("live gates keep payment requests and simulation separate", async ({ page }) => {
  const data = checkout();
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.goto("/pay?id=share-test");
  await expect(page.getByText("Live payments await funded verification.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get payment quote" })).toBeDisabled();
  await expect(page.getByText("Demo · No real payments")).toHaveCount(0);
  await expect(page.getByText("Simulate successful payment")).toHaveCount(0);
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await page.getByRole("radio", { name: /Confidential balance/ }).check();
  await expect(page.getByText(/Confidential USDC needs a verified wallet authorization flow/)).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Open Zcash wallet" })).toHaveAttribute("href", syntheticUri);
  await expect(page.getByRole("img", { name: "Zcash payment request with the exact amount" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy exact amount" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulate successful payment" })).toHaveCount(0);
  data.attempts[0].expiresAt = Date.now() - 1;
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("heading", { name: "This quote has expired" })).toBeVisible();
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
  await page.getByText("Payment request history (1)").click();
  await expect(page.getByText("Request 1 · Zcash · pending")).toBeVisible();
  data = { ...data, share: { ...data.share, status: "paid" }, attempts: [{ ...data.attempts[0], status: "paid" }] };
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("request creation keeps exact request fields and refresh errors preserve history", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false } };
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
  await page.getByLabel("Your Zcash refund address").fill("synthetic-refund-address");
  await page.getByRole("button", { name: "Get payment quote" }).click();
  await expect(page.getByRole("heading", { name: "Checking your payment request" })).toBeVisible();
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
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false } };
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
  await page.getByLabel("Your Zcash refund address").fill("synthetic-refund-address");
  await page.getByRole("button", { name: "Get payment quote" }).click();
  await expect(page.getByText("Request interrupted. Retry to check the same payment request.")).toBeVisible();
  await page.getByRole("button", { name: "Retry payment request" }).click();
  await expect(page.getByRole("heading", { name: "Checking your payment request" })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
  await expect(page.getByText("Payment request history (1)")).toBeVisible();
});

test("processing and incomplete payments never offer another send or quote", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: false } };
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
  await expect(page.getByText(/do not top up this request/)).toBeVisible();
  await expect(page.locator('a[href^="zcash:"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
});

test("confidential wallet connection and spending review require separate user actions", async ({ page }) => {
  const data = checkout();
  data.live = { enabled: true, reason: "", methods: { zcash: false, confidential: true } };
  const requests: string[] = [];
  await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
  await page.route("**/api/shares/share-test/prepare", (route) => { requests.push("prepare"); return route.fulfill({ status: 500, json: { error: "Unexpected automatic prepare" } }); });
  await page.route("**/api/shares/share-test/submit", (route) => { requests.push("submit"); return route.fulfill({ status: 500, json: { error: "Unexpected automatic submit" } }); });
  await page.goto("/pay?id=share-test");
  await page.getByRole("radio", { name: /Confidential balance/ }).check();
  await expect(page.getByRole("button", { name: "Connect NEAR wallet" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Get payment quote" })).toBeDisabled();
  await expect(page.getByText(/near.com-created passkey accounts cannot sign here/)).toBeVisible();
  await expect(page.getByText(/No balance is read or transferred on connection/)).toBeVisible();
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
    data.live = { enabled: true, reason: "", methods: { zcash: true, confidential: true } };
    data.share.status = status;
    data.attempts = [{ id: "closed-test", method: "confidential", mode: "live", status, createdAt: Date.now(), expiresAt: Date.now() + 60_000, payment: { state: status, amount: "10.000001", symbol: "USDC", statusMessage: "The prior request is closed." } }];
    await page.route("**/api/shares/share-test", (route) => route.fulfill({ json: data }));
    await page.goto("/pay?id=share-test");
    await expect(page.getByText("This request is closed. Ask the organizer to review the previous payment before arranging another request.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create a new quote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Get payment quote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Review USDC payment" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign and submit payment" })).toHaveCount(0);
    await expect(page.getByText("Payment request history (1)")).toBeVisible();
  });
}
