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

Correction from the user: the destination is the confidential balance displayed on near.com; the login or signing method is not confirmed. Do not assume it is a passkey account or make a near.com passkey bridge a universal receiving dependency. Do not create a replacement wallet or import secrets.

The official near.com migration guide documents Account menu → My address for its internal receiving identity. Identify this account separately from any chain-specific deposit address, then verify its use as the confidential recipient. The guide's internal-network transfer instructions are not by themselves proof that a particular incoming payment credits the confidential ledger. [Official guide](https://near-intents-app.helpscoutdocs.com/article/257-migration-from-near-intents-to-nearcom).

For passkey-based accounts, protocol support for `standard: webauthn` is real. It specifies how a signed payload reaches Intents; it does not itself supply a third-party near.com wallet connection. The official migration notice explains that passkeys are domain-specific. The legacy frontend's related-origin support explicitly lists near-intents.org and solswap.org; that is not permission for our domain. No documented near.com-origin signing bridge, SDK, redirect or payment deep link for this app was found in the reviewed sources.

Receiving and spending are separate:

1. **Receiving ZEC reimbursements:** a confidential-recipient quote needs the correct organizer account ID; the organizer does not sign each incoming payment. We still need a supported way to identify and authorize the intended receiving account in onboarding. A copied, unverified identifier must not be called a verified wallet connection. An external-chain deposit address is not interchangeable with the Confidential Intents account ID.
2. **Paying from confidential USDC:** generate the intent for the payer's account, obtain their explicit signature through a supported wallet handoff, then submit it. A partner API key or an authenticated user session cannot replace that signature.

Precise question for NEAR's integration team (draft only; not sent):

> We have working partner-authenticated dry quotes for ZEC -> confidential USDC and confidential USDC -> confidential USDC. Our organizer wants to receive into the confidential balance displayed on near.com; their login method is not yet confirmed. How should we identify the correct account ID and verify it for recipientType CONFIDENTIAL_INTENTS? Separately, what supported wallet interfaces let existing confidential-balance payers authorize the payload returned by /generate-intent? For near.com passkey users, is there a supported near.com-origin signing bridge? If no third-party signer is available, is there a supported near.com payment-request/deep-link flow? We do not want users to create new wallets or export keys. Please also confirm the user-session requirements for basic-confidential quote/status lookup and the supported Zcash refund path for VIZOR/Zodl users.

## Remaining activation checks

1. Identify and validate the actual confidential receiving account shown on near.com. Confirm the user's wallet/login method before choosing ownership and payer-signing adapters. Keep receiving and payer authorization distinct.
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
