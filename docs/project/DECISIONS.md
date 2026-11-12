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

## 2026-11-10 — Manual Solana deposit receiving and near.com vision

- User wants the feature eventually embedded in near.com and included as a future goal in the hackathon description. Record the aspiration without claiming partnership or integration.
- User's example receive screen is USDC on Solana with a 1 USDC minimum; user explicitly confirmed Confidential Mode. For the manual beta, use this typed chain-deposit destination with DESTINATION_CHAIN and the Solana USDC asset. It is not the internal account ID accepted by the existing adapter. Preserve the direct internal route separately.
- Existing 1Click routing performs conversion; no custom or additional app-managed solver is needed. near.com deposit credit is a separate downstream step with unverified fees/status mechanics. Do not equate delivery to its deposit address with verified net confidential credit. Keep organizer login-free and payer scope unchanged.
- This records the next implementation direction. No address/QR saved in Git, route implementation switched, payment sent or submission made.


## 2026-11-10 — Implemented direct internal receiving

The user selected the simpler internal near.com address route, superseding the manual Solana deposit plan. Require the full nearcom: prefix at entry, validate format, normalize only for storage/provider use, and show the address for confirmation. Add an accessible instructions popup. Save the recipient immutably at bill creation; a changed recipient requires a new bill. Only organizer responses contain it. Do not claim ownership validation or live settlement. Migration 004 preserves old rows as null and retains server-only access.


## 2026-11-11 — Durable execution and restricted wallet signing

Implement real quote allocation, private storage, exact-route validation, settlement reconciliation and NEP-413 signing through compatible external NEAR wallets. Do not imply that this controls a near.com-created passkey account. Keep each method gated until its real wallet/refund/funded acceptance is complete. Use NEAR Connect 0.12.0, pinned.

Reserve allocation and spending submission atomically before external calls; a timeout retains an unknown lock. Do not issue replacement fundable quotes after failure/refund without verified provider cancellation/finality: the old instruction may still receive a late payment. Same-key requests remain idempotent. Once a deposit is observed, never show funding instructions again merely because status regresses. Preserve existing demo flows and immutable receiving binding.


## 2026-11-11 — Literal copy and task-first presentation

User requested removal of redundant captions, corny phrases and common generated-interface patterns. Use the bill name and concrete actions instead of slogans. Keep amount and next action primary; reveal optional explanations and alternate payment handoffs on demand. Preserve consequential disclosures and demo labels. Retain the existing wordmark, restrained palette and single sans-serif instead of substituting another trend. Research and visual acceptance criteria are recorded in DESIGN.md.


## 2026-11-11 — Centered wordmark

User changed the main logo to plain lowercase splitdbill, centered in the header. This supersedes the earlier slash-separated wordmark styling.


## 2026-11-12 — No-login bill history and purposeful motion

User approved Impeccable plus Vercel interface guidance and requested that organizers can return after closing a page. Keep the no-wallet-login design: store validated organizer capabilities on the device after authorized creation/read, list saved bills and expose a private recovery link for another browser. Capability possession grants management access; a receiving address alone never does. Return the existing owner token only in the already-authorized organizer response. Payer responses remain excluded. No database migration or account signup is required. Clearly explain browser-local persistence and loss of access if both storage and saved link are lost.

Use brief interaction/loading/completion feedback, respect reduced motion and preserve truthful payment states. Do not activate real payments or inference as a side effect of visual work.


## 2026-11-12 — Larger split/d/bill wordmark

User restored slash-separated split/d/bill branding and requested a much bigger centered logo, superseding the November 11 plain spelling. Give the mobile logo its own row so navigation remains usable.


## 2026-11-12 — Reference-led visual redesign

User explicitly approved the whole nearhackathon.com visual reference: cream and blue, bold type, sharp layout, pixel graphics and motion. Replace the slate/green floating-card visual system across creation, payment and tracking while retaining the existing product flow, centered split/d/bill wordmark and truthful demo states. Self-host open-licensed Space Grotesk; no external font requests.


## 2026-11-12 — One-pass animated homepage explanation

User requested animated phrases to replace repeated split copy and emphasize convenience/privacy. Use one readable sequence ending on Privately, with pause/replay and a static reduced-motion alternative; actions are never gated by animation. Keep private-link wording explicit and do not claim verified end-to-end wallet anonymity. Palette selection remains pending.


## 2026-11-12 — Final brand palette

User selected the porcelain/petrol comparison after feedback from friends. Adopt #F3F4EF porcelain and #14645E petrol across the app and brand assets, superseding cream/cobalt and closing the palette choice. Preserve the pixel receipt identity, typography, animations and sharp layout. Retain contrasting semantic error states.


## 2026-11-13 — Wordmark selection and rate explanation

User selected logo comparison option 1: pixel receipt plus readable lettering and pixel slashes, using the approved petrol palette. Retain the receipt as the standalone app symbol. Keep FX provenance and the USD/USDC calculation assumption available in an optional disclosure instead of always printing it on the organizer receipt. This is presentation only, not a change to rate selection or settlement.


## 2026-11-13 — Solana USDC and route-specific privacy

User explicitly expanded the beta to a third Solana wallet payment method, superseding the November 10 prohibition on Solana payers. Limit this increment to native USDC on Solana through the existing exact-output Intents route into confidential USDC. Preserve separate disabled rollout/acceptance gates until wallet, refund and funded settlement acceptance. Do not silently enable mainnet spending, add other assets or claim standard Solana transfers hide the sender. Label Zcash as Zcash (VIZOR or Zodl), and NEAR Confidential balance explicitly; describe shielded-source sender protection separately from confidential receiving and visible bridge data.

The approved headline sequence is Photograph a receipt → Split the amount → Send payment requests → Get paid back privately. Keep existing loop timing, asymmetric multiline previews, pause and reduced-motion behavior.


## 2026-11-13 — Separate owner live testing from funded acceptance

- User requested real tests with their own Solana and VIZOR wallets, keeping spending approval in the wallet. Introduce explicit `LIVE_PAYMENT_TESTING` instead of falsely marking refund, device or funded acceptance complete.
- Permit Solana/Zcash deposit routes before acceptance only with server-proven owner access, a configured partner key and global/per-route activation. Keep every acceptance flag false. Confidential-balance spending has no testing bypass and stays disabled.
- Sites uses its platform-authenticated owner-private hosting boundary only in the Cloudflare runtime. Native Vercel uses an independent signed owner-password session and never trusts a caller-supplied Sites identity header. Keep application capability checks inside either hosting boundary.
- Label manual/uploaded bills **Live testing · Real funds**; retain samples and all demo settlement controls as explicit simulations. A generated request, dry quote or synthetic browser test cannot establish actual wallet compatibility, refund delivery or confidential credit.
- Prepare a separate native Next.js owner-password Vercel deployment for wallet opening outside the Sites browser; do not change the Sites audience. Vercel owner access and Supabase Cron/Vault scheduling were verified later in this session; funded acceptance remains incomplete. General public rollout remains a separate decision after acceptance evidence.


## 2026-11-13 — Standalone origin and background reconciliation

- Use `https://split-d-bill.vercel.app` as the canonical native owner-pilot origin and pin `APP_ORIGIN` to it. Vercel must collect the existing `.next-native` output; keep Sites-only Vite configuration out of native deployment. The final production deployment is READY with hosted owner login and canonical-origin checks verified.
- Run provider status reconciliation every minute through Supabase `pg_cron`/`pg_net`, using the existing bearer token held in Vault as `splitdbill_reconcile_token`. Keep token values out of operational SQL and source. The verified HTTP 200 empty run establishes scheduling and authorization, not funded settlement or acceptance. This job reads statuses and never authorizes wallet spending.
