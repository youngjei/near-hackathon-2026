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
