> November 11 implementation update: durable live quote allocation, confidential NEP-413 signing through compatible external NEAR wallets, private status reconciliation and checkout are implemented behind disabled gates. Supabase migration 005 is applied. See [current compatibility](WALLET_COMPATIBILITY.md). Historical pending-implementation statements below describe earlier checkpoints; actual device/refund/funded acceptance remains outstanding.

# Payment adapter and near.com connection

Checked November 10, 2026. Implementation: `app-web/lib/providers/intents.ts`. This is a verified server integration component, not an enabled checkout. The hosted application still uses explicit payment simulations.

## Verified now

The configured partner key obtained six signed, dry `EXACT_OUTPUT` quotes: ZEC to confidential USDC and confidential USDC to confidential USDC, each delivering 5, 15 and 50 USDC. The official TypeScript SDK 0.1.26 verified every signature. Synthetic receiving/refund identities were used; no deposit address was allocated, user account accessed, signature requested or funds moved. See [sanitized evidence](evidence/payment-adapter-2026-11-10.json).

At the observation time, delivering 15 USDC was estimated at 0.01316116 ZEC or 15.151516 confidential USDC. These are expired estimates, not current prices or a fixed fee schedule. Checkout must distinguish the USDC reimbursement from the payer's quoted input and network costs. Quote time estimates were 455 seconds and 10 seconds respectively; actual confirmation/settlement time is not yet measured.

From `app-web`, with the existing ignored `.env.local` containing `NEAR_INTENTS_API_KEY`:

```sh
npm run check:intents
```

Expected result: one opt-in live check passes, covering all six quotes, and rewrites only the sanitized evidence file. Default `npm test` never calls a payment provider. Do not substitute personal account IDs into the synthetic check.

## Implemented boundaries

- Only the two beta routes, confidential USDC output, exact cent precision and `confidentiality: basic`.
- Compare every requested routing field to the returned quote, check amounts and expiry, then verify the provider signature. The SDK signature covers selected fields; it does not authenticate the confidentiality parameter, status or actual settled output. Those remain HTTPS provider assertions.
- Browser preview projection contains estimated input, output amount, timestamp and estimated seconds only. It omits account identifiers, deposit instructions and raw provider payloads.
- Validate transparent Zcash refund addresses using prefix, length and Base58Check checksum before requesting a quote. Published bridge support is t1/t3 only. This does not prove either selected wallet exposes a suitable refund destination or that refunds have been exercised.
- Status lookup includes the deposit memo when present and binds the response to the saved signed quote. A `SUCCESS` assessment requires actual `swapDetails.amountOut` at least equal to the requested USDC. Underpayment or missing output requires review. Unknown statuses require review. Historic quote expiry does not prevent assessing a late payment.
- Generic provider failures, bounded request timeout and rejected HTTP redirects prevent leaking upstream private diagnostics or forwarding credentials to redirect targets.

Status classification is unit-tested against a previously captured signed public quote plus synthetic statuses. No confidential allocated quote/status access or actual settlement was verified here. No cron, database reconciliation, executable-quote allocator or spending submission is connected to this adapter. Persistent reconciliation must still handle retries, late payments, terminal-state ordering, duplicate settlement and refund follow-up atomically.

## Receiving destination: the confidential balance on near.com

Correction from the user: the destination is the confidential balance displayed on near.com; the login or signing method is not confirmed. The organizer only supplies and confirms a receiving account; no organizer wallet login or ownership signature is required. Do not assume it is a passkey account or make a near.com passkey bridge a receiving dependency. Do not create a replacement wallet or import secrets.

The official near.com migration guide documents Account menu → My address for its internal receiving identity. Identify this account separately from any chain-specific deposit address, then verify its use as the confidential recipient. The guide's internal-network transfer instructions are not by themselves proof that a particular incoming payment credits the confidential ledger. [Official guide](https://near-intents-app.helpscoutdocs.com/article/257-migration-from-near-intents-to-nearcom).

For passkey-based accounts, protocol support for `standard: webauthn` is real. It specifies how a signed payload reaches Intents; it does not itself supply a third-party near.com wallet connection. The official migration notice explains that passkeys are domain-specific. The legacy frontend's related-origin support explicitly lists near-intents.org and solswap.org; that is not permission for our domain. No documented near.com-origin signing bridge, SDK, redirect or payment deep link for this app was found in the reviewed sources.

Receiving and spending are separate:

1. **Direct internal receiving (existing adapter):** a confidential-recipient quote needs the correct organizer account ID; the organizer does not sign each incoming payment. The organizer pastes and confirms that account. Validate its format and confidential routing, without asserting ownership or requiring a wallet connection. Bind it immutably to the bill once requests are issued; protect management with the existing organizer capability. An external-chain deposit address is not interchangeable with the Confidential Intents account ID.
2. **Paying from confidential USDC:** generate the intent for the payer's account, obtain their explicit signature through a supported wallet handoff, then submit it. A partner API key or an authenticated user session cannot replace that signature.

Precise question for NEAR's integration team (draft only; not sent):

> We have working partner-authenticated dry quotes for ZEC -> confidential USDC and confidential USDC -> confidential USDC. Our organizer wants to receive into the confidential balance displayed on near.com; their login method is not yet confirmed. How should we identify the correct account ID and verify it for recipientType CONFIDENTIAL_INTENTS? Separately, what supported wallet interfaces let existing confidential-balance payers authorize the payload returned by /generate-intent? For near.com passkey users, is there a supported near.com-origin signing bridge? If no third-party signer is available, is there a supported near.com payment-request/deep-link flow? We do not want users to create new wallets or export keys. Please also confirm the user-session requirements for basic-confidential quote/status lookup and the supported Zcash refund path for VIZOR/Zodl users.

## Earlier alternative: receiving through near.com's Solana deposit address

The user supplied a Receive screen showing USDC, Solana and a minimum of 1 USDC, and explicitly confirmed it was opened in Confidential Mode. Do not store the user's address or QR in this repository. This is a chain-specific deposit destination associated with their intended confidential balance, not an internal Confidential Intents account ID.

For this manual beta route, the intended flow is:

`payer ZEC or confidential USDC -> one 1Click conversion -> USDC on Solana to the pasted near.com receive address -> near.com deposit processing -> confidential credit`

The existing 1Click solver infrastructure handles asset conversion; the app does not operate a second solver or chain two independent swap requests. Deposit processing is a separate stage from the conversion, and a funded end-to-end acceptance check remains necessary.

| Receiving route | recipientType | destinationAsset | recipient value |
| --- | --- | --- | --- |
| Manual Solana receive address from Confidential Mode | DESTINATION_CHAIN | nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near | Solana deposit address |
| Direct internal confidential account | CONFIDENTIAL_INTENTS | Explicitly selected USDC asset | Internal account ID |

Both USDC asset IDs in the current implementation and this table were checked against the live public token catalogue on November 10; they are different six-decimal assets. The current adapter hardcodes NEAR-origin USDC and an internal recipient. It must be extended and tested before accepting a Solana receive address. Never put a Solana deposit address into its internal-recipient field or silently infer destination type from an arbitrary string.

For the manual beta, pin the receive network/token to Solana USDC and ask the organizer to copy the address from near.com Confidential Mode, then confirm it without login to split/d/bill. Keep recipient binding immutable after requests are issued. This does not broaden payer-chain scope. Automatic address association inside near.com is the longer-term integration vision.

Acceptance must establish address lifetime/reusability, supported third-party 1Click withdrawals into that deposit address, minimums and any second-stage fees. Exact output at the Solana deposit address is not proof of the same net confidential credit. A 1Click SUCCESS can establish delivery for its own route; use a distinct delivered/credit-pending state until supported deposit confirmation establishes the final credit. Do not require organizer login merely to compensate for an unimplemented deposit-status integration. The Solana transfer is publicly visible even though the eventual balance is confidential.

Sources: [quote recipient types](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote), [public token catalogue](https://1click.chaindefuser.com/v0/tokens), [Main/Confidential balance distinction and direct confidential deposits](https://docs.near-intents.org/integration/market-makers/confidential-liquidity). The association of the pictured receive screen with Confidential Mode is user-confirmed; final credit and deposit mechanics for that particular address have not been tested.

## Internal near.com address now supplied: direct route verified with dry quotes

The user subsequently supplied their internal near.com address with a `nearcom:` prefix. The personal value is intentionally not recorded here. Its format is `nearcom:0x<40 hex characters>`. NEAR DevHub's Trezu implementation treats the prefix as frontend routing/display information, strips it for 1Click, and chooses INTENTS versus CONFIDENTIAL_INTENTS separately. The prefix itself does not select the confidential ledger.

Checked four dry quotes to the user-supplied underlying account ID, each for exactly 5 USDC output:

| Payer input | Confidential output asset | HTTP | Signature and exact recipient/amount |
| --- | --- | --- | --- |
| External ZEC | NEAR-origin USDC | 201 | Verified |
| External ZEC | Solana-origin USDC | 201 | Verified |
| Existing confidential NEAR-origin USDC | NEAR-origin USDC | 201 | Verified |
| Existing confidential NEAR-origin USDC | Solana-origin USDC | 201 | Verified |

Every quote used recipientType CONFIDENTIAL_INTENTS, basic confidentiality and dry true. Refund identifiers were synthetic. No payment address allocated, owner session requested, spending signature generated, balance read or funds moved. Personal IDs and raw quote payloads were not saved. These checks establish quote/routing acceptance, not account ownership or completed settlement.

Internal network does not mean NEAR-token-only or a normal transfer on the NEAR blockchain. This account can be credited with the tested supported USDC representations inside Confidential Intents. For this direct route, output associated with Solana USDC remains an internal confidential balance; it is not sent to a Solana blockchain address. The user selected direct internal receiving, avoiding the manual external deposit round trip. Keep the Solana deposit plan above as an alternative, not a necessary architecture. Organizer login is still unnecessary.

Do not send an ordinary blockchain transfer to the internal 0x identifier. Removing nearcom: is for the typed 1Click API recipient only. The app must bind that normalized account to recipientType CONFIDENTIAL_INTENTS and validate the returned quote.

Primary implementation evidence: [prefix normalization](https://github.com/NEAR-DevHub/trezu/blob/62cf0e41d4b2d2358a496d47c80fcd2e59094247/nt-fe/lib/nearcom-address.ts), [quote routing](https://github.com/NEAR-DevHub/trezu/blob/62cf0e41d4b2d2358a496d47c80fcd2e59094247/nt-fe/hooks/use-intents-quote.ts), [official recipient types](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote).

The same Trezu source includes a near.com/send prefill helper. This is a newly found possible wallet handoff, not yet tested in split/d/bill; investigate token/network/recipient/paymentToken behavior before claiming it solves exact-amount signing or reconciliation. It is not proof of an arbitrary passkey signing bridge.

## Remaining activation checks

1. Internal nearcom-prefixed address entry, help, confirmation and immutable organizer-only storage are implemented. Bind executable quotes to the saved normalized account with CONFIDENTIAL_INTENTS. No organizer login or ownership proof. Select signing adapters separately for confidential-balance payers.
2. Verify selected wallet versions can supply a payer-controlled supported refund destination and handle a ZIP-321 request.
3. Add server-only executable quote storage per share, capability-protected checkout, cancellation/retry policy and durable provider reconciliation. Never send raw quotes/account identifiers to other diners.
4. Test confidential status visibility with the partner credential, organizer session, unrelated payer session and anonymous access. A dry quote does not prove recipient privacy.
5. With a separately authorized small budget and human wallet approval, test one payment for each method, late/partial payment, refund handling and the final receiving credit. Only then enable live checkout and deploy the payment feature.

## Primary sources

- [Signed intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution)
- [Authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication)
- [Quote signature verification](https://docs.near-intents.org/integration/distribution-channels/1click-api/verify-quote-signature)
- [Execution status](https://docs.near-intents.org/api-reference/oneclick/check-swap-execution-status)
- [Supported chain/address formats](https://docs.near-intents.org/resources/chain-support)
- [Official migration notice](https://near-intents.org/)
- [Legacy passkey source and explicit related origins](https://github.com/defuse-protocol/defuse-frontend/blob/594085d3c7e60ce912fb62b768b12f46c4917510/src/features/webauthn/lib/webauthnService.ts)

These sources establish protocol and passkey constraints; they do not prove that near.com has no private partner integration. That specific integration remains unconfirmed.
