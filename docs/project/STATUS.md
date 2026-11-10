# Current status

Updated: November 10, 2026 (KST).

Phase: persisted demo implemented, locally verified and privately deployed. Demo methods represent VIZOR/Zodl ZEC and confidential USDC but cannot move funds. Partner integration access, wallet signing, OCR and live reconciliation remain pending. No submission or funded project wallet exists.

Preview: [https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site](https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site) — owner-only, ChatGPT sign-in required.

## Completed

- Built TypeScript/React App Router screens on the Sites-compatible Vinext runtime, with D1 bill/share/attempt records and private R2 receipt uploads.
- Implemented per-share capabilities, cookie exchange, exact cent allocation, idempotent requests, stale-attempt handling and explicit simulation controls.
- TypeScript and production build passed; 10 Vitest checks and 8 Playwright scenarios passed. Visual inspection completed; wallet-device testing is separate and not performed.
- Published the private preview and verified the hosted API with synthetic data: creation, durable reads, separate diner access, simulated settlement and idempotence passed. All five expected database tables were present. No recurring jobs are configured.
- Added schema migrations, empty-value environment template, reproducible walkthrough and credential setup guide. Supabase schema is staged only; no Supabase/Vercel runtime is configured.

- Recommended TypeScript/Next.js, Supabase, 1Click/Intents SDKs, ZIP-321 and NEAR AI receipt extraction; see [stack proposal](../technical/STACK.md). Checked current AI-credit terms and hosting constraints. No services provisioned.

- Hackathon guide and all 13 prompts reviewed; references preserved.
- User problem and working name captured: cross-border receipt splitting. November 10 scope prioritizes automatic conversion and payment requests.
- Checked VIZOR sending documentation, Zashi → Zodl rename, ZIP-321 standard and both wallet codebases for request parsing. No device-level wallet test performed.
- Indexed/downloaded 72 official Intents docs; examined core architecture, confidentiality, signing, APIs, SDKs, fees and execution.
- Generated an API map covering 15 1Click operations and related protocol interfaces.
- Verified disposable wallet authentication and owner-only private balance access; documented private quote/history access restrictions.
- Requested real dry quotes, allocated one unfunded public quote and confirmed anonymous status returns its recipient. Verified three response signatures.
- Saved source hashes, sanitized results and a reproducible unfunded probe.

Delivery target: a real usable application with Supabase persistence, receipt extraction and verified NEAR payments. The existing demo is an interim preview. Supabase credentials were verified; schema setup and runtime connection remain pending. The schema now has an appended migration supporting explicit live and test records.

## Next

1. Provision an enabled Confidential Intents partner integration through the official Partner Portal; no enabled credential is available here.
2. Validate dinner-sized ZEC → confidential USDC quotes, refund formats and ZIP-321 handoff in selected VIZOR/Zodl releases.
3. Validate a different user paying confidential USDC → organizer confidential USDC; finalize receipt → share → payment-attempt records and private checkout access.
4. Validate an image model with the configured NEAR AI key; wire receipt extraction after validation. Complete the intended Supabase/native Next.js deployment adapter if adopting Vercel.
5. Implement real settlement reconciliation and validate funded execution only after a small explicit budget is authorized.

## Known boundaries

Private balances are documented and authentication was tested. Recipient identity privacy across the entire proposed flow is not yet proved. Basic versus advanced guarantees and confidential quote auth composition need partner clarification. Fee/deadline docs/runtime differences are recorded in the technical dossier. No fund movement or mainnet deployment occurred.

Deadline: November 15, 2026, 08:59 KST (November 14, 23:59 UTC).
