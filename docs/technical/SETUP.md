# Credentials for the next integration phase

The Supabase server adapter is implemented and the project migrations are applied. Native Next.js uses it directly; Sites selects it with `STORAGE_BACKEND=supabase`. Database credentials do not enable payments or OCR. The private Sites owner pilot now has a hosted partner key and explicit real-funds Solana/Zcash testing gates; all acceptance flags remain false.

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
4. The configured project has migrations `202611100001_beta.sql`, `202611100002_application_modes.sql`, `202611100003_server_adapter.sql`, and `202611100004_receiving_account.sql`, `202611110005_durable_live_payments.sql`, and `202611130006_solana_usdc_method.sql` applied. The third migration was explicitly approved and grants access only to the server role, adds transaction functions and rate limits, and preserves existing records. The fourth adds the immutable receiving account; the fifth adds private quote/signing records and atomic payment functions. Legacy data and browser access restrictions are preserved. For a different fresh project, run all migrations in order. Do not rerun them against this initialized project.
5. Validate access from `app-web` with `node --env-file=.env.local scripts/check-supabase.mjs`. Start native Next.js with `npm run dev:next`, then open http://127.0.0.1:5180. For a production Next.js server, set `APP_ORIGIN` to its exact public origin without a trailing slash. See the application README for build/test commands.
6. You do not need Supabase Auth email signup for the current capability-link demo. The organizer supplies a confirmed confidential receiving account without wallet login. Payer authorization is required when spending a confidential balance.

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
3. Partner quote access is now verified for this project. Internal near.com account routing is verified with signed dry quotes, and the app saves the pasted recipient. Next validate payer signing and settlement; see [the precise integration question](PAYMENT_ADAPTER.md). The broader request below remains useful for a new partner account. No message has been sent on your behalf.

Suggested support request:

> I am building split/d/bill for the NEAR hackathon. An organizer receives USDC in a user-controlled Confidential Intents balance. Friends pay either shielded-source ZEC from VIZOR/Zodl or USDC from their own Confidential Intents balance. Please enable/confirm partner access for exact-output ZEC → confidential USDC and confidential USDC → another user's confidential USDC. Please confirm supported Zcash refund-address formats, minimum amounts, expiry/late-deposit behavior, confidential metadata access, and the supported account identifier for confidential receiving and wallet signing interface for payer spending authorization.

4. Once access is configured, verify dry quotes and authorization without funds. An enabled key does not establish that refunds, third-party receiving or near.com wallet signing work.
5. Funded tests require a separately agreed small budget and your wallet approval. Never supply a seed phrase or spending private key to the app or this chat.

Sources: [partner authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication), [signed intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution).

## 4. Hosting and background checks

The current Site is owner-private and uses its own runtime/storage. Local `.env.local` values are not automatically deployed; do not assume keys on your machine configure the hosted Site.

Native Next.js and the Supabase adapter are implemented. A native Vercel production build is deployed; the canonical origin is `https://split-d-bill.vercel.app`. The final deployment applies this origin; hosted owner-password login and API access checks passed. Follow the exact Node 24 / Vercel CLI 65.15.0 commands in the [application README](../../app-web/README.md#native-vercel-owner-pilot). The protected reconciliation endpoint expires demo attempts and checks stored live provider settlements. Supabase `pg_cron` and `pg_net` are installed. Job ID 1, `splitdbill-reconcile`, runs every minute using the existing `CRON_SECRET` saved privately in Vault as `splitdbill_reconcile_token`. A scheduled HTTP 200 `{ok:true,checked:0,updated:0,unavailable:0}` response was verified. Repeatable setup and pause SQL is in [reconciliation-cron.sql](../../app-web/supabase/operations/reconciliation-cron.sql); no token value appears in the file. This verifies invocation, not funded settlement.

Tell me when the local values are configured, without sending the values. I can check presence and perform bounded non-spending integration checks next.

## Payment activation checkpoint — November 11

Historical November 11 checkpoint: the executable backend and external NEAR-wallet signing path were implemented while the partner key was local and hosted execution disabled. The owner-only pilot below supersedes that hosting state. Do not set acceptance switches merely to try the UI. First arrange explicitly authorized, bounded wallet/device tests and verify actual confidential credit/refunds. Existing confidential payers need the same compatible external NEAR account that controls their balance; near.com-created passkey accounts require a separate integration. No key export or replacement account is needed.

Before general rollout, configure the provider key and CRON_SECRET in server-only hosting secrets and schedule POST /api/reconcile. Closing a browser must not stop settlement checks. Retain the rollout gates until the complete acceptance record exists. See the app README and WALLET_COMPATIBILITY.md.


## November 13 — Solana USDC addition

Supabase migration 006 is applied. New projects must run migrations 001–006 in order. The third route uses the existing partner key; it does not need a separate Solana RPC credential for generating payment requests. The payer's compatible wallet signs and sends the Solana Pay USDC transfer and supplies SOL network fees. At the initial Solana release both execution and acceptance switches stayed false. The subsequent owner-only pilot below enables testing without asserting acceptance.


## November 13 — Owner-only real-funds pilot

The private Sites deployment now has the partner key and enables Solana USDC/Zcash request creation for its authenticated owner. `LIVE_PAYMENT_TESTING` separates this testing from general acceptance. It requires `LIVE_PAYMENTS_ENABLED`, the selected route switch and the provider key. Every acceptance flag remains false; confidential sending remains disabled. The interface labels manual/uploaded bills **Live testing · Real funds**; **Try a sample bill** always stays a demo.

Sites grants the testing exception only in the Cloudflare runtime with `PRIVATE_LIVE_TEST_HOST` and the platform-authenticated owner-private identity boundary. This flag is not a substitute for private hosting. Native Vercel uses its own owner password and signed origin-bound session; spoofed Sites identity headers cannot establish native access. Missing owner access fails closed. Keep the owner password private and at least 32 random characters. See the application README for environment variable names and hosting commands.

Use only the owner's wallets and approve payment manually in the wallet. No seed phrase, spending private key or automatic send is required. A real payment request can receive funds; quotes and UI tests do not verify wallet prefill, refunds or actual confidential credit. Record those acceptance outcomes separately before changing acceptance flags. The Vercel production build and recurring reconciliation are deployed. Canonical-origin deployment and hosted owner login are verified; funded wallet/refund acceptance is still incomplete.
