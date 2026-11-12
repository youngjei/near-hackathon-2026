import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookie, json, responseHeaders } from "./security";

type Settings = Record<string, string | undefined>;
const COOKIE = "sdb_test_owner";
const SESSION_SECONDS = 12 * 60 * 60;
const enabled = (settings: Settings) => settings.LIVE_PAYMENT_TESTING === "true";
const configured = (settings: Settings) => (settings.PRIVATE_TEST_PASSWORD?.length ?? 0) >= 32;
const signature = (value: string, settings: Settings) => createHmac("sha256", settings.PRIVATE_TEST_PASSWORD!).update(value).digest("hex");
function equal(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
export function testOwnerAuthorized(request: Request, settings: Settings, now = Date.now()) {
  if (!enabled(settings) || !configured(settings)) return false;
  const value = cookie(request, COOKIE);
  const match = /^(\d{13})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return false;
  const expiry = Number(match[1]);
  return expiry > now && expiry <= now + SESSION_SECONDS * 1000 &&
    equal(match[2], signature(`splitdbill-owner:${settings.APP_ORIGIN}:${expiry}`, settings));
}
function safeReturn(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") &&
    !/[\\\x00-\x20]/.test(value) && !value.startsWith("/test-access") && !value.startsWith("/api/") ? value : "/";
}
function escape(value: string) {
  return value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function loginPage(returnTo: string, failed = false) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private testing · split/d/bill</title><style>body{margin:0;background:#f3f4ef;color:#202c29;font:18px/1.6 system-ui,sans-serif}main{max-width:440px;margin:12vh auto;padding:24px}h1{font-size:32px;line-height:1.2}label,input,button{display:block;width:100%;box-sizing:border-box}input{padding:14px;border:1px solid #74837a;background:#fcfdf8;font:inherit;margin:8px 0 20px}button{padding:14px;background:#14645e;color:white;border:0;font:inherit;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid #14645e;outline-offset:3px}.error{color:#9b302c}</style><main><p>split/d/bill</p><h1>Private wallet testing</h1><p>Enter your owner password to open this private test deployment. Payment approval always happens in your wallet.</p>${failed ? '<p class="error" role="alert">That password did not match. Try again.</p>' : ""}<form method="post" action="/api/test-access"><input type="hidden" name="returnTo" value="${escape(safeReturn(returnTo))}"><label for="password">Owner password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024" autofocus><button type="submit">Open private test</button></form></main></html>`, { status: failed ? 401 : 200, headers: { ...responseHeaders, "Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "same-origin", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'", "X-Frame-Options": "DENY" } });
}

// Shared by native Next proxy and runtime. API enforcement remains effective
// even if a hosting layer bypasses proxy. No Sites identity header is trusted.
export async function testAccess(request: Request, settings: Settings): Promise<Response | undefined> {
  if (!enabled(settings)) return;
  if (!configured(settings)) return json({error: "Private testing access is not configured."}, 503);
  let origin: URL;
  try {
    origin = new URL(settings.APP_ORIGIN || "");
    if (origin.origin !== settings.APP_ORIGIN || !["https:", "http:"].includes(origin.protocol)) throw new Error();
  } catch { return json({error: "Application origin is not configured."}, 503); }
  const url = new URL(request.url);
  if (url.pathname === "/api/test-access" && request.method === "POST") {
    if (request.headers.get("origin") !== origin.origin) return json({error: "Open this page directly and try again."}, 403);
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return json({error: "Expected a login form."}, 415);
    if (Number(request.headers.get("content-length") || 0) > 4096) return json({error: "Request too large."}, 413);
    // Bound the stream before buffering so absent/forged Content-Length cannot
    // turn the public login endpoint into an unbounded body allocation.
    const reader = request.body?.getReader();
    let body = "";
    if (reader) {
      const decoder = new TextDecoder(); let bytes = 0;
      for (;;) {
        const {done, value} = await reader.read(); if (done) break;
        bytes += value.length;
        if (bytes > 4096) { await reader.cancel(); return json({error: "Request too large."}, 413); }
        body += decoder.decode(value, {stream: true});
      }
      body += decoder.decode();
    }
    const fields = new URLSearchParams(body);
    const returnTo = safeReturn(fields.get("returnTo"));
    if (!equal(fields.get("password") || "", settings.PRIVATE_TEST_PASSWORD!)) return loginPage(returnTo, true);
    const expiry = Date.now() + SESSION_SECONDS * 1000;
    const token = `${expiry}.${signature(`splitdbill-owner:${settings.APP_ORIGIN}:${expiry}`, settings)}`;
    return new Response(null, {status: 303, headers: {...responseHeaders, Location: new URL(returnTo, origin).href, "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${origin.protocol === "https:" ? "; Secure" : ""}`}});
  }
  if (url.pathname === "/test-access" && request.method === "GET") return loginPage(safeReturn(url.searchParams.get("returnTo")));
  if (testOwnerAuthorized(request, settings)) return;
  if (url.pathname === "/api/reconcile" && request.method === "POST" && settings.CRON_SECRET && equal(request.headers.get("authorization") || "", `Bearer ${settings.CRON_SECRET}`)) return;
  if (url.pathname.startsWith("/api/")) return json({error: "Open this deployment and enter your owner password."}, 401);
  return new Response(null, {status: 303, headers: {...responseHeaders, Location: `${origin.origin}/test-access?returnTo=${encodeURIComponent(safeReturn(url.pathname + url.search))}`}});
}
