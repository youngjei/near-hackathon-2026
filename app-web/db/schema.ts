import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const bills = sqliteTable(
  "bills",
  {
    id: text("id").primaryKey(),
    ownerHash: text("owner_hash").notNull(),
    createKey: text("create_key").notNull(),
    merchant: text("merchant").notNull(),
    currency: text("currency").notNull(),
    originalTotal: text("original_total").notNull(),
    extra: text("extra").notNull(),
    diners: integer("diners").notNull(),
    totalUnits: text("total_units").notNull(),
    fxRate: text("fx_rate").notNull(),
    fxDate: text("fx_date").notNull(),
    fxSource: text("fx_source").notNull(),
    mode: text("mode").notNull().default("demo"),
    receiptId: text("receipt_id"),
    recipientAccount: text("recipient_account"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("bill_creation").on(t.ownerHash, t.createKey)],
);
export const shares = sqliteTable(
  "shares",
  {
    id: text("id").primaryKey(),
    billId: text("bill_id")
      .notNull()
      .references(() => bills.id),
    position: integer("position").notNull(),
    amountUnits: text("amount_units").notNull(),
    tokenHash: text("token_hash").notNull(),
  },
  (t) => [
    uniqueIndex("share_position").on(t.billId, t.position),
    index("shares_bill").on(t.billId),
  ],
);
export const attempts = sqliteTable(
  "payment_attempts",
  {
    id: text("id").primaryKey(),
    shareId: text("share_id")
      .notNull()
      .references(() => shares.id),
    requestKey: text("request_key").notNull(),
    method: text("method").notNull(),
    status: text("status").notNull(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    mode: text("mode").notNull().default("demo"),
  },
  (t) => [
    uniqueIndex("attempt_request").on(t.shareId, t.requestKey),
    index("attempts_share").on(t.shareId),
  ],
);
export const receipts = sqliteTable("receipts", {
  id: text("id").primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  objectKey: text("object_key").notNull(),
  mime: text("mime").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const limits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
// Server-only provider metadata. Access must always pass capability checks in the API.
export const liveAttempts = sqliteTable("live_payment_attempts", {
  attemptId: text("attempt_id").primaryKey().references(() => attempts.id),
  shareId: text("share_id").notNull().references(() => shares.id),
  routeFingerprint: text("route_fingerprint").notNull(),
  allocationState: text("allocation_state").notNull(),
  quoteJson: text("quote_json"),
  settlementUpdatedAt: integer("settlement_updated_at"),
  providerStatus: text("provider_status"),
  depositObserved: integer("deposit_observed", {mode:"boolean"}).notNull().default(false),
  settlementState: text("settlement_state"),
  signerAccount: text("signer_account"),
  signedIntentJson: text("signed_intent_json"),
  submissionState: text("submission_state"),
  submissionHash: text("submission_hash"),
  lastCheckedAt: integer("last_checked_at").notNull().default(0),
}, (t) => [
  uniqueIndex("live_active_share").on(t.shareId).where(sql`${t.allocationState} IN ('allocating','ready','unknown','review')`),
  index("live_reconcile_order").on(t.lastCheckedAt),
]);
