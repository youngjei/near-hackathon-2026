# Build log

## 2026-11-13 — Public repository release

After scanning current files and 579 reachable Git blobs for committed `.env` files, private keys, GitHub tokens and the personal internal receiving identifier, changed the repository to public under the owner's approved release plan. One `ed25519:` match in old probe evidence was a quote signature, not a secret key. PR #1 merged the beta into `main`; anonymous raw GitHub requests returned HTTP 200 for the root README, three screenshots and MP4. Added a concise repository description and relevant topics. The owner-only Vercel pilot remains protected and is not the judge demo. The local credential-free sample and video are the judge path permitted by the live organizer guide. A code license, lead/contact fields, human X post and exact one-time submission are still outstanding.

## 2026-11-13 — Submission reproducibility and media

Prepared a root README with exact credential-free D1 setup, action-to-result sample steps, honest simulation/owner-pilot boundaries, track fit, eligible-work baseline and reused-code disclosure. Added three synthetic UI screenshots and a 72.56-second narrated/captioned demo video to `docs/hackathon/assets/`; masked the synthetic receiving value in the video. The human must still publish the required X post. The license, public repository and exact entry payload remain pending.

Verified a fresh isolated D1 database against all four migrations (0000–0003). Vinext and native Next.js production builds, TypeScript and 114 Vitest tests passed. ESLint passed with zero errors and five image warnings after generated-output exclusion and narrow React hook exceptions. The full Playwright run passed 58/60 desktop/mobile scenarios; both timed intro failures occurred because the test sampled before Web Animations finished pausing. The test now waits for paused play state and the two affected scenarios passed on rerun. No wallet transfer, funded settlement or confidential credit was performed.

## 2026-11-13 — Hosted collision index and owner-pilot deployment

In the authenticated Supabase SQL editor, a preflight count found zero duplicate saved deposit address/memo pairs. Applied migration 007's unique index and verified `live_deposit_identity` appeared in `pg_indexes`. Native Next.js production build passed. Deployed the local Solana handoff correction and deposit-collision guard to the existing owner-only Vercel pilot: deployment `dpl_43ft4CvWDSsMtcDBFcyHyBRaGbwN` is READY at the canonical https://split-d-bill.vercel.app. An unauthenticated API check returned HTTP 401 from the owner-password gate. Vercel's CLI created a persistent automation bypass secret during that check; it was revoked and a follow-up inspection showed zero bypass secrets. Temporary local credential files were removed. No funded payment, device handoff or confidential receiving credit was observed.

## 2026-11-13 — Per-friend deposit collision guard

Audited quote allocation after the owner asked whether friends could receive the same deposit address. Each share requests a separate 1Click quote; official documentation does not explicitly guarantee a unique address. Added local D1 migration 0003 and Supabase migration 007 with atomic uniqueness over saved live deposit address/memo pairs. The second colliding attempt remains locked without revealing its funding instruction. Existing collisions cause migration failure for investigation. This prevents a later collision from reaching another payer; it cannot recall an instruction already shown. Hosted Supabase 007 was applied through its SQL editor after a zero-collision preflight, then verified in `pg_indexes`; code deployment is pending.

TypeScript and all 114 Vitest tests passed, including concurrent storage collisions in both backends. No provider allocation, wallet signature or funded transfer occurred in this check. See `docs/technical/PAYMENT_ADAPTER.md` for the exact privacy and reconciliation boundary.

## 2026-11-13 — Solana browser-launch correction

The owner reported that the Solana Pay action exposed a `solana:` link and did not open a wallet on their device. Solana's transfer-request specification defines this URI and QR payload, but browser launch depends on an installed handler. Removed the Solana link from checkout, kept the exact-amount Solana Pay QR for another-device scanning, and made same-device USDC address/amount copying explicit. Zcash's optional URI shortcut remains. Updated the compatibility record, README and focused browser assertion. This is a local source fix, not a deployment or funded-payment result.

Validation with Node 24.22.3: 110 Vitest tests passed, native Next.js production build passed, sequential TypeScript passed and the focused Solana checkout scenario passed on desktop and mobile. The first TypeScript invocation raced the native build's generated-type cleanup and failed with missing generated files; rerunning after the build passed. The previous lint failures remain. Next: deploy the local fix to the owner pilot after review, test actual QR scanning or manual Send with a bounded owner-approved payment, and verify reconciliation plus confidential credit before claiming live success.

## 2026-11-13 — New-laptop beta audit and demo rough cut

The Conductor workspace initially opened on `origin/main`, which has only the preparation dossier. Found the developed app on `origin/feat/first-beta` and checked out a local tracking branch without renaming the placeholder branch. Added a truthful video storyboard in `docs/hackathon/DEMO_PLAN.md` and captured a 30-second silent MP4 rough cut of the sample receipt → share → simulated Zcash payment → organizer progress journey. The video and final screenshot are ignored workspace artifacts under `.context/`, not published or committed.

On this laptop, installed a disposable Node 24.22.3 runtime because the system Node is 23.6.0. `npm ci`, `npm run typecheck`, `npm test` (110/110), `npm run build`, `npm run build:next`, and `npm run test:e2e` (60/60 desktop/mobile) passed. The E2E run used a fresh local D1 database with migrations 0000–0002 and a local Sites-compatible dev server. `npm run lint` failed with 21 errors and 7 warnings; this is an existing cleanup item, not a passing gate. Inspected the video contact sheet and final organizer screen; the recording visibly labels the journey as simulated.

This verifies the local application journey and its automated boundaries. It does not verify the deployed owner login from this laptop, installed VIZOR/Zodl/Phantom handoff, refund behavior, a funded NEAR Intents route, or confidential USDC credit. Next: test those with the user's own devices and explicit payment approval, then record a narrated final video with only claims backed by observations. Release also needs a license, public repository, public human-posted X demo and exact submission information.

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


## 2026-11-12 — Animated homepage explanation

Replaced repeated Split a bill/description with a one-pass phrase sequence: Photograph a receipt; Split the amount; Send ready-to-pay requests; Privately. The persistent private-link explanation keeps the privacy claim scoped. Removed only the homepage split illustration. Added pause/resume/replay, document/offscreen pause, reduced-motion/no-script text, stable accessible heading and reserved layout space. All four animations share one timeline to prevent completed words restarting on resume. Nonbreaking ready-to-pay and balanced caption avoid awkward wrapping.

Sol implemented the bounded component/CSS; Terra reviewed lifecycle/accessibility; root reviewed code, wrote behavioral tests, checked rendered states and published. Fourteen desktop/mobile intro and existing journey tests passed, covering pause/resume, no old-word replay, completion, replay, focus restoration, reduced motion and bill creation. TypeScript and whitespace checks passed. Nine final screenshots at 320/390/1280px showed no overflow or page errors, plus an actual animation recording. Production build and owner-private deployment succeeded: source `0cc8d913a3fccffade60153039ac506040ef20f5`, deployment `appgdep_6af540f71f0881c2852a793455d1f104`, environment revision 1. Palette, payment/storage logic and rollout gates unchanged.


## 2026-11-12 — Reimbursement context and adjacent phrase cues

Added “Get paid back in USDC for the dinner you covered.” above the smaller private-link explanation. Sol implemented shared-timeline faded previews; root refined/reviewed large clipped edge letters and corrected trailing-text alignment. Cues disappear at completion and are hidden for reduced motion. Existing pause/resume/replay and palette remain unchanged.

TypeScript, four focused desktop/mobile animation tests, whitespace and production build passed. Nine responsive screenshots and an autoplay recording were produced; checked narrow-phone and desktop layouts. Publication is pending because automatic approval review returned a technical Bad Request twice on the publishing helper credential transfer. No unsafe-action determination was made; no alternate credential transport was attempted. Existing live source/deployment remain unchanged. No payment logic, provider credentials or rollout gates changed.


## 2026-11-12 — Publishing retry succeeded

Restarted the supported Sites publishing helper in a fresh session with a new short-lived credential. The same hidden-stdin approval path succeeded; no bypass or application code changes were needed. Reused the already validated production build, pushed and packaged source `dc5ed40a1d95153e054d19703748ce465529d14a`, and published successfully as deployment `appgdep_6af556b0a5fc81c29de581f31251d05a`, environment revision 1. Native deployment returned succeeded and the existing Site URL. The precise cause of the earlier review-service Bad Request is unknown. Existing owner-only audience and disabled live-payment gates are preserved.


## 2026-11-12 — Smooth phrase handoffs

User reported transitions felt rough. Source inspection found separate exit/arrival beats and a sharply accelerating 200ms exit. Replaced these with concurrent 500ms handoffs using a common smooth curve, reduced travel to 12px and synchronized the edge fragments. Retained 2.4-second reading holds, the overall 12.2-second pass, final Privately state and all motion controls.

TypeScript and production build passed. Six desktop/mobile browser tests passed, including continuous opacity sampling to catch blank/dim handoffs, pause/resume/replay, stable layout and reduced motion. Nine responsive captures reported no page errors or overflow; representative mobile/desktop states inspected and autoplay recording saved. Published source `da5ecbf83cac4431b9911864d3615a14b6d75613`, deployment `appgdep_6af55962d52081c295f59d5601412e20`, environment revision 1. Physical-device frame-rate profiling was not performed. No backend, palette, audience or rollout changes.


## 2026-11-12 — Pixel receipt story and app branding

Restored a three-part pixel story below the introduction: one receipt, three small receipts, three smiling heads, centered above their numbered steps. Desktop uses shared subgrid rows so left/right dividers align when text wraps; mobile stacks the upload after the compact story. Updated supporting copy to “Each friend gets a private link to pay their share.” User requested independent agents: Sol reviewed copy alternatives; another Sol implemented receipt favicon/ICO/PNG/Apple/maskable icons, manifest and a reproducible dependency-free generator. Root reviewed code/assets, built the story, unified the loading mark, verified and published. The split/d/bill wordmark remains.

TypeScript and production build passed. Sixteen existing intro/journey checks plus two new five-width alignment/metadata checks passed (18 total). Nine responsive captures reported no page errors or overflow; desktop/phone layout and app icon visually inspected. Icon dimensions, PNG decompression, ICO bounds and manifest references checked. Manifest adds branding and no offline capability. Published source `5472ac8faf1f50135ee7adcd1c500dc069187b4b`, deployment `appgdep_6af55c5943f081c2a0eebca2eb08a4c6`, environment revision 1. Owner-only audience and disabled payment rollout preserved.


## 2026-11-12 — Give introduction text more room

Removed the 30ch caption width limit and balanced short-line wrapping. Caption now uses available width, with a separate right column for motion controls, 18px/16px desktop text, 1.6 line spacing and 12px between sentences. Headline tracking loosened to -0.025em. Eight intro/alignment browser checks and production build passed; nine responsive captures had no overflow or page errors. Published source `532fd3322b31f2b7464a59f80e7328352ec837f3`, deployment `appgdep_6af55dfb6cf481c29bfa4fcfee111026`, environment revision 1. No copy, payment or audience changes.


## 2026-11-12 — Always-visible digital bill receipt

Organizer dashboard now uses an always-visible paper-style digital receipt instead of the separate amount hero and Bill details dropdown. It shows persisted totals, optional extra charge, diner count, converted total, organizer share, requested/received/remaining USDC, payment progress and recorded FX source/date. Existing five-second polling drives updates; original photo remains optionally expandable. TypeScript, production build and 14 desktop/mobile checks passed, plus a final focused rerun after footer spacing adjustment. Responsive and large-value screenshots inspected. Published source `d7b8bc1ed348c28bb427c642535d7fe1a4543905`, deployment `appgdep_6af56223ea2c81c2ad6da1c035db99a9`, environment revision 1. Demo labels, private access and disabled payment gates preserved.

Receipt assertions verify exact-cent organizer/reimbursement totals, tip display, payment/refund changes, progress and live-versus-demo wording using synthetic API projections. Existing bill creation, payer isolation and receipt privacy journeys remain passing. The payer checkout details presentation is unchanged; this request implements the organizer screenshots. No funds moved or new data collected.


## 2026-11-12 — Porcelain and petrol palette

Applied the user-selected porcelain/petrol palette across shared UI tokens, receipt paper, modal backdrop, QR colors, browser theme, favicon and all app icons. Exact primary colors are #F3F4EF and #14645E. Versioned icon/manifest URLs refresh old cached branding. Production build and six focused desktop/mobile receipt, metadata/alignment and complete demo-journey scenarios passed. Contrast ratios on porcelain: ink 13.07, muted 5.69, petrol 6.30, control boundaries 3.60. Responsive screenshots and regenerated icon reviewed; no prior cream/cobalt hex colors remain in active app code/assets. Published source `c31127c70981c9ce587a2a4bce551e71aa739221`, deployment `appgdep_6af5631da2b481c29a9d71c3ba9a4cd3`, environment revision 1. No payment behavior, audience or rollout changes. Semantic error red remains distinct for errors.


## 2026-11-13 — Approved pixel/clean wordmark

Applied approved logo option 1 in the global header and organizer receipt: pixel receipt, clean lettering and petrol stepped slashes. Receipt bands separate slightly on hover/focus with a reduced-motion override. Moved organizer FX source/date/rate and the USD-to-USDC accounting assumption into optional Conversion details. Calculation and settlement behavior are unchanged. TypeScript, production build and six desktop/mobile receipt, disclosure, layout and reduced-motion scenarios passed; responsive captures inspected. Published source `542bfda3df780f52b6fa114d77de692cdfc9f1c9`, deployment `appgdep_6af5d909ad9881c2bc463357a0b9e206`, environment revision 1. Owner-only access and disabled payment gates preserved.


## 2026-11-13 — Continuous headline loop and wider previews

Headline now repeats on a seamless 13.7-second timeline, holding Privately for 4.5 seconds versus 2.4 seconds for other phrases. Removed completion/replay state; retained pause/resume, hidden/offscreen pause and static reduced-motion fallback. Cyclic previous/next previews are widened to 1.15em (roughly two to three characters) with reserved text gutters. TypeScript, production build and eight desktop/mobile tests passed, including real loop return, longer hold, pause/resume and opacity sampling across two loop boundaries. Final nine responsive captures had no overflow/page errors; desktop and small-phone states inspected. Published source `aa1fba43de148595216fd166fd7054135b963d9b`, deployment `appgdep_6af5daf00d0c81c29dad8096c9efe457`, environment revision 1. No payment, data or audience changes.


## November 13 — Directional phrase previews

Asymmetric headline previews: previous phrase uses 0.8em (roughly 1.5 characters) and next phrase uses 1.5em (roughly 2.5 characters). Corresponding gutters preserve the overall text width and looping timing. Nine captures at 320/390/1280px had no overflow or page errors; desktop and narrow-phone views inspected. Production build and whitespace checks passed. Published source `5d2ef3825ca597047261d34bf3a4fc890b95c5e3`, deployment `appgdep_6af5dbe2154481c29f39901cc43577d5`, environment revision 1.


## November 13 — Multiline preview continuity

Replaced single-line preview snippets with full neighboring phrases, sharing phrase markup, text width, tracking and balanced line wrapping with the main headline. Previous line ends and upcoming line starts remain cropped to the chosen asymmetric widths. Preview blocks stay vertically centered at their natural multiline height. TypeScript, production build and all 10 intro browser checks passed, including character-by-character line grouping at five viewport widths. Nine responsive captures had no overflow/page errors; desktop and 320px layouts visually inspected. Published source `bbe4b9cd8d7fe5bb4a383a77bc45a7008ced27ae`, deployment `appgdep_6af5dd98acfc81c299d43fcb69d4fe4d`, environment revision 1.


## November 13 — Solana USDC route and private reimbursement copy

Approved headline now ends Get paid back privately, with Send payment requests as the prior phrase. Added shared Zcash (VIZOR or Zodl), NEAR Confidential balance and Solana wallet (USDC) choices with route-specific privacy explanations. Solana backend requests exact-output mainnet USDC to confidential USDC and produces verified Solana Pay URI/QR/copy instructions; separate rollout and acceptance gates remain false. Added pinned @noble/curves 2.4.0 address validation. Migration 006 applied to splitdbill Supabase through its authenticated SQL editor and the resulting three-method constraint verified; existing records and grants preserved. TypeScript, all 99 unit/integration checks, 18 synthetic live-checkout checks, 10 intro checks and four persisted demo journeys passed; final transactional migration rerun passed 29 database checks. Nine headline and six checkout responsive captures reviewed. Three official signed dry Solana quotes passed for 5/15/50 USDC; no executable Solana quote, wallet-device, funded payment or refund test. Production build passed and owner-private deployment succeeded: source `d0e5131b4f09f40540760899d916d5c04cf586f6`, deployment `appgdep_6af5e82b248481c28b6761cc235ab5b2`, environment revision 1.


## November 13 — Owner-only real-payment pilot

User requested real testing with their own Solana and VIZOR wallets and manual wallet approvals. Added a separate `LIVE_PAYMENT_TESTING` mode that requires server-verified owner access plus the provider key, global activation and per-route switch. Only Solana/Zcash deposit routes can bypass acceptance during this pilot. Confidential sending remains disabled; every acceptance flag remains false. Manual/uploaded bill creation, organizer and checkout show **Live testing · Real funds**; samples retain their demo notice. Checkout states that wallet, refund and settlement acceptance is incomplete. No automatic signing or sending was introduced.

Sites trusted owner access is confined to the Cloudflare runtime and the owner-private hosting boundary. Native Next.js instead uses a password of at least 32 characters and a signed origin-bound HTTP-only session, with same-origin form checks and bounded request bodies. Spoofed Sites identity headers do not authorize native access. Reconciliation remains independently protected by its server bearer secret.

TypeScript and all 110 Vitest checks passed. Four new desktop/mobile browser checks passed for owner-testing labels, incomplete-acceptance copy and sample-demo preservation. Sites publication succeeded: source `7bfa49f1140d4686b8bfb874556a0759f9f285e7`, deployment `appgdep_6af5ee35a75081c29f68fdd8930c4855`, environment revision 3. Hosted partner key and pilot gates are configured. Native Vercel owner-password hosting and Supabase Cron/Vault scheduling were completed later in this session; final verification is recorded below. Documentation now gives exact Node 24 / Vercel CLI 65.15.0 setup commands using environment variable names only. No funded payment, refund, wallet-device acceptance or confidential credit is claimed.


## November 13 — Background reconciliation verified and standalone build deployed

Installed Supabase `pg_cron` and `pg_net` and saved the existing reconciliation bearer token privately in Vault as `splitdbill_reconcile_token`. Job ID 1, `splitdbill-reconcile`, now invokes the standalone `/api/reconcile` endpoint every minute. Verified a real `net._http_response` HTTP 200 result: `{ok:true,checked:0,updated:0,unavailable:0}`. This proves background scheduling and endpoint authorization for an empty queue; it does not prove payment settlement. Repeatable SQL and the pause command are in `app-web/supabase/operations/reconciliation-cron.sql`, with no secret values.

Vercel production deployment `dpl_BCMYhr1jDLgV1BSzX32gjHEqDhAR` is READY at the canonical address `https://split-d-bill.vercel.app`. Native output requires `.next-native` in Vercel configuration; Sites-only `vite.config.ts` is excluded from native deployment. The final deployment pins the shorter `APP_ORIGIN`; hosted owner-password login and canonical-origin checks passed. Updated project continuity and current documentation to distinguish verified infrastructure from unverified funded acceptance. All acceptance flags remain false; confidential sending is disabled.


## November 13 — Final standalone owner-access verification

Vercel deployment `dpl_BCMYhr1jDLgV1BSzX32gjHEqDhAR` is READY at `https://split-d-bill.vercel.app`. Hosted checks passed: unauthenticated API access returned 401; owner-password login returned 303 with its HTTP-only session cookie. Authorized config returned 200 with mode live, testing true, Zcash/Solana enabled, confidential sending disabled, Supabase storage and OCR disabled. Authorized reconciliation returned 200 with zero attempts checked. An actual browser owner login succeeded and the homepage displayed **Live testing · Real funds**. Supabase every-minute reconciliation and its empty HTTP 200 response remain verified. No funded payment, wallet transaction, refund or actual confidential credit was performed or inferred from these checks.
