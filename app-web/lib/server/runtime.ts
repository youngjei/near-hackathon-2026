import { env } from "cloudflare:workers";
import { createHandler } from "./api";
import { d1Store } from "./d1-store";
import { supabaseStore } from "./supabase-store";
import { json } from "./security";

export async function handle(request: Request) {
  const settings = env as unknown as Record<string, string | undefined>;
  const backend = settings.STORAGE_BACKEND || "d1";
  if (backend === "supabase") {
    if (!settings.SUPABASE_URL || !settings.SUPABASE_SERVICE_ROLE_KEY)
      return json({ error: "Supabase storage is not configured." }, 503);
    return createHandler(
      supabaseStore(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY),
      settings.CRON_SECRET,
    )(request);
  }
  // A missing/misconfigured selected backend must never silently write elsewhere.
  if (backend !== "d1" || !env.DB)
    return json({ error: "Storage is unavailable." }, 503);
  return createHandler(
    d1Store(env.DB, env.BUCKET),
    settings.CRON_SECRET,
  )(request);
}
