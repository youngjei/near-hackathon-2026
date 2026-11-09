# Project brief

Working name: **splitdbill**. Beta narrowed by the user on November 10; [BETA_SCOPE.md](BETA_SCOPE.md) is authoritative. Implementation stack and final tracks remain open.

| Question | Current direction |
| --- | --- |
| User/problem | Friends using shielded Zcash or Confidential Intents need an easy way to convert and settle a shared restaurant bill |
| Product | Photograph receipt → confirm total/currency → divide among diners → share QR/link → repay each share through NEAR Intents |
| Why NEAR | Cross-chain payment routing, exact-output USDC settlement, confidential receiving balances |
| Positioning | Convenience: receipt recognition, amount conversion, payment requests and reconciliation; rely on existing wallet/protocol privacy without promising universal anonymity |
| Supported beta senders | Shielded ZEC from VIZOR or Zodl (formerly Zashi); existing Confidential Intents balance, initially USDC |
| Recipient | User-controlled confidential USDC balance |
| Tracks | Real-World Money primary candidate; Social Money secondary candidate; Privacy only with a demonstrated privacy journey |
| Demo | Organizer confirms a 200 AED receipt and group size; other diners each pay one allocated share; progress updates from verified settlement |
| MVP | Equal split including organizer, receipt confirmation, one share per other diner, exact-output quotes, private receiving integration, payment reconciliation |
| Out of scope | External public-wallet/chain support, itemized splitting, lending, yield, trading dashboard, custom token, operating a solver, broad accounting suite |
| UX | Simple, clean; choose visual style after the core flow is established |
| First experiment | Partner-enabled ZEC → confidential USDC quote, ZIP-321 wallet handoff and refund compatibility; confidential → confidential payment |
| Stack/network | Stack undecided; Intents has no official testnet |
| Real vs simulated | Real API auth, dry quotes and one unfunded public quote/status tested; no payment executed, no application exists |
| Budget/license/team | Not yet set; keep personal details outside Git |

See [integration design](../technical/SPLITDBILL.md), [privacy findings](../technical/PRIVACY.md) and [API map](../technical/API_MAP.md).
