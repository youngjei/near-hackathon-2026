import { z } from "zod";
import { allocation, billInput, currencies } from "../money";
import { shareStatus, transition, Status } from "../payments";
import { getRate } from "../providers/fx";
import { imageType } from "../providers/receipt";
import { receivingAccount, displayReceivingAddress } from "../receiving";
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
import type { Store, Bill, Share, Attempt } from "./store";
const uuid = z.string().uuid();
export function createHandler(store: Store, cronSecret?: string) {
  async function limit(key: string, max: number) {
    const now = Date.now(),
      bucket = Math.floor(now / 3600000);
    const count = await store.incrementLimit(`${key}:${bucket}`, now + 3600000);
    if (count > max)
      throw new HttpError(
        429,
        "Too many requests. Please try again in an hour.",
      );
  }
  async function session(req: Request) {
    const token = cookie(req, "sdb_session");
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new HttpError(401, "Refresh this page and try again.");
    return token;
  }
  async function authorizedBill(req: Request, id: string) {
    uuid.parse(id);
    const bill = await store.bill(id);
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
    const share = await store.share(id);
    const token = cookie(req, `sdb_s_${id}`);
    if (!share || !token || (await hash(token)) !== share.token_hash)
      throw new HttpError(
        404,
        "This payment link is unavailable. Open the link your friend shared.",
      );
    const bill = await store.bill(share.bill_id);
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
      mode: a.mode,
    };
  }
  async function dashboard(bill: Bill, token: string) {
    const shares = await store.shares(bill.id);
    const result = await Promise.all(
      shares.map(async (s) => ({
        id: s.id,
        position: s.position,
        amountUnits: s.amount_units,
        status: shareStatus(await store.attempts(s.id)),
        token: await shareToken(token, s.id),
      })),
    );
    return { bill: billView(bill), receivingAddress: bill.recipient_account ? displayReceivingAddress(bill.recipient_account) : null, shares: result };
  }
  async function checkout(share: Share, bill: Bill) {
    const attempts = await store.attempts(share.id);
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
  return async function handle(req: Request): Promise<Response> {
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
          storage: true,
          storageProvider: store.kind,
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
        const receiptId = crypto.randomUUID();
        await store.saveReceipt(
          {
            id: receiptId,
            owner_hash: ownerHash,
            object_key: `receipts/${receiptId}`,
            mime,
            created_at: Date.now(),
          },
          bytes,
        );
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
        const old = await store.billByRequest(ownerHash, body.requestKey);
        if (old && old.recipient_account !== receivingAccount(body.receivingAddress))
          throw new HttpError(409, "This bill already has a receiving address. Start a new bill to use a different one.");
        if (old)
          return json(
            { ...(await dashboard(old, token)), organizerToken: token },
            200,
            { "Set-Cookie": sessionCookie(req, `sdb_b_${old.id}`, token) },
          );
        if (body.receiptId) {
          const receipt = await store.receipt(body.receiptId);
          if (
            !receipt ||
            receipt.owner_hash !== (await hash(master)) ||
            receipt.created_at <= Date.now() - 7 * 86400000
          )
            throw new HttpError(
              403,
              "This receipt is unavailable. Upload it again.",
            );
        }
        const fx = await getRate(body.currency);
        if (fx.rate !== body.approvedRate || fx.date !== body.approvedDate)
          throw new HttpError(
            409,
            "The reference rate changed. Review the conversion again.",
          );
        const split = allocation(body.total, body.extra, fx.rate, body.diners);
        const billId = crypto.randomUUID(),
          now = Date.now();
        const shares: Share[] = [];
        for (let i = 1; i < body.diners; i++) {
          const sid = crypto.randomUUID();
          shares.push({
            id: sid,
            bill_id: billId,
            position: i,
            amount_units: split.shares[i],
            token_hash: await hash(await shareToken(token, sid)),
          });
        }
        const saved = await store.createBill(
          {
            id: billId,
            owner_hash: ownerHash,
            create_key: body.requestKey,
            merchant: body.merchant,
            currency: body.currency,
            original_total: body.total,
            extra: body.extra,
            diners: body.diners,
            total_units: split.totalUnits,
            fx_rate: fx.rate,
            fx_date: fx.date,
            fx_source: fx.source,
            mode: "demo",
            receipt_id: body.receiptId || null,
            recipient_account: receivingAccount(body.receivingAddress),
            created_at: now,
          },
          shares,
        );
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
        const expected =
          resource === "bills"
            ? (await store.bill(id))?.owner_hash
            : (await store.share(id))?.token_hash;
        if (!expected || (await hash(token)) !== expected)
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
        const receipt = bill.receipt_id
          ? await store.receipt(bill.receipt_id)
          : null;
        if (!receipt || receipt.created_at <= Date.now() - 7 * 86400000)
          throw new HttpError(
            404,
            "This receipt has expired or is unavailable.",
          );
        const object = await store.receiptBody(receipt.object_key);
        if (!object) throw new HttpError(404, "Receipt unavailable.");
        return new Response(object, {
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
        if (bill.mode !== "demo")
          throw new HttpError(503, liveReadiness.reason);
        const body = z
          .object({
            method: z.enum(["zcash", "confidential"]),
            requestKey: uuid,
          })
          .parse(await readJson(req));
        await limit("attempt:" + id, 40);
        const current = await store.attempts(id);
        const previous = current.find((a) => a.request_key === body.requestKey);
        if (previous) {
          if (previous.method !== body.method)
            throw new HttpError(409, "Choose a new payment request.");
          return json(await checkout(share, bill));
        }
        if (current.some((a) => a.status === "paid"))
          throw new HttpError(409, "This share is already paid.");
        const now = Date.now();
        await store.createDemoAttempt({
          id: crypto.randomUUID(),
          share_id: id,
          request_key: body.requestKey,
          method: body.method,
          status: "pending",
          created_at: now,
          expires_at: now + 10 * 60000,
          mode: "demo",
        });
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
        const attempt = (await store.attempts(id)).find(
          (a) => a.id === body.attemptId && a.mode === "demo",
        );
        if (!attempt) throw new HttpError(404, "Payment attempt not found.");
        let next: Status;
        try {
          next = transition(attempt.status, body.status);
        } catch {
          throw new HttpError(409, "This payment cannot change to that state.");
        }
        await store.updateDemoAttempt(attempt.id, id, attempt.status, next);
        return json(await checkout(share, bill));
      }
      if (resource === "reconcile" && method === "POST") {
        // No live attempt can be created in this version. This job only expires demo attempts.
        if (
          !cronSecret ||
          req.headers.get("authorization") !== `Bearer ${cronSecret}`
        )
          throw new HttpError(401, "Unauthorized.");
        await store.expireDemo(Date.now());
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
  };
}
