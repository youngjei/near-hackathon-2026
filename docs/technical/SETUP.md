# Credentials for the next integration phase

The Supabase server adapter is implemented and the project migrations are applied. Native Next.js uses it directly; Sites selects it with `STORAGE_BACKEND=supabase`. Payment execution and OCR remain separate integrations and are not enabled by database credentials.

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
4. The configured project has migrations `202611100001_beta.sql`, `202611100002_application_modes.sql`, and `202611100003_server_adapter.sql` applied. The third migration was explicitly approved and grants access only to the server role, adds transaction functions and rate limits, and preserves existing records. For a different fresh project, run all migrations in order. Do not rerun them against this initialized project.
5. Validate access from `app-web` with `node --env-file=.env.local scripts/check-supabase.mjs`. Start native Next.js with `npm run dev:next`, then open http://127.0.0.1:5180. For a production Next.js server, set `APP_ORIGIN` to its exact public origin without a trailing slash. See the application README for build/test commands.
6. You do not need Supabase Auth email signup for the current capability-link demo. Wallet authorization remains a separate integration requirement.

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
3. Partner quote access is now verified for this project. The remaining specific dependency is the near.com passkey account/signing handoff; see [the precise integration question](PAYMENT_ADAPTER.md). The broader request below remains useful for a new partner account. No message has been sent on your behalf.

Suggested support request:

> I am building split/d/bill for the NEAR hackathon. An organizer receives USDC in a user-controlled Confidential Intents balance. Friends pay either shielded-source ZEC from VIZOR/Zodl or USDC from their own Confidential Intents balance. Please enable/confirm partner access for exact-output ZEC → confidential USDC and confidential USDC → another user's confidential USDC. Please confirm supported Zcash refund-address formats, minimum amounts, expiry/late-deposit behavior, confidential metadata access, and the supported wallet/account signing interface for organizer ownership proof and payer spending authorization.

4. Once access is configured, verify dry quotes and authorization without funds. An enabled key does not establish that refunds, third-party receiving or near.com wallet signing work.
5. Funded tests require a separately agreed small budget and your wallet approval. Never supply a seed phrase or spending private key to the app or this chat.

Sources: [partner authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication), [signed intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution).

## 4. Hosting and background checks

The current Site is owner-private and uses its own runtime/storage. Local `.env.local` values are not automatically deployed; do not assume keys on your machine configure the hosted Site.

Vercel is optional for this first preview. Native Next.js and the Supabase adapter are implemented. A Vercel deployment still needs an appropriate account/plan and server environment configuration. Background reconciliation must verify actual provider settlement; the current protected endpoint only expires simulated requests. No scheduled job is provisioned. Do not configure a live job around the demo endpoint.

Tell me when the local values are configured, without sending the values. I can check presence and perform bounded non-spending integration checks next.
