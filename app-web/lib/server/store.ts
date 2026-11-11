import type { Status } from "../payments";
import type { VerifiedQuote, Settlement, ConfidentialIntent } from "../providers/intents";

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
  recipient_account: string | null;
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
// Never serialize this record to a browser. The quote contains private routing data.
export type LiveAttempt = Attempt & {
  route_fingerprint: string;
  allocation_state: "allocating" | "ready" | "unknown" | "review" | "terminal";
  quote: VerifiedQuote | null;
  settlement_updated_at: number | null;
  last_checked_at: number;
  provider_status: string | null;
  deposit_observed: boolean;
  settlement_state: string | null;
  signer_account: string | null;
  signed_intent: ConfidentialIntent | null;
  submission_state: "prepared" | "submitting" | "accepted" | "unknown" | null;
  submission_hash: string | null;
};
export type LiveReservation = { attempt: Attempt; route_fingerprint: string };
export type LiveStore = Pick<Store, "reserveLiveAttempt" | "liveAttempt" | "saveLiveQuote" | "markLiveAllocationUnknown" | "reconcilableLiveAttempts" | "recordLiveSettlement" | "prepareConfidentialIntent" | "reserveConfidentialSubmit" | "finishConfidentialSubmit">;
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
  reserveLiveAttempt(input: LiveReservation): Promise<{ attempt: LiveAttempt; acquired: boolean }>;
  liveAttempt(id: string): Promise<LiveAttempt | null>;
  saveLiveQuote(id: string, quote: VerifiedQuote): Promise<void>;
  markLiveAllocationUnknown(id: string): Promise<void>;
  reconcilableLiveAttempts(limit: number, shareId?: string): Promise<LiveAttempt[]>;
  recordLiveSettlement(id: string, settlement: Settlement | null, checkedAt: number): Promise<void>;
  prepareConfidentialIntent(id: string, signer: string, intent: ConfidentialIntent): Promise<LiveAttempt>;
  reserveConfidentialSubmit(id: string, now: number): Promise<{ attempt: LiveAttempt; acquired: boolean }>;
  finishConfidentialSubmit(id: string, state: "accepted" | "unknown", intentHash?: string): Promise<void>;
}
