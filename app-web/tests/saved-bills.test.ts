import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { forgetBill, MAX_SAVED_BILLS, readSavedBills, rememberBill } from "../lib/saved-bills";
import { api, redeem } from "../lib/client";
const id = "11111111-1111-4111-8111-111111111111", token = "ab".repeat(32);
const bill = { id, merchant: "Test dinner" };
function storage(initial: string | null = null) {
  let value = initial;
  return { getItem: vi.fn(() => value), setItem: vi.fn((_key: string, next: string) => { value = next; }) };
}
let local: ReturnType<typeof storage>;
beforeEach(() => {
  local = storage();
  vi.stubGlobal("window", { localStorage: local });
});
afterEach(() => vi.unstubAllGlobals());
test("stores only validated minimal owner access and avoids rewrites on polling", () => {
  expect(rememberBill({ ...bill, receivingAddress: "private" } as typeof bill, token)).toBe(true);
  expect(readSavedBills().bills).toEqual([{ id, token, title: bill.merchant, savedAt: expect.any(Number) }]);
  expect(rememberBill(bill, token)).toBe(true);
  expect(local.setItem).toHaveBeenCalledTimes(1);
  expect(rememberBill({ ...bill, id: "invalid" }, token)).toBe(false);
  expect(rememberBill(bill, "invalid")).toBe(false);
  expect(rememberBill({ ...bill, merchant: "\nunsafe" }, token)).toBe(false);
  expect(forgetBill(id)).toBe(true);
  expect(readSavedBills().bills).toEqual([]);
});
test("malformed, oversized and unsupported storage cannot become capabilities", () => {
  for (const raw of ["{", "x".repeat(24001), JSON.stringify({ version: 2, bills: [{ id, token, title: "Dinner", savedAt: 1 }] }),
    JSON.stringify({ version: 1, bills: [{ id: "x", token, title: "Dinner", savedAt: 1 }, { id, token, title: "x", savedAt: -1 }] })]) {
    expect(readSavedBills(storage(raw)).bills).toEqual([]);
  }
  expect(rememberBill(bill, token, storage("{"))).toBe(true);
});
test("filters entries individually, strips unknown metadata, deduplicates and bounds the index", () => {
  const entries = Array.from({ length: 60 }, (_, n) => ({
    id: `11111111-1111-4111-8111-${String(n).padStart(12, "0")}`, token, title: "Dinner", savedAt: n,
    receivingAddress: "must not survive",
  }));
  const local = storage(JSON.stringify({ version: 1, bills: [...entries, entries[59], { id, token: "bad" }] }));
  expect(readSavedBills(local).bills).toHaveLength(MAX_SAVED_BILLS);
  expect(Object.keys(readSavedBills(local).bills[0])).toEqual(["id", "token", "title", "savedAt"]);
  rememberBill(bill, token, local);
  expect(readSavedBills(local).bills).toHaveLength(MAX_SAVED_BILLS);
  expect(readSavedBills(local).bills[0].id).toBe(id);
});
test("storage exceptions, quotas and browser absence fail gracefully", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  expect(readSavedBills(blocked)).toEqual({ bills: [], available: false });
  expect(rememberBill(bill, token, blocked)).toBe(false);
  expect(forgetBill(id, blocked)).toBe(false);
  expect(rememberBill(bill, token, { getItem: () => null, setItem() { throw new Error("quota"); } })).toBe(false);
  vi.stubGlobal("window", undefined);
  expect(readSavedBills()).toEqual({ bills: [], available: false });
});
test("successful create saves owner access before returning and payer results never save", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ bill, organizerToken: token }))));
  await api("bills", {});
  expect(readSavedBills().bills[0].id).toBe(id);
  forgetBill(id);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ bill, organizerToken: token }))));
  await api(`shares/${id}`);
  expect(readSavedBills().bills).toEqual([]);
});
test("expired organizer cookies restore once from local capability; network errors do not", async () => {
  rememberBill(bill, token);
  const fetcher = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 404 }))
    .mockResolvedValueOnce(new Response('{"ok":true}'))
    .mockResolvedValueOnce(new Response(JSON.stringify({ bill, organizerToken: token })));
  vi.stubGlobal("fetch", fetcher);
  await api(`bills/${id}`);
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(fetcher.mock.calls[1][0]).toBe(`/api/bills/${id}/access`);
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ token });
  fetcher.mockReset().mockRejectedValue(new Error("offline"));
  await expect(api(`bills/${id}`)).rejects.toThrow("offline");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test("invalid/stale saved access never escalates to another bill or payer", async () => {
  rememberBill(bill, token);
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response('{"error":"unavailable"}', { status: 404 })));
  vi.stubGlobal("fetch", fetcher);
  await expect(api(`bills/${id}`)).rejects.toThrow("unavailable");
  expect(fetcher).toHaveBeenCalledTimes(2);
  fetcher.mockClear();
  await expect(api(`shares/${id}`)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test("list refresh cannot re-add a forgotten bill when its in-flight read completes", async () => {
  rememberBill(bill, token);
  let resolve!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(done => { resolve = done; })));
  const pending = api(`bills/${id}`, undefined, { remember: false });
  forgetBill(id);
  resolve(new Response(JSON.stringify({ bill, organizerToken: token })));
  await pending;
  expect(readSavedBills().bills).toEqual([]);
});
test("fragment is retained until successful authorization and diner tokens are never saved", async () => {
  vi.stubGlobal("location", { hash: `#${token}`, pathname: "/pay", search: `?id=${id}` });
  const replaceState = vi.fn();
  vi.stubGlobal("history", { replaceState });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response('{"error":"no access"}', { status: 404 }))
    .mockResolvedValueOnce(new Response('{"ok":true}')));
  await expect(redeem("shares", id)).rejects.toThrow("no access");
  expect(replaceState).not.toHaveBeenCalled();
  await redeem("shares", id);
  expect(replaceState).toHaveBeenCalledWith(null, "", `/pay?id=${id}`);
  expect(readSavedBills().bills).toEqual([]);
});
test("organizer fragment persists through dashboard failure or storage denial", async () => {
  vi.stubGlobal("location", { hash: `#${token}`, pathname: "/bill", search: `?id=${id}` });
  const replaceState = vi.fn();
  vi.stubGlobal("history", { replaceState });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response('{"ok":true}')).mockRejectedValueOnce(new Error("offline")));
  await expect(redeem("bills", id)).rejects.toThrow("offline");
  expect(replaceState).not.toHaveBeenCalled();
  vi.stubGlobal("window", { get localStorage() { throw new Error("blocked"); } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response('{"ok":true}'))
    .mockResolvedValueOnce(new Response(JSON.stringify({ bill, organizerToken: token }))));
  await redeem("bills", id);
  expect(replaceState).not.toHaveBeenCalled();
});

test("ordinary organizer polling does not re-add an entry removed in another tab", async () => {
  const other = { id: "33333333-3333-4333-8333-333333333333", merchant: "Another dinner" };
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ bill: other, organizerToken: token })))));
  await api(`bills/${other.id}`);
  expect(readSavedBills().bills).toHaveLength(1);
  forgetBill(other.id);
  await api(`bills/${other.id}`);
  expect(readSavedBills().bills).toEqual([]);
});
