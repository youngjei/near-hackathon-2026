import { createHandler } from "./api";
import { supabaseStore } from "./supabase-store";
import { json } from "./security";

// Native Next.js entry point; never imported by browser components.
export async function handle(request: Request) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET } = process.env;
  // Next can construct an internal localhost URL behind a proxy. Use a pinned
  // deployment origin, never untrusted forwarded headers, for CSRF/cookie checks.
  const origin = process.env.APP_ORIGIN ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:5180" : "");
  let validOrigin = false;
  try {
    const parsed = new URL(origin);
    validOrigin = parsed.origin === origin && ["http:", "https:"].includes(parsed.protocol);
  } catch { /* Invalid deployment configuration fails closed. */ }
  if (!validOrigin)
    return json({ error: "Application origin is not configured." }, 503);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return json({ error: "Supabase storage is not configured." }, 503);
  const url = new URL(request.url);
  const canonicalRequest = new Request(new URL(url.pathname + url.search, origin), request);
  return createHandler(
    supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
    CRON_SECRET,
  )(canonicalRequest);
}
