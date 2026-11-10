# Project brief

Working name: **splitdbill**. Beta narrowed by the user on November 10; [BETA_SCOPE.md](BETA_SCOPE.md) is authoritative. The first persisted demo uses Sites/Vinext + D1/R2; live integrations and final tracks remain open.

| Question | Current direction |
| --- | --- |
| User/problem | Friends using shielded Zcash or Confidential Intents need an easy way to convert and settle a shared restaurant bill |
| Product | Photograph receipt → confirm total/currency → divide among diners → share QR/link → repay each share through NEAR Intents |
| Why NEAR | Cross-chain payment routing, exact-output USDC settlement, confidential receiving balances |
| Positioning | Convenience: receipt recognition, amount conversion, payment requests and reconciliation; rely on existing wallet/protocol privacy without promising universal anonymity |
| Supported beta senders | Shielded ZEC from VIZOR or Zodl (formerly Zashi); existing Confidential Intents balance, initially USDC |
| Recipient | Confidential balance on near.com; manual beta uses a USDC/Solana receive address copied from Confidential Mode, with conversion and deposit-credit stages verified separately |
| Tracks | Real-World Money primary candidate; Social Money secondary candidate; Privacy only with a demonstrated privacy journey |
| Demo | Organizer confirms a 200 AED receipt and group size; other diners each pay one allocated share; progress updates from verified settlement |
| MVP | Equal split including organizer, receipt confirmation, one share per other diner, exact-output quotes, private receiving integration, payment reconciliation |
| Out of scope | External public-wallet/chain support, itemized splitting, lending, yield, trading dashboard, custom token, operating a solver, broad accounting suite |
| UX | Simple, clean; choose visual style after the core flow is established |
| First experiment | Partner-enabled ZEC → confidential USDC quote, ZIP-321 wallet handoff and refund compatibility; confidential → confidential payment |
| Stack/network | TypeScript/React App Router demo on Sites/Vinext with D1/R2; planned Supabase/Vercel integration pending; Intents has no official testnet |
| Real vs simulated | Real API auth, dry quotes and one unfunded public quote/status tested; no real payment executed; persisted demo application now deployed |
| Budget/license/team | Not yet set; keep personal details outside Git |

See [integration design](../technical/SPLITDBILL.md), [privacy findings](../technical/PRIVACY.md) and [API map](../technical/API_MAP.md).

## Product vision

The user ultimately wants split/d/bill embedded seamlessly within near.com, with automatic receiving-destination selection and integrated bill/payment tracking. The hackathon prototype remains an independent application with manual receiving-address entry and no organizer wallet login. No near.com partnership or embedded integration is claimed. See the [submission wording draft](../hackathon/SUBMISSION.md#product-description-draft).
