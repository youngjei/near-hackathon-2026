import { rememberBill, savedBill } from "./saved-bills";
// Save on an explicit page open, never re-add a forgotten entry on later polls.
const rememberedOwnerReads = new Set<string>();

export async function api<T = unknown>(path: string, body?: unknown, options: { remember?: boolean } = {}): Promise<T> {
  let r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  // A saved organizer capability survives the short-lived HTTP-only cookie.
  const ownerRead = body === undefined && /^bills\/[a-f0-9-]{36}$/.test(path);
  if (ownerRead && (r.status === 401 || r.status === 404)) {
    const id = path.slice("bills/".length);
    const saved = savedBill(id);
    if (saved) {
      await api(`bills/${id}/access`, { token: saved.token });
      r = await fetch("/api/" + path, { cache: "no-store" });
    }
  }
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(data.error || "Please try again.");
  // Only authorized owner dashboard responses may enter the local index. Save
  // synchronously before returning, so creation can navigate immediately.
  if (options.remember !== false && (path === "bills" || ownerRead) && data && typeof data === "object") {
    const dashboard = data as unknown as Partial<Dashboard>;
    if (dashboard.bill && typeof dashboard.organizerToken === "string" &&
        (!ownerRead || !rememberedOwnerReads.has(dashboard.bill.id))) {
      if (rememberBill(dashboard.bill, dashboard.organizerToken) && ownerRead)
        rememberedOwnerReads.add(dashboard.bill.id);
    }
  }
  return data;
}
export async function redeem(kind: "bills" | "shares", id: string) {
  const token = location.hash.slice(1);
  if (token) {
    await api(`${kind}/${id}/access`, { token });
    if (kind === "bills") {
      const dashboard = await api<Dashboard>(`bills/${id}`);
      // If storage is blocked, retain the original link until it can be copied.
      if (!dashboard.organizerToken || !rememberBill(dashboard.bill, dashboard.organizerToken)) return;
    }
    // Keep a failed link intact so it can be retried or copied for recovery.
    history.replaceState(null, "", location.pathname + location.search);
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
  method: "zcash" | "confidential" | "solana";
  status: string;
  expiresAt: number;
  createdAt: number;
  mode: string;
  payment?: {
    amount: string;
    symbol: "ZEC" | "USDC";
    address?: string;
    uri?: string;
    walletUrl?: string;
    statusMessage?: string;
    state?: string;
  };
};
export type Dashboard = {
  live?: Checkout["live"];
  bill: BillView;
  receivingAddress: string | null;
  shares: ShareView[];
  organizerToken?: string;
};
export type Checkout = {
  bill: BillView;
  share: ShareView;
  attempts: AttemptView[];
  live?: {
    enabled: boolean;
    testing?: boolean;
    reason: string;
    methods: { zcash: boolean; confidential: boolean; solana: boolean };
  };
};

export type ConfidentialIntentView = {
  standard: "nep413";
  payload: { message: string; nonce: string; recipient: "intents.far" };
};
export type PreparedConfidentialPayment = {
  intent: ConfidentialIntentView;
  signer: string;
  state: string;
};
