# Build log

## 2026-11-09 — Repository and hackathon context

Prepared the repository and reviewed the organizer guide, site and all track prompts. Added event and submission briefs, technical resources, project planning files and original reference snapshots. Cross-checked dates and prize totals, identified older submission wording and Intents/testnet conflicts, and checked internal Markdown links and Git hygiene before the initial commit.

No product code exists yet. Next: choose a concrete user problem and test its hardest dependency.

## Future session format

- Date and outcome
- Changes and why they matter
- Checks performed and results
- Known limitations or blockers
- Next concrete step

## 2026-11-09 — Intents and Confidential Intents investigation

Captured splitdbill's product direction. Added a technical dossier covering architecture, privacy boundaries, all current 1Click operations, related SDKs/interfaces, and the proposed application flow. Saved a 72-page source manifest and sanitized API evidence.

Live validation: fresh Ed25519 empty-intent authentication succeeded; private balances returned only with the valid user token; history was invite-only; confidential quotes were access-blocked. Public exact-output quotes succeeded. One unfunded quote's anonymous status exposed the synthetic recipient, and dry/allocated/status quote signatures all verified. No spending signature or funded transaction was submitted.

Added a reproducible probe with no user-wallet access or spending endpoint. Updated README, project brief, status, decisions and outdated fee guidance. Remaining dependency: enabled confidential partner credentials, followed by payer/owner/anonymous metadata testing. No frontend implementation yet.

Final checks: the saved dry-probe script reproduced the expected auth/access outcomes; offline verification passed for all three saved quote signatures. Local Markdown links, evidence JSON parsing, Python syntax, JWT-value scan and Git whitespace checks passed. The probe uses curl because this machine’s Python HTTP stack had certificate/client-access issues; no TLS checks were disabled.
