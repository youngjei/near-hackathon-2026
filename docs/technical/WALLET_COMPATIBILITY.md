# Wallet compatibility and execution boundaries

Checked November 11, 2026 against primary source code and provider documentation. Source inspection is not an installed-release, device, funded-payment or refund test.

## Zcash: VIZOR and Zodl

The implemented `zcashPaymentUri` produces a single-recipient [ZIP-321](https://zips.z.cash/zip-0321) URI with an exact eight-decimal ZEC amount from a signed, unexpired executable quote. It refuses an unsupported/malformed transparent deposit address or a deposit memo rather than dropping provider instructions. The quoted ZEC input excludes any wallet network fee. `t1`/`t3` refund addresses are checksum checked; the payer must control and be able to receive to the address. A Zcash transparent output and any transparent refund are publicly visible; shielded sender selection alone does not make the whole flow shielded.

| Wallet | Source evidence | Remaining acceptance |
| --- | --- | --- |
| VIZOR | [ZIP-321 scanner](https://github.com/chainapsis/vizor-wallet/blob/c1629cef9480e9b99413e9efebeb133c713cf854/lib/src/features/send/services/payment_request_scanner.dart) and [payment request parser](https://github.com/chainapsis/vizor-wallet/blob/c1629cef9480e9b99413e9efebeb133c713cf854/lib/src/core/zcash/zip321_payment_request.dart); [receive controls](https://github.com/chainapsis/vizor-wallet/blob/c1629cef9480e9b99413e9efebeb133c713cf854/lib/src/features/receive/widgets/receive_address_widgets.dart) include transparent tab and copy. | Confirm the actual installed release, account type and network expose a usable payer-controlled `t1`/`t3` address; test request prefill, shielded-source send and refund on a device. |
| Zodl iOS | [Changelog](https://github.com/zodl-inc/zodl-ios/blob/bfce63e808f595f716db56d3e2c87cb4f002c259/CHANGELOG.md) describes ZIP-321 handling. [Receive screen](https://github.com/zodl-inc/zodl-ios/blob/bfce63e808f595f716db56d3e2c87cb4f002c259/secant/Sources/Features/Receive/ReceiveView.swift) displays a transparent address and QR; its transparent block sets `copyButton: false`. [Wallet model](https://github.com/zodl-inc/zodl-ios/blob/bfce63e808f595f716db56d3e2c87cb4f002c259/secant/Sources/Models/WalletAccount.swift) derives the transparent receiver from a unified address. | Verify how a user obtains the full address on the actual version, whether it remains receivable and usable for refunds for their account, and test the URI and return flow. Android and hardware variants require separate checks. |

The code sources are pinned snapshots, not proof a particular installed version contains the same features. Neither wallet has been tested here. The provider's [chain support](https://docs.near-intents.org/resources/chain-support) must be checked again before enabling; do not assume it accepts a shielded, unified or TEX refund address. No refund has been exercised. A generated URI does not prove either wallet uses shielded inputs or that the provider will settle.

## Existing confidential balance

[Official signed-intent execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution) requires a confidential quote, `/generate-intent` using its deposit address and payer signer ID, the user's wallet signature on the returned payload, and `/submit-intent`. Partner credentials do not replace the signature. The API status can then be checked by the quote deposit address and memo, subject to confidential access and settlement validation.

NEAR DevHub Trezu's [near.com helper](https://github.com/NEAR-DevHub/trezu/blob/62cf0e41d4b2d2358a496d47c80fcd2e59094247/nt-fe/lib/nearcom-address.ts) defines only `token`, `network`, `recipient`, and `paymentToken` prefill fields. Its [confidential payment handoff](https://github.com/NEAR-DevHub/trezu/blob/62cf0e41d4b2d2358a496d47c80fcd2e59094247/nt-fe/app/(treasury)/%5BtreasuryId%5D/pay/%5Bkind%5D/page.tsx) passes `network=near_intents` and a prefixed recipient. The inspected flow does not show an amount, an existing 1Click quote identifier, a signed-payload callback or settlement correlation. It is a useful manual send prefill, but does not establish that a payer can sign this app's exact quote or that this app can reconcile it. We found no documented near.com-origin bridge for signing arbitrary generated payloads; this does not rule out an unpublished partner integration. Do not invent additional query parameters or ask users to export keys.

An external NEAR wallet with an existing confidential balance can use the implemented NEP-413 path: connect the same account, get a quote, review its input and output, then explicitly sign the generated transfer. The provider helper validates the exact signer, FAR receiver, documented confidential token, quoted input, deadline and nonce, and verifies the wallet signature before submission. The NEAR Connect integration is separate from near.com-origin passkeys. Multi-account connections and non-NEP-413 signers are not supported by this adapter.

Two unfunded executable quotes and `/generate-intent` requests with disposable synthetic accounts returned HTTP 201. The generated message contained one transfer to the quote deposit, equal to the quoted input, on `intents.far`; the token followed the [documented confidential IMT mapping](https://docs.agentsonintents.com/integration/agent-api/native-accounts). Those checks did not access any balance or sign or submit the provider payload. The signature test uses a locally generated disposable test key and synthetic data only.

General rollout defaults off and requires explicit route and acceptance switches. The November 13 owner pilot below is a separate, labelled testing exception for Solana/Zcash deposits only. Source checks and unit tests are not a wallet, refund or funded settlement acceptance record. No personal accounts or funds were used in these checks.


## November 13 — Solana USDC addition

The user explicitly expanded payer scope. Solana Pay requests now encode the signed provider's owner address, six-decimal input amount and mainnet USDC mint. Standard transfers publicly reveal the source wallet and amount; confidential receiving protects the destination balance, not the public source transaction. Compatible URI handlers can open the request; QR and exact address/amount copying provide fallbacks. Actual wallet-device compatibility remains untested, including Phantom/Solflare; do not infer it from the protocol alone.

Three real signed dry quotes at 5/15/50 USDC passed; see [evidence](evidence/solana-usdc-dry-2026-11-13.json). No executable Solana quote, funded payment, refund or confidential credit was tested. Require SOL for fees and possible associated token account creation. Only ordinary on-curve keypair wallet-owner addresses are accepted in this increment, with known program/mint keys rejected; this is not proof of ownership. Memo-dependent routes remain unsupported. At this initial Solana release execution and acceptance flags were false; the subsequent owner-only testing exception below does not change acceptance.

Primary references checked November 13: [Solana Pay transfer requests](https://solana.com/docs/tools/solana-pay/quickstart/transfer-requests), [Solana privacy](https://solana.com/docs/finance/privacy), [1Click token catalogue](https://1click.chaindefuser.com/v0/tokens).


## November 13 — Owner-only pilot, acceptance still incomplete

The owner explicitly requested real testing with their own Solana and VIZOR wallets. The owner-private Sites deployment now permits real Solana USDC and Zcash requests under `LIVE_PAYMENT_TESTING` with authenticated owner access. The normal key, global and per-route switches still apply; all acceptance flags remain false. Confidential-balance sending stays disabled and has no acceptance bypass.

The UI shows **Live testing · Real funds** and incomplete wallet/refund/settlement acceptance. Sample bills stay simulations. Testing-mode availability is not an installed-wallet compatibility result: wallet version, same-device opening, QR prefill, fee handling, successful confidential credit, late/partial deposits and refunds still require observed results. No funded payment or refund is claimed here. A native Vercel production build is deployed at https://split-d-bill.vercel.app; canonical-origin deployment and hosted owner-password login checks passed. Supabase background reconciliation runs every minute, with an HTTP 200 empty-run response verified; this is not evidence of funded settlement.


## November 13 — Browser launch repair

A payment URI is not a universal wallet launcher. VIZOR's current [Android manifest](https://github.com/chainapsis/vizor-wallet/blob/main/android/app/src/main/AndroidManifest.xml) declares MAIN/LAUNCHER but no VIEW handler for zcash; its ZIP-321 scanner supports a different entry path. [Zodl iOS](https://github.com/zodl-inc/zodl-ios/blob/main/secant-distrib-Info.plist) registers zcash. [Phantom's maintainer](https://github.com/orgs/phantom/discussions/424) states that no custom Solana Pay universal entry point is provided. Phantom/Solflare browse links open a website and require a separate provider integration to request a transaction; they are not payment-prefill links.

Ready, unexpired requests now make QR scanning and exact address/amount copying primary. A generic mobile URI is an optional shortcut with explicit installed-wallet/browser compatibility guidance. Same-device users can open Send manually and paste the two fields (USDC on Solana for that route). No extension connection or device launch is claimed. Processing, expired and paid requests continue to hide funding controls. The browser tests exercise UI and URI contents, not installed apps or funded payments.
