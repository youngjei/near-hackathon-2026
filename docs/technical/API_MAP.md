# APIs and developer tools

Snapshot: 2026-11-09; application adapter update: November 10. Live 1Click OpenAPI version: 0.1.10. Base URL: `https://1click.chaindefuser.com`. This inventory includes all 15 operations across 14 paths in the retrieved specification; listing an operation does not mean we executed it.

## 1Click REST operations

| Method | Path | Purpose | Authentication/access note |
| --- | --- | --- | --- |
| POST | `/v0/auth/authenticate` | Authenticate user with signed data | Wallet-signed empty ownership proof; tested with disposable Ed25519 key |
| POST | `/v0/auth/refresh` | Refresh access token | Refresh token; not executed |
| GET | `/v0/account/balances` | Get user token balances | User access token in Authorization: Bearer; tested |
| GET | `/v0/account/history` | Get transaction history | User authentication plus invite-only access; observed HTTP 403 |
| GET | `/v0/tokens` | Get supported tokens | Public; tested |
| POST | `/v0/quote` | Request a swap quote | Partner auth advertised; public ordinary quotes work anonymously; both beta confidential routes now pass partner-authenticated dry quotes |
| GET | `/v0/status` | Check swap execution status | Partner auth advertised; own unfunded public status worked anonymously |
| GET | `/v0/any-input/withdrawals` | Get ANY_INPUT withdrawals | Partner-auth surface; not executed |
| POST | `/v0/deposit/submit` | Submit deposit transaction hash | Optional transaction-hash notification; not executed |
| POST | `/v0/generate-intent` | Generate an intent for signing | Partner JWT; builds unsigned payload, does not itself authorize spending |
| POST | `/v0/submit-intent` | Submit a signed intent | Partner JWT plus wallet-signed spending payload; not executed |
| POST | `/v0/orders` | Create an order | Partner-auth surface; not executed |
| GET | `/v0/orders` | List orders | Partner-auth surface; not executed |
| POST | `/v0/orders/{orderId}/cancel` | Cancel an order | Partner-auth surface; not executed |
| GET | `/v0/orders/{orderId}` | Get an order | Partner-auth surface; not executed |

Source: [live OpenAPI](https://1click.chaindefuser.com/docs/v0/openapi.yaml). The spec's security metadata is not an exact description of anonymous runtime behavior; use the probes and the endpoint guides together.

## Headers and identity

Partner credential: `X-API-Key: <partner JWT>`; legacy `Authorization: Bearer <partner JWT>` is also accepted. User data endpoints: `Authorization: Bearer <accessToken>` from `/auth/authenticate`. The OpenAPI label `User-Session` names a bearer security scheme; it is not an HTTP header called `User-Session`.

Do not exchange the two token types. The user token worked for balances but failed at `/quote`. The configured partner key now authorizes both beta dry-quote routes. Executable confidential status/session access still needs verification. Never ship partner secrets, access/refresh tokens or spending keys in a bill link.

Source: [authentication](https://docs.near-intents.org/integration/distribution-channels/1click-api/authentication).

## Fields used by splitdbill

- `dry`: true previews; false allocates deposit instructions. Neither transfers funds on its own.
- `swapType: EXACT_OUTPUT`: `amount` is the receiving token amount in base units.
- `originAsset`, `destinationAsset`: exact canonical asset IDs from `/tokens`.
- `depositType`: external origin chain, public Intents, or Confidential Intents.
- `recipient`, `recipientType`: where output is delivered; private recipient still has an account identifier.
- `refundTo`, `refundType`: correct payer-controlled refund route.
- `slippageTolerance`: basis points, not percent; 100 means 1%.
- `deadline`: requested refund deadline; distinguish returned quote deadline/inactivity fields.
- `depositAddress`, `depositMemo`: payment instructions; memo mandatory when returned.
- `confidentiality`: lowercase `public`, `basic`, `advanced`; separate from the location of the receiving balance.
- `signature`, `timestamp`: verify the signed quote projection before relying on payment instructions.

Source: [quote API](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote).

## Other protocol interfaces

| Interface | Purpose | Relevance |
| --- | --- | --- |
| Public verifier via NEAR RPC | `simulate_intents`, balances, keys, nonce salt; signed on-chain execution | Understand signatures and verify public state; not a private FAR RPC |
| Solver JSON-RPC, `https://solver-relay-v2.chaindefuser.com/rpc` | `quote`, `publish_intent`, `publish_intents`, `get_status`; partner JWT | Lower-level integration; official guidance directs swap apps to 1Click |
| Solver WebSocket, `wss://solver-relay-v2.chaindefuser.com/ws` | Quote subscriptions/responses and status notifications; Bearer handshake | Needed for market making, not the bill-splitting frontend |
| Private relay | Separate provisioned URL; private signed quote bundles, settlement and unshield events | No public unauthenticated endpoint; access from Defuse |
| Intents Explorer API | Historical swap queries, JWT and documented request limits | Public-market analytics; does not substitute for authenticated private account history |
| SHIELD incident API | Partner incident/status and request policy | Operational service distinct from shielding funds into FAR |
| Omni / PoA / HOT bridge interfaces | Asset transport and withdrawals | Prefer 1Click orchestration for this MVP |

Sources: [RPC](https://docs.near-intents.org/integration/market-makers/message-bus/rpc), [WebSocket](https://docs.near-intents.org/integration/market-makers/message-bus/websocket), [private relay](https://docs.near-intents.org/integration/market-makers/confidential-intents), [Explorer](https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/introduction), [SHIELD](https://docs.near-intents.org/security-compliance/shield-incident-api).

## SDKs and integration helpers

| Tool | What it does | Use for this project |
| --- | --- | --- |
| [1Click TypeScript SDK](https://github.com/defuse-protocol/one-click-sdk-typescript) | Typed REST client and quote signature verification | Primary candidate for application integration |
| [1Click Go SDK](https://github.com/defuse-protocol/one-click-sdk-go) / [Rust SDK](https://github.com/defuse-protocol/one-click-sdk-rs) | Alternative language clients | Available; no need for three clients |
| [Intents SDK](https://github.com/defuse-protocol/sdk-monorepo/tree/main/packages/intents-sdk) | Signers, intent builder, versioned nonces, withdrawal orchestration | Useful for ownership signatures and existing-balance spending |
| [Aurora widget](https://docs.near-intents.org/integration/devkit/react-widget) | Configurable React swap/transfer/withdraw UI | UI helper, not proof of private payment support |
| [NEAR agent skills](https://github.com/near/agent-skills) | Agent integration instructions | Reference; not installed or trusted as live API authority |
| [Confidential solver example](https://github.com/hairy-pointer/near-intents-amm-solver/tree/feat/confidential-amm-solver-mode) | Liquidity shielding, private solving, balance auth | Architecture reference; we do not need to operate a solver |

The November 9 repository snapshot reported 0.1.25. The application now pins SDK 0.1.26 and has verified six live dry-quote signatures with it. See [payment adapter](PAYMENT_ADAPTER.md).

Signature verification is over selected request/quote fields, serialized deterministically, hashed, base58-encoded and Ed25519-signed. The reviewed source excludes several metadata fields and does not include `confidentiality` in its request projection. A valid signature therefore is not a blanket attestation of every response field. Our dry quote, allocated quote and status quote all verified using that published algorithm.

Sources: [SDK guide](https://docs.near-intents.org/integration/distribution-channels/1click-api/sdk), [verification guide](https://docs.near-intents.org/integration/distribution-channels/1click-api/verify-quote-signature), [reviewed implementation](https://github.com/defuse-protocol/one-click-sdk-typescript/blob/ae8b24e064785c8cba8081263e03e52fed4de089/src/quote-signature.ts).

## Adjacent products

Earn routes into third-party yield positions; Hyperliquid handles special USDC routing; orders support confidential limit orders. All are documented in the same API family, but none is necessary to split a dinner bill. x402/MPP payment integrations are another distribution layer over Intents, not a replacement for receipt allocation or proof of recipient privacy.

Sources: [Earn](https://docs.near-intents.org/integration/distribution-channels/1click-api/earn), [Hyperliquid](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid), [orders](https://docs.near-intents.org/integration/distribution-channels/1click-api/orders), [NEAR payments](https://www.near.org/agentic-payments).
