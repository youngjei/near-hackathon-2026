# Current status

Updated: November 12, 2026 (KST).

Phase: executable payment backend and compatible external NEAR-wallet signing implemented, with rollout gates disabled. Supabase migrations 001–005 are applied. Real device/refund/funded acceptance, hosted payment credentials, reconciliation scheduling and OCR remain outstanding. The November 12 cream/blue redesign and organizer recovery are now published on the owner-private Site; execution gates remain disabled. No submission or funded project wallet exists.

Preview: [https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site](https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site) — owner-only, ChatGPT sign-in required.

## Completed

- Added a verified payment adapter for the two beta routes. Six real dry quotes (5/15/50 USDC per route) passed official SDK signature and routing checks. Settlement classification, privacy-safe preview projection and transparent Zcash refund checksum validation are implemented and tested; live checkout and database reconciliation were subsequently connected behind disabled rollout gates. See [payment integration details](../technical/PAYMENT_ADAPTER.md).

- November 10 partner checks: authenticated ordinary control, ZEC → confidential USDC (basic and public parameter), and confidential USDC → confidential USDC all returned HTTP 201 dry quotes. No payment addresses, spending signatures or funds. Sanitized evidence saved; credential remains local.

- Built TypeScript/React App Router screens on the Sites-compatible Vinext runtime, with D1 bill/share/attempt records and private R2 receipt uploads.
- Implemented per-share capabilities, cookie exchange, exact cent allocation, idempotent requests, stale-attempt handling and explicit simulation controls.
- TypeScript and production build passed; 10 Vitest checks and 8 Playwright scenarios passed. Visual inspection completed; wallet-device testing is separate and not performed.
- Published the private preview and verified the hosted API with synthetic data: creation, durable reads, separate diner access, simulated settlement and idempotence passed. All five expected database tables were present. No recurring jobs are configured.
- Applied the first three Supabase migrations with explicit user approval for the server functions and grants. Implemented PostgreSQL transactions, private receipt storage, exact monetary serialization and rate limits. The private Site now uses Supabase; native Next.js is also supported locally. Vercel hosting is not configured.

- Recommended TypeScript/Next.js, Supabase, 1Click/Intents SDKs, ZIP-321 and NEAR AI receipt extraction; see [stack proposal](../technical/STACK.md). Checked current AI-credit terms and hosting constraints. No services provisioned.

- Hackathon guide and all 13 prompts reviewed; references preserved.
- User problem and working name captured: cross-border receipt splitting. November 10 scope prioritizes automatic conversion and payment requests.
- Checked VIZOR sending documentation, Zashi → Zodl rename, ZIP-321 standard and both wallet codebases for request parsing. No device-level wallet test performed.
- Indexed/downloaded 72 official Intents docs; examined core architecture, confidentiality, signing, APIs, SDKs, fees and execution.
- Generated an API map covering 15 1Click operations and related protocol interfaces.
- Verified disposable wallet authentication and owner-only private balance access; documented private quote/history access restrictions.
- Requested real dry quotes, allocated one unfunded public quote and confirmed anonymous status returns its recipient. Verified three response signatures.
- Saved source hashes, sanitized results and a reproducible unfunded probe.

Delivery target: a real usable application with receipt extraction and verified NEAR payments. Supabase schema and runtime connection are complete; payment execution remains simulated and is clearly labelled. Existing D1 test records are preserved but not migrated; create new links in the Supabase-backed preview.

## Latest verification

- November 12 homepage refinement is implemented locally: “Get paid back in USDC for the dinner you covered.” precedes the smaller private-link explanation. Clipped, faded letter fragments preview adjacent phrases and disappear at the end. TypeScript, four focused desktop/mobile motion tests and production build passed; responsive screenshots reviewed. Publication is pending: automatic approval review twice returned a technical `Bad Request` while sending the publishing helper its credential, so no new source push/deployment occurred. The live version remains the one below; palette and payment gates are unchanged.

- November 12 animated home introduction published: one 12.2-second receipt → split → requests → Privately sequence replaces repeated headline copy, with pause/resume/replay and reduced-motion fallback. Fourteen desktop/mobile intro and existing journey scenarios passed; final phrase wrapping reviewed in nine screenshots at 320/390/1280px with no overflow/page errors. TypeScript and production build passed. Source `0cc8d913a3fccffade60153039ac506040ef20f5`, deployment `appgdep_6af540f71f0881c2852a793455d1f104`, environment revision 1. Colors remain unchanged pending user feedback.

- November 12 cream/blue release: user-approved NEAR Hackathon visual reference applied across creation, review, checkout, organizer/history and help/loading. Self-hosted OFL Space Grotesk, sharp rules and authored pixel receipt graphics replace floating gray/green cards. TypeScript and Sites production build passed. 34 distinct browser scenarios passed across a full run (33 pass, one short-screen positioning failure) and the corrected eight-scenario mobile checkout rerun. Eighteen desktop/mobile/320px screenshots reported no overflow or page errors; independent source/visual review completed. Published privately: source `5bac538805037f92674075358055c11ae4b70274`, deployment `appgdep_6af53876ada081c29d8209c0030194b0`, environment revision 1.

- November 12 logo update: enlarged centered `split/d/bill` to 56px desktop and 42–52px mobile, with mobile navigation below. TypeScript, production build, six responsive logo checks and two keyboard/reduced-motion browser scenarios passed. Published privately: source `1eb498a6a728d9ef2973aa89f94edad1c8f44733`, deployment `appgdep_6af52de249b881c28b2a906821f87771`, environment revision 1.

- November 12: responsive interface redesign, purposeful loading/confirmation motion and no-login organizer return flow implemented. Your bills remembers up to 50 authorized bills in this browser; private organizer links restore access on another browser. Recovery restores expired cookies, preserves links on failed/blocked-storage paths and never grants organizer access to payers. No schema or payment-rollout changes.
- Verification: TypeScript and whitespace checks passed. 90 unit/integration checks covered across the full 88-test run and focused 12-test recovery run; 34 distinct desktop/mobile browser scenarios passed across the existing suite and focused reruns. Updated keyboard-order assertion for new navigation. Twelve synthetic final screenshots had no overflow or page errors; independent manual visual and recovery reviews completed. Sanitized Sites production build and owner-private publication succeeded: source `e3c5ca03b656f9e7f1472eb5c6cbf4c23c246fdc`, deployment `appgdep_6af52526c3fc81c2b5988e0aeef97fb1`, environment revision 1.

- Centered `splitdbill` header wordmark published. Rendered alignment and non-overlapping navigation verified at 320, 390 and 1440 pixels; production build passed.

- UX refinement: 26 desktop/mobile journeys passed against the local Sites runtime. The focused QR-disclosure/above-fold action test passed on both viewports after a short-screen spacing correction. TypeScript and the sanitized Sites production build passed. Nine synthetic screenshots reviewed; no overflow or console errors. Demo disclosure and payment safeguards remain; optional explanations and QR/copy fallback use accessible disclosures.

- 78 Vitest checks pass, including quote tampering/expiry, settlement underpayment, provider error redaction, real PostgreSQL migration/transaction behavior and native proxy-origin security checks.
- Twenty-six desktop/mobile scenarios pass: ten persisted demo journeys against native Next.js/Supabase and sixteen synthetic live-checkout scenarios. The new receiving-address scenarios also pass against the D1 production build; the previous eight D1 scenarios passed after adapter extraction.
- Both production builds and TypeScript pass. Native Next.js output is isolated in `.next-native/` so it cannot overwrite Vinext route types.
- Next.js is 16.4.6; React/ReactDOM/RSC are patched to 19.2.9, resolving the newly listed critical RSC advisory as well as earlier patched issues. Other audit findings remain (26: 16 moderate, 10 high, including tooling/Vinext/Zod); do not describe this as a completed dependency security review.
- Hosted API checks passed for Supabase selection, receiving-address persistence and exclusion from diner responses, synthetic receipt round-trip, authorization and idempotent simulated settlement. Those hosted checks covered the previous receiving-address deployment. The current redesign/recovery deployment is source `e3c5ca03b656f9e7f1472eb5c6cbf4c23c246fdc`, deployment `appgdep_6af52526c3fc81c2b5988e0aeef97fb1`, environment revision 1; its Sites production build and native deployment result succeeded. Only Supabase credentials were configured in hosted secrets; NEAR AI and Intents keys remain local and unused by the app.

## Next

1. Publication completed after the user explicitly approved the publishing helper credential transport. Site source `e3c5ca03b656f9e7f1472eb5c6cbf4c23c246fdc`, deployment `appgdep_6af52526c3fc81c2b5988e0aeef97fb1`, environment revision 1. Both live routes remain disabled; publication does not establish wallet or settlement acceptance.
2. Run real VIZOR/Zodl URI + usable transparent-refund tests and a compatible external NEAR wallet signing test. near.com-created passkeys remain unsupported by this external-wallet connector.
3. With an explicitly authorized small budget and user wallet approvals, verify actual confidential recipient credit, fees, partial/late deposits and refunds. No user-wallet signature or funded execution has happened.
4. Configure hosted provider/cron secrets and a recurring reconciliation job, then activate only accepted routes. Both route switches remain false.
5. Recheck NEAR AI availability before image-model verification and receipt recognition.

The new backend binds every quote to the immutable recipient and share, verifies provider signatures, persists private intent payloads and reserves each external call atomically. It hides funding instructions after any observed deposit, continues late settlement checks and blocks replacement quotes until provider finality/cancellation is established. Unknown allocation/submission is retained for operator review.

Unfunded live evidence: ZEC quote HTTP 201, validated partner PENDING_DEPOSIT HTTP 200, anonymous status 404; confidential quote and NEP-413 generation HTTP 201. No funds moved. Status normalization fixes cover omitted signed provider defaults and null pending output.

## NEAR AI availability — November 10

NEAR AI key is configured locally and remains ignored by Git. It has not been authenticated or used for inference. Official https://status.near.ai showed Major outage for Cloud API, Chat API, private models and attestation, last updated November 10 at 07:50 KST. An unauthenticated public /v1/models request returned HTTP 200 with 64 models; that does not verify inference or attestation availability. User reported a possible security issue on X, but no primary-source incident announcement was verified. Keep manual receipt entry available and defer inference checks until the service status is resolved or clarified.

## Known boundaries

Private balances are documented and authentication was tested. Recipient identity privacy across the entire proposed flow is not yet proved. Basic versus advanced guarantees and confidential quote auth composition need partner clarification. Fee/deadline docs/runtime differences are recorded in the technical dossier. No fund movement or mainnet deployment occurred.

Deadline: November 15, 2026, 08:59 KST (November 14, 23:59 UTC).
