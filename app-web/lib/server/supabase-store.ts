import { createClient } from "@supabase/supabase-js";
import type { Store, Bill, Share, Attempt, Receipt, LiveAttempt } from "./store";
import { HttpError } from "./security";

// Timestamps and decimal strings are normalized at the database boundary.
// PostgreSQL JSON helpers cast monetary values to text before JSON serialization.
function normalize<T>(value: unknown): T {
  const row = { ...(value as Record<string, unknown>) };
  for (const k of ["created_at", "expires_at", "settlement_updated_at", "last_checked_at"]) {
    if (typeof row[k] === "string") row[k] = Date.parse(row[k] as string);
  }
  return row as T;
}
export function supabaseStore(url: string, key: string): Store {
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  async function rpc(name: string, args: Record<string, unknown> = {}) {
    const { data, error } = await client
      .rpc(name, args)
      .abortSignal(AbortSignal.timeout(15000));
    if (error) {
      if (error.code === "PT409")
        throw new HttpError(
          409,
          "This payment request changed. Refresh and try again.",
        );
      // Never include upstream errors, record contents or credentials in responses.
      throw new HttpError(503, "Database is unavailable. Please try again.");
    }
    return data;
  }
  async function one<T>(
    kind: string,
    id: string,
    key?: string,
  ): Promise<T | null> {
    const data = await rpc("sdb_read", {
      p_kind: kind,
      p_id: id,
      p_key: key ?? null,
    });
    return data === null ? null : normalize<T>(data);
  }
  async function rows<T>(kind: string, id: string): Promise<T[]> {
    const data = await rpc("sdb_read", { p_kind: kind, p_id: id, p_key: null });
    return (data as unknown[]).map(normalize<T>);
  }
  const receipts = client.storage.from("receipts");
  return {
    kind: "supabase",
    bill: (id) => one<Bill>("bill", id),
    billByRequest: (owner, key) => one<Bill>("bill_request", owner, key),
    share: (id) => one<Share>("share", id),
    shares: (id) => rows<Share>("shares", id),
    attempts: (id) => rows<Attempt>("attempts", id),
    receipt: (id) => one<Receipt>("receipt", id),
    async saveReceipt(r, bytes) {
      const upload = await receipts.upload(r.object_key, bytes, {
        contentType: r.mime,
        upsert: false,
      });
      if (upload.error)
        throw new HttpError(
          503,
          "Image storage is unavailable. You can enter the bill manually.",
        );
      try {
        await rpc("sdb_save_receipt", {
          p_receipt: { ...r, created_at: new Date(r.created_at).toISOString() },
        });
      } catch (e) {
        await receipts.remove([r.object_key]).catch(() => {});
        throw e;
      }
    },
    async receiptBody(key) {
      const { data, error } = await receipts.download(key);
      if (error)
        throw new HttpError(
          503,
          "Receipt storage is unavailable. Please try again.",
        );
      return data;
    },
    async createBill(b, shares) {
      return normalize<Bill>(
        await rpc("sdb_create_bill", {
          p_bill: { ...b, created_at: new Date(b.created_at).toISOString() },
          p_shares: shares,
        }),
      );
    },
    async createDemoAttempt(a) {
      await rpc("sdb_create_demo_attempt", {
        p_attempt: {
          ...a,
          created_at: new Date(a.created_at).toISOString(),
          expires_at: new Date(a.expires_at).toISOString(),
        },
      });
    },
    async updateDemoAttempt(id, share, previous, next) {
      await rpc("sdb_update_demo_attempt", {
        p_id: id,
        p_share: share,
        p_previous: previous,
        p_next: next,
      });
    },
    async incrementLimit(key, expires) {
      return (await rpc("sdb_increment_limit", {
        p_key: key,
        p_expires: new Date(expires).toISOString(),
      })) as number;
    },
    async expireDemo(now) {
      await rpc("sdb_expire_demo", { p_now: new Date(now).toISOString() });
    },
    async reserveLiveAttempt({ attempt, route_fingerprint }) {
      const result = await rpc("sdb_reserve_live", {
        p_attempt: { ...attempt, created_at: new Date(attempt.created_at).toISOString(), expires_at: new Date(attempt.expires_at).toISOString() },
        p_fingerprint: route_fingerprint,
      }) as { attempt: unknown; acquired: boolean };
      return { attempt: normalize<LiveAttempt>(result.attempt), acquired: result.acquired };
    },
    async liveAttempt(id) {
      const data = await rpc("sdb_live_read", { p_id: id });
      return data === null ? null : normalize<LiveAttempt>(data);
    },
    async saveLiveQuote(id, quote) {
      await rpc("sdb_save_live_quote", { p_id: id, p_quote: quote, p_expires: new Date(Math.min(Date.parse(String(quote.quoteRequest.deadline)), Date.parse(quote.quote.deadline!), Date.parse(quote.quote.timeWhenInactive!))).toISOString() });
    },
    async markLiveAllocationUnknown(id) { await rpc("sdb_live_unknown", { p_id: id }); },
    async reconcilableLiveAttempts(limit, shareId) {
      const data = await rpc("sdb_live_reconcilable", { p_limit: limit, p_share: shareId ?? null });
      return (data as unknown[]).map(normalize<LiveAttempt>);
    },
    async recordLiveSettlement(id, settlement, checkedAt) {
      await rpc("sdb_record_live_settlement", { p_id: id, p_settlement: settlement, p_checked: new Date(checkedAt).toISOString() });
    },
    async prepareConfidentialIntent(id, signer, intent) {
      return normalize<LiveAttempt>(await rpc("sdb_prepare_confidential", { p_id: id, p_signer: signer, p_intent: intent }));
    },
    async reserveConfidentialSubmit(id, now) {
      const result=await rpc("sdb_reserve_confidential_submit", { p_id:id,p_now:new Date(now).toISOString() }) as {attempt:unknown;acquired:boolean};
      return {attempt:normalize<LiveAttempt>(result.attempt),acquired:result.acquired};
    },
    async finishConfidentialSubmit(id, state, intentHash) {
      await rpc("sdb_finish_confidential_submit", { p_id:id,p_state:state,p_hash:intentHash??null });
    },
  };
}
