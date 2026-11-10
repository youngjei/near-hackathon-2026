# Decision log

## 2026-11-09 — Preparation before implementation

- Start with a private repository under youngjei; use the neutral name near-hackathon-2026 until a product name is chosen.
- Preserve the live organizer guide and the exact prompt repository revision reviewed, with source links and hashes.
- Keep idea, track, stack and license open until the product is selected.
- Treat the live organizer rules as authoritative over older starter checklist wording.
- Do not assume an Intents testnet or working programmatic access to a partner service; verify the dependency first.

For future decisions, record the date, decision, reason, alternatives that materially affected it, and implications for the demo.

## 2026-11-09 — splitdbill and evidence-based privacy design

- Adopt splitdbill as the working product name and the user's recurring cross-border bill-splitting problem. Keep the existing private repo URL for continuity.
- Propose Real-World Money plus Social Money; final track selection remains open. Privacy is earned by demonstrated behavior, not the use of a privacy-branded API.
- Use exact-output quotes per share; implement bills, allocation, fiat conversion and QR/link management in the application.
- Investigate confidential receiving balances, with a dedicated user-controlled receiving identity as the design proposal. Do not claim the organizer's main wallet is protected until the payer-visible path passes the documented test.
- Treat partner enablement as a real dependency. A valid end-user session alone did not authorize confidential quote creation.
- Keep receipt/OCR confirmation and simple UX central. No DeFi/lending/trading feature expansion.
- Keep source-derived statements, live observations and untested boundaries separate in docs/technical. No funded execution was authorized or performed.

## 2026-11-10 — Convenience-first, restricted-wallet beta

- User chose automatic bill conversion and payment requests as the project contribution.
- Restrict the beta to shielded ZEC from VIZOR/Zodl (formerly Zashi) and existing Confidential Intents balances. Organizer receives confidential USDC. General external-chain support is future work.
- Start the private-balance path with USDC input as a simplifying implementation choice. Preserve equal split as the first allocation mode.
- Use per-share ZIP-321 ZEC requests as the planned wallet handoff, with real app/version testing before claiming support. A wallet-brand selector does not enforce the sender app on chain.
- Reuse existing privacy infrastructure and keep per-diner payment metadata private. Do not market splitdbill as a newly built anonymity system.
- Partner access, route economics, refund compatibility and actual third-party settlement remain integration requirements. See BETA_SCOPE.md.

## 2026-11-10 — Stack recommendation, pending implementation

- Recommend one TypeScript/Next.js application with Supabase PostgreSQL/private Storage and scheduled reconciliation. No custom smart contract or native app is required by the scoped beta.
- Use existing 1Click/Intents SDKs and ZIP-321; isolate provider APIs behind small adapters. Recommend Frankfurter reference rates and NEAR AI Cloud receipt extraction, with the exact image model still unverified.
- This records an engineering recommendation, not user approval of visual design, purchased services or an implemented integration. See docs/technical/STACK.md for dependencies and access requirements.
