// Organizer capabilities are bearer secrets. Keep only this browser's minimal return
// index here: never add receipts, receiving accounts, shares or payment metadata.
export const SAVED_BILLS_KEY = "splitdbill.organizer-bills.v1";
export const MAX_SAVED_BILLS = 50;
const MAX_STORAGE_LENGTH = 24000;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const TOKEN = /^[a-f0-9]{64}$/;
export type SavedBill = { id: string; token: string; title: string; savedAt: number };
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type SavedBillIndex = { bills: SavedBill[]; available: boolean };
function browserStorage(): StorageLike | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; }
  catch { return undefined; }
}
export function validBillCapability(id: string, token: string) {
  return UUID.test(id) && TOKEN.test(token);
}
function validEntry(value: unknown): value is SavedBill {
  if (!value || typeof value !== "object") return false;
  const entry = value as SavedBill;
  return typeof entry.id === "string" && typeof entry.token === "string" &&
    validBillCapability(entry.id, entry.token) && typeof entry.title === "string" &&
    entry.title.length > 0 && entry.title.length <= 80 && entry.title === entry.title.trim() &&
    !/[\u0000-\u001f\u007f]/.test(entry.title) && Number.isSafeInteger(entry.savedAt) && entry.savedAt >= 0;
}
export function readSavedBills(storage: StorageLike | undefined = browserStorage()): SavedBillIndex {
  if (!storage) return { bills: [], available: false };
  try {
    const raw = storage.getItem(SAVED_BILLS_KEY);
    if (!raw) return { bills: [], available: true };
    if (raw.length > MAX_STORAGE_LENGTH) return { bills: [], available: true };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("version" in parsed) || parsed.version !== 1 ||
        !("bills" in parsed) || !Array.isArray(parsed.bills)) return { bills: [], available: true };
    const seen = new Set<string>();
    const bills = parsed.bills.filter(validEntry).sort((a, b) => b.savedAt - a.savedAt)
      .filter(entry => !seen.has(entry.id) && !!seen.add(entry.id)).slice(0, MAX_SAVED_BILLS)
      .map(({ id, token, title, savedAt }) => ({ id, token, title, savedAt }));
    return { bills, available: true };
  } catch {
    // A corrupt index is replaceable. A blocked storage API is not.
    try { storage.getItem(SAVED_BILLS_KEY); return { bills: [], available: true }; }
    catch { return { bills: [], available: false }; }
  }
}
export function rememberBill(
  bill: { id: string; merchant: string }, token: string,
  storage: StorageLike | undefined = browserStorage(),
): boolean {
  const entry = { id: bill.id, token, title: bill.merchant, savedAt: Date.now() };
  if (!storage || !validEntry(entry)) return false;
  const current = readSavedBills(storage);
  if (!current.available) return false;
  if (current.bills.some(saved => saved.id === entry.id && saved.token === token && saved.title === entry.title)) return true;
  try {
    storage.setItem(SAVED_BILLS_KEY, JSON.stringify({ version: 1, bills:
      [entry, ...current.bills.filter(saved => saved.id !== entry.id)].slice(0, MAX_SAVED_BILLS) }));
    return true;
  } catch { return false; }
}
export function forgetBill(id: string, storage: StorageLike | undefined = browserStorage()): boolean {
  if (!storage) return false;
  const current = readSavedBills(storage);
  if (!current.available) return false;
  try {
    storage.setItem(SAVED_BILLS_KEY, JSON.stringify({ version: 1, bills: current.bills.filter(bill => bill.id !== id) }));
    return true;
  } catch { return false; }
}
export function savedBill(id: string): SavedBill | undefined {
  return readSavedBills().bills.find(bill => bill.id === id);
}
