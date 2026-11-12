# split/d/bill web beta

A persisted receipt-to-reimbursement application with **Supabase PostgreSQL and private Storage**, plus an isolated D1/R2 development mode. The default configuration remains an explicitly labelled simulation. Real Zcash quotes, durable reconciliation and existing-confidential-balance NEP-413 wallet signing are implemented behind disabled, per-route gates. No user wallet has been connected and no funded acceptance test has run.

## Run locally

Use Node 24 LTS and npm. The current implementation uses React and Next.js App Router conventions through Vinext, with Sites Cloudflare Workers, D1 and private R2 storage. It is not deployed to Vercel. Supabase is connected through a server-only adapter and transactional RPCs. Native Next.js also builds and runs against Supabase.

From this directory:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_jimmy_woo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_complete_bruce_banner.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_durable_live_payments.sql
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173. Apply each migration once to a fresh local database; do not rerun it on an existing initialized database. Later migrations must be applied in order. `npm start -- --port 5173` previews the production build against the same local database. `.wrangler/` contains disposable local demo data and is ignored.

The npm legacy peer resolver is pinned in `.npmrc` because the host npm resolver crashed on the dependency graph. `package-lock.json` pins installed versions. No environment credentials are needed for the isolated demo.

## Run with Supabase and native Next.js

The configured Supabase project has all five migrations applied. For a new project, apply `supabase/migrations/*.sql` in filename order. Do not rerun the initial migration on an existing database. Only the server role has table/function access; browser roles cannot call the RPCs.

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

Set `APP_ORIGIN` to the exact HTTPS deployment origin for hosting, without a trailing slash. It pins CSRF validation and secure cookies independently of proxy headers. A Vercel deployment can use `npm run build:next`; no Vercel project has been provisioned.

Sites uses the Cloudflare entry point. Set hosted `STORAGE_BACKEND=supabase` plus the two server credentials using runtime secret configuration to use the same database. D1 remains available with `STORAGE_BACKEND=d1`; selecting an unavailable backend never silently falls back. Old D1 preview records are retained but are not copied to Supabase.

## Demo walkthrough

1. **Try a sample bill** → synthetic 200 AED receipt details appear. Alternatively upload a JPG/PNG/WebP under 5 MB or enter details manually. OCR is not connected: uploads always ask for manual details.
2. Correct the name, total, currency, extra charges and diner count. Only add charges not already included in the receipt. Paste your full internal `nearcom:` receiving address; **Where do I find this?** opens instructions. For isolated tests only, use synthetic `nearcom:demo.near` (never send funds to it).
3. **Review split** → confirm the receiving address and approve the dated fiat reference rate and USDC amounts. One USD equals one USDC for bill accounting; this is not a swap quote. A dated, labelled demo reference rate is used if the rate service fails.
4. **Create demo requests** → one persisted bill and N−1 individual reimbursement shares. The organizer's share is excluded from the reimbursement total.
5. **Share link** on a friend → copy that private link or scan its invitation QR. It opens a checkout, never a fundable wallet request.
6. Open checkout → choose Zcash or confidential USDC → **Try … demo** → **Simulate successful payment**. No address, live quote, wallet signature or spending submission exists in this mode.
7. The organizer page updates within about five seconds while open. Close it, reopen the app and select **Your bills** → open the saved bill to see current payment progress. **Keep your organizer link** exposes a private recovery link for a different browser; save it privately. **Test another outcome** exercises expiry, failure, refund and late settlement.

The owner-private Sites deployment is for the owner to review. Friends cannot use it until an explicitly authorized audience change/deployment is made. Individual application capabilities remain required even within the hosting access boundary.

## Privacy and correctness

- Random organizer capability, per-share derived capabilities and hashes stored in the database.
- Tokens travel in URL fragments, are exchanged through same-origin POST for scoped HTTP-only cookies, and are removed after successful access and organizer persistence. If browser storage is blocked, the organizer fragment remains available for manual recovery. HTTP request URLs/referrers do not include fragments. Do not share organizer links or disclose private share links.
- Cookies last seven days. Authorized organizer capabilities are remembered in browser-local storage and can restore the cookie from **Your bills**. The private organizer recovery link also works in a fresh browser. Clearing browser data or using a different browser removes automatic discovery; losing both saved browser access and the recovery link loses access. There is no wallet-address lookup or cloud account recovery. The list retains up to 50 bills; save private recovery links for older bills. Removing a list entry does not revoke existing cookies or copies of the link. Organizer capabilities are bearer secrets; the browser index stores only the token, bill ID, title and save time, never receipt or receiving-wallet data.
- Receipts remain in a private bucket. Reading requires organizer or individual share authorization. Images become inaccessible after seven days; automatic object deletion is not scheduled yet.
- Atomic batches and unique keys prevent duplicate creation and repeated payment requests. One share is counted once even if multiple attempts settle. Old attempts are retained.
- No API exposes other diners' capabilities to a payer, or raw provider metadata. Rate limits bound creation, upload, FX and attempt calls per session/share.
- No secret is bundled into the client. No analytics or external font/image requests are present.

## Integrations and limits

| Integration | Actual status |
| --- | --- |
| D1 / R2 | Implemented for the Sites preview and local emulator |
| Fiat reference rates | Frankfurter adapter with dated, labelled fixture fallback in demo |
| NEAR AI | Server adapter implemented; no model/credential verified; upload route deliberately uses manual entry |
| Confidential Intents | Quote allocation, strict signatures, exact route binding and status reconciliation implemented; unfunded ZEC status and confidential intent generation verified; execution gates remain disabled |
| ZIP-321 | Exact-amount payment QR/open/copy from verified executable quotes; VIZOR/Zodl device/refund tests pending; no fundable request in demo |
| Wallet signing | NEAR Connect 0.12.0 + NEP-413 for a compatible external NEAR wallet with an existing confidential balance; near.com-created passkey bridge unavailable |
| Supabase | Server adapter, atomic bill/attempt operations, rate limits and private receipt storage implemented |
| Cron | Protected provider reconciliation endpoint implemented; no recurring schedule configured |

`POST /api/reconcile` requires a server-configured `CRON_SECRET` bearer token. It expires demo attempts, cleans rate counters and reconciles stored live attempts through the provider, up to 20 per call with concurrency 3. It remains available for settlement when new-payment gates are disabled. Live checkout additionally polls its own capability-scoped reconciliation every 15 seconds while visible. Configure a server scheduler before live rollout; no schedule is installed.

See [credential setup](../docs/technical/SETUP.md) and [implementation direction](../docs/technical/DESIGN.md). Partner dry-quote access is verified. Organizer entry now requires the full internal `nearcom:` address, with format validation, finding instructions and confirmation before saving. The normalized account is immutable on the bill and omitted from diner responses. No organizer wallet login or ownership proof is required. The planned execution route strips the display prefix and uses `CONFIDENTIAL_INTENTS`; real dry quotes to the supplied account passed. Actual payment execution is still disabled by configuration. Existing confidential payers can connect a supported external NEAR wallet, review the stored exact intent and explicitly sign it; near.com-created passkey accounts are not supported by that connector. Real device, refund and funded settlement checks remain pending. Credentials alone do not enable these paths.

See the [payment adapter and near.com handoff](../docs/technical/PAYMENT_ADAPTER.md) for verified behavior and remaining integration work. `npm run check:intents` explicitly runs six unfunded, signed route estimates using the local partner key; it creates no payment address and saves sanitized evidence. It is separate from default tests and the hosted application.

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

The November 12 cream/blue redesign follows the user-approved NEAR Hackathon reference, with a large centered split/d/bill wordmark, sharp rules, self-hosted Space Grotesk and pixel receipt graphics. Creation, checkout and organizer history share the same styling. Reduced-motion preferences disable animation; payment statuses and rollout gates are unchanged. The font license is included in `public/fonts/OFL-Space-Grotesk.txt`. See [design direction](../docs/technical/DESIGN.md).

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

Enable neither route merely because credentials exist. The default-off switches in `.env.example` require global activation, a per-method switch and that method's acceptance switch. Set acceptance only after explicitly authorized wallet-device, refund, late-payment and actual confidential-credit checks. Hosted secrets and scheduler configuration are separate from local environment values.

Executable quotes and generated signer payloads are private server records. Atomic reservations prevent duplicate quote allocation and duplicate intent submission. Timeout/unknown outcomes retain their lock. Once an executable quote exists, replacement quotes for that share remain blocked even after failure/refund, because provider finality/cancellation has not been verified; organizer review is required. Same-key network retries reuse the existing attempt, and cancelling a wallet prompt before submission does not spend funds. Old requests continue reconciliation; once any deposit is detected, payment instructions cannot reappear following a status regression.
