import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { createHandler } from "../lib/server/api";
import { supabaseStore } from "../lib/server/supabase-store";
import type { Dashboard, Checkout } from "../lib/client";

const pg = new PGlite();
const origin = "https://split.test";
let handle: ReturnType<typeof createHandler>;
let session: string;
const migrations = [
  "202611100001_beta.sql",
  "202611100002_application_modes.sql",
  "202611100003_server_adapter.sql",
  "202611100004_receiving_account.sql",
];
beforeAll(async () => {
  await pg.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema storage; create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  for (const migration of migrations)
    await pg.exec(
      await readFile(
        new URL(`../supabase/migrations/${migration}`, import.meta.url),
        "utf8",
      ),
    );
  // Exercise real Postgres functions and the actual Supabase HTTP adapter together.
  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      const name = new URL(request.url).pathname.split("/").pop()!;
      const args = (await request.json()) as Record<string, unknown>;
      if (!/^sdb_[a-z_]+$/.test(name))
        throw new Error("Unexpected test request");
      try {
        const keys = Object.keys(args);
        const { rows } = await pg.query<{ value: unknown }>(
          `select public.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(",")}) as value`,
          Object.values(args),
        );
        return Response.json(rows[0].value);
      } catch (e) {
        return Response.json(
          {
            code: (e as { code: string }).code,
            message: "Database operation failed",
          },
          { status: 400 },
        );
      }
    },
  );
  handle = createHandler(
    supabaseStore("https://database.test", "test-server-key"),
    "test-cron",
  );
  const r = await call("/session", "POST");
  session = r.headers.get("set-cookie")!.split(";")[0];
}, 30000);
afterAll(async () => {
  vi.unstubAllGlobals();
  await pg.close();
});
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie = session,
) {
  return handle(
    new Request(`${origin}/api${path}`, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
}
const input = () => ({
  merchant: "Integration dinner",
  receivingAddress: "nearcom:0x" + "a1".repeat(20),
  currency: "USD",
  total: "30.01",
  extra: "0",
  diners: 3,
  requestKey: crypto.randomUUID(),
  approvedRate: "1",
  approvedDate: new Date().toISOString().slice(0, 10),
});
async function dinner() {
  const body = input();
  const response = await call("/bills", "POST", body);
  expect(response.status).toBe(201);
  const data = (await response.json()) as Dashboard;
  return {
    body,
    data,
    cookie: response.headers.get("set-cookie")!.split(";")[0],
  };
}
test("Supabase saves an entire bill, normalizes money/timestamps, and preserves private access", async () => {
  const { body, data, cookie } = await dinner();
  expect(data.shares).toHaveLength(2);
  expect(data.receivingAddress).toBe(body.receivingAddress);
  expect(data.bill.totalUnits).toBe("30010000");
  expect(typeof data.bill.createdAt).toBe("number");
  expect((await call(`/bills/${data.bill.id}`)).status).toBe(404);
  expect(
    (await call(`/bills/${data.bill.id}`, "GET", undefined, cookie)).status,
  ).toBe(200);
  const repeat = await call("/bills", "POST", body);
  expect(((await repeat.json()) as Dashboard).bill.id).toBe(data.bill.id);
  const s = data.shares[0];
  const access = await call(`/shares/${s.id}/access`, "POST", {
    token: s.token,
  });
  const dinerCookie = access.headers.get("set-cookie")!.split(";")[0];
  const checkout = (await (
    await call(`/shares/${s.id}`, "GET", undefined, dinerCookie)
  ).json()) as Checkout;
  expect(checkout.share.amountUnits).toBe("10000000");
  expect(JSON.stringify(checkout)).not.toMatch(
    /owner_hash|token_hash|organizerToken|receivingAddress|recipient_account|nearcom:|a1a1a1a1/,
  );
  expect(
    (await call(`/bills/${data.bill.id}`, "GET", undefined, dinerCookie))
      .status,
  ).toBe(404);
});
test("transaction rolls back a bill when any share fails and a duplicate create returns original", async () => {
  const { data } = await dinner();
  const store = supabaseStore("https://database.test", "test-server-key");
  const b = (await store.bill(data.bill.id))!;
  const s = await store.shares(b.id);
  const fresh = {
    ...b,
    id: crypto.randomUUID(),
    create_key: crypto.randomUUID(),
  };
  await expect(
    store.createBill(
      fresh,
      s.map((x) => ({ ...x, bill_id: fresh.id })),
    ),
  ).rejects.toThrow(); // duplicate share IDs
  expect(await store.bill(fresh.id)).toBeNull();
  const repeated = await store.createBill({ ...b, id: crypto.randomUUID() }, s);
  expect(repeated.id).toBe(b.id);
});
test("duplicate attempts and late settlement remain idempotent; simulation cannot affect live bills", async () => {
  const { data } = await dinner();
  const s = data.shares[0];
  const access = await call(`/shares/${s.id}/access`, "POST", {
    token: s.token,
  });
  const cookie = access.headers.get("set-cookie")!.split(";")[0];
  const body = { method: "zcash", requestKey: crypto.randomUUID() };
  const responses = await Promise.all([
    call(`/shares/${s.id}/attempts`, "POST", body, cookie),
    call(`/shares/${s.id}/attempts`, "POST", body, cookie),
  ]);
  expect(responses.every((r) => r.ok)).toBe(true);
  let checkout = (await (
    await call(`/shares/${s.id}`, "GET", undefined, cookie)
  ).json()) as Checkout;
  expect(checkout.attempts).toHaveLength(1);
  const first = checkout.attempts[0].id;
  await call(
    `/shares/${s.id}/attempts`,
    "POST",
    { ...body, requestKey: crypto.randomUUID() },
    cookie,
  );
  expect(
    (
      await call(
        `/shares/${s.id}/simulate`,
        "POST",
        { attemptId: first, status: "paid" },
        cookie,
      )
    ).ok,
  ).toBe(true);
  expect(
    (
      await call(
        `/shares/${s.id}/simulate`,
        "POST",
        { attemptId: first, status: "paid" },
        cookie,
      )
    ).ok,
  ).toBe(true);
  checkout = (await (
    await call(`/shares/${s.id}`, "GET", undefined, cookie)
  ).json()) as Checkout;
  expect(checkout.share.status).toBe("paid");
  expect(checkout.attempts).toHaveLength(2);
  expect(
    (
      await call(
        `/shares/${s.id}/attempts`,
        "POST",
        { ...body, requestKey: crypto.randomUUID() },
        cookie,
      )
    ).status,
  ).toBe(409);
  await pg.query("update public.bills set mode='live' where id=$1", [
    data.bill.id,
  ]);
  expect(
    (
      await call(
        `/shares/${s.id}/simulate`,
        "POST",
        { attemptId: first, status: "refunded" },
        cookie,
      )
    ).status,
  ).toBe(403);
  await expect(
    pg.query("select public.sdb_update_demo_attempt($1,$2,'paid','refunded')", [
      first,
      s.id,
    ]),
  ).rejects.toThrow();
});
test("browser roles cannot execute server functions or read tables; server role can", async () => {
  const { rows } = await pg.query<{
    browser: boolean;
    server: boolean;
    tables: boolean;
  }>(`select
    has_function_privilege('anon','public.sdb_read(text,text,text)','execute') or has_function_privilege('authenticated','public.sdb_create_bill(jsonb,jsonb)','execute') as browser,
    has_function_privilege('service_role','public.sdb_read(text,text,text)','execute') as server,
    has_table_privilege('anon','public.bills','select') or has_table_privilege('authenticated','public.shares','select') as tables`);
  expect(rows[0]).toEqual({ browser: false, server: true, tables: false });
  await pg.exec("set role service_role");
  expect(
    await pg.query("select public.sdb_read('shares',gen_random_uuid()::text)"),
  ).toBeTruthy();
  await pg.exec("reset role");
});
test("rate limits increment atomically and monetary JSON preserves bigint precision", async () => {
  const store = supabaseStore("https://database.test", "test-server-key");
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      store.incrementLimit("test-limit", Date.now() + 10000),
    ),
  );
  expect(results.sort()).toEqual([1, 2, 3, 4, 5]);
  const { data } = await dinner();
  await pg.query(
    "update public.bills set total_units=9007199254740993 where id=$1",
    [data.bill.id],
  );
  expect((await store.bill(data.bill.id))!.total_units).toBe(
    "9007199254740993",
  );
});

test("recipient is normalized, persisted, immutable and cannot be changed by a repeated request", async () => {
 const {data,body}=await dinner();
 const different='nearcom:0x'+'b2'.repeat(20);
 const replay=await call('/bills','POST',{...body,receivingAddress:different});
 expect(replay.status).toBe(409);
 const store=supabaseStore('https://database.test','test-server-key');
 const saved=(await store.bill(data.bill.id))!;
 expect(saved.recipient_account).toBe(body.receivingAddress.slice(8));
 await expect(pg.query('update public.bills set recipient_account=$1 where id=$2',[different.slice(8),saved.id])).rejects.toThrow('fixed for this bill');
 await expect(store.createBill({...saved,recipient_account:different.slice(8)},await store.shares(saved.id))).rejects.toThrow();
 expect((await store.bill(saved.id))?.recipient_account).toBe(saved.recipient_account);
});
test("bare blockchain and malformed receiving addresses are rejected by the API", async () => {
 for(const receivingAddress of ['', '0x'+'a1'.repeat(20), 'nearcom:0x123', 'nearcom:solana:abc']) {
  expect((await call('/bills','POST',{...input(),receivingAddress})).status).toBe(400);
 }
});
