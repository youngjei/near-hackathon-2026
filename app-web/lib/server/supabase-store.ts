import { createClient } from "@supabase/supabase-js";
import type { Store, Bill, Share, Attempt, Receipt } from "./store";
import { HttpError } from "./security";

// Timestamps and decimal strings are normalized at the database boundary.
// PostgreSQL JSON helpers cast monetary values to text before JSON serialization.
function normalize<T>(value: unknown): T {
  const row = { ...(value as Record<string, unknown>) };
  for (const k of ["created_at", "expires_at"]) {
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
  };
}
