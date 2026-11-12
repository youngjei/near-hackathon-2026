# splitdbill — NEAR Hackathon 2026

A receipt-based bill splitter for friends meeting across borders: confirm a receipt, automatically calculate shares and conversions, send payment requests, and track repayments in USDC.

The hackathon beta supports **ZEC payments from VIZOR or Zodl (formerly Zashi)**, **payments from an existing Confidential Intents balance**, and **USDC from a Solana wallet**. Standard Solana deposits expose the sender and amount; this route does not shield them. Organizers receive USDC into a confidential balance. Convenience is the product contribution; general external-chain support is deferred. See the [beta scope](docs/project/BETA_SCOPE.md).

This private repository now contains the persisted **split/d/bill beta preview**, alongside hackathon research and unfunded protocol probes. The [web application](app-web/README.md) supports receipt upload/manual entry, conversion, private share links and simulated repayment tracking. Supabase persistence and private receipt storage are connected. A signed payment adapter now passes real dry-quote checks for all three beta routes; see [integration status](docs/technical/PAYMENT_ADAPTER.md). Payment allocation and durable reconciliation are implemented. An owner-only live-testing mode now permits real Solana USDC and Zcash requests on the private Site; confidential sending remains disabled and all acceptance flags remain false. Live wallet/device, refund and confidential-credit acceptance and OCR remain pending. See [wallet compatibility](docs/technical/WALLET_COMPATIBILITY.md).

**Submission deadline: November 14, 2026, 23:59 UTC / November 15, 2026, 08:59 KST.**

**[Open the private owner pilot](https://split-d-bill-beta.snu-chatgpt-5678.chatgpt.site)** · Sign in as the Site owner. “Try a sample bill” stays a simulation. Manual/uploaded bills show **Live testing · Real funds** and can produce real Solana/Zcash payment requests; approve any payment manually in your own wallet. Funded acceptance is not complete.

## Start here

1. Read the [hackathon brief](docs/hackathon/BRIEF.md) for dates, eligibility, prizes and judging.
2. Compare the [13 tracks](docs/hackathon/TRACKS.md) and their starter ideas.
3. Check [technical resources and constraints](docs/hackathon/RESOURCES.md).
4. Read the [project brief](docs/project/PROJECT.md) and [NEAR Intents technical dossier](docs/technical/README.md), including live privacy/access findings.
5. Keep [status](docs/project/STATUS.md), [decisions](docs/project/DECISIONS.md) and the [build log](docs/project/BUILD_LOG.md) current as we work.
6. Use the [submission checklist](docs/hackathon/SUBMISSION.md) when the prototype is ready.

Hackathon research was checked on **November 9, 2026 (KST)**; beta wallet scope and sources were updated **November 10**. [Sources and snapshots](docs/hackathon/SOURCES.md) explain provenance and known gaps. Recheck the live organizer guide before submitting.

## Working on the project

- Use a descriptive branch for a feature or experiment; make small commits describing the result.
- Record user-visible changes, validation and the next step in the build log each session.
- Update the README with actual installation commands and numbered action → expected result demo steps once code exists.
- Keep credentials in ignored local environment files. Commit only an example file with empty values when configuration is defined.
- Track tasks using the included GitHub issue template or the project status file.

The repository starts private. It must become public before the deadline and remain public through judging. The [original stack recommendation](docs/technical/STACK.md) is preserved. The private preview uses Vinext on Sites with Supabase; D1/R2 remains an isolated development option. Native Next.js also builds and runs against Supabase. A separate native Vercel production build is deployed at [the owner-password pilot](https://split-d-bill.vercel.app); the final canonical-origin deployment, owner-password login and live-testing configuration checks passed. Supabase background reconciliation is scheduled every minute, with an HTTP 200 empty-run result verified. See the [implementation direction](docs/technical/DESIGN.md). Selecting a license is on the release checklist. Reference documents retain their original authorship and are not our project code.

## Reproducibility status

See [application setup and demo walkthrough](app-web/README.md), [credential setup](docs/technical/SETUP.md), and [current status](docs/project/STATUS.md). The [research probes](docs/technical/evidence/RESULTS.md) remain separate from the application: they reproduce authentication and unfunded quote checks and never execute payments. A demo-only application is not a completed live NEAR payment integration.
