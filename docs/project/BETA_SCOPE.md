# splitdbill beta scope

Decided by the user on November 10, 2026 (KST). This supersedes the earlier broad external-wallet scope. This is a product specification, not a shipped integration.

## Product promise

Photograph a receipt, confirm the total, split it among friends, and generate payment requests with the correct converted amount. Track which shares are settled. Convenience is the hackathon contribution; existing wallets and NEAR provide the underlying privacy features. We do not claim to have invented payment privacy or demonstrated universal anonymity.

## Accepted beta payment paths

| Participant | Beta support |
| --- | --- |
| Organizer | Receives USDC into a user-controlled Confidential Intents balance |
| Zcash payer | Pays ZEC from a shielded balance using VIZOR or Zodl (formerly Zashi) |
| Confidential Intents payer | Pays from their existing confidential balance; start with USDC to keep the asset set small |

USDC-only confidential input is the initial implementation choice, not an API restriction. Additional private-balance assets can be added later without broadening this beta to external public wallets.

Do not build external Ethereum/MetaMask, Solana/Phantom, BTC or a generic chain selector for this beta. The sender selects one of two payment methods: Zcash wallet or Confidential Intents balance. VIZOR and Zodl are the supported/tested Zcash wallet targets, not a cryptographically enforceable wallet-brand allowlist: a chain transfer does not authenticate the originating app brand.

## Organizer journey

1. Paste and confirm a USDC/Solana receive address copied from near.com Confidential Mode for the manual beta. No organizer wallet login, connection, ownership signature or new wallet is required in split/d/bill. This deposit address is distinct from an internal Confidential Intents account ID; validate explicit destination type and route without claiming ownership is verified.
2. Photograph/upload a receipt; confirm extracted total, currency, tips and service charges.
3. Enter diner count including themselves; allocate N shares and request N−1 reimbursements.
4. Approve the conversion into USDC and rounding allocation. Record FX source and time.
5. Share the bill invitation and private per-diner checkout access.
6. Follow unpaid, pending, paid and refunded status until all reimbursement shares settle.

Keep bill management behind the private organizer capability link. Save the confirmed recipient with the bill and bind every payment quote to it. The recipient must not change after payment requests are issued; a different recipient requires a new bill. These are implementation requirements, not shipped live behavior.

Equal splitting is the first beta. Item-level allocations and additional split rules are later scope.

## Zcash payment path

1. Friend opens their checkout, sees the receipt and USDC share, then selects Zcash.
2. Backend requests an `EXACT_OUTPUT` ZEC → Solana USDC quote with `depositType: ORIGIN_CHAIN` and `recipientType: DESTINATION_CHAIN` for the manual near.com receive address. The direct internal-account alternative uses `CONFIDENTIAL_INTENTS`; never interchange those recipient values. The current adapter implements only the latter.
3. Obtain a supported, payer-controlled refund destination before creating the executable quote. Do not infer a shielded sender's refund address from the public transaction. Verify supported refund formats and their privacy implications with the live integration.
4. Generate a single-recipient ZIP-321 payment URI from the returned Zcash deposit address and quoted ZEC input amount. Example shape only: `zcash:<deposit-address>?amount=<quoted-ZEC>`. Do not put receipt details or personal names into the URI.
5. Present a wallet-open action where the OS supports it, a scanable payment QR, and a copy-address/amount fallback. Test VIZOR's Send flow and Zodl on selected release versions. Do not assume every scanner, platform or in-app swap screen processes payment requests identically.
6. Friend reviews and approves in their wallet. The Zcash network fee is separate from the amount paid to the deposit address; ensure sufficient balance for both.
7. Backend polls 1Click for delivery to the Solana deposit address, then verifies deposit credit separately before claiming confidential receipt. Minimums, any deposit-stage fees and supported credit-status access must be validated; 1Click delivery alone is not proof of final credit.

We create and track the 1Click quote. The wallet makes a ZEC send to its deposit address. Do not send users through a second independent in-wallet swap, which could lose our quote association or duplicate routing.

ZIP-321 is an amount/address request, not a guarantee of quote validity or execution. Display quote expiry, refresh before issuing new instructions, and reconcile late deposits against old attempts. Saved QR codes cannot be remotely erased.

## Confidential balance payment path

1. Friend authorizes access to their existing confidential account.
2. Backend requests a quote funded from `CONFIDENTIAL_INTENTS`, with a confidential refund destination. For manual Solana deposit-address receiving, use `recipientType: DESTINATION_CHAIN`; for a direct internal recipient use `CONFIDENTIAL_INTENTS`.
3. Generate the spending intent, validate account/amount/destination, have the user's wallet sign it, and submit through the partner API.
4. Track and reconcile settlement into the organizer's confidential USDC balance.

User authentication for reading a balance is distinct from authorization to spend it. splitdbill never stores spending keys. The integration remains dependent on partner enablement and actual third-party receiving tests.

## Privacy and access boundaries

VIZOR documents spending from shielded balances. Zodl is the current name of Zashi and is positioned as private by default. These defaults improve the sender model, but they do not make a transparent bridge output shielded: the Zcash deposit destination and amount can remain public. Avoid claims that the entire Zcash-to-NEAR route is invisible.

Retain private per-diner checkouts. A group invitation must not authorize reading other participants' deposit addresses, transaction hashes, refund addresses or complete upstream status responses. Organizer progress shows payment outcomes, not raw wallet metadata. Our backend and upstream providers still process routing data.

The previous [privacy investigation](../technical/PRIVACY.md) remains relevant evidence. Recipient identity hiding has not been verified end to end. It is no longer the central novelty claim or the reason to expand the beta into a universal privacy system.

## Integration acceptance criteria

- Enabled Confidential Intents partner credentials and a working organizer receiving flow.
- ZEC → confidential USDC quote at realistic dinner sizes; measure minimums, fees, confirmation time and expiry behavior for this exact route.
- Correct amount and address prefill on actual selected VIZOR and Zodl releases; test same-device opening and cross-device QR scanning. Source-code support alone does not count as a wallet integration test.
- A valid refund path for shielded-source ZEC payments, including unused exact-output input, failed and late payments.
- Confidential USDC → confidential USDC payment by a different user, with correct signing and settlement.
- One successful payment counted once despite duplicate notifications, multiple quotes or late settlement.
- Labels distinguishing live quotes, simulated completion and funded execution. Funded testing still requires an explicit budget.

## Sources checked November 10

- [VIZOR sending guide](https://vizor.cash/blog/how-to-send-zec/): shielded-balance spending and transparent recipient behavior.
- [VIZOR wallet listing](https://z.cash/ecosystem/vizor/): shielded-by-default positioning.
- [Zashi → Zodl announcement](https://zodl.com/zashi-is-becoming-zodl): current wallet name and continuity.
- [Zodl listing](https://z.cash/ecosystem/zodl-wallet/): wallet features and privacy defaults.
- [ZIP-321](https://zips.z.cash/zip-0321): standard payment requests containing address and amount.
- [VIZOR Send scanner source](https://github.com/chainapsis/vizor-wallet/blob/c1629cef9480e9b99413e9efebeb133c713cf854/lib/src/features/send/models/send_scan_result.dart): request prefill versus address-only scanners, rejection/downgrade paths.
- [Zodl iOS request parser](https://github.com/zodl-inc/zodl-ios/blob/bfce63e808f595f716db56d3e2c87cb4f002c259/secant/Sources/Dependencies/URIParser/RequestPaymentParser.swift): ZIP-321 parsing. Android and installed wallet versions not tested in this session.
- [NEAR chain support](https://docs.near-intents.org/resources/chain-support): transparent Zcash addresses listed.
- [Quote API](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote): deposit instructions and quote parameters.
- [Signed-intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution): existing confidential-balance payment flow.

Track direction remains Real-World Money plus Social Money as candidates. Choose final tracks against the completed demo; privacy branding is not the product thesis.

## Longer-term product vision

Integrate receipt splitting directly into near.com: automatically use the signed-in user's confidential receiving destination, generate requests and track reimbursements in the existing wallet experience. This is a user-stated aspiration, not a confirmed partnership or shipped near.com feature. The standalone beta uses manual receiving-address entry.
