import { test, expect, type Page } from "@playwright/test";
const origin = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";
const storageKey = "splitdbill.organizer-bills.v1";
async function create(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample bill" }).click();
  await page.getByLabel("Your near.com receiving address", { exact: true }).fill("nearcom:0x" + "a1".repeat(20));
  await page.getByRole("button", { name: "Review split" }).click();
  await page.getByRole("button", { name: "Create 3 demo requests" }).click();
  await expect(page.getByRole("heading", { name: "Dinner in Dubai" })).toBeVisible();
  return new URL(page.url()).searchParams.get("id")!;
}

test("created bills return after closing a tab and expired cookies, with current server progress", async ({ page, context }) => {
  const id = await create(page);
  expect(await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    return saved.bills.length === 1 && saved.bills[0].title === "Dinner in Dubai" &&
      Object.keys(saved.bills[0]).sort().join(",") === "id,savedAt,title,token";
  }, storageKey)).toBe(true);
  const dashboard = await (await page.request.get(`/api/bills/${id}`)).json();
  const share = dashboard.shares[0];
  await page.request.post(`/api/shares/${share.id}/access`, { data: { token: share.token }, headers: { Origin: origin } });
  const payment = await (await page.request.post(`/api/shares/${share.id}/attempts`, {
    data: { method: "zcash", requestKey: crypto.randomUUID() }, headers: { Origin: origin },
  })).json();
  await page.request.post(`/api/shares/${share.id}/simulate`, {
    data: { attemptId: payment.attempts[0].id, status: "paid" }, headers: { Origin: origin },
  });
  await context.clearCookies();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/bills");
  await expect(reopened.getByRole("heading", { name: "Your bills" })).toBeVisible();
  await expect(reopened.getByText("1 of 3 paid in demo", { exact: false })).toBeVisible();
  await reopened.getByRole("link", { name: "Open bill", exact: false }).click();
  await expect(reopened.getByRole("heading", { name: "Dinner in Dubai" })).toBeVisible();
  await expect(reopened.getByText("1 of 3 paid", { exact: true })).toBeVisible();
  expect(new URL(reopened.url()).hash === "").toBe(true);
});

test("private organizer link recovers on a fresh device while payer and unrelated browser stay isolated", async ({ page, browser }) => {
  const id = await create(page);
  await page.getByText("Keep your organizer link", { exact: true }).click();
  const recovery = await page.getByLabel("Private organizer link", { exact: true }).inputValue();
  expect(Boolean(new URL(recovery).hash)).toBe(true);
  const fresh = await browser.newContext({ baseURL: origin });
  const recovered = await fresh.newPage();
  await recovered.goto(recovery);
  await expect(recovered.getByRole("heading", { name: "Dinner in Dubai" })).toBeVisible();
  expect(new URL(recovered.url()).hash === "").toBe(true);
  await fresh.clearCookies();
  await recovered.goto("/bills");
  await expect(recovered.getByRole("heading", { name: "Dinner in Dubai" })).toBeVisible();
  const unrelated = await browser.newContext({ baseURL: origin });
  const outsider = await unrelated.newPage();
  await outsider.goto(`/bill?id=${id}`);
  await expect(outsider.getByRole("alert")).toBeVisible();
  expect(await outsider.getByRole("heading", { name: "Dinner in Dubai" }).count()).toBe(0);
  const owner = await (await page.request.get(`/api/bills/${id}`)).json();
  const share = owner.shares[0];
  await outsider.goto(`${origin}/pay?id=${share.id}#${share.token}`);
  await expect(outsider.getByRole("heading", { name: "Your share" })).toBeVisible();
  expect(await outsider.evaluate(key => localStorage.getItem(key) === null, storageKey)).toBe(true);
  const payerData = await (await outsider.request.get(`/api/shares/${share.id}`)).json();
  expect(Object.hasOwn(payerData, "organizerToken")).toBe(false);
  await outsider.goto("/bills");
  await expect(outsider.getByText("No bills saved here yet.", { exact: false })).toBeVisible();
  await fresh.close();
  await unrelated.close();
});

test("blocked storage preserves manual recovery and malformed storage stays harmless", async ({ browser }) => {
  const blocked = await browser.newContext({ baseURL: origin });
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked storage"); } }));
  const page = await blocked.newPage();
  await create(page);
  await expect(page.getByText("This browser cannot save this bill.", { exact: false })).toBeVisible();
  expect(Boolean(new URL(page.url()).hash)).toBe(true);
  const recovery = await page.getByLabel("Private organizer link", { exact: true }).inputValue();
  const fresh = await browser.newContext({ baseURL: origin });
  const next = await fresh.newPage();
  await next.goto(recovery);
  await expect(next.getByRole("heading", { name: "Dinner in Dubai" })).toBeVisible();
  await next.goto("/bills");
  await next.evaluate(key => localStorage.setItem(key, '{"version":1,"bills":[{"id":"unsafe","token":"bad"}]}'), storageKey);
  await next.reload();
  await expect(next.getByText("No bills saved here yet.", { exact: false })).toBeVisible();
  await blocked.close();
  await fresh.close();
});

test("invalid organizer fragment stays retryable and stale saved entries cannot authorize", async ({ page }) => {
  const id = crypto.randomUUID();
  const invalid = "00".repeat(32);
  await page.goto(`/bill?id=${id}#${invalid}`);
  await expect(page.getByRole("alert")).toBeVisible();
  expect(Boolean(new URL(page.url()).hash)).toBe(true);
  expect(await page.evaluate(key => localStorage.getItem(key) === null, storageKey)).toBe(true);
  await page.evaluate(({ key, id, token }) => localStorage.setItem(key, JSON.stringify({ version: 1,
    bills: [{ id, token, title: "Unavailable dinner", savedAt: Date.now() }] })), { key: storageKey, id, token: invalid });
  await page.goto("/bills");
  await expect(page.getByText("Status unavailable.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Remove Unavailable dinner from list" }).click();
  await expect(page.getByText("No bills saved here yet.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText("No bills saved here yet.", { exact: false })).toBeVisible();
});
