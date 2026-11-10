# Current status

Updated: November 10, 2026 (KST).

Phase: Supabase persistence connected, native Next.js supported, and the private Site updated. Demo methods represent VIZOR/Zodl ZEC and confidential USDC but cannot move funds. Signed payment estimates now verify in the application adapter; near.com passkey signing, OCR and live reconciliation remain pending. No submission or funded project wallet exists.

Preview: [https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site](https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site) — owner-only, ChatGPT sign-in required.

## Completed

- Added a verified payment adapter for the two beta routes. Six real dry quotes (5/15/50 USDC per route) passed official SDK signature and routing checks. Settlement classification, privacy-safe preview projection and transparent Zcash refund checksum validation are implemented and tested; live checkout and database reconciliation remain unconnected. See [payment integration details](../technical/PAYMENT_ADAPTER.md).

- November 10 partner checks: authenticated ordinary control, ZEC → confidential USDC (basic and public parameter), and confidential USDC → confidential USDC all returned HTTP 201 dry quotes. No payment addresses, spending signatures or funds. Sanitized evidence saved; credential remains local.

- Built TypeScript/React App Router screens on the Sites-compatible Vinext runtime, with D1 bill/share/attempt records and private R2 receipt uploads.
- Implemented per-share capabilities, cookie exchange, exact cent allocation, idempotent requests, stale-attempt handling and explicit simulation controls.
- TypeScript and production build passed; 10 Vitest checks and 8 Playwright scenarios passed. Visual inspection completed; wallet-device testing is separate and not performed.
- Published the private preview and verified the hosted API with synthetic data: creation, durable reads, separate diner access, simulated settlement and idempotence passed. All five expected database tables were present. No recurring jobs are configured.
- Applied all three Supabase migrations with explicit user approval for the server functions and grants. Implemented PostgreSQL transactions, private receipt storage, exact monetary serialization and rate limits. The private Site now uses Supabase; native Next.js is also supported locally. Vercel hosting is not configured.

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

- 34 Vitest checks pass, including quote tampering/expiry, settlement underpayment, provider error redaction, real PostgreSQL migration/transaction behavior and native proxy-origin security checks.
- Eight desktop/mobile browser scenarios pass against native Next.js with the real Supabase project. The D1 implementation also passed all eight after extraction into its adapter.
- Both production builds and TypeScript pass. Native Next.js output is isolated in `.next-native/` so it cannot overwrite Vinext route types.
- Updated Next.js to 16.4.6 and React/RSC to 19.2.8, resolving the audit's critical Next advisory and RSC high advisory. Other audit findings remain (26: 16 moderate, 10 high, including tooling/Vinext/Zod); do not describe this as a completed dependency security review.
- Hosted API checks passed for Supabase selection, synthetic receipt round-trip, authorization and idempotent simulated settlement. Deployed Site source `da965610766fc0b568f70ede9cc49eb1711cf5f4`, deployment `appgdep_6af295f0fe7881c2941663c3bd134601`, environment revision 1. Only Supabase credentials were configured in hosted secrets; NEAR AI and Intents keys remain local and unused by the app.

## Next

1. User receives through near.com with a passkey. Resolve its supported third-party account/ownership/signing handoff; the protocol accepting webauthn does not itself connect that wallet. Partner dry quote access is already verified.
2. Dinner-sized dry quotes pass. Verify transparent t1/t3 refund access and ZIP-321 handoff in the selected VIZOR/Zodl releases; published bridge support does not include shielded refund addresses.
3. Validate a different user paying confidential USDC → organizer confidential USDC; finalize receipt → share → payment-attempt records and private checkout access.
4. Validate an image model with the configured NEAR AI key; wire receipt extraction after validation. The Supabase/native Next.js adapter is complete; configure Vercel only if switching hosting.
5. Implement real settlement reconciliation and validate funded execution only after a small explicit budget is authorized.

## NEAR AI availability — November 10

NEAR AI key is configured locally and remains ignored by Git. It has not been authenticated or used for inference. Official https://status.near.ai showed Major outage for Cloud API, Chat API, private models and attestation, last updated November 10 at 07:50 KST. An unauthenticated public /v1/models request returned HTTP 200 with 64 models; that does not verify inference or attestation availability. User reported a possible security issue on X, but no primary-source incident announcement was verified. Keep manual receipt entry available and defer inference checks until the service status is resolved or clarified.

## Known boundaries

Private balances are documented and authentication was tested. Recipient identity privacy across the entire proposed flow is not yet proved. Basic versus advanced guarantees and confidential quote auth composition need partner clarification. Fee/deadline docs/runtime differences are recorded in the technical dossier. No fund movement or mainnet deployment occurred.

Deadline: November 15, 2026, 08:59 KST (November 14, 23:59 UTC).
