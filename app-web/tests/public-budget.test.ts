import { expect, test, vi } from "vitest";
import { createHandler, PUBLIC_HOURLY_BUDGETS } from "../lib/server/api";
import { HttpError, readJson } from "../lib/server/security";
import type { Store } from "../lib/server/store";

test("JSON input is bounded by bytes while streaming and cancels overflow", async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(16 * 1024)); controller.enqueue(new Uint8Array(1)); },
    cancel,
  });
  const request = new Request("https://split.test/api/bills", { method: "POST", headers: {"Content-Type":"application/json"}, body: stream, duplex: "half" } as RequestInit);
  await expect(readJson(request)).rejects.toMatchObject({ status: 413 } satisfies Partial<HttpError>);
  expect(cancel).toHaveBeenCalledOnce();
});

test("shared upload budget applies across sessions while reconciliation remains independent", async () => {
  const counts = new Map<string, number>();
  const store = {
    incrementLimit: vi.fn(async (key: string) => {
      const count = (counts.get(key) ?? 0) + 1; counts.set(key, count); return count;
    }),
    expireDemo: vi.fn(),
    cleanupExpiredReceipts: vi.fn(async () => 0),
  } as unknown as Store;
  const handle = createHandler(store, "cron");
  const responses = await Promise.all(Array.from({length: PUBLIC_HOURLY_BUDGETS.upload + 1}, (_, i) =>
    handle(new Request("https://split.test/api/receipts", {
      method: "POST", headers: { Origin: "https://split.test", Cookie: `sdb_session=${i.toString(16).padStart(64, "0")}` },
      body: new Uint8Array([0]),
    }))));
  expect(responses.filter(r => r.status === 429)).toHaveLength(1);
  expect(responses.filter(r => r.status === 415)).toHaveLength(PUBLIC_HOURLY_BUDGETS.upload);
  expect([...counts.keys()].filter(key => key.startsWith("upload:"))).toHaveLength(PUBLIC_HOURLY_BUDGETS.upload);
  const cron = await handle(new Request("https://split.test/api/reconcile", { method:"POST", headers:{Authorization:"Bearer cron"} }));
  expect(cron.status).toBe(200);
});
