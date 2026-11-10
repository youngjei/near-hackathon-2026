export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export async function redeem(kind: "bills" | "shares", id: string) {
  const token = location.hash.slice(1);
  if (token) {
    history.replaceState(null, "", location.pathname + location.search);
    await api(`${kind}/${id}/access`, { token });
  }
}
export function link(kind: "bill" | "pay", id: string, token: string) {
  return `${location.origin}/${kind}?id=${id}#${token}`;
}
export type BillView = {
  id: string;
  merchant: string;
  currency: string;
  originalTotal: string;
  extra: string;
  diners: number;
  totalUnits: string;
  fxRate: string;
  fxDate: string;
  fxSource: string;
  mode: string;
  hasReceipt: boolean;
  createdAt: number;
};
export type ShareView = {
  id: string;
  position: number;
  amountUnits: string;
  status: string;
  token?: string;
};
export type AttemptView = {
  id: string;
  method: "zcash" | "confidential";
  status: string;
  expiresAt: number;
  createdAt: number;
  mode: string;
};
export type Dashboard = {
  bill: BillView;
  receivingAddress: string | null;
  shares: ShareView[];
  organizerToken?: string;
};
export type Checkout = {
  bill: BillView;
  share: ShareView;
  attempts: AttemptView[];
};
