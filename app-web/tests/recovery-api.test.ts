import { expect, test, vi } from "vitest";
import { createHandler } from "../lib/server/api";
import { hash } from "../lib/server/security";
import type { Bill, Share, Store } from "../lib/server/store";

test("only an authorized organizer receives a recoverable owner capability, never a diner", async () => {
  const owner = "ab".repeat(32), payer = "cd".repeat(32);
  const id = "11111111-1111-4111-8111-111111111111";
  const sid = "22222222-2222-4222-8222-222222222222";
  const bill: Bill = { id, owner_hash: await hash(owner), create_key: crypto.randomUUID(), merchant: "Synthetic dinner",
    currency: "USD", original_total: "10", extra: "0", diners: 2, total_units: "10000000", fx_rate: "1",
    fx_date: "2026-11-11", fx_source: "Reference", mode: "demo", receipt_id: null,
    recipient_account: "receiver.near", created_at: Date.now() };
  const share: Share = { id: sid, bill_id: id, position: 1, amount_units: "5000000", token_hash: await hash(payer) };
  const store = { kind: "d1", bill: vi.fn(async () => bill), share: vi.fn(async () => share),
    shares: vi.fn(async () => [share]), attempts: vi.fn(async () => []) } as unknown as Store;
  const handle = createHandler(store);
  const origin = "https://split.test";
  const get = (path: string, cookie?: string) => handle(new Request(`${origin}/api/${path}`, { headers: cookie ? { Cookie: cookie } : {} }));
  expect((await get(`bills/${id}`)).status).toBe(404);
  expect((await get(`bills/${id}`, `sdb_s_${sid}=${payer}`)).status).toBe(404);
  expect((await get(`bills/${id}`, `sdb_b_${id}=${payer}`)).status).toBe(404);
  const dashboard = await get(`bills/${id}`, `sdb_b_${id}=${owner}`);
  expect(dashboard.status).toBe(200);
  expect(dashboard.headers.get("cache-control")).toBe("no-store");
  const data = await dashboard.json() as { organizerToken?: string };
  expect(data.organizerToken).toBe(owner);
  const checkout = await get(`shares/${sid}`, `sdb_s_${sid}=${payer}`);
  expect(checkout.status).toBe(200);
  expect(await checkout.json()).not.toHaveProperty("organizerToken");
  const access = await handle(new Request(`${origin}/api/bills/${id}/access`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ token: owner }),
  }));
  expect(access.status).toBe(200);
  expect(access.headers.get("set-cookie")?.includes(`sdb_b_${id}=`)).toBe(true);
});
