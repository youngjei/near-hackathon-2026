import { env } from "cloudflare:workers";
import { createHandler } from "./api";
import { d1Store } from "./d1-store";
import { supabaseStore } from "./supabase-store";
import { json } from "./security";
import { paymentOptions } from "./payment-runtime";

export async function handle(request: Request) {
  const settings = env as unknown as Record<string, string | undefined>;
  // Sites authenticates and injects this header before the Worker is reached.
  // Set this host flag only after verifying the Site is owner-private. Native
  // Next.js never trusts these headers and validates its own owner session.
  const ownerTesting = settings.PRIVATE_LIVE_TEST_HOST === "true" &&
    !!request.headers.get("oai-authenticated-user-id");
  const backend = settings.STORAGE_BACKEND || "d1";
  if (backend === "supabase") {
    if (!settings.SUPABASE_URL || !settings.SUPABASE_SERVICE_ROLE_KEY)
      return json({ error: "Supabase storage is not configured." }, 503);
    return createHandler(
      supabaseStore(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY),
      settings.CRON_SECRET,
      paymentOptions(settings, ownerTesting),
    )(request);
  }
  // A missing/misconfigured selected backend must never silently write elsewhere.
  if (backend !== "d1" || !env.DB)
    return json({ error: "Storage is unavailable." }, 503);
  return createHandler(
    d1Store(env.DB, env.BUCKET),
    settings.CRON_SECRET,
    paymentOptions(settings, ownerTesting),
  )(request);
}
