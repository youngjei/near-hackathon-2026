import type { Store, Bill, Share, Attempt, Receipt } from "./store";
import { HttpError } from "./security";

export function d1Store(db: D1Database, bucket?: R2Bucket): Store {
  const stmt = (sql: string, values: unknown[] = []) =>
    db.prepare(sql).bind(...values);
  const one = <T>(sql: string, ...values: unknown[]) =>
    stmt(sql, values).first<T>();
  const rows = async <T>(sql: string, ...values: unknown[]) =>
    (await stmt(sql, values).all<T>()).results;
  return {
    kind: "d1",
    bill: (id) => one<Bill>("SELECT * FROM bills WHERE id=?", id),
    billByRequest: (owner, key) =>
      one<Bill>(
        "SELECT * FROM bills WHERE owner_hash=? AND create_key=?",
        owner,
        key,
      ),
    share: (id) => one<Share>("SELECT * FROM shares WHERE id=?", id),
    shares: (id) =>
      rows<Share>("SELECT * FROM shares WHERE bill_id=? ORDER BY position", id),
    attempts: (id) =>
      rows<Attempt>(
        "SELECT * FROM payment_attempts WHERE share_id=? ORDER BY created_at DESC,rowid DESC",
        id,
      ),
    receipt: (id) => one<Receipt>("SELECT * FROM receipts WHERE id=?", id),
    async saveReceipt(r, bytes) {
      if (!bucket)
        throw new HttpError(
          503,
          "Image storage is unavailable. You can enter the bill manually.",
        );
      await bucket.put(r.object_key, bytes, {
        httpMetadata: { contentType: r.mime },
      });
      try {
        await stmt(
          "INSERT INTO receipts (id,owner_hash,object_key,mime,created_at) VALUES (?,?,?,?,?)",
          [r.id, r.owner_hash, r.object_key, r.mime, r.created_at],
        ).run();
      } catch (e) {
        await bucket.delete(r.object_key).catch(() => {});
        throw e;
      }
    },
    async receiptBody(key) {
      return (await bucket?.get(key))?.body ?? null;
    },
    async createBill(b, shares) {
      const fields = Object.keys(b) as (keyof Bill)[];
      const statements = [
        stmt(
          `INSERT OR IGNORE INTO bills (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
          fields.map((k) => b[k]),
        ),
      ];
      for (const s of shares)
        statements.push(
          stmt(
            "INSERT INTO shares (id,bill_id,position,amount_units,token_hash) SELECT ?,id,?,?,? FROM bills WHERE id=?",
            [s.id, s.position, s.amount_units, s.token_hash, b.id],
          ),
        );
      await db.batch(statements);
      const saved = await one<Bill>(
        "SELECT * FROM bills WHERE owner_hash=? AND create_key=?",
        b.owner_hash,
        b.create_key,
      );
      if (!saved) throw new Error("Save failed");
      if (saved.recipient_account !== b.recipient_account) throw new HttpError(409, "This bill already has a receiving address. Start a new bill to use a different one.");
      return saved;
    },
    async createDemoAttempt(a) {
      await db.batch([
        stmt(
          "UPDATE payment_attempts SET status='expired' WHERE share_id=? AND mode='demo' AND status='pending' AND request_key<>?",
          [a.share_id, a.request_key],
        ),
        stmt(
          "INSERT OR IGNORE INTO payment_attempts (id,share_id,request_key,method,status,created_at,expires_at,mode) SELECT ?,?,?,?,'pending',?,?,'demo' WHERE NOT EXISTS (SELECT 1 FROM payment_attempts WHERE share_id=? AND status='paid')",
          [
            a.id,
            a.share_id,
            a.request_key,
            a.method,
            a.created_at,
            a.expires_at,
            a.share_id,
          ],
        ),
      ]);
    },
    async updateDemoAttempt(id, share, previous, next) {
      await stmt(
        "UPDATE payment_attempts SET status=? WHERE id=? AND share_id=? AND status=? AND mode='demo'",
        [next, id, share, previous],
      ).run();
    },
    async incrementLimit(key, expires) {
      const r = await one<{ count: number }>(
        "INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
        key,
        expires,
      );
      if (!r) throw new Error("Rate limit unavailable");
      return r.count;
    },
    async expireDemo(now) {
      await db.batch([
        stmt(
          "UPDATE payment_attempts SET status='expired' WHERE mode='demo' AND status='pending' AND expires_at<=?",
          [now],
        ),
        stmt("DELETE FROM rate_limits WHERE expires_at<?", [now - 3600000]),
      ]);
    },
  };
}
