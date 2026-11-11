# First beta design and implementation direction

User-authored build brief accepted November 10, 2026.

- Product: a receipt becoming clear reimbursement requests for travelling friends.
- Trust first; task completion is the primary interaction. No marketing landing page.
- Wordmark: `splitdbill` in lowercase, centered in the header (updated at the user’s request on November 11).
- Palette: paper `#faf9f6`, ink `#212922`, muted `#626b64`, accent `#345d49`, tint `#eef2eb`.
- Single sans-serif stack, proportional text, tabular amounts. Native form controls for small-screen accessibility.
- Narrow 480px task column; mobile margins 20px. Typography and rules establish hierarchy.
- Motion: 150–300ms transitions for entry, feedback and progress. Reduced-motion disables them. No ASCII effect because it did not clarify the core flow.
- No filler badges, italic emphasis, monospace theme, gradient decoration, nested dashboard cards or invented metrics.
- Three journeys: confirm/create, pay an individual share, track reimbursements.
- A persistent demo disclosure and explicitly named simulation actions prevent false payment claims.

## Hosting adjustment

No Vercel or Supabase credentials were available. To deliver a real persisted preview, implement React/Next.js App Router conventions using the Sites Vinext runtime and provisioned D1/R2. The originally proposed Vercel + Supabase deployment remains a separate integration task, not an environment-variable switch. Preserve a PostgreSQL migration as a starting point, not a claim of parity or tested deployment.

## Remaining product constraints

Private owner-only hosting is suitable for preview, not group distribution. App capabilities are still separately enforced. Organizer access uses a private capability link and cookie. The receiving flow uses a pasted, confirmed internal nearcom-prefixed address, without requiring wallet login or ownership proof. A format example and accessible help popup explain where to find it. Keep this internal account distinct from chain deposit addresses; see PAYMENT_ADAPTER.md. Recipient changes after requests are issued are disallowed; use a new bill. Receipt images expire from application access after seven days; cleanup is not yet scheduled. No fabricated wallet-connect flow, live balances, quotes or fees appear in demo. The receiving field stores the organizer-supplied account; it does not enable funding.


## November 11 UX refinement

Product thesis: a receipt becomes a clear amount to repay. Target: friends paying each other after a shared meal across borders. Trust and clarity take precedence over novelty. The interface should feel like a short receipt and payment request, with the bill, amount and next action leading each screen. Use literal, consumer-friendly language. Preserve the centered splitdbill wordmark and restrained paper/ink/green palette.

Remove slogans, captions that repeat headings, decorative status banners, duplicate friend numbers and oversized controls that imply drag-and-drop without implementing it. Do not replace these with trendy gradients, glass cards, pill badges, italic display words, random monospace or scroll effects. Small transitions should acknowledge interaction. Optional exchange-rate explanations, address help and manual payment-copy fallbacks belong in accessible disclosures. Demo status, fees, expiry, return-address privacy, receiving-address confirmation and double-payment prevention must remain understandable.

The researched patterns are editorial critiques, not an objective test of whether software was AI-generated. [Designpixil's examples](https://designpixil.com/blog/ai-slop-design) describe recurring decorative defaults and generic language. The actionable basis here is NN/g's [aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/) and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): remove information that competes with the task while retaining necessary controls.

Acceptance: desktop/mobile journey completion, keyboard access and focus restoration, no horizontal overflow, useful error text, visible demo distinction and payment safeguards; inspect rendered screens rather than relying only on source review.
