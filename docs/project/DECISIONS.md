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

## 2026-11-10 — First persisted preview

- Implement the user's receipt-first light design and exact split/d/bill wordmark; omit ASCII because it does not clarify the payment journey.
- In the absence of Vercel/Supabase credentials, use the available Sites hosting runtime (Vinext with App Router conventions) and D1/R2 for a persistent owner-private preview. Preserve the Supabase migration as staged, not an implemented backend switch.
- Live payment gate is hard-disabled. No fundable QR, fabricated wallet connection, simulated balances presented as real, or spending endpoint exists. Real NEAR/AI adapters remain incomplete and unverified.
- Use individual invitation links instead of a shared claimable group link for this first version, avoiding shared access to all diners' payment data.
- No cloud plan purchased, blockchain contract deployed, visibility changed or funds moved.

## 2026-11-10 — Real application remains the delivery goal

- User clarified that setup must target a real usable application. The deployed demo is an interim preview, not the intended final deliverable.
- Append a Supabase migration allowing explicit live/demo modes instead of restricting the schema to demo-only records. Remove implicit demo defaults; retain existing test records and current live-payment authorization gates.
- Correct the fresh-project SQL handoff and provide a separate upgrade for a project that already ran the original setup. This schema change does not implement or validate payment execution.

## 2026-11-10 — Confidential quote access no longer blocked

- A configured partner key successfully authorizes dry quotes for both intended payment paths. Do not keep describing partner quote enablement as blocked.
- Keep funded execution gated until actual receiving-account authorization, payer signing, refunds and provider reconciliation pass their own checks. Synthetic dry quotes do not prove these.

## 2026-11-10 — Shared Supabase persistence and native runtime

- Separate API behavior from storage with a domain-level Store interface. Keep the existing Sites D1/R2 implementation and add Supabase PostgreSQL/private Storage; never translate arbitrary SQL over HTTP.
- Use server-only, security-invoker RPCs for transactions. Explicit service-role grants fix the observed table permission errors; browser roles retain no table/function access. Apply migration 003 only after the user's explicit approval, received this session.
- Serialize monetary PostgreSQL values as strings, normalize timestamps, and lock shares during attempt creation/updates. Payment mode remains independent of database choice.
- Add native Next.js commands without replacing the existing private Site. Pin an explicit public origin for native production CSRF/cookies, because Next's internal request URL may use localhost behind a proxy.
- Retain old D1 test records; they are not migrated to Supabase. New Supabase requests have their own links. No wallet spending or live settlement is enabled by this infrastructure change.

## 2026-11-10 — Verified payment adapter; preserve the existing near.com wallet

- The initial answer described near.com with a passkey; the user subsequently clarified that only the confidential receiving balance on near.com is confirmed. Login/signing method remains unknown. Do not require a passkey bridge unless that account type is established. Receiving does not require signing each incoming payment; spending from confidential USDC does require payer authorization.
- Pin the official 1Click TypeScript SDK 0.1.26 for quote verification. Bind all expected routing fields independently because the signed projection excludes confidentiality and settlement status. Keep provider metadata server-side.
- Both beta routes passed signed dry estimates at 5, 15 and 50 USDC. Store sanitized evidence only. Keep live checkout gated until account authorization, wallet refunds, confidential status access and funded acceptance are verified.
- Validate transparent Zcash refund addresses according to current published support. Do not silently treat a shielded/unified refund address as supported, or imply that VIZOR/Zodl device compatibility has been tested.
- No schema change, hosted behavior change, user signature, allocated confidential payment address or funds in this increment.

## 2026-11-10 — No organizer wallet login

- User explicitly chose receiving-account entry without receiver login. This supersedes earlier organizer ownership-proof/onboarding authorization requirements. The organizer pastes and confirms a Confidential Intents receiving account; validate format and route, not ownership.
- Preserve private organizer capability access for bill management. Bind the receiving account to the bill and prohibit changing it after payment requests are issued. Do not ask for wallet secrets or balance-reading access.
- Payers still authorize their own spending in their wallet. An organizer passkey bridge is not a prerequisite for ZEC reimbursements into their confidential balance. Live recipient entry/binding remains to be implemented; this update changes the specification only.
