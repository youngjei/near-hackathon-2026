# split/d/bill web beta

A persisted receipt-to-reimbursement application with **Supabase PostgreSQL and private Storage**, plus an isolated D1/R2 development mode. Payment execution remains simulated. No live payment can be created, no wallet is connected, and no real funds move. All simulation controls say so explicitly.

## Run locally

Use Node 24 LTS and npm. The current implementation uses React and Next.js App Router conventions through Vinext, with Sites Cloudflare Workers, D1 and private R2 storage. It is not deployed to Vercel. Supabase is connected through a server-only adapter and transactional RPCs. Native Next.js also builds and runs against Supabase.

From this directory:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_jimmy_woo.sql
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173. Apply the migration once to a fresh local database; do not rerun it on an existing initialized database. Later migrations must be applied in order. `npm start -- --port 5173` previews the production build against the same local database. `.wrangler/` contains disposable local demo data and is ignored.

The npm legacy peer resolver is pinned in `.npmrc` because the host npm resolver crashed on the dependency graph. `package-lock.json` pins installed versions. No environment credentials are needed for the isolated demo.

## Run with Supabase and native Next.js

The configured Supabase project has all three migrations applied. For a new project, apply `supabase/migrations/*.sql` in filename order. Do not rerun the initial migration on an existing database. Only the server role has table/function access; browser roles cannot call the RPCs.

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
2. Correct the name, total, currency, extra charges and diner count. Only add charges not already included in the receipt.
3. **Review split** → approve the dated fiat reference rate and USDC amounts. One USD equals one USDC for bill accounting; this is not a swap quote. A dated, labelled demo reference rate is used if the rate service fails.
4. **Create demo requests** → one persisted bill and N−1 individual reimbursement shares. The organizer's share is excluded from the reimbursement total.
5. **Share link** on a friend → copy that private link or scan its invitation QR. It opens a checkout, never a fundable wallet request.
6. Open checkout → choose Zcash or confidential USDC → **Try … demo** → **Simulate successful payment**. No address, live quote, wallet signature or spending submission exists in this mode.
7. The organizer page updates within about five seconds while open. Reload either page: stored progress persists. **Test another outcome** exercises expiry, failure, refund and late settlement.

The owner-private Sites deployment is for the owner to review. Friends cannot use it until an explicitly authorized audience change/deployment is made. Individual application capabilities remain required even within the hosting access boundary.

## Privacy and correctness

- Random organizer capability, per-share derived capabilities and hashes stored in the database.
- Tokens travel in URL fragments, are exchanged through same-origin POST for scoped HTTP-only cookies, and are removed from the address bar. HTTP request URLs/referrers do not include fragments. Do not share organizer links or disclose private share links.
- Cookies last seven days. This demo has no wallet-based account recovery. Bookmarking preserves access only in a browser retaining the cookie.
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
| Confidential Intents | Signed quote validation and settlement assessment implemented; six live dry estimates verified; checkout remains disabled |
| ZIP-321 | URI validation helper tested; no fundable request generated in demo |
| Wallet signing | Not implemented; requires actual supported signer and partner access |
| Supabase | Server adapter, atomic bill/attempt operations, rate limits and private receipt storage implemented |
| Cron | Protected demo-expiry endpoint exists; no recurring job or live provider reconciliation is configured |

`POST /api/reconcile` requires a server-configured `CRON_SECRET` bearer token. It only expires pending demo attempts and cleans old rate-limit counters. It never checks or marks a live payment paid. Frontend polling is a view refresh, not a substitute for live reconciliation.

See [credential setup](../docs/technical/SETUP.md) and [implementation direction](../docs/technical/DESIGN.md). Partner dry-quote access is verified. Receiving integration needs a pasted, confirmed Confidential Intents account and validated routing, with no organizer login or ownership proof; each payer spending from a confidential balance also needs their own wallet signature. Refund/device checks, funded settlement authorization and durable provider reconciliation remain pending. Credentials alone do not enable these paths.

See the [payment adapter and near.com passkey handoff](../docs/technical/PAYMENT_ADAPTER.md) for verified behavior and remaining integration work. `npm run check:intents` explicitly runs six unfunded, signed route estimates using the local partner key; it creates no payment address and saves sanitized evidence. It is separate from default tests and the hosted application.

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

## Publishing

`.openai/hosting.json` owns the existing Site ID. Never create another Site for this app. Use the Sites skill source workflow to build, synchronize the exact source and publish privately. D1 migrations are included in the artifact; local data is not. Keep `.env*`, `.dev.vars*`, `.wrangler`, `.sites-runtime`, test traces and credentials out of Git and deployment archives.

The application is kept in the original GitHub project. Sites publication uses a sanitized copy of this directory so the hosting source repository does not replace the project's Git remote.
