# First beta design and implementation direction

User-authored build brief accepted November 10, 2026.

- Product: a receipt becoming clear reimbursement requests for travelling friends.
- Trust first; task completion is the primary interaction. No marketing landing page.
- Wordmark: `split/d/bill` in lowercase, centered in the header; 64px desktop and 44–56px mobile (updated at the user’s request on November 12). Mobile navigation sits on its own row below the logo.
- Visual direction (November 12, superseding the earlier slate/green release): the user approved the whole nearhackathon.com reference—warm cream, strong blue, bold typography, sharp dividing rules and pixel graphics/motion. Preserve the existing task flow and centered slash wordmark. Final tokens are defined in app-web/app/globals.css.
- Self-hosted Space Grotesk variable font (SIL OFL) for the expressive sans-serif identity, proportional UI text and tabular amounts. Preserve native form controls and clear labels. No external font requests or monospace theme.
- Responsive task layout with context alongside the working area on desktop and one column on mobile. Flat surfaces and clear rules replace floating rounded cards; the reference supplies visual character without adding marketing sections to checkout.
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


## November 12 — Organizer continuity and interface redesign

Approved direction: a mobile task interface for cross-border reimbursements, with trust first and small rewards for completed actions. The receipt, each share and the next action lead. Keep the centered lowercase splitdbill wordmark, consumer language and no organizer login. A neutral slate canvas and white document surface replace the undifferentiated paper form; desktop can show context alongside the task while mobile stays in one column. Avoid promotional badges, decorative charts, random italic emphasis and monospace styling.

Motion acknowledges a press immediately, explains loading and confirms successful completion. Routine transitions stay around 120–250 ms; no artificial waits or payment celebration before verified success. Reduced-motion preferences retain textual feedback without spatial animation.

Organizer continuity: automatically remember authorized bills on the same browser, expose Your bills in navigation and provide a private recovery link for another device. Browser storage is convenience, not an identity system or cloud account. Losing both browser data and the private link loses organizer access. The receiving wallet identifier never authorizes bill management.

Design guidance: [Impeccable](https://github.com/pbakaus/impeccable), especially Operate, craft-floor and animate references, plus [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines). Both agent skills installed locally through the skill installer. Impeccable's binary context launcher could not initialize its cache; guidance is being applied directly, without claiming an automated detector result.


## November 12 — Approved cream, blue and pixel direction

The user rejected the slate/white/green release as bland and cited [NEAR Hackathon](https://nearhackathon.com/#tracks). Asked whether the appeal was colors, typography/layout, pixel graphics/motion or the whole combination, they answered “all of it”. This pins the new visual world and supersedes earlier palette/card guidance. Keep the existing receipt → review → requests experience and the large centered split/d/bill wordmark.

Product thesis: make cross-border dinner reimbursements feel easy and worth using. Audience: friends meeting at conferences. Primary metaphor: a clear receipt becoming individual payment requests. The first screen must show the brand, receipt action and manual alternative. Voice stays direct; visual expression comes from type, color, composition and useful pixel motion. No filler badges, promotional claims, random italics, forced terminal styling or artificial waits.

Motion should acknowledge an upload, splitting or confirmed completion. Static graphics still convey the same information with reduced motion. Readable amounts, truthful demo/payment states, keyboard access, mobile usability, receiving help and organizer recovery remain acceptance requirements. No payment rollout changes are part of this redesign.

Font source: [Google Fonts Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk), with the license distributed in app-web/public/fonts/OFL-Space-Grotesk.txt.


## November 12 — Animated receipt-to-request introduction

User requested replacing the redundant home heading and description with a phrase sequence: Photograph a receipt → Split the amount → Send ready-to-pay requests → Privately. Keep the logo and pending palette choice. One 12.2-second pass uses concurrent 500ms arrivals/exits, 12px travel and 2.4-second readable holds, then settles on the accent-colored final phrase. Matching easing keeps the outgoing/incoming opacity complementary, avoiding an empty beat. A stable grid reserves text space; upload remains available immediately. Pause/resume/replay, hidden/offscreen pausing and a static reduced-motion/no-script alternative preserve access. Screen readers receive one complete stable heading, without repeated live announcements.

The persistent line “One private payment link for each friend” scopes privacy to individual requests, without claiming that every wallet/chain route is untraceable. Remove the home decorative split illustration so the words are the focal motion; preserve the review graphic and meaningful interaction feedback elsewhere.

Follow-up refinement: precede that smaller explanation with “Get paid back in USDC for the dinner you covered.” Large, clipped, scanline-faded letter fragments at the heading edges suggest the preceding and upcoming phrases. They share the main timeline and disappear as Privately settles; reduced motion hides them. Preserve the pending palette selection.


## November 12 — Receipt brand and three-step story

User explicitly restored homepage pixel imagery: one receipt → three shares → three friends. Center each group over its numbered workflow step and align both desktop divider lines via shared grid rows. Keep the smaller mobile story and the animated headline. Supporting line now reads “Each friend gets a private link to pay their share.” The existing pixel receipt is the app symbol for favicon, browser/home-screen icons, upload and loading; the large split/d/bill wordmark remains. Regenerate raster/SVG/ICO assets with the documented script; no offline behavior is implied by the manifest. This supersedes the earlier removal of homepage illustration.


## November 12 — Organizer digital receipt

Replace the organizer amount hero and tucked-away bill details with one paper receipt: warm ivory, pixel receipt mark, real bill name/date, aligned amounts, perforated dividers and a torn lower edge. Include original/converted totals, organizer share and current repayments together; distinguish requested reimbursements from the full bill total. Preserve actual stored FX references and demo wording. Updates reuse the existing polling; only the original photograph remains an optional disclosure. Payment requests and private recovery stay adjacent on desktop, after the receipt on mobile.
