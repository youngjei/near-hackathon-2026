# Recipient privacy: findings and evidence

Scope update, November 10: [beta scope](../project/BETA_SCOPE.md) prioritizes conversion and payment-request convenience for VIZOR/Zodl and Confidential Intents users. The findings below are preserved; they are not a claim that the app has implemented or verified end-to-end anonymity.

## Direct answer

Confidential Intents hides balances and internal activity on its private ledger from public blockchain observers. It does not erase the public transaction history of a wallet used elsewhere. An account identifier is not the same thing as its confidential balance.

For example, learning an EVM address still lets someone inspect that address on an EVM explorer. That does not let them read its Confidential Intents balance. This follows from the documented account mapping and separation between public and private ledgers. It does not establish that a particular confidential payment exposes that address to the payer.

The earlier concern should have been stated as a precise boundary, not as an unverified claim that confidential deposits leak the organizer's wallet. We have not demonstrated that leak for a confidential quote.

Sources: [account abstraction](https://docs.near-intents.org/integration/verifier-contract/account-abstraction), [confidential architecture](https://docs.near-intents.org/integration/market-makers/confidential-intents), [end-user authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication).

## What the documented system does

| Surface | Confirmed behavior | Implication for splitdbill |
| --- | --- | --- |
| Private ledger | FAR is a permissioned NEAR fork with private networking/RPC; `intents.far` holds private balances and settles private swaps | Friends cannot use a public FAR explorer to browse those balances |
| Private account API | Owner signs an empty authentication intent; `/account/balances` requires the resulting bearer token | Knowing an account ID is not sufficient authorization to query private balances |
| External-to-external confidential swap | `confidentiality: basic` or `advanced` requests privacy handling without requiring an existing private balance | This is distinct from retaining reimbursement inside a confidential account |
| Confidential receiving balance | `recipientType: CONFIDENTIAL_INTENTS` identifies the receiving account inside the private system | A receiving identifier still exists; this field alone is not an anonymous payment-link API |
| Shield boundary | The solver liquidity guide describes a public transfer to a treasury with a memo naming the private recipient | A direct shield is not proof that every boundary identifier is hidden |
| Existing public history | Public account activity remains publicly readable | Protecting the private balance does not hide unrelated public assets once their address is known |
| Operator visibility | near.com's terms explicitly retain operator access to confidential transaction information | The project goal is privacy from fellow diners/public observers, not invisibility to the provider |

Sources: [confidential quickstart](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/confidential-swaps), [liquidity movement](https://docs.near-intents.org/integration/market-makers/confidential-liquidity), [quote schema](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote), [near.com terms, Confidential Mode](https://near.com/terms).

The shield guide and the current quote schema describe different stages: public minting into FAR versus delivery of swap output by a signed transfer inside FAR. Do not infer that the public shield memo always names the final bill recipient. A funded trace of the actual route is needed to establish which account appears at that boundary.

## A recent change that matters

The October 27 changelog says all 1Click swaps settle confidentially, while ordinary swap data remains available on the Intents Explorer. Therefore private settlement infrastructure does not, by itself, mean a particular API payment hides its metadata. The separate `public`, `basic` and `advanced` modes still matter.

The July confidentiality changelog describes `advanced` only as higher privacy; the reviewed official material does not specify a precise threat model or the difference in mixing, timing, amounts or metadata disclosure. Do not invent those mechanics or equate the implementation with a zero-knowledge shielded pool.

Sources: [current changelog](https://docs.near-intents.org/changelog/overview), [confidentiality parameter announcement](https://docs.near-intents.org/changelog/entries/2026-07-02-confidentiality-parameter).

## What was tested live

All tests used fresh disposable identity or synthetic addresses, with no deposited funds. Authentication signed only an empty ownership proof; no spending intent was signed or submitted.

| Probe | Result |
| --- | --- |
| Anonymous private balance lookup | HTTP 401, authorization required |
| Fresh Ed25519 identity authenticates with a versioned nonce and empty intent | HTTP 201, access and refresh tokens issued |
| Private balance lookup using that access token | HTTP 200, empty balances for the new identity |
| History with and without that user session | HTTP 403, invite-only |
| Dry confidential-recipient quotes without credentials, all three modes | HTTP 401, user authentication required |
| Same quotes with the user token in the documented Bearer header | HTTP 401, invalid token; quote endpoint advertises partner authentication |
| Dry external-to-external quote, public mode | HTTP 201, exact output 15 USDC |
| Dry external-to-external quote, basic/advanced, no credentials | HTTP 401, user authentication required |
| One unfunded public quote and anonymous status lookup | HTTP 201 / 200; status included the original recipient and refund identifiers |
| Quote and status signatures, using the current SDK algorithm and public key | All three sampled responses verified |

The ordinary status endpoint really exposes the recipient to someone who knows that deposit address. Hiding it in our UI or proxying the quote call does not fix this. That observation is limited to `confidentiality: public`; it must not be generalized to basic/advanced or confidential-account destinations without evidence.

## Exact access gap

The official confidentiality announcement says the integration must be enabled through the [Partner Portal](https://partners.near-intents.org). No enabled partner credential was available in this workspace. A valid end-user session worked for balances but was rejected by `/quote`; it does not replace the partner credential there. The published quote auth schema and runtime error messages do not fully explain how partner and user auth compose for confidential quote creation.

This blocks creating a confidential quote for subsequent owner/anonymous/unrelated-user status comparisons. It also blocks verifying third-party reimbursement to another account, exact-output confidential fees and route-specific public shielding metadata. These are named untested boundaries, not assumed failures of the protocol.

## Privacy acceptance test before making the promise

1. Create organizer A and unrelated payer B; request a quote paying A using the enabled integration.
2. Capture the payer page's HTML, network traffic, QR, wallet signing payload and receipt download. Check for A's main wallet identity.
3. Query the resulting quote/status from no session, B's session and A's session. Check actual fields, not just documentation schemas.
4. With separately authorized small funds, follow origin transaction, public NEAR shield receipts, private credit and later withdrawal. Record which identifier appears at each boundary.
5. Confirm B cannot query A's private balances or history.
6. Test a separate receiving identity and recovery process. Do not claim it is unlinkable merely because it is a new address.

Target promise: friends can reimburse a bill without being given a route to the organizer's main public wallet. It is stronger than hiding a private balance and requires the entire application flow to pass these checks.
