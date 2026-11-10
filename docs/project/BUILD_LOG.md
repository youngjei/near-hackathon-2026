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
