# Architecture and execution

## Public protocol

An intent specifies an authorized result rather than a sequence of user-managed chain transactions. Distribution apps collect requests; solvers offer liquidity; the relay coordinates signed offers; the verifier applies valid matched state changes. The public verifier is `intents.near`.

The verifier maintains token balances by account. Depositing tokens into it credits ledger balances. Swaps use `token_diff` intents: signed balance changes must be satisfiable together, including protocol fees. Public operations also include transfers, withdrawals, key management and storage actions. Internal execution atomicity does not make every asynchronous external bridge call atomic. `simulate_intents` is read-only and does not prove all downstream asynchronous effects will succeed.

Sources: [verifier](https://docs.near-intents.org/integration/verifier-contract/introduction), [intent types](https://docs.near-intents.org/integration/verifier-contract/intent-types-and-execution), [simulation](https://docs.near-intents.org/integration/verifier-contract/simulating-intents).

## Cross-chain assets and bridges

Assets in requests use canonical token IDs such as `nep141:<contract>`, with integer amounts in token base units. Use `/v0/tokens` for supported assets, decimal precision and chain identifiers; a ticker alone is insufficient. Public ledger balances and ordinary external wallet balances are separate.

Omni, PoA and HOT bridge routes connect external chains. They have different trust assumptions, supported assets, minimums and execution behavior. 1Click orchestrates routing, quotes, deposits and withdrawals. A successful quote is not proof of final delivery; track terminal settlement and actual output.

Sources: [balances and IDs](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/balances), [bridges](https://docs.near-intents.org/integration/bridging/overview), [tokens](https://docs.near-intents.org/api-reference/oneclick/get-supported-tokens).

## Confidential layer

FAR is a private permissioned NEAR fork. Its `intents.far` contract records private balances. Public assets held by a treasury back IMT balances 1:1. Shielding transfers public liquidity to the treasury and mints its private representation; unshielding burns that representation and releases public backing. This depends on the Private PoA Bridge and private infrastructure.

Solvers use `imt:<treasury>:<public-token-id>` privately. Application-facing 1Click requests use the documented public IDs; private balance responses strip the internal IMT prefix. The private relay is separate from the public relay and requires provisioned access. Solver responses can include shield, swap and recovery intents; shield without recovery is rejected. Do not release external assets merely on a quote acceptance notification.

Treasury recorded in the reviewed docs: `51e8f94d77b5e90dc9852ca6113771e11e8382ce69473a75e313e41665de7cbe`. Treat it as a dated integration constant, not a destination to pay manually.

Sources: [confidential architecture](https://docs.near-intents.org/integration/market-makers/confidential-intents), [example solver](https://docs.near-intents.org/integration/market-makers/confidential-example).

## Account identity and authorization

Named NEAR accounts register their signing keys on the verifier. Implicit identities can be derived from their signing keys: Ed25519 uses the 32-byte key as lowercase hex; EVM identities use the corresponding address. Keys authorized on an Intents account are not equivalent to restricted NEAR function-call keys; key authorization must be handled as control of the Intents balance.

Supported signing standards documented for generated intents include NEP-413, ERC-191, raw Ed25519, WebAuthn, TON Connect, SEP-53 and TIP-191. Sign the exact returned payload. Bind the intended account, contract, deadline and nonce. Validate that the requested operation and amount match what the user approved before asking the wallet to sign.

Private authentication uses an empty intent as an ownership proof. This is distinct from signing a spending intent. The current live auth probe accepted raw Ed25519 over the UTF-8 JSON payload, with a 32-byte versioned nonce. The nonce includes prefix, version, four-byte contract salt, deadline, embedded start time and randomness. Fetch the public verifier salt instead of copying a docs example. Public salt returned `252812b3` in our probe; the private solver docs' `e110f317` is a different context and must not be blindly substituted.

Sources: [account abstraction](https://docs.near-intents.org/integration/verifier-contract/account-abstraction), [signing](https://docs.near-intents.org/integration/verifier-contract/signing-intents), [user auth](https://docs.near-intents.org/api-reference/user-auth/authenticate-user-with-signed-data), [nonce SDK source](https://github.com/defuse-protocol/sdk-monorepo/blob/06f5a89b7bf26f9a41a9bb728bfca2f0cea9965c/packages/intents-sdk/src/intents/expirable-nonce.ts).

## Two payment execution paths

External wallet: get supported tokens → request quote → transfer the requested token/amount to returned deposit address, with memo when required → optionally notify deposit hash → poll status.

Existing public/private Intents balance: quote using the matching deposit type → generate unsigned transfer intent → validate and ask wallet to sign → submit signed intent → poll status. Private spending has no public RPC fallback. Generate/submit calls use partner authentication; the spending signature supplies user authorization.

Terminal states are `SUCCESS`, `REFUNDED` and `FAILED`. Other states include `PENDING_DEPOSIT`, `KNOWN_DEPOSIT_TX`, `PROCESSING` and `INCOMPLETE_DEPOSIT`. A deposit notification alone must not mark a bill share paid.

Sources: [making a request](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request), [signed execution](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/signed-intent-execution), [SDK status guide](https://docs.near-intents.org/integration/distribution-channels/1click-api/sdk).

## Quote types, costs and testing

`EXACT_OUTPUT` fits a bill: `amount` is the recipient's destination amount. Input slippage is a buffer; unused input is refunded according to execution rules. `EXACT_INPUT` fixes what the payer spends. `FLEX_INPUT` accepts a variable input band and does not support Confidential Intents. `ANY_INPUT` is a partner-only standing collection/sweep product with a documented $1,000 threshold; it is not a dinner payment request.

Current fee docs list a 0.0001% protocol fee, an additional 25 bps for unauthenticated non-ANY_INPUT quotes, and partner defaults of 20 bps or 1 bp for stablecoin/same-asset routes. Bridge/gas costs and quote spreads also affect the final amount. Our sampled anonymous USDC quote returned an `appFees` entry of 1 bp, not the documented 25 bps; treat this as a docs/runtime discrepancy, not a general fee promise. Show actual input/output and refund terms.

The sampled quote's execution deadline was three days later than its request deadline. The application must retain and distinguish the requested deadline and returned execution fields, and verify service behavior before implementing expiry/refund UX.

No official Intents testnet is offered. Dry quotes and `simulate_intents` do not execute a payment. An unfunded non-dry quote only allocates deposit instructions. No funded execution was performed for this research.

Sources: [swap types](https://docs.near-intents.org/integration/distribution-channels/1click-api/swap-types), [fees](https://docs.near-intents.org/resources/fees), [FAQ](https://docs.near-intents.org/resources/faqs).
