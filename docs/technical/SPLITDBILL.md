# splitdbill: implementation direction

## Product

Current beta scope (November 10): [BETA_SCOPE.md](../project/BETA_SCOPE.md) supersedes the earlier broad-chain proposal.

A friend pays a restaurant bill abroad, photographs the receipt, confirms its total, and shares payment requests. Other diners pay shielded ZEC from VIZOR/Zodl or use an existing Confidential Intents balance. The organizer receives confidential USDC. The product contribution is automatic conversion, request creation and reconciliation.

Keep the first experience to three views: create/confirm bill, pay one share, and organizer progress. The visual style will be selected later. No lending, yield, trading dashboard, DAO, custom token or speculative feature is needed.

## What we build versus what NEAR provides

| splitdbill owns | NEAR / 1Click provides |
| --- | --- |
| Receipt image upload, OCR and correction | Supported assets and route availability |
| Fiat currency/rate confirmation | Crypto conversion quotes |
| Number of diners, inclusion of organizer, allocation and rounding | Exact-output execution primitives |
| Bill IDs, share IDs, links/QRs, payment attempts | Deposit instructions and settlement status |
| Private receipt access, reminders and group progress | Confidential balance/transaction infrastructure, with enabled access |
| Protection of recipient identity in every payer-facing surface | Underlying cryptographic signatures and ledger execution |

There is no documented native N-person bill request, receipt scanner, fiat FX conversion, or group payment-link API. A bill link is our application object. Create fresh per-share payment quotes when a diner chooses Zcash or their confidential balance; do not encode a long-lived expiring quote as the bill itself.

## Amount calculation

Confirm total, tip/service charges and currency before allocating. Count the organizer in N, allocate N shares, and request only N−1 reimbursements. Use integer arithmetic for fiat minor units and token base units; assign rounding remainders explicitly so allocated shares sum to the confirmed total. USDC has token precision; it is not an FX rate source and must not silently be treated as exactly USD in all market conditions.

Store the selected conversion rate, source and timestamp with the bill. Let the organizer approve the USDC target. Request `EXACT_OUTPUT` for each reimbursement, show the payer the input token/chain, total input including costs, maximum input and refund destination before signing or depositing.

## Receiving identity

Use the organizer's user-controlled confidential receiving account. Authenticate it for confidential balance access. A separate receiving identity is optional future hardening, not a new-wallet requirement for the beta. Avoid putting the organizer's main wallet in the bill, public URL, receipt metadata or client response. Do not give the server a spending key merely to make links.

Account recovery, withdrawal metadata and the actual confidential status response must be verified. A confidential balance is not proof of recipient-identity unlinkability.

For beta Zcash payers, the documented target is `depositType: ORIGIN_CHAIN`, `recipientType: CONFIDENTIAL_INTENTS`, destination USDC. A diner already using a private Intents balance instead uses signed-intent execution. Third-party receipt by the organizer must be tested with enabled partner credentials; the live private quote access gate currently prevents that test.

## Payment records and failure behavior

Model Bill → Share → PaymentAttempt. A share may have multiple expired/replaced quotes, but only one successful reimbursement should count. Retain every attempt and reconcile late settlement; stop offering new quotes after success. A group QR should lead to share selection or assignment, not a shared deposit address that cannot distinguish payers. Prevent concurrent claims of the same share and provide a duplicate-payment resolution path.

Store quote request, signed response, intended recipient, deposit address/memo, token decimals, deadline fields and terminal status. Verify the provider's signature on the server before giving payment instructions. The current SDK signature covers selected fields, not the entire JSON; `confidentiality` is not included in the reviewed signing projection. Check privacy settings through the trusted authenticated integration as well, rather than treating a valid quote signature as proof of privacy mode.

Handle underpayment, overpayment, expired quotes, unsupported routes, stale rates, duplicate deposits and refund status explicitly. Do not count a screenshot or submitted transaction hash as settlement evidence.

## Receipt privacy

The receipt itself can contain names, restaurant location, timestamps and card fragments. Keep uploads private, strip image metadata, and scope receipt viewing to the shared bill. Do not put receipts on chain. OCR output is an untrusted suggestion until the organizer confirms it. The image-recognition provider and fiat-rate provider are not selected yet.

## Next concrete integration milestone

Obtain an enabled partner integration through the official portal, then run the owner/payer/anonymous confidentiality test in [PRIVACY.md](PRIVACY.md). Validate ZEC quote sizes, wallet request handling, refunds, and third-party confidential payment delivery. Recipient-metadata checks remain part of validation; universal sender/recipient anonymity is not the product promise. A funded end-to-end test requires a separately authorized small budget because no official testnet exists.

Primary track fit: Real-World Money. Social Money is the natural secondary candidate. Privacy & Private AI is additional only when the privacy journey is demonstrated. No submission track is finalized here.
