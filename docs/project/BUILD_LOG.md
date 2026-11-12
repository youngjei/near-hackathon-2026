# Build log

## 2026-11-09 — Repository and hackathon context

Prepared the repository and reviewed the organizer guide, site and all track prompts. Added event and submission briefs, technical resources, project planning files and original reference snapshots. Cross-checked dates and prize totals, identified older submission wording and Intents/testnet conflicts, and checked internal Markdown links and Git hygiene before the initial commit.

No product code exists yet. Next: choose a concrete user problem and test its hardest dependency.

## Future session format

- Date and outcome
- Changes and why they matter
- Checks performed and results
- Known limitations or blockers
- Next concrete step

## 2026-11-09 — Intents and Confidential Intents investigation

Captured splitdbill's product direction. Added a technical dossier covering architecture, privacy boundaries, all current 1Click operations, related SDKs/interfaces, and the proposed application flow. Saved a 72-page source manifest and sanitized API evidence.

Live validation: fresh Ed25519 empty-intent authentication succeeded; private balances returned only with the valid user token; history was invite-only; confidential quotes were access-blocked. Public exact-output quotes succeeded. One unfunded quote's anonymous status exposed the synthetic recipient, and dry/allocated/status quote signatures all verified. No spending signature or funded transaction was submitted.

Added a reproducible probe with no user-wallet access or spending endpoint. Updated README, project brief, status, decisions and outdated fee guidance. Remaining dependency: enabled confidential partner credentials, followed by payer/owner/anonymous metadata testing. No frontend implementation yet.

Final checks: the saved dry-probe script reproduced the expected auth/access outcomes; offline verification passed for all three saved quote signatures. Local Markdown links, evidence JSON parsing, Python syntax, JWT-value scan and Git whitespace checks passed. The probe uses curl because this machine’s Python HTTP stack had certificate/client-access issues; no TLS checks were disabled.

## 2026-11-10 — Narrowed beta wallet and product scope

Recorded the user's decision to focus on bill conversion and payment requests, supporting VIZOR/Zodl shielded ZEC and existing Confidential Intents balances, with confidential USDC receipt. Added BETA_SCOPE.md and updated active continuity/product docs; historical protocol evidence is retained.

Checked official wallet documentation and branding, ZIP-321, VIZOR Send scanner source, Zodl iOS URI parser and NEAR quote/signing docs. Wallet source support is not claimed as an executed wallet integration. Added explicit tests for dinner-sized quotes, refund destination support, QR/deep-link behavior, stale requests and private-balance payments. No app implementation, funds, wallet signatures or device tests in this scope update.

Validation: all local Markdown links resolved; Git whitespace checks passed. Documentation-only change; no application tests apply.

## 2026-11-10 — Architecture and dependency recommendation

Added STACK.md covering languages, libraries, application boundaries, records, scheduled settlement checks, deployment and useful hackathon support. Rechecked the organizer's separate $10 AI-key offer, Supabase quotas, Vercel Hobby restrictions and cron limits. A public Frankfurter AED/USD lookup succeeded; NEAR AI model-list requests returned service errors, so no image model or OCR capability was live-validated.

Documentation only: no packages, cloud accounts, credentials, signatures or fund transfers. Local Markdown links and Git whitespace checked. Next: obtain enabled confidential integration access, verify the actual signer/refund paths, and test receipt extraction before implementing the smallest journey.

## 2026-11-10 — First application implementation

Built app-web with receipt upload/manual correction, an editable synthetic sample, dated fiat conversion, equal allocation, individual link/QR sharing, persisted organizer progress and simulated payment/refund/failure/expiry flows. Added scoped capability sessions, private receipt serving, SQL migrations and rate limits. All live-payment paths remain disabled.

Validation: TypeScript, production build and 10 unit tests passed. Eight browser scenarios passed across desktop/mobile, including authorization boundaries, private image access, unsafe image rejection, concurrent duplicate attempts, late payment, refunds, keyboard focus, reduced motion and long amounts. Fixed duplicate-request expiry and early clicks before hydration. Real wallet handoff, funded payment, OCR inference and Supabase deployment are not covered.

Credential instructions supplied to user; no secrets read or printed. Deployment publication is recorded separately below once verified.

## 2026-11-10 — Private publication verified

Published https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site using Sites. Deployment `appgdep_6af273a61b0c81c28702156c1cb6b590` succeeded; hosting-source commit `b19bb3f890a539efca7336455e45e145fab305a9`. The separate GitHub project retains its original remote and feature branch.

Verified deployed API via the existing Site service credential, passed through hidden stdin and never saved: demo gate, session, bill creation, authorization rejection, separate diner capability, non-fundable attempt, simulated settlement, duplicate counting and fresh persisted read. Checked that all five D1 tables were provisioned. The in-app browser reached the owner sign-in gate; no user login credentials were entered, and hosted interactive browser testing remains behind sign-in. Local browser tests and screenshots cover the same build. No service token was generated or rotated, no visibility changed, and no real funds moved.

Final code checks: 10 unit tests and the full 8-case browser suite passed, followed by a two-case desktop/mobile checkout viewport recheck. The final branded build succeeded. Scheduled live reconciliation, OCR, supported wallet handoff and the Supabase runtime remain pending.

## 2026-11-10 — Corrected application setup scope

Acknowledged the user's clarification that the final deliverable is a real usable application. Appended a PostgreSQL migration allowing explicit live/demo records and removing implicit test-mode defaults. Regenerated the fresh-project SQL handoff and supplied a separate upgrade script. Preserved the original migration and existing test data. No remote schema or live-payment gates changed. Checked generated SQL composition and Git whitespace; remote execution remains untested.

## 2026-11-10 — Partner access verified

User configured the Distribution Channel credential. Validated format without printing the key, then requested four dry quotes: ordinary authenticated control; ZEC → confidential USDC with basic and public confidentiality parameters; confidential USDC → confidential USDC. All returned HTTP 201 and no deposit addresses. Used synthetic account/refund identifiers only. No wallet access, spending intent or funds.

The public catalogue uses blockchain `zec` for native Zcash; corrected the probe's initial `zcash` assumption before the quote requests. Saved a whitelist-only evidence summary and reproducible checker, with no partner token or raw provider payloads. Quote access does not establish wallet signing, shielded refunds, account ownership or funded settlement. The official docs Support link resolves directly to https://t.me/near_intents, an alternative to the inaccessible portal link. No support message sent.

## 2026-11-10 — AI key saved; inference verification deferred

Checked only local presence/format of NEAR_AI_API_KEY; no key printed, uploaded or used in a request. Model remains unselected. Official status page loaded in browser and reported a major outage across Cloud API, Chat API, private models and attestation (last update 07:50 KST). Public, unauthenticated /v1/models returned 200 and 64 models. That response is not evidence that inference or verification is healthy.

User mentioned a potential security issue on X; targeted official-source searches did not verify an incident statement. Asked for the source; user recalled X without a link. No inference or receipt upload was attempted, and no provider switch or credential rotation was performed. Receipt manual entry and other integrations can proceed independently.

## 2026-11-10 — Supabase connected and private preview updated

Implemented a domain-level Store interface, retained D1/R2 for isolated local use, and added Supabase PostgreSQL/private Storage. RPCs provide atomic bill/share creation, share-locked demo-attempt creation/updates, rate counters and expiry. Money is serialized from PostgreSQL as text, avoiding bigint precision loss. Receipt upload rolls back its object when metadata saving fails; reads stay behind per-bill/per-share capabilities.

Remote checks found the user's first two migrations and private bucket present, but the server key received table permission errors. Prepared migration 003 and tested it with an embedded PostgreSQL engine. Automatic approval review required explicit approval for production schema/permission changes; the user approved, then the migration was applied through their existing Supabase SQL Editor. Follow-up table and RPC checks returned 200. Browser roles remain excluded; no existing records deleted.

Added native Next.js run/build commands using the same Supabase adapter. Fixed a native proxy-origin mismatch using an explicit APP_ORIGIN instead of forwarded headers. Isolated native output in .next-native to avoid type-file collisions with Vinext. Added a reproducible read-only Supabase health checker. Updated Next/React/RSC patches after auditing; remaining dependency findings are tracked in STATUS, not claimed resolved.

Validation: 18 Vitest checks pass, including actual PostgreSQL migrations, transaction rollback, duplicate creates/attempts, late updates, live-mode simulation exclusion, role grants, precision, and proxy-origin security. Eight Playwright scenarios passed with D1 after refactoring; all eight also passed with native Next.js against the real Supabase project, using synthetic receipts and records. Both production builds and TypeScript pass. Initial browser runs were blocked by the sandbox or hit an occupied port; the subsequent run used verified port 5180 and passed after the origin fix. No unrelated local server was changed.

Configured only Supabase runtime secrets on the existing owner-private Site and deployed source da965610766fc0b568f70ede9cc49eb1711cf5f4. Deployment appgdep_6af295f0fe7881c2941663c3bd134601 succeeded at environment revision 1. Hosted checks verified the Supabase backend, exact synthetic image upload/download, private receipt and organizer access, individual checkout, non-fundable simulated attempts, persisted repayment and idempotence. Existing Site service access was used via hidden stdin; no service token was created or rotated. Scanned deployment/client artifacts for configured key material: none found.

Old D1 test records remain retained but are not copied to Supabase; create new preview links. No NEAR AI request, wallet signature, real payment or audience change. Next: supported confidential-wallet ownership/signing, route/refund execution, provider reconciliation, then separately authorized funded acceptance.

## 2026-11-10 — Signed route estimates and settlement validation

User confirmed the intended existing receiving wallet is near.com with a passkey. Reviewed current official signing, authentication, supported-chain, signature and status documentation plus the legacy frontend passkey implementation. Protocol webauthn support does not supply an app connection to the existing near.com passkey; no documented handoff was found. Recorded the exact partner integration question and the distinction between receiving identification and payer spending authorization. No support message, wallet prompt or replacement account created.

Added the application payment adapter with pinned official 1Click SDK 0.1.26, strict expected routing/amount checks, signature verification, quote freshness, transparent Zcash refund checksums, safe preview projection and provider-error redaction. Replaced the obsolete unchecked status helper with a status assessment that binds the saved quote/deposit memo and requires actual delivered output before reporting paid. This component is not wired to live checkout or durable reconciliation.

Using the configured partner key, verified six real dry quotes for 5/15/50 USDC output across both beta paths. All returned the expected confidential route and valid signatures; none allocated a payment address. Saved whitelisted evidence with synthetic identities omitted. Added an explicitly opt-in npm run check:intents command; default tests remain offline. No user session, personal account, signature or funds used.

Validation: 34 Vitest checks pass; TypeScript and both native Next.js and Sites/Vinext production builds pass. Tests include signed-field tampering, unsigned/stale payloads, output mismatch, privacy-field mismatch, late settlement, insufficient/missing/zero settled output, unknown states, deposit memo preservation, invalid refund addresses, redacted upstream failures and redirect refusal. Live dry checks cover valid transparent refund checksums and both provider routes. No new browser suite was needed because UI/routes/storage behavior did not change. Hosted preview remains at the previous Supabase deployment; no remote schema or secret changes.

Remaining: near.com account/signing handoff, actual VIZOR/Zodl refund and URI compatibility, executable confidential quote/status visibility, durable reconciliation, then separately authorized funded acceptance. OCR remains separately pending model/service validation.

## 2026-11-10 — Receiving destination clarified

User corrected the preceding wallet answer: the required destination is the confidential balance on near.com, while passkey/login method is uncertain. Updated current status, adapter notes, setup and decision log so a passkey bridge is not treated as a confirmed blocker. Reviewed official near.com migration instructions, which document Account menu → My address, and Intents account/quote documentation. Receiving-account identification and confidential-ledger verification come first; payer signing remains a separate requirement. No code, payment, deployment or credentials changed. Documentation consistency and whitespace checks passed.

## 2026-11-10 — Removed organizer login requirement

User clarified that the receiver only needs to provide a receiving wallet. Updated the authoritative beta journey, design, status, setup and adapter notes to require paste-and-confirm Confidential Intents account entry without organizer login or ownership proof. Kept destination/routing validation separate from ownership; retained private organizer-link management and specified immutable recipient binding once requests exist. Payer spending authorization remains separate. Documentation-only change; no payment gate, schema or deployed behavior changed. Checked whitespace and current requirements for consistency.

## 2026-11-10 — Distinguished chain deposit from internal receiving account

Reviewed the user's USDC/Solana Receive screenshot; user confirmed it was opened in near.com Confidential Mode. Checked official recipient-type semantics, current token catalogue and confidential-liquidity documentation. The external Solana deposit address needs DESTINATION_CHAIN and the Solana USDC asset, while the current adapter is hardcoded to internal confidential receiving and NEAR-origin USDC. Documented the manual deposit route, explicit destination typing, downstream credit/fee checks, and the public Solana transfer boundary. Existing solver routing handles asset conversion; a second custom solver is unnecessary.

Added the user's aspiration for native near.com integration and drafted honest hackathon wording distinguishing future integration from this independent prototype. No personal address or QR retained. Documentation-only changes; no route execution, wallet authentication, funds, remote schema, submission or deployment. Python HTTPS lookup failed due to its local CA configuration; retried successfully using Node with TLS verification enabled. Checked documentation whitespace and route consistency.

## 2026-11-10 — Verified internal near.com identifier routing

User supplied an internal nearcom-prefixed address and asked whether it was limited to NEAR. Located NEAR DevHub Trezu source documenting prefix removal for 1Click and independent public/confidential recipient typing. Four actual dry quotes to the provided normalized account passed with verified signatures and exact 5 USDC output, covering ZEC/existing confidential USDC inputs and NEAR-/Solana-origin USDC output. No addresses allocated, signatures requested, balances queried or funds moved. No personal account value or raw payload saved to Git.

This establishes direct internal route acceptance and avoids treating a Solana external deposit hop as necessary; funded delivery is still unverified. Recorded the route evidence and a newly discovered near.com/send prefill helper for later investigation. First local script invocation failed before networking because Node strip-only mode rejected a TypeScript parameter property; the same check succeeded with transform-types enabled. Documentation-only repository changes; whitespace check passed.


## 2026-11-10 — Internal receiving field and finding instructions

Implemented the nearcom-prefixed address input, inline errors, help popup, confirmation and organizer-only persisted display. Added normalized immutable account storage to Supabase and D1, including duplicate-request conflict checks and database triggers. Applied Supabase migration 004 through the existing SQL Editor; legacy data and access restrictions are preserved. All 38 unit/integration checks and ten native Next.js/Supabase browser scenarios passed, plus both new desktop/mobile scenarios against the D1 production preview. Visual QA caught and fixed dialog centering and list numbering; focused browser checks passed again. No personal identifier committed, wallet connected, live quote issued or funds moved. Both native Next.js and Sites production builds passed. Published the existing owner-private Site from source f85efcad807fb136bd8533a4c6457c802dcfe803, deployment appgdep_6af2c386b0c081c28b1ca85bfb03d66f, environment revision 1. Hosted checks passed for address persistence, diner-response omission, private receipt access and idempotent simulated settlement. The Site source credential expired during packaging; renewed it in memory and the retry succeeded. Temporary local preview servers were stopped.


## 2026-11-11 — Payment integration, wallet compatibility and review

Delegated backend/storage and UI coding to GPT-6.1 Sol and provider/wallet work to GPT-6.1 Terra; root coordinated APIs, inspected the code, ran integration checks and reviewed a separate payment-risk assessment. Implemented exact-output allocation, private durable quote/intent records, atomic idempotence, quote and NEP-413 signature validation, external NEAR-wallet connect/review/sign, ZEC ZIP-321 QR/open/copy, scoped status refresh and protected reconciliation.

Actual unfunded provider probes found status responses omit a signed default and use null output while pending. Corrected normalization without relaxing paid-amount or recipient checks. A later probe passed partner status validation; anonymous lookup returned 404. Disposable confidential quote/intent generation passed without signing/submission. Saved sanitized evidence only. Review identified late-payment replacement risk; blocked replacements conservatively and added regression coverage.

Applied Supabase migration 005 through the existing project SQL Editor; success was visible and its service-role reconciliation RPC returned HTTP 200 with an empty result. Existing records and browser exclusions were preserved. Patched React/ReactDOM/RSC to 19.2.9 after the current audit identified a critical RSC advisory; 26 other audit findings remain (16 moderate, 10 high). No user funds, user wallet authentication, spending signatures or live activation. Final verification: 78 unit/integration tests and TypeScript passed; 26 desktop/mobile browser cases passed (10 persisted demo journeys, 16 synthetic live scenarios). Both native Next.js and Sites/Vinext production builds passed. Four synthetic checkout screenshots were reviewed without layout/console defects. The local Next preview was stopped. Publication is blocked as described below; the previously published Site remains unchanged.

Sites source synchronization was rejected twice by automatic approval review because the helper's credential would appear in the tool-call payload. The second attempt supplied evidence of hidden raw-mode stdin but was still rejected. No alternative credential transport or bypass was attempted. Publishing needs explicit approval of that specific mechanism.


## 2026-11-11 — Publication and activation requested

The user explicitly requested publishing and activating the app. Confirmed the existing Site remains owner-private and source c07203b is clean. Obtained a fresh short-lived repository credential without printing its value. The sandboxed source helper could not resolve the Git host; the approved network-enabled helper then reached hidden stdin, where automatic approval review rejected the credential-bearing tool argument. Asked for approval of that specific transport and did not retry or work around it. Prepared a sanitized tracked-source staging directory without local environment files. Existing successful code checks remain applicable because application code did not change. No deployment, hosted-secret update, activation flag, wallet signature or funds changed. Wallet-device, refund and funded settlement acceptance remain outstanding.


## 2026-11-11 — Payment-code release published

The user explicitly approved the official publishing helper's hidden-input credential transport. Refreshed the short-lived credential in memory, opened the existing Site source, synchronized all 110 tracked application files from c07203b without local secrets or runtime data, installed pinned dependencies and rebuilt the Sites production artifact successfully. The helper pushed source 55b74bcbf5bb4b13f6056fc5c87692610f306f8a and packaged splitdbill-payments.tar.gz. Native owner-private deployment succeeded: appgdep_6af458887bf881c2bf630ba729ca7ce5, environment revision 1. Existing URL and owner-only audience preserved. No environment values or acceptance flags changed. Real payments and OCR remain disabled; no wallet signature, funded transaction or new device-acceptance claim. Existing 78 unit/integration and 26 browser checks cover the unchanged application code; this turn additionally verified the sanitized release build and native deployment result.


## 2026-11-11 — UX copy and interaction refinement

Researched recurring generated-interface patterns and applied NN/g minimalist-design and progressive-disclosure principles (sources in DESIGN.md). Delegated create/dashboard copy and payment-screen copy to the existing Sol/Terra agents; root reviewed and refined their changes. Removed slogans, repeated captions, duplicate friend numbering, decorative live banners and the oversized dashed upload area. Aligned the wordmark and demo notice with the task column, kept one plain typeface and removed the whole-page entrance animation. Shortened receiving help and OCR fallback text. Kept necessary demo, fee, expiry, refund privacy and payment-state warnings. Moved optional exchange-rate explanations, address-format help, QR scanning and manual payment-copy instructions into disclosures. The same-device wallet action comes before the optional QR. No provider, signature, settlement or rollout logic changed.

Validation: TypeScript passed; all 26 desktop/mobile browser journeys passed. Added disclosure checks to existing tests. Visual review found the wallet action below the mobile fold, corrected by moving the QR into a disclosure. A focused test then found a shorter viewport with the payment-paused notice still clipped the action; tightened only checkout spacing and both focused cases passed. Nine synthetic screenshots were reviewed; no overflow or browser errors. No actual wallet/provider payment calls. The sanitized Sites production build passed; native publication succeeded from source 75d277f8736afa9037519ef6539395e54aa667b9, deployment appgdep_6af45fa8047481c298b034729df0cde6, environment revision 1. Owner-private audience and disabled real-payment gates preserved.


## 2026-11-11 — Centered splitdbill logo

Changed the header wordmark to splitdbill and centered it using equal outer grid columns, including when New bill is visible. Updated the accessible home label, page title and existing keyboard-check selector. Browser geometry checks passed at 320, 390 and 1440 pixels; mobile screenshot visually inspected. Sites production build and deployment succeeded: source 0210ff45d98e054df32bbfba4d6687609a2c574a, deployment appgdep_6af468c2067c81c287ce4099d2a398b7, environment revision 1. No payment or access configuration changed.


## 2026-11-12 — Interface redesign, purposeful motion and organizer recovery

Installed the approved Impeccable and Vercel Web Design Guidelines agent skills using the installer. Python HTTPS installation hit a certificate-store error; Git installation succeeded without disabling TLS verification. Impeccable binary context initialization could not write its cache; disclosed the fallback and read existing project context and skill references directly. No automated detector or hook result claimed.

Delegated UI and recovery implementation to Sol agents and independent recovery/visual review to Terra. Rebuilt the task layout with slate/white surfaces, centered splitdbill header, responsive context/document composition, clear amount and request hierarchy. Added brief press, selection, step, loading and success feedback; reduced motion keeps visible state text. Removed redundant captions, ornamental marks and extra separators during screenshot review. Existing real-payment gates and provider behavior remain unchanged.

Implemented Your bills using a validated browser-local index of organizer capabilities, plus a selectable/copyable private recovery link. Authorized existing organizer pages are adopted, expired cookies restore from saved access, and a private link works on a fresh browser. Invalid/failed links are retained for retry; blocked storage exposes manual recovery. Owner capability is returned only by the already-authorized owner dashboard, never payer responses. No schema changes or wallet login. List removal does not revoke existing cookies or copied links; the 50-entry limit and local-only retention are explained. Review fixed background re-save races and premature fragment erasure.

Validation: TypeScript and git diff whitespace passed. Full unit run passed 88 checks; the final focused recovery run passed 12 including two subsequently added checks, totaling 90 distinct unit/integration checks. Existing browser suite passed 24/26 initially; the two failures were the expected keyboard order after adding Your bills. Updated that assertion; focused run passed 12, covering 8 new recovery checks plus corrected keyboard and existing receiving checks (34 distinct passing desktop/mobile scenarios overall). Twelve final synthetic screenshots showed no overflow or browser errors. Independent manual review found no material visual defects in its five-screen scope. Real device/wallet and funded acceptance remain outstanding.

Sanitized Sites build passed and source `e3c5ca03b656f9e7f1472eb5c6cbf4c23c246fdc` published successfully as deployment `appgdep_6af52526c3fc81c2b5988e0aeef97fb1`, environment revision 1. Same owner-private URL and disabled live/OCR gates. No provider secrets changed, funds moved or audience expanded.


## 2026-11-12 — Larger slash wordmark

User requested a much larger centered split/d/bill logo. Updated the shared header, accessible home-link name and browser title. Desktop wordmark is 56px; mobile is 42–52px with navigation on a separate row. TypeScript and Sites build passed; centered/non-overlap checks passed on home and payer routes at 320/390/1440px. Mobile/desktop screenshots reviewed; two existing keyboard/reduced-motion scenarios passed. Published source `1eb498a6a728d9ef2973aa89f94edad1c8f44733`, deployment `appgdep_6af52de249b881c28b2a906821f87771`. Private audience and runtime environment preserved.


## 2026-11-12 — Cream/blue visual rebuild

User rejected the slate/rounded-card presentation and approved all aspects of the NEAR Hackathon reference: cream/blue, bold typography, sharp layout and pixel graphics/motion. Rebuilt the shared visual system across creation, details/review, payment, organizer history, receiving help and loading. Large centered split/d/bill retained. Space Grotesk is self-hosted with its SIL OFL; authored pixel receipt/share geometry has brief review feedback and reduced-motion support. No payment, persistence or authentication logic changed.

Delegation: Sol implemented frontend styling/markup; Terra independently reviewed stable code and five representative captures; root inspected rendered screens, checked the diff and corrected short-phone checkout spacing. TypeScript and whitespace checks passed. Full browser suite: 33/34 initially; the wallet button was 27px below the 664px viewport. Scoped short-screen checkout spacing fixed this; all eight mobile checkout cases passed on rerun (34 distinct scenarios passing overall). Eighteen screenshots across desktop/mobile/320px showed no overflow or page errors. Six header alignment checks passed at 320/390/1440px. Production build passed; published source `5bac538805037f92674075358055c11ae4b70274`, deployment `appgdep_6af53876ada081c29d8209c0030194b0`, environment revision 1. Existing private audience and disabled live-payment gates preserved.
