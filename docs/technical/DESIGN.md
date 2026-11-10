# First beta design and implementation direction

User-authored build brief accepted November 10, 2026.

- Product: a receipt becoming clear reimbursement requests for travelling friends.
- Trust first; task completion is the primary interaction. No marketing landing page.
- Wordmark: `split/d/bill` in lowercase, slashes in the restrained accent.
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

Private owner-only hosting is suitable for preview, not group distribution. App capabilities are still separately enforced. Organizer recovery is cookie-based for seven days in demo; verified wallet ownership is required before live receiving. Receipt images expire from application access after seven days; cleanup is not yet scheduled. No fabricated wallet-connect flow, live balances, quotes, fees or address fields appear in demo.
