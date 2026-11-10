import { test, expect } from "@playwright/test";
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5173";
test("create, privately share, pay and reconcile a demo dinner", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(page.getByText("Demo · No real payments")).toBeVisible();
  await page.getByRole("button", { name: "Try a sample bill" }).click();
  await expect(page.getByLabel("Receipt total", { exact: true })).toHaveValue(
    "200.00",
  );
  await page.getByLabel("Your near.com receiving address", {exact:true}).fill("nearcom:0x" + "a1".repeat(20));
  await page.getByRole("button", { name: "Review split" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s the split." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create 3 demo requests" }).click();
  await expect(
    page.getByRole("heading", { name: "Your bill, shared." }),
  ).toBeVisible();
  expect(page.url()).not.toContain("#");
  await expect(page.getByText("0 of 3 paid")).toBeVisible();
  await page
    .getByRole("button", { name: "Share link", exact: true })
    .first()
    .click();
  const payUrl = await page
    .getByRole("link", { name: "Open checkout" })
    .getAttribute("href");
  expect(payUrl).toContain("#");
  const diner = await browser.newContext({
    viewport: page.viewportSize() || { width: 1280, height: 720 },
  });
  const checkout = await diner.newPage();
  await checkout.goto(payUrl!);
  await expect(
    checkout.getByRole("heading", { name: "Your share." }),
  ).toBeVisible();
  expect(checkout.url()).not.toContain("#");
  const billId = new URL(page.url()).searchParams.get("id");
  expect(
    (await diner.request.get(`${base}/api/bills/${billId}`)).status(),
  ).toBe(404);
  const shareId = new URL(checkout.url()).searchParams.get("id");
  const guest = await browser.newContext();
  expect(
    (await guest.request.get(`${base}/api/shares/${shareId}`)).status(),
  ).toBe(404);
  await checkout.getByRole("button", { name: "Try Zcash demo" }).click();
  await expect(
    checkout.getByRole("heading", { name: "Waiting for payment" }),
  ).toBeVisible();
  expect(await checkout.locator('a[href^="zcash:"]').count()).toBe(0);
  await checkout
    .getByRole("button", { name: "Simulate successful payment" })
    .click();
  await expect(
    checkout.getByRole("heading", { name: "Paid in demo" }),
  ).toBeVisible();
  await expect(page.getByText("1 of 3 paid")).toBeVisible({ timeout: 12000 });
  await checkout.reload();
  await expect(
    checkout.getByRole("heading", { name: "Paid in demo" }),
  ).toBeVisible();
  await checkout.getByText("Test another outcome", { exact: true }).click();
  await checkout.getByRole("button", { name: "Refund", exact: true }).click();
  await expect(
    checkout.getByText(
      "The demo payment was refunded. No real funds were moved.",
    ),
  ).toBeVisible();
  await expect(page.getByText("0 of 3 paid")).toBeVisible({ timeout: 12000 });
  await page.screenshot({
    path: `../outputs/organizer-${test.info().project.name}.png`,
    fullPage: true,
  });
  await checkout.screenshot({
    path: `../outputs/checkout-${test.info().project.name}.png`,
    fullPage: true,
  });
  await diner.close();
  await guest.close();
});
test("manual correction, stale attempts, concurrency and isolation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page.getByLabel("Bill name").fill("Late-night noodles");
  await page.getByLabel("Receipt total", { exact: true }).fill("10");
  await page.getByLabel("Currency").selectOption("USD");
  await page.getByLabel("Your near.com receiving address", {exact:true}).fill("nearcom:0x" + "a1".repeat(20));
  await page.getByRole("button", { name: "Review split" }).click();
  await page.getByRole("button", { name: "Create 3 demo requests" }).click();
  await expect(page.getByText("0 of 3 paid")).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id");
  const d = await (await page.request.get(`/api/bills/${id}`)).json();
  const sid = d.shares[0].id;
  await page.request.post(`/api/shares/${sid}/access`, {
    data: { token: d.shares[0].token },
    headers: { Origin: base },
  });
  const key = crypto.randomUUID();
  const [a, b] = await Promise.all(
    [1, 2].map(() =>
      page.request.post(`/api/shares/${sid}/attempts`, {
        data: { method: "confidential", requestKey: key },
        headers: { Origin: base },
      }),
    ),
  );
  expect(a.ok()).toBeTruthy();
  expect(b.ok()).toBeTruthy();
  let c = await (await page.request.get(`/api/shares/${sid}`)).json();
  expect(c.attempts).toHaveLength(1);
  expect(c.attempts[0].status).toBe("pending");
  const first = c.attempts[0].id;
  await page.request.post(`/api/shares/${sid}/simulate`, {
    data: { attemptId: first, status: "expired" },
    headers: { Origin: base },
  });
  await page.request.post(`/api/shares/${sid}/attempts`, {
    data: { method: "zcash", requestKey: crypto.randomUUID() },
    headers: { Origin: base },
  });
  await page.request.post(`/api/shares/${sid}/simulate`, {
    data: { attemptId: first, status: "paid" },
    headers: { Origin: base },
  });
  await page.request.post(`/api/shares/${sid}/simulate`, {
    data: { attemptId: first, status: "paid" },
    headers: { Origin: base },
  });
  c = await (await page.request.get(`/api/shares/${sid}`)).json();
  expect(c.share.status).toBe("paid");
  expect(c.attempts).toHaveLength(2);
  expect(JSON.stringify(c)).not.toMatch(
    /token_hash|owner_hash|depositAddress|refundTo|recipient_account|receivingAddress|a1a1a1a1/,
  );
  const forbidden = await page.request.post(
    `/api/shares/${d.shares[1].id}/access`,
    { data: { token: d.shares[0].token }, headers: { Origin: base } },
  );
  expect(forbidden.status()).toBe(404);
  expect(
    (
      await page.request.post(`/api/shares/${sid}/attempts`, {
        data: { method: "zcash", requestKey: crypto.randomUUID() },
        headers: { Origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  await page.reload();
  await expect(page.getByText("1 of 3 paid")).toBeVisible();
});

test("receipt fallback stays editable, rejects unsafe uploads, and keeps images private", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(
    page.getByLabel("Upload receipt", { exact: true }),
  ).toBeEnabled();
  const image = await page.screenshot();
  await page
    .getByLabel("Upload receipt", { exact: true })
    .setInputFiles({
      name: "synthetic-receipt.png",
      mimeType: "image/png",
      buffer: image,
    });
  await expect(
    page.getByText(
      "Receipt saved. Automatic reading is not connected in this demo. Please enter the total and currency.",
    ),
  ).toBeVisible();
  await page.getByLabel("Bill name").fill("Photo receipt test");
  await page.getByLabel("Receipt total", { exact: true }).fill("99.99");
  await page.getByLabel("Currency").selectOption("USD");
  await page.getByLabel("Your near.com receiving address", {exact:true}).fill("nearcom:0x" + "a1".repeat(20));
  await page.getByRole("button", { name: "Review split" }).click();
  await page.getByRole("button", { name: "Create 3 demo requests" }).click();
  await expect(page.getByText("0 of 3 paid")).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id");
  const receipt = await page.request.get(`/api/bills/${id}/receipt`);
  expect(receipt.status()).toBe(200);
  expect(receipt.headers()["content-type"]).toBe("image/png");
  expect(receipt.headers()["cache-control"]).toBe("no-store");
  const outsider = await browser.newContext();
  expect(
    (await outsider.request.get(`${base}/api/bills/${id}/receipt`)).status(),
  ).toBe(404);
  await outsider.close();
  const bad = await page.request.post("/api/receipts", {
    data: '<svg onload="alert(1)"></svg>',
    headers: { Origin: base, "Content-Type": "image/png" },
  });
  expect(bad.status()).toBe(415);
});

test("small screens, large amounts, keyboard focus and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "split/d/bill home" }),
  ).toBeFocused();
  await page.screenshot({
    path: `../outputs/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Enter details manually" }).click();
  await page
    .getByLabel("Bill name")
    .fill("A long dinner name that still needs to fit on a small screen");
  await page.getByLabel("Receipt total", { exact: true }).fill("99999999.99");
  await page.getByLabel("Currency").selectOption("USD");
  await page.getByLabel("Your near.com receiving address", {exact:true}).fill("nearcom:0x" + "a1".repeat(20));
  await page.getByRole("button", { name: "Review split" }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s the split." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(
    await page
      .locator(".flow")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("receiving-address help, validation, confirmation and saved organizer-only address", async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'Try a sample bill'}).click();
 const input=page.getByLabel('Your near.com receiving address',{exact:true});
 await expect(input).toHaveAttribute('placeholder','nearcom:0x…');
 await page.getByRole('button',{name:'Where do I find this?'}).click();
 const help=page.getByRole('dialog',{name:'Find your near.com address'});
 await expect(help).toBeVisible();
 await expect(help.getByRole('link',{name:'Open near.com'})).toHaveAttribute('href','https://near.com');
 await expect(help.getByRole('button',{name:'Close address help'})).toBeFocused();
 await page.screenshot({path:`../outputs/receiving-help-${test.info().project.name}.png`,animations:'disabled'});
 const box=await help.boundingBox();
 expect(box!.x).toBeGreaterThan(0);
 expect(box!.x+box!.width).toBeLessThan(page.viewportSize()!.width);
 expect(box!.y).toBeGreaterThanOrEqual(0);
 expect(box!.y+box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
 await page.keyboard.press('Escape');
 await expect(help).not.toBeVisible();
 await expect(page.getByRole('button',{name:'Where do I find this?'})).toBeFocused();
 await page.getByRole('button',{name:'Review split'}).click();
 await expect(page.getByText('Paste your near.com internal address.',{exact:true})).toBeVisible();
 await expect(input).toBeFocused();
 await input.fill('0x'+'AB'.repeat(20));
 await page.getByRole('button',{name:'Review split'}).click();
 await expect(page.getByText('Copy the internal address from near.com. It starts with nearcom:.')).toBeVisible();
 await input.fill('NEARCOM:0x'+'AB'.repeat(20));
 await page.getByRole('button',{name:'Review split'}).click();
 const normalized='nearcom:0x'+'ab'.repeat(20);
 await expect(page.getByLabel('Receiving address').getByText(normalized,{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit bill'}).click();
 await expect(input).toHaveValue(normalized);
 await input.scrollIntoViewIfNeeded();
 await page.screenshot({path:`../outputs/receiving-field-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Review split'}).click();
 await page.getByRole('button',{name:'Create 3 demo requests'}).click();
 await expect(page.getByRole('heading',{name:'Your bill, shared.'})).toBeVisible();
 await page.reload();
 await expect(page.getByLabel('Receiving address').getByText(normalized,{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
