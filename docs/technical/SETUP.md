# Credentials for the next integration phase

The current deployed demo does not need any of these credentials. It uses Sites D1/R2 and cannot accept real funds. This guide prepares the originally planned integrations; it does not imply they are enabled by adding keys.

## Local file

From the repository root, create the ignored environment file without overwriting an existing one:

```sh
cd app-web
cp -n .env.example .env.local
```

Open `.env.local` in your editor. Fill values after the equals signs. Never paste them into chat, commit them, add `NEXT_PUBLIC_` prefixes, or include them in screenshots.

## 1. Supabase

1. Open https://supabase.com/dashboard and create a project. Choose a free plan if available and sufficient. Keep the generated database password in your own password manager; the current API integration does not need it in chat.
2. In the project **Connect** dialog or project API settings, copy the project URL into `SUPABASE_URL`.
3. In **Settings → API Keys**, use a server-only secret key (`sb_secret_…`), or the legacy `service_role` key. Store it as `SUPABASE_SERVICE_ROLE_KEY`; the variable name is retained for compatibility even when using a new secret key. Never use it in browser code. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).
4. The staged schema is `app-web/supabase/migrations/202611100001_beta.sql`. Apply the initial migration followed by `202611100002_application_modes.sql`; together they create application tables with explicit live/test modes, row-level security and a private `receipts` bucket. The corrected combined fresh-project script is supplied in outputs/supabase-initial-setup.sql. It has not been run against your project. Once the project is available, apply and verify the migration and implement the PostgreSQL transaction adapter before switching the application from D1. Do not point it at a database containing unrelated existing tables with the same names.
5. You do not need Supabase Auth email signup for the current capability-link demo. Wallet authorization remains a separate integration requirement.

## 2. NEAR AI Cloud

1. For the hackathon credit, join https://nearbuilders.org/join and claim through https://nearbuilders.org/dashboard. The organizer guide describes a separate API key with a $10 balance. Those credits do not appear in the normal cloud.near.ai account dashboard.
2. Alternatively create a key in https://cloud.near.ai. Do not buy credits solely to complete this setup unless you choose to.
3. Put the key into `NEAR_AI_API_KEY`.
4. Leave `NEAR_AI_MODEL` empty initially. We must verify current model availability and image-input support with your key, select the intended privacy tier, and test a synthetic receipt. A text-only model is unsuitable. Model-list requests previously failed without usable results.
5. After those checks, wire the existing extraction adapter into the upload route with rate limits and confirmation. The current demo intentionally never calls it or spends credits.

Official sources: [quickstart](https://docs.near.ai/cloud/quickstart), [model tiers](https://docs.near.ai/cloud/models), [hackathon credit terms](https://nearhackathon.com/HACKATHON.md).

## 3. Confidential Intents partner access

1. Register at https://partners.near-intents.org.
2. Obtain the partner API credential and save it as `NEAR_INTENTS_API_KEY`. The official docs support `X-API-Key`; a partner JWT is not the same credential as a wallet-owner session.
3. If confidential access is not explicitly available, ask partner support for the scope below. No message has been sent on your behalf.

Suggested support request:

> I am building split/d/bill for the NEAR hackathon. An organizer receives USDC in a user-controlled Confidential Intents balance. Friends pay either shielded-source ZEC from VIZOR/Zodl or USDC from their own Confidential Intents balance. Please enable/confirm partner access for exact-output ZEC → confidential USDC and confidential USDC → another user's confidential USDC. Please confirm supported Zcash refund-address formats, minimum amounts, expiry/late-deposit behavior, confidential metadata access, and the supported wallet/account signing interface for organizer ownership proof and payer spending authorization.

4. Once access is configured, verify dry quotes and authorization without funds. An enabled key does not establish that refunds, third-party receiving or near.com wallet signing work.
5. Funded tests require a separately agreed small budget and your wallet approval. Never supply a seed phrase or spending private key to the app or this chat.

Sources: [partner authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication), [signed intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution).

## 4. Hosting and background checks

The current Site is owner-private and uses its own runtime/storage. Local `.env.local` values are not automatically deployed; do not assume keys on your machine configure the hosted Site.

Vercel is optional for this first preview. A later Vercel deployment needs an appropriate account/plan, a native Next.js build and the completed Supabase adapter. Background reconciliation must verify actual provider settlement; the current protected endpoint only expires simulated requests. No scheduled job is provisioned. Do not configure a live job around the demo endpoint.

Tell me when the local values are configured, without sending the values. I can check presence and perform bounded non-spending integration checks next.
