# split/d/bill web beta

A persisted receipt-to-reimbursement application with **Supabase PostgreSQL and private Storage**, plus an isolated D1/R2 development mode. The default configuration remains an explicitly labelled simulation. Real quotes, durable reconciliation and existing-confidential-balance NEP-413 wallet signing are implemented. The owner-private Site now enables Solana USDC and Zcash in an explicit **Live testing · Real funds** mode; confidential sending stays disabled. All funded-acceptance flags remain false, and no funded acceptance test has completed. Sample bills remain simulations.

## Run locally

Use Node 24 LTS and npm. The current implementation uses React and Next.js App Router conventions through Vinext, with Sites Cloudflare Workers, D1 and private R2 storage. The native Next.js Vercel owner pilot is deployed and its canonical origin, owner login and API access checks passed. Supabase is connected through a server-only adapter and transactional RPCs. Native Next.js also builds and runs against Supabase.

From this directory:

```sh
node --version
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_jimmy_woo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_complete_bruce_banner.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_durable_live_payments.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_unique_live_deposit.sql
npm run dev -- --port 5173
```

Expect `node --version` to report v24.x, then open http://127.0.0.1:5173. Apply each migration once to a fresh local database; do not rerun it on an existing initialized database. Later migrations must be applied in order. `npm start -- --port 5173` previews the production build against the same local database. `.wrangler/` contains disposable local demo data and is ignored.

The npm legacy peer resolver is pinned in `.npmrc` because the host npm resolver crashed on the dependency graph. `package-lock.json` pins installed versions. No environment credentials are needed for the isolated demo.

## Run with Supabase and native Next.js

The configured hosted Supabase project has migrations 001–007 applied; migration 007 rejects duplicate live deposit instructions across shares. For a new project, apply `supabase/migrations/*.sql` in filename order. Do not rerun the initial migration on an existing database. Only the server role has table/function access; browser roles cannot call the RPCs.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in ignored `.env.local`, then:

```sh
node --env-file=.env.local scripts/check-supabase.mjs
npm run dev:next
```

Open http://127.0.0.1:5180. This mode uses real Supabase storage and still labels payment simulations. For a production Node build:

```sh
npm run build:next
APP_ORIGIN=http://127.0.0.1:5180 npm run start:next
```

Set `APP_ORIGIN` to the exact HTTPS deployment origin for hosting, without a trailing slash. It pins CSRF validation and secure cookies independently of proxy headers. The Vercel project uses `vercel.json` with `npm run build:next` and Node 24. The owner-password gate is implemented; the production deployment, canonical origin and hosted owner login are verified. See the reproducible hosting steps below.

Sites uses the Cloudflare entry point. Set hosted `STORAGE_BACKEND=supabase` plus the two server credentials using runtime secret configuration to use the same database. D1 remains available with `STORAGE_BACKEND=d1`; selecting an unavailable backend never silently falls back. Old D1 preview records are retained but are not copied to Supabase.

## Native Vercel owner pilot

Use Node 24 and Vercel CLI 65.15.0. The canonical address is [the standalone pilot](https://split-d-bill.vercel.app). Production deployment `dpl_43ft4CvWDSsMtcDBFcyHyBRaGbwN` is READY with this exact `APP_ORIGIN`. The earlier deployment's owner-password login and real-funds notice were verified; the updated deployment's unauthenticated API returned 401. This is not a new wallet acceptance test. `vercel.json` selects native Next.js with the `.next-native` output directory. `.vercelignore` excludes Sites-only configuration, including `vite.config.ts`, and local secrets/artifacts.

From the repository root:

```sh
cd app-web
node --version
npm ci
npx vercel@65.15.0 login
npx vercel@65.15.0 link --yes --project split-d-bill --scope youngjei326-9568s-projects
```

Expected result: Node reports v24.x, dependencies install, and this directory links to the existing Vercel project. In Vercel project settings select Node.js 24.x. Add server-only production configuration through the CLI prompts; commands below contain names only. Enter values privately, never in source or chat:

```sh
npx vercel@65.15.0 env add APP_ORIGIN --environment production --sensitive --yes
npx vercel@65.15.0 env add SUPABASE_URL --environment production --sensitive --yes
npx vercel@65.15.0 env add SUPABASE_SERVICE_ROLE_KEY --environment production --sensitive --yes
npx vercel@65.15.0 env add NEAR_INTENTS_API_KEY --environment production --sensitive --yes
npx vercel@65.15.0 env add CRON_SECRET --environment production --sensitive --yes
npx vercel@65.15.0 env add PRIVATE_TEST_PASSWORD --environment production --sensitive --yes
npx vercel@65.15.0 env add STANDALONE_PRIVATE_ACCESS --environment production --sensitive --yes
npx vercel@65.15.0 env add LIVE_PAYMENT_TESTING --environment production --sensitive --yes
npx vercel@65.15.0 env add LIVE_PAYMENTS_ENABLED --environment production --sensitive --yes
npx vercel@65.15.0 env add LIVE_ZCASH_ENABLED --environment production --sensitive --yes
npx vercel@65.15.0 env add LIVE_SOLANA_ENABLED --environment production --sensitive --yes
npx vercel@65.15.0 env add LIVE_CONFIDENTIAL_ENABLED --environment production --sensitive --yes
npx vercel@65.15.0 env add ZCASH_ACCEPTANCE_VERIFIED --environment production --sensitive --yes
npx vercel@65.15.0 env add SOLANA_ACCEPTANCE_VERIFIED --environment production --sensitive --yes
npx vercel@65.15.0 env add CONFIDENTIAL_ACCEPTANCE_VERIFIED --environment production --sensitive --yes
npm run typecheck
npm test
npm run build:next
npx vercel@65.15.0 deploy --prod --yes --scope youngjei326-9568s-projects
```

Use `APP_ORIGIN` equal to the exact canonical HTTPS origin above, without a trailing slash. Use a random owner password of at least 32 characters. Set `STANDALONE_PRIVATE_ACCESS=true` to protect bill creation and organizer pages, and `LIVE_PAYMENT_TESTING=true` for the owner pilot. Checkout requires a valid private share capability. Enable the global/Zcash/Solana switches for this pilot; leave confidential sending and every acceptance flag false. `PRIVATE_LIVE_TEST_HOST` is Sites-only and must not authorize native access. Do not replace existing production environment values blindly; inspect variable names in Vercel settings first. Deployment is an operator action requiring authorization.

Receipt cleanup defaults off and does not require migration 008 to deploy. Before enabling `RECEIPT_CLEANUP_ENABLED`, apply Supabase migration `202611140008_receipt_retention.sql` to the linked project. Without its service-only functions, enabled cleanup reports a failure after payment reconciliation runs. The existing hosted deployment predates this migration. The Vercel firewall now has one active production rule limiting bill-create, upload and quote POSTs to 30 requests per IP per 60 seconds; it does not limit payment refresh or reconciliation. This edge rule does not replace the app's atomic shared budgets or funded acceptance.

Expected result with the owner-private settings above: the canonical URL opens the owner-password form; unauthenticated bill creation and organizer API requests are denied. A valid private share link opens only that friend's checkout; an invalid or missing capability cannot read or create a payment request. Owner login creates an origin-bound, HTTP-only signed session for 12 hours. Native access never trusts Sites identity headers. Open **Try a sample bill** → expect **Demo · No real payments**. Start a manual/uploaded bill → expect **Pilot testing · Real funds**. Do not treat either UI check as wallet/refund acceptance. The earlier hosted deployment passed owner login and API checks; it predates the scoped payer change, so hosted payer access has not yet been verified. These checks made no funded payment.

## Demo walkthrough

1. **Try a sample bill** → synthetic 200 AED receipt details appear. Alternatively upload a JPG/PNG/WebP under 5 MB or enter details manually. OCR is not connected: uploads always ask for manual details.
2. Correct the name, total, currency, extra charges and diner count. Only add charges not already included in the receipt. Paste your full internal `nearcom:` receiving address; **Where do I find this?** opens instructions. For isolated tests only, use synthetic `nearcom:demo.near` (never send funds to it).
3. **Review split** → confirm the receiving address and approve the dated fiat reference rate and USDC amounts. One USD equals one USDC for bill accounting; this is not a swap quote. A dated, labelled demo reference rate is used if the rate service fails.
4. **Create demo requests** → one persisted bill and N−1 individual reimbursement shares. The organizer's share is excluded from the reimbursement total.
5. **Share link** on a friend → copy that private link or scan its invitation QR. It opens a checkout, never a fundable wallet request.
6. Open checkout → choose Zcash, confidential USDC or Solana USDC → **Try … demo** → **Simulate successful payment**. No address, live quote, wallet signature or spending submission exists in this mode.
7. The organizer page updates within about five seconds while open. Close it, reopen the app and select **Your bills** → open the saved bill to see current payment progress. **Keep your organizer link** exposes a private recovery link for a different browser; save it privately. **Test another outcome** exercises expiry, failure, refund and late settlement.

The owner-private Sites deployment is for owner review and explicitly authorized wallet testing. Friends cannot use it until an explicitly authorized audience change/deployment is made. Individual application capabilities remain required even within the hosting access boundary.

## Privacy and correctness

- Random organizer capability, per-share derived capabilities and hashes stored in the database.
- Tokens travel in URL fragments, are exchanged through same-origin POST for scoped HTTP-only cookies, and are removed after successful access and organizer persistence. If browser storage is blocked, the organizer fragment remains available for manual recovery. HTTP request URLs/referrers do not include fragments. Do not share organizer links or disclose private share links.
- Cookies last seven days. Authorized organizer capabilities are remembered in browser-local storage and can restore the cookie from **Your bills**. The private organizer recovery link also works in a fresh browser. Clearing browser data or using a different browser removes automatic discovery; losing both saved browser access and the recovery link loses access. There is no wallet-address lookup or cloud account recovery. The list retains up to 50 bills; save private recovery links for older bills. Removing a list entry does not revoke existing cookies or copies of the link. Organizer capabilities are bearer secrets; the browser index stores only the token, bill ID, title and save time, never receipt or receiving-wallet data.
- Receipts remain in a private bucket. Reading requires organizer or individual share authorization. Images become inaccessible after seven days. Local code deletes expired objects and receipt metadata in batches through the authenticated reconciliation endpoint; deployment and migration 008 are still required before this cleanup runs on the hosted pilot.
- Atomic batches and unique keys prevent duplicate creation and repeated payment requests. One share is counted once even if multiple attempts settle. Old attempts are retained.
- No API exposes other diners' capabilities to a payer, or raw provider metadata. Local rate limits bound creation, upload, FX and attempt calls per session/share and with shared cost budgets; the production edge rule bounds selected writes per IP. Shared budgets can be exhausted by an attacker and are not proof of public-launch readiness.
- No secret is bundled into the client. No analytics or external font/image requests are present.

## Integrations and limits

| Integration | Actual status |
| --- | --- |
| D1 / R2 | Implemented for the Sites preview and local emulator |
| Fiat reference rates | Frankfurter adapter with dated, labelled fixture fallback in demo |
| NEAR AI | Server adapter implemented; no model/credential verified; upload route deliberately uses manual entry |
| Confidential Intents | Quote allocation, strict signatures, route binding and reconciliation implemented; owner-only Solana/Zcash testing enabled; confidential spending disabled; funded acceptance incomplete |
| ZIP-321 | Exact-amount payment QR/open/copy from verified executable quotes; VIZOR/Zodl device/refund tests pending; no fundable request in demo |
| Wallet signing | NEAR Connect 0.12.0 + NEP-413 for a compatible external NEAR wallet with an existing confidential balance; near.com-created passkey bridge unavailable |
| Supabase | Server adapter, atomic bill/attempt operations, rate limits and private receipt storage implemented |
| Cron | Supabase pg_cron/pg_net job runs every minute with a Vault-held token; HTTP 200 empty-run result verified |

`POST /api/reconcile` requires a server-configured `CRON_SECRET` bearer token. The local version also deletes up to 20 expired receipts per call, after their seven-day access period; a failed storage deletion retains metadata for a retry. It expires demo attempts, cleans rate counters and reconciles stored live attempts through the provider, up to 20 per call with concurrency 3. It remains available for settlement when new-payment gates are disabled. Live checkout additionally polls its own capability-scoped reconciliation every 15 seconds while visible. Supabase `pg_cron`/`pg_net` now run job `splitdbill-reconcile` (job ID 1) every minute. The existing server token is stored in Vault as `splitdbill_reconcile_token`. A real scheduled HTTP 200 response with `{ok:true,checked:0,updated:0,unavailable:0}` was verified; this confirms background invocation, not funded settlement.

The repeatable operational script is [reconciliation-cron.sql](supabase/operations/reconciliation-cron.sql). In a new project's SQL editor: store the server's existing `CRON_SECRET` privately in Vault under `splitdbill_reconcile_token`, then run that script → expect one active `splitdbill-reconcile` job with schedule `* * * * *`. Inspect `net._http_response` after the next minute → expect status 200 and the reconciliation result. The SQL contains no secret value, performs status reads and never signs or sends wallet funds. The file also contains the command to pause the job when owner testing ends.

See [credential setup](../docs/technical/SETUP.md) and [implementation direction](../docs/technical/DESIGN.md). Partner dry-quote access is verified. Organizer entry now requires the full internal `nearcom:` address, with format validation, finding instructions and confirmation before saving. The normalized account is immutable on the bill and omitted from diner responses. No organizer wallet login or ownership proof is required. The planned execution route strips the display prefix and uses `CONFIDENTIAL_INTENTS`; real dry quotes to the supplied account passed. The owner-only pilot can allocate real Solana/Zcash payment requests. General rollout and confidential-balance spending remain disabled. Existing confidential payers can connect a supported external NEAR wallet, review the stored exact intent and explicitly sign it; near.com-created passkey accounts are not supported by that connector. Real device, refund and funded settlement checks remain pending. Credentials alone do not enable these paths.

See the [payment adapter and near.com handoff](../docs/technical/PAYMENT_ADAPTER.md) for verified behavior and remaining integration work. `npm run check:intents` explicitly runs nine unfunded, signed route estimates across Zcash, confidential USDC and Solana USDC using the local partner key; it creates no payment address and saves sanitized evidence. It is separate from default tests and the hosted application.

## Validation

```sh
npm run typecheck
npm test
npx playwright install chromium
# Run the local server first, then:
npm run test:e2e
# Against the native Next.js + Supabase server:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5180 npm run test:e2e
```

Vitest includes an embedded PostgreSQL engine that executes the actual migrations, tests transaction rollback, access grants, duplicate requests, late updates and bigint serialization. Native-origin tests cover proxy requests and spoofed headers. Playwright uses separate browser contexts to check organizer/diner access boundaries and tests mobile and desktop journeys. It also tests image fallback/privacy, stale requests, concurrent retries, late settlement, refunds, keyboard entry, reduced motion and small-screen overflow. Outputs are synthetic data only. Real VIZOR/Zodl app handoffs and real payments are not tested by this suite.

## Visual design

The porcelain/petrol design uses the user-approved editorial layout and pixel receipt motif, with a large centered split/d/bill wordmark, sharp rules, self-hosted Space Grotesk and pixel receipt graphics. Creation, checkout and organizer history share the same styling. Reduced-motion preferences disable animation; payment statuses and rollout gates are unchanged. The font license is included in `public/fonts/OFL-Space-Grotesk.txt`. See [design direction](../docs/technical/DESIGN.md).

## Publishing

`.openai/hosting.json` owns the existing Site ID. Never create another Site for this app. Use the Sites skill source workflow to build, synchronize the exact source and publish privately. D1 migrations are included in the artifact; local data is not. Keep `.env*`, `.dev.vars*`, `.wrangler`, `.sites-runtime`, test traces and credentials out of Git and deployment archives.

The application is kept in the original GitHub project. Sites publication uses a sanitized copy of this directory so the hosting source repository does not replace the project's Git remote.

## Payment integration and activation

See [wallet compatibility](../docs/technical/WALLET_COMPATIBILITY.md) for source evidence and remaining real-wallet checks. Public HTTP routes use existing private capabilities and same-origin POST checks:

- `POST /api/bills` accepts explicit `mode: live` only when at least one route is enabled. Omitted mode stays demo; sample bills always stay demo. Live FX never falls back to fixture rates.
- `POST /api/shares/:id/attempts` accepts method, requestKey and refundAddress; amounts, token and recipient come from the saved bill/share.
- `POST /api/shares/:id/prepare` accepts attemptId and signer; returns the exact server-stored NEP-413 review payload.
- `POST /api/shares/:id/submit` accepts attemptId plus accountId/publicKey/signature only. It cannot accept an altered intent, amount or recipient. A wallet signature spends funds; no signing happens automatically.
- `POST /api/shares/:id/refresh` reconciles only that authorized share. `POST /api/reconcile` requires CRON_SECRET and reconciles globally.

Credentials alone never enable a route. General rollout requires global activation, a per-method switch and that method's acceptance switch. The pilot uses `LIVE_PAYMENT_TESTING=true` plus verified server-side owner access, or the explicitly configured public pilot described below, to allow Solana/Zcash testing before acceptance. It still requires `LIVE_PAYMENTS_ENABLED`, the route switch and `NEAR_INTENTS_API_KEY`; all acceptance flags stay false. Confidential spending has no testing bypass. Set acceptance only after wallet-device, refund, late-payment and actual confidential-credit checks. Hosted secrets and scheduling remain separate from local environment values.

Executable quotes and generated signer payloads are private server records. Atomic reservations prevent duplicate quote allocation and duplicate intent submission. Timeout/unknown outcomes retain their lock. Once an executable quote exists, replacement quotes for that share remain blocked even after failure/refund, because provider finality/cancellation has not been verified; organizer review is required. Same-key network retries reuse the existing attempt, and cancelling a wallet prompt before submission does not spend funds. Old requests continue reconciliation; once any deposit is detected, payment instructions cannot reappear following a status regression.


### Regenerate app icons

From `app-web`, run `node scripts/generate-brand-icons.mjs`. Expected result: SVG/ICO and PNG favicon, Apple touch and app icons are regenerated in `public/` from the `PixelReceipt` matrix in `components/task-frame.tsx`, using the porcelain/petrol brand colors. `public/site.webmanifest` declares the app icons; this adds home-screen branding, not offline functionality.


### Solana USDC requests (November 13)

Migration `supabase/migrations/202611130006_solana_usdc_method.sql` extends the method constraint to `solana`, preserving data and permissions. It was applied to the splitdbill Supabase project on November 13; fresh deployments must apply migrations 001–007 in order. D1 needs no Solana-specific migration, but its later deposit-identity guard is migration `0003`.

1. Start the local app and choose **Try a sample bill** → create demo requests using a synthetic receiving account.
2. Open a private diner checkout → choose **Solana wallet (USDC)** → **Try Solana USDC demo**. Expect a clearly labelled simulated request, with no wallet link or fundable address.
3. Simulate successful payment → the organizer sees one paid share. Reloading preserves it.
4. To check the real provider without funds, from `app-web` run `node --env-file=.env.local ./node_modules/vitest/vitest.mjs run --config vitest.live.config.ts checks/solana-live.test.ts`. Expect three verified dry quotes and sanitized evidence; no deposit address or transaction signature.

The implemented real route uses exact-output mainnet Solana USDC → confidential USDC and Solana Pay QR/copy instructions. The `solana:` URI is encoded in the QR for wallets that support scanning it; it is not presented as a browser wallet-launch button. On the same phone, open the wallet's Send flow, select USDC on Solana, and paste the exact address and amount. It pins the USDC mint and validates amounts, quote signatures, expiry and wallet-owner address format. Ordinary keypair wallet addresses are supported; off-curve PDA/ATA addresses and memo-dependent quotes are rejected. An address-format check cannot establish ownership or recognize every exchange/token account.

`LIVE_SOLANA_ENABLED` is true in the owner-only Sites and Vercel pilots; `SOLANA_ACCEPTANCE_VERIFIED` remains false. Real Solana-wallet compatibility, SOL fees, refund delivery and actual confidential credit are unverified. A dry quote or simulated payment is not acceptance. Solana signing stays in the user's wallet; no sender privacy layer is added.

### Public real-funds pilot

The public pilot is unverified and can create real payment requests. To open it on native Vercel, configure `STANDALONE_PRIVATE_ACCESS=false`, `PUBLIC_LIVE_PILOT=true`, and `LIVE_PAYMENT_TESTING=true`, alongside `LIVE_PAYMENTS_ENABLED=true`, the desired `LIVE_ZCASH_ENABLED` and `LIVE_SOLANA_ENABLED` switches, and the server-only `NEAR_INTENTS_API_KEY`. Leave `LIVE_CONFIDENTIAL_ENABLED=false` and all acceptance flags false. Anyone with the URL can create a live bill; each payer still needs its individual share capability. This is not a general verified rollout. Restore `STANDALONE_PRIVATE_ACCESS=true` and disable `PUBLIC_LIVE_PILOT` to return to owner-only access. Changing production environment values and deploying are separate operator actions.

`RECEIPT_CLEANUP_ENABLED` defaults to false, independently of payment reconciliation. Before enabling it on Supabase, apply migration `202611140008_receipt_retention.sql`; for D1 apply the corresponding receipt retention migration. Until then receipt cleanup does not run, so retained receipt objects require operational attention. With cleanup enabled, failures are reported by the reconciliation endpoint after payment reconciliation has run.
