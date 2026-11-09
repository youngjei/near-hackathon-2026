# Submission checklist and contract notes

Source of truth: [live HACKATHON.md](https://nearhackathon.com/HACKATHON.md). Checked November 9, 2026. **Nothing has been submitted.**

## Prepare the entry

- [ ] Choose the project name and all applicable track IDs.
- [ ] Complete a working prototype and document its specific NEAR integration.
- [ ] Add prerequisites, exact install/run commands, sample input, expected output and numbered action → result demo steps to README.
- [ ] Explain real versus simulated behavior and known limitations.
- [ ] Disclose baseline code, reused libraries/templates, AI code and any second independent entry; link the eligible diff if applicable.
- [ ] Choose and add a LICENSE file.
- [ ] Inspect files and Git history for credentials and private data.
- [ ] Reproduce the demo from a clean checkout.
- [ ] Make the repository public before **November 14, 23:59 UTC / November 15, 08:59 KST** and keep it public through judging.
- [ ] Record a complete user workflow; use video if the demo is local-only.
- [ ] Human publishes a public X post saying it was built at NEAR HACKATHON, including `@NEARProtocol`, `#NEARHackathon` and demo video/screenshots. Optional tags: `@NearLegion`, `@NearBuilders`.
- [ ] Keep any hosted demo up through November 18, ideally November 25.
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
| `nearAddress` | Mainnet account supplied by the human; 2–64 characters, lowercase, organizer regex in saved guide |
| `projectUrl` | Public repository HTTP(S) URL, at most 300 characters; each repo only once |
| `demoUrl` | Public X demo post HTTP(S) URL, at most 300 characters |
| `idea` | 20–2,000 characters covering problem, product and NEAR's role |
| `consent` | Boolean true only after actual agreement |

Do not add `website`: it is a spam trap, not a project website field for the API.

On 201, record successful submission privately. On 400, fix the listed validation fields and reuse the same request ID. On 403, stop and report the reason. On 409, investigate the existing submission/limit; do not change identity or repository URLs to evade it. On 413, shorten the body. On 503, wait a minute and reuse the same request ID. After a network error, reuse the same request ID rather than creating a second entry.

Saved entries cannot be edited directly. The human uses [Request changes](https://nearhackathon.com/request-changes) with the originally submitted email, wallet and repository plus proposed corrections; organizers review manually. Do not submit the same project again.
