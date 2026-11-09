# splitdbill — NEAR Hackathon 2026

A receipt-based bill splitter for friends meeting across borders: confirm a receipt, automatically calculate shares and conversions, send payment requests, and track repayments in USDC.

The hackathon beta supports **ZEC payments from VIZOR or Zodl (formerly Zashi)** and **payments from an existing Confidential Intents balance**. Organizers receive USDC into a confidential balance. Convenience is the product contribution; general external-chain support is deferred. See the [beta scope](docs/project/BETA_SCOPE.md).

This private repository contains hackathon preparation, technical research and an unfunded API probe; there is no working application yet. The working product name is **splitdbill**.

**Submission deadline: November 14, 2026, 23:59 UTC / November 15, 2026, 08:59 KST.**

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

The repository starts private. It must become public before the deadline and remain public through judging. Application code, framework, infrastructure and license are not selected yet; selecting a license is on the release checklist. Reference documents retain their original authorship and are not our project code.

## Reproducibility status

There are no application commands yet. The [research probe instructions](docs/technical/evidence/RESULTS.md) reproduce authentication and unfunded quote checks with Python and cryptography; they do not execute a payment. Judges should not treat this preparation repository as a completed entry. When the prototype exists, this section will state prerequisites, exact commands, sample inputs, expected outputs, NEAR integration, deployed addresses/network, limitations and the demo URL.
