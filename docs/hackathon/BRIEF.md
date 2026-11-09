# Hackathon brief

Checked November 9, 2026 (KST). Sources: [live organizer guide](https://nearhackathon.com/HACKATHON.md), [event website](https://nearhackathon.com/) and [prompt repository](https://github.com/nearai/near-hackathon-prompt-examples). The [saved guide](reference/HACKATHON.md) contains the complete event rules and API contract.

## Dates

| Milestone | UTC | Korea time (UTC+9) |
| --- | --- | --- |
| Announcement / eligible new code begins | October 19, 2026 (time not specified) | Exact local boundary not specified |
| Event and submissions open | November 1, 2026, 00:00 | November 1, 09:00 |
| Development ends; submissions close | November 14, 2026, 23:59 | November 15, 08:59 |
| Judging starts | November 16, 2026, 00:00 | November 16, 09:00 |
| Results due by | November 18, 2026, 23:59 | November 19, 08:59 |

We are starting during the event. There is no separate advance application: the final submission is registration. Aim to finish before November 14 KST, leaving time for reproduction, recording and submission; this is our planning suggestion, not an organizer deadline.

## Entry and eligibility

- Solo builders and teams may enter. One submission per project; each person may enter at most two independent projects, disclosed in each project's README.
- Select all tracks that actually fit; multiple tracks still means one submission. The examples and named ecosystem integrations are optional. An appropriate own contract on NEAR can qualify.
- Work written since the October 19 announcement counts. Earlier work is baseline. Existing products, cross-chain integrations and new features are allowed when the eligible additions are separated and disclosed.
- Existing repositories are allowed. Use a dedicated branch or baseline/submission tags and link the relevant diff in the README.
- Libraries, templates, boilerplate and AI-generated code are allowed; disclose their use. There is no stated minimum code size.
- Testnet-only entries are eligible in every track. Mainnet is only needed for an integration available exclusively there.
- Public repository plus working prototype plus public X demo post are required. Local-only demos are allowed with reproducible instructions and a video; screenshots alone are insufficient if judges cannot open the demo.
- Keep a hosted demo available through November 18, ideally November 25. Keep the repository public through judging and add a LICENSE file. Any license is allowed; the team retains ownership.

## Prizes

The announced pool is **$250,000**, denominated in USD and paid in NEAR to the mainnet account supplied with the entry.

| Award | Per winner | Winners | Total |
| --- | ---: | ---: | ---: |
| Overall grand prize | $55,000 | 1 | $55,000 |
| First in each track | $10,000 | 13 | $130,000 |
| Second in each track | $3,000 | 13 | $39,000 |
| Third in each track | $2,000 | 13 | $26,000 |

Payout is one payment, with no vesting, within 30 days of results. The reviewed materials do not specify the NEAR conversion price/time or whether awards can stack across tracks or with the grand prize. Do not assume those mechanics.

## Judging

Claude Code and Codex screen entries for reproducibility and whether features match the README, producing a report and preliminary score. Human judges decide; a low AI score alone cannot reject an entry.

The website lists Illia Polosukhin (NEAR Protocol), Eddy Lazzarin (a16z crypto), Mert Mumtaz (Helius), Avichal Garg (Electric Capital), Kain Warwick (Synthetix & Infinex), Haseeb Qureshi (Dragonfly), and Stepan Gershuni (cyber•Fund), alongside the AI screening tools.

Technical implementation, design, impact, originality and sustainability are cited as criteria used in previous NEAR hackathons, offered as preparation guidance. The reviewed materials do **not** publish a weighted scoring rubric for this event.

Practical implication: demonstrate one complete workflow, show exactly where NEAR is used, provide safe sample data and explicit expected results, disclose limitations and make it easy to reproduce without funds where possible.

## Important clarifications

- The older prompt repository's SUBMITTING.md says one submission per team. The current guide and website instead specify one per project and up to two independent disclosed projects per person. Use the live rules.
- Some sample prompts combine a testnet flow with NEAR Intents. The current guide explicitly says no Intents testnet exists or is planned. Split the sandbox/testnet component from dry quotes or mainnet-only execution; do not claim a full testnet integration exists.
- The form displays a Website field, but the guide says the API's `website` field is a honeypot. Do not populate it or add it to an API payload.
- The guide says no reimbursement of mainnet costs by default. Do not budget on reimbursement.

## Still unresolved

Project concept, team size, track selection, stack, deployment approach, license, budget, mainnet payout account, team contact details and demo post are not yet provided. We have not submitted, created a wallet, installed the NEAR agent skills, deployed contracts or spent funds.
