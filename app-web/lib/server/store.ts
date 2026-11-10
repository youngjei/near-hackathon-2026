import type { Status } from "../payments";

export type Bill = {
  id: string;
  owner_hash: string;
  create_key: string;
  merchant: string;
  currency: string;
  original_total: string;
  extra: string;
  diners: number;
  total_units: string;
  fx_rate: string;
  fx_date: string;
  fx_source: string;
  mode: "demo" | "live";
  receipt_id: string | null;
  created_at: number;
};
export type Share = {
  id: string;
  bill_id: string;
  position: number;
  amount_units: string;
  token_hash: string;
};
export type Attempt = {
  id: string;
  share_id: string;
  request_key: string;
  method: string;
  status: Status;
  expires_at: number;
  created_at: number;
  mode: "demo" | "live";
};
export type Receipt = {
  id: string;
  owner_hash: string;
  object_key: string;
  mime: string;
  created_at: number;
};
// Implementations preserve the transaction boundaries in these domain operations.
// The API alone authorizes capabilities and returns restricted views to browsers.
export interface Store {
  kind: "d1" | "supabase";
  bill(id: string): Promise<Bill | null>;
  billByRequest(owner: string, key: string): Promise<Bill | null>;
  share(id: string): Promise<Share | null>;
  shares(bill: string): Promise<Share[]>;
  attempts(share: string): Promise<Attempt[]>;
  receipt(id: string): Promise<Receipt | null>;
  saveReceipt(receipt: Receipt, bytes: Uint8Array): Promise<void>;
  receiptBody(key: string): Promise<BodyInit | null>;
  createBill(bill: Bill, shares: Share[]): Promise<Bill>;
  createDemoAttempt(attempt: Attempt): Promise<void>;
  updateDemoAttempt(
    id: string,
    share: string,
    previous: Status,
    next: Status,
  ): Promise<void>;
  incrementLimit(key: string, expires: number): Promise<number>;
  expireDemo(now: number): Promise<void>;
}
