# Submission checklist and contract notes

Source of truth: [live HACKATHON.md](https://nearhackathon.com/HACKATHON.md). Checked November 13, 2026. **Nothing has been submitted.**

## Prepare the entry

The live guide requires a working prototype, public reproducible repository and human-published X demo post. It explicitly allows local-only demos with a video and testnet-only entries; NEAR Intents has no testnet. It does not state that a funded mainnet payment is mandatory. For split/d/bill, any unverified live payment path must stay labelled as a pilot, while the reproducible sample journey is labelled a simulation. Claiming real reimbursement success requires an observed wallet payment, provider settlement and confidential receiving credit.

- [x] Choose display name **Split/d/bill** (form fallback **Splitdbill**) and track IDs `realworld`, `privacy`, `social`. Social Money is a secondary fit for small-group expense coordination; no DAO/Trezu integration is claimed.
- [x] Complete a working prototype and document its specific NEAR integration and funded-acceptance limits.
- [x] Add prerequisites, exact install/run commands, sample input, expected output and numbered action → result demo steps to README.
- [x] Explain real versus simulated behavior and known limitations.
- [x] Disclose baseline code, reused libraries/templates and AI code; link the eligible diff. No second independent entry has been identified.
- [ ] Choose and add a LICENSE file.
- [x] Inspect current files and Git history for credentials and private data; 579 history blobs had no `.env` file, private key, GitHub token or personal internal receiving identifier. The separate signature evidence is public quote data, not a secret key.
- [x] Reproduce the demo against a fresh isolated local D1 database and verify the browser journeys.
- [x] Make the repository public before **November 14, 23:59 UTC / November 15, 08:59 KST** and keep it public through judging. Public `main` serves the README, screenshots and video without sign-in.
- [x] Record a complete synthetic user workflow; the narrated video is in `assets/demo.mp4`.
- [ ] Human publishes a public X post saying it was built at NEAR HACKATHON, including `@NEARProtocol`, `#NEARHackathon` and demo video/screenshots. Optional tags: `@NearLegion`, `@NearBuilders`.
- [ ] If a public hosted demo is added, keep it up through November 18, ideally November 25. The current Vercel pilot is owner-only; the credential-free local demo is the judge path permitted by the organizer guide.
- [ ] Re-read the live rules and verify the exact repo and X post links.

## Human-provided information

Collect privately: project name, lead name, contact email, team size, tracks, mainnet NEAR prize account, public repo URL, public X demo post URL, product description, and explicit consent. Do not put contact details, consent records or the payload in Git.

Read the consent notice verbatim before recording consent:

> I agree that the organizers may use these details to review our submission and contact us about this hackathon.

## Submit once

The [web form](https://nearhackathon.com/#apply) and API accept the same entry. The organizer guide asks that the complete exact API payload be shown to the human and explicitly confirmed before sending. No automatic submission is configured here.

`POST https://nearhackathon.com/api/applications`, JSON, body at most 12,000 bytes. Only these fields:

| Field | Validation |
| --- | --- |
| `requestId` | Generate one UUID and preserve it for all retries of this entry |
| `projectName` | 2–80 characters |
| `leadName` | 2–80 characters |
| `email` | Valid email, at most 160 characters; at most two different projects per email |
| `size` | Exactly `1`, `2 - 4`, `4 - 6`, `6 - 8`, or `8+` |
| `tracks` | One or more unique IDs from the 13-track list |
| `nearAddress` | Mainnet named NEAR account or 64-character implicit account supplied by the human; 2–64 characters, lowercase, organizer regex in live guide. An internal `nearcom:0x…` receiving identifier is not a valid prize account. |
| `projectUrl` | Public repository HTTP(S) URL, at most 300 characters; each repo only once |
| `demoUrl` | Public X demo post HTTP(S) URL, at most 300 characters |
| `idea` | 20–2,000 characters covering problem, product and NEAR's role |
| `consent` | Boolean true only after actual agreement |

Do not add `website`: it is a spam trap, not a project website field for the API.

On 201, record successful submission privately. On 400, fix the listed validation fields and reuse the same request ID. On 403, stop and report the reason. On 409, investigate the existing submission/limit; do not change identity or repository URLs to evade it. On 413, shorten the body. On 503, wait a minute and reuse the same request ID. After a network error, reuse the same request ID rather than creating a second entry.

Saved entries cannot be edited directly. The human uses [Request changes](https://nearhackathon.com/request-changes) with the originally submitted email, wallet and repository plus proposed corrections; organizers review manually. Do not submit the same project again.

## Product description draft for exact payload review

Split/d/bill helps friends from different countries reimburse a shared meal without manual currency math or a group wallet-address thread. An organizer confirms a receipt, charges and diner count; the app calculates cent-accurate USDC shares from a dated fiat reference rate, creates a separate private checkout link for each friend and tracks repayment. The prototype implements NEAR Intents 1Click quote validation, per-share quote allocation and reconciliation for Zcash and Solana USDC toward an organizer's Confidential Intents USDC balance. Compatible external NEAR wallets can review and sign an intent from an existing confidential balance. The credential-free sample and video demonstrate simulated settlement. Real Zcash/Solana requests are restricted to an owner-only pilot; wallet-device handoff, refunds, funded settlement and final confidential credit remain unverified. Privacy depends on the route: Solana transfers reveal sender and amount, while the provider can see routing data. The app does not claim universal anonymity.

This draft describes the shipped scope for the human to review before the one-time submission. It does not claim native near.com embedding or successful funded payments. Nothing has been submitted.
