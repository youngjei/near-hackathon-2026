import { env } from "cloudflare:workers";
import { z } from "zod";
import { allocation, billInput, currencies } from "../money";
import { shareStatus, transition, Status } from "../payments";
import { getRate } from "../providers/fx";
import { imageType } from "../providers/receipt";
import { liveReadiness } from "../providers/near";
import {
  HttpError,
  cookie,
  hash,
  json,
  readJson,
  sameOrigin,
  secret,
  sessionCookie,
  shareToken,
  responseHeaders,
} from "./security";
type Bill = {
  id: string;
  owner_hash: string;
  merchant: string;
  currency: string;
  original_total: string;
  extra: string;
  diners: number;
  total_units: string;
  fx_rate: string;
  fx_date: string;
  fx_source: string;
  mode: string;
  receipt_id: string | null;
  created_at: number;
};
type Share = {
  id: string;
  bill_id: string;
  position: number;
  amount_units: string;
  token_hash: string;
};
type Attempt = {
  id: string;
  share_id: string;
  request_key: string;
  method: string;
  status: Status;
  expires_at: number;
  created_at: number;
  mode: string;
};
const uuid = z.string().uuid();
function db() {
  if (!env.DB)
    throw new HttpError(503, "Storage is unavailable. Please try again.");
  return env.DB;
}
async function one<T>(sql: string, ...values: unknown[]) {
  return db()
    .prepare(sql)
    .bind(...values)
    .first<T>();
}
async function rows<T>(sql: string, ...values: unknown[]) {
  return (
    await db()
      .prepare(sql)
      .bind(...values)
      .all<T>()
  ).results;
}
async function limit(key: string, max: number) {
  const now = Date.now(),
    bucket = Math.floor(now / 3600000),
    k = `${key}:${bucket}`;
  const r = await one<{ count: number }>(
    "INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    k,
    now + 3600000,
  );
  if (!r || r.count > max)
    throw new HttpError(429, "Too many requests. Please try again in an hour.");
}
async function session(req: Request) {
  const token = cookie(req, "sdb_session");
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new HttpError(401, "Refresh this page and try again.");
  return token;
}
async function authorizedBill(req: Request, id: string) {
  uuid.parse(id);
  const bill = await one<Bill>("SELECT * FROM bills WHERE id=?", id);
  const token = cookie(req, `sdb_b_${id}`);
  if (!bill || !token || (await hash(token)) !== bill.owner_hash)
    throw new HttpError(
      404,
      "This bill link is unavailable. Open your original organizer link.",
    );
  return { bill, token };
}
async function authorizedShare(req: Request, id: string) {
  uuid.parse(id);
  const share = await one<Share>("SELECT * FROM shares WHERE id=?", id);
  const token = cookie(req, `sdb_s_${id}`);
  if (!share || !token || (await hash(token)) !== share.token_hash)
    throw new HttpError(
      404,
      "This payment link is unavailable. Open the link your friend shared.",
    );
  const bill = await one<Bill>("SELECT * FROM bills WHERE id=?", share.bill_id);
  if (!bill) throw new HttpError(404, "Bill not found.");
  return { share, bill };
}
function billView(b: Bill) {
  return {
    id: b.id,
    merchant: b.merchant,
    currency: b.currency,
    originalTotal: b.original_total,
    extra: b.extra,
    diners: b.diners,
    totalUnits: b.total_units,
    fxRate: b.fx_rate,
    fxDate: b.fx_date,
    fxSource: b.fx_source,
    mode: b.mode,
    hasReceipt: !!b.receipt_id,
    createdAt: b.created_at,
  };
}
function attemptView(a: Attempt) {
  return {
    id: a.id,
    method: a.method,
    status:
      a.status === "pending" && a.expires_at <= Date.now()
        ? "expired"
        : a.status,
    expiresAt: a.expires_at,
    createdAt: a.created_at,
    mode: "demo",
  };
}
async function dashboard(bill: Bill, token: string) {
  const shares = await rows<Share>(
    "SELECT * FROM shares WHERE bill_id=? ORDER BY position",
    bill.id,
  );
  const result = await Promise.all(
    shares.map(async (s) => ({
      id: s.id,
      position: s.position,
      amountUnits: s.amount_units,
      status: shareStatus(
        await rows<Attempt>(
          "SELECT * FROM payment_attempts WHERE share_id=? ORDER BY created_at DESC,rowid DESC",
          s.id,
        ),
      ),
      token: await shareToken(token, s.id),
    })),
  );
  return { bill: billView(bill), shares: result };
}
async function checkout(share: Share, bill: Bill) {
  const attempts = await rows<Attempt>(
    "SELECT * FROM payment_attempts WHERE share_id=? ORDER BY created_at DESC,rowid DESC",
    share.id,
  );
  return {
    bill: billView(bill),
    share: {
      id: share.id,
      position: share.position,
      amountUnits: share.amount_units,
      status: shareStatus(attempts),
    },
    attempts: attempts.map(attemptView),
    live: liveReadiness,
  };
}
async function readBytes(req: Request, max: number) {
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "Use an image smaller than 5 MB.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Select an image.");
  const chunks: Uint8Array[] = [];
  let n = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) {
      await reader.cancel();
      throw new HttpError(413, "Use an image smaller than 5 MB.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(n);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
}
export async function handle(req: Request): Promise<Response> {
  try {
    const path = new URL(req.url).pathname
      .replace(/^\/api\/?/, "")
      .split("/")
      .filter(Boolean);
    const [resource, id, action] = path;
    const method = req.method;
    if (method === "POST" && resource !== "reconcile") sameOrigin(req);
    if (resource === "config" && method === "GET")
      return json({
        mode: "demo",
        live: liveReadiness,
        ocr: false,
        storage: !!env.DB,
      });
    if (resource === "session" && method === "POST") {
      const existing = cookie(req, "sdb_session");
      const token = /^[a-f0-9]{64}$/.test(existing) ? existing : secret();
      return json({ ok: true }, 200, {
        "Set-Cookie": sessionCookie(req, "sdb_session", token),
      });
    }
    if (resource === "fx" && method === "GET") {
      const currency = z
        .enum(currencies)
        .parse(new URL(req.url).searchParams.get("currency"));
      await limit("fx:" + (await hash(await session(req))), 100);
      return json(await getRate(currency));
    }
    if (resource === "receipts" && method === "POST") {
      const ownerHash = await hash(await session(req));
      await limit("upload:" + ownerHash, 12);
      const bytes = await readBytes(req, 5 * 1024 * 1024);
      const mime = imageType(bytes);
      if (!mime) throw new HttpError(415, "Choose a JPG, PNG or WebP image.");
      if (!env.BUCKET)
        throw new HttpError(
          503,
          "Image storage is unavailable. You can enter the bill manually.",
        );
      const receiptId = crypto.randomUUID(),
        key = `receipts/${receiptId}`;
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: mime } });
      await db()
        .prepare(
          "INSERT INTO receipts (id,owner_hash,object_key,mime,created_at) VALUES (?,?,?,?,?)",
        )
        .bind(receiptId, ownerHash, key, mime, Date.now())
        .run();
      return json(
        {
          receiptId,
          extracted: null,
          message:
            "Receipt saved. Automatic reading is not connected in this demo. Please enter the total and currency.",
        },
        201,
      );
    }
    if (resource === "bills" && !id && method === "POST") {
      const master = await session(req);
      await limit("create:" + (await hash(master)), 20);
      const body = billInput.parse(await readJson(req));
      const token = await shareToken(master, body.requestKey),
        ownerHash = await hash(token);
      const old = await one<Bill>(
        "SELECT * FROM bills WHERE owner_hash=? AND create_key=?",
        ownerHash,
        body.requestKey,
      );
      if (old)
        return json(
          { ...(await dashboard(old, token)), organizerToken: token },
          200,
          { "Set-Cookie": sessionCookie(req, `sdb_b_${old.id}`, token) },
        );
      if (
        body.receiptId &&
        !(await one(
          "SELECT id FROM receipts WHERE id=? AND owner_hash=? AND created_at>?",
          body.receiptId,
          await hash(master),
          Date.now() - 7 * 86400000,
        ))
      )
        throw new HttpError(
          403,
          "This receipt is unavailable. Upload it again.",
        );
      const fx = await getRate(body.currency);
      if (fx.rate !== body.approvedRate || fx.date !== body.approvedDate)
        throw new HttpError(
          409,
          "The reference rate changed. Review the conversion again.",
        );
      const split = allocation(body.total, body.extra, fx.rate, body.diners);
      const billId = crypto.randomUUID(),
        now = Date.now();
      const billStmt = db()
        .prepare(
          "INSERT OR IGNORE INTO bills (id,owner_hash,create_key,merchant,currency,original_total,extra,diners,total_units,fx_rate,fx_date,fx_source,mode,receipt_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          billId,
          ownerHash,
          body.requestKey,
          body.merchant,
          body.currency,
          body.total,
          body.extra,
          body.diners,
          split.totalUnits,
          fx.rate,
          fx.date,
          fx.source,
          "demo",
          body.receiptId || null,
          now,
        );
      const statements = [billStmt];
      for (let i = 1; i < body.diners; i++) {
        const sid = crypto.randomUUID();
        statements.push(
          db()
            .prepare(
              "INSERT INTO shares (id,bill_id,position,amount_units,token_hash) SELECT ?,id,?,?,? FROM bills WHERE id=?",
            )
            .bind(
              sid,
              i,
              split.shares[i],
              await hash(await shareToken(token, sid)),
              billId,
            ),
        );
      }
      await db().batch(statements);
      const saved = await one<Bill>(
        "SELECT * FROM bills WHERE owner_hash=? AND create_key=?",
        ownerHash,
        body.requestKey,
      );
      if (!saved) throw new Error("Save failed");
      return json(
        { ...(await dashboard(saved, token)), organizerToken: token },
        201,
        { "Set-Cookie": sessionCookie(req, `sdb_b_${saved.id}`, token) },
      );
    }
    if (
      (resource === "bills" || resource === "shares") &&
      id &&
      action === "access" &&
      method === "POST"
    ) {
      uuid.parse(id);
      const { token } = z
        .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
        .parse(await readJson(req));
      const row = await one<{ token_hash: string }>(
        resource === "bills"
          ? "SELECT owner_hash AS token_hash FROM bills WHERE id=?"
          : "SELECT token_hash FROM shares WHERE id=?",
        id,
      );
      if (!row || (await hash(token)) !== row.token_hash)
        throw new HttpError(
          404,
          "This link is unavailable. Ask for a new link.",
        );
      return json({ ok: true }, 200, {
        "Set-Cookie": sessionCookie(
          req,
          `sdb_${resource === "bills" ? "b" : "s"}_${id}`,
          token,
        ),
      });
    }
    if (resource === "bills" && id && method === "GET" && !action) {
      const { bill, token } = await authorizedBill(req, id);
      return json(await dashboard(bill, token));
    }
    if (resource === "shares" && id && method === "GET" && !action) {
      const { share, bill } = await authorizedShare(req, id);
      return json(await checkout(share, bill));
    }
    if (
      (resource === "bills" || resource === "shares") &&
      id &&
      action === "receipt" &&
      method === "GET"
    ) {
      const { bill } =
        resource === "bills"
          ? await authorizedBill(req, id)
          : await authorizedShare(req, id);
      const receipt = await one<{ object_key: string; mime: string }>(
        "SELECT * FROM receipts WHERE id=? AND created_at>?",
        bill.receipt_id,
        Date.now() - 7 * 86400000,
      );
      if (!receipt || !env.BUCKET)
        throw new HttpError(404, "This receipt has expired or is unavailable.");
      const object = await env.BUCKET.get(receipt.object_key);
      if (!object) throw new HttpError(404, "Receipt unavailable.");
      return new Response(object.body, {
        headers: {
          ...responseHeaders,
          "Content-Type": receipt.mime,
          "Content-Disposition": "inline",
        },
      });
    }
    if (
      resource === "shares" &&
      id &&
      action === "attempts" &&
      method === "POST"
    ) {
      const { share, bill } = await authorizedShare(req, id);
      if (bill.mode !== "demo") throw new HttpError(503, liveReadiness.reason);
      const body = z
        .object({ method: z.enum(["zcash", "confidential"]), requestKey: uuid })
        .parse(await readJson(req));
      await limit("attempt:" + id, 40);
      const current = await rows<Attempt>(
        "SELECT * FROM payment_attempts WHERE share_id=? ORDER BY created_at DESC,rowid DESC",
        id,
      );
      const previous = current.find((a) => a.request_key === body.requestKey);
      if (previous) {
        if (previous.method !== body.method)
          throw new HttpError(409, "Choose a new payment request.");
        return json(await checkout(share, bill));
      }
      if (current.some((a) => a.status === "paid"))
        throw new HttpError(409, "This share is already paid.");
      const now = Date.now();
      await db().batch([
        db()
          .prepare(
            "UPDATE payment_attempts SET status='expired' WHERE share_id=? AND status='pending' AND request_key<>?",
          )
          .bind(id, body.requestKey),
        db()
          .prepare(
            "INSERT OR IGNORE INTO payment_attempts (id,share_id,request_key,method,status,created_at,expires_at,mode) SELECT ?,?,?,?,'pending',?,?,'demo' WHERE NOT EXISTS (SELECT 1 FROM payment_attempts WHERE share_id=? AND status='paid')",
          )
          .bind(
            crypto.randomUUID(),
            id,
            body.requestKey,
            body.method,
            now,
            now + 10 * 60000,
            id,
          ),
      ]);
      return json(await checkout(share, bill), 201);
    }
    if (
      resource === "shares" &&
      id &&
      action === "simulate" &&
      method === "POST"
    ) {
      const { share, bill } = await authorizedShare(req, id);
      if (bill.mode !== "demo")
        throw new HttpError(403, "Simulation is disabled for live bills.");
      const body = z
        .object({
          attemptId: uuid,
          status: z.enum(["paid", "expired", "failed", "refunded"]),
        })
        .parse(await readJson(req));
      const attempt = await one<Attempt>(
        "SELECT * FROM payment_attempts WHERE id=? AND share_id=? AND mode=?",
        body.attemptId,
        id,
        "demo",
      );
      if (!attempt) throw new HttpError(404, "Payment attempt not found.");
      let next: Status;
      try {
        next = transition(attempt.status, body.status);
      } catch {
        throw new HttpError(409, "This payment cannot change to that state.");
      }
      await db()
        .prepare(
          "UPDATE payment_attempts SET status=? WHERE id=? AND status=? AND mode=?",
        )
        .bind(next, attempt.id, attempt.status, "demo")
        .run();
      return json(await checkout(share, bill));
    }
    if (resource === "reconcile" && method === "POST") {
      // No live attempt can be created in this version. This job only expires demo attempts.
      const token = (env as unknown as Record<string, string>).CRON_SECRET;
      if (!token || req.headers.get("authorization") !== `Bearer ${token}`)
        throw new HttpError(401, "Unauthorized.");
      await db()
        .prepare(
          "UPDATE payment_attempts SET status='expired' WHERE mode='demo' AND status='pending' AND expires_at<=?",
        )
        .bind(Date.now())
        .run();
      await db()
        .prepare("DELETE FROM rate_limits WHERE expires_at<?")
        .bind(Date.now() - 3600000)
        .run();
      return json({ ok: true, mode: "demo", livePaymentsChecked: 0 });
    }
    throw new HttpError(404, "Not found.");
  } catch (e) {
    if (e instanceof z.ZodError)
      return json(
        { error: e.issues[0]?.message || "Check the entered details." },
        400,
      );
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
