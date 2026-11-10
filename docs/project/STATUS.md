# Current status

Updated: November 10, 2026 (KST).

Phase: convenience-first beta scoped to shielded ZEC from VIZOR/Zodl and existing Confidential Intents balances. Partner integration access remains pending. No application, deployment or submission exists. A disposable identity was generated for read-only authentication and discarded; no funded project wallet exists.

## Completed

- Recommended TypeScript/Next.js, Supabase, 1Click/Intents SDKs, ZIP-321 and NEAR AI receipt extraction; see [stack proposal](../technical/STACK.md). Checked current AI-credit terms and hosting constraints. No services provisioned.

- Hackathon guide and all 13 prompts reviewed; references preserved.
- User problem and working name captured: cross-border receipt splitting. November 10 scope prioritizes automatic conversion and payment requests.
- Checked VIZOR sending documentation, Zashi → Zodl rename, ZIP-321 standard and both wallet codebases for request parsing. No device-level wallet test performed.
- Indexed/downloaded 72 official Intents docs; examined core architecture, confidentiality, signing, APIs, SDKs, fees and execution.
- Generated an API map covering 15 1Click operations and related protocol interfaces.
- Verified disposable wallet authentication and owner-only private balance access; documented private quote/history access restrictions.
- Requested real dry quotes, allocated one unfunded public quote and confirmed anonymous status returns its recipient. Verified three response signatures.
- Saved source hashes, sanitized results and a reproducible unfunded probe.

## Next

1. Provision an enabled Confidential Intents partner integration through the official Partner Portal; no enabled credential is available here.
2. Validate dinner-sized ZEC → confidential USDC quotes, refund formats and ZIP-321 handoff in selected VIZOR/Zodl releases.
3. Validate a different user paying confidential USDC → organizer confidential USDC; finalize receipt → share → payment-attempt records and private checkout access.
4. Implement the smallest complete journey using the recommended stack; verify a receipt model and wallet connector first. Validate actual funded execution only after a small explicit budget is authorized.

## Known boundaries

Private balances are documented and authentication was tested. Recipient identity privacy across the entire proposed flow is not yet proved. Basic versus advanced guarantees and confidential quote auth composition need partner clarification. Fee/deadline docs/runtime differences are recorded in the technical dossier. No fund movement or mainnet deployment occurred.

Deadline: November 15, 2026, 08:59 KST (November 14, 23:59 UTC).
