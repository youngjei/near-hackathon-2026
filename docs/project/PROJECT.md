# Project brief

Working name: **splitdbill**. User-selected problem; implementation stack and final tracks remain open.

| Question | Current direction |
| --- | --- |
| User/problem | Friends from different countries at crypto conferences need to split a restaurant bill without exposing their main wallets |
| Product | Photograph receipt → confirm total/currency → divide among diners → share QR/link → repay each share through NEAR Intents |
| Why NEAR | Cross-chain payment routing, exact-output USDC settlement, confidential receiving balances |
| Privacy target | Fellow diners cannot use the reimbursement flow to inspect the organizer's main public wallet; private balances alone do not prove this |
| Tracks | Real-World Money primary candidate; Social Money secondary candidate; Privacy only with a demonstrated privacy journey |
| Demo | Organizer confirms a 200 AED receipt and group size; other diners each pay one allocated share; progress updates from verified settlement |
| MVP | Equal split including organizer, receipt confirmation, one share per other diner, exact-output quotes, private receiving integration, payment reconciliation |
| Out of scope | Lending, yield, trading dashboard, custom token, operating a solver, broad accounting suite |
| UX | Simple, clean; choose visual style after the core flow is established |
| First experiment | Confidential quote creation and payer-visible metadata audit; public/auth probes completed, confidential partner access unresolved |
| Stack/network | Stack undecided; Intents has no official testnet |
| Real vs simulated | Real API auth, dry quotes and one unfunded public quote/status tested; no payment executed, no application exists |
| Budget/license/team | Not yet set; keep personal details outside Git |

See [integration design](../technical/SPLITDBILL.md), [privacy findings](../technical/PRIVACY.md) and [API map](../technical/API_MAP.md).
