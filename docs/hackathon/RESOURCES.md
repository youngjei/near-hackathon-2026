# Technical resources and constraints

Checked November 9, 2026. This is an integration map, not a selected architecture. The organizer guide supplies the partner directory; the starter prompts supply example-specific links. An ecosystem listing is not a guarantee that every API is publicly available or appropriate for our project.

## Documentation entry points

- [NEAR documentation index](https://docs.near.org/llms.txt): accounts, keys, contracts, testnet, RPC, Chain Signatures, applications and data infrastructure.
- [NEAR Intents documentation index](https://docs.near-intents.org/llms.txt): supported chains/assets, 1Click quotes and execution, SDK, authentication, fees and Explorer API.
- [NEAR agent skills](https://github.com/near/agent-skills): the organizer setup prompt recommends `npx skills add near/agent-skills`. The six advertised areas are near-ai-cloud, near-api-js, near-dapp, near-intents, near-kit and near-smart-contracts. This preparation session reviewed the recommendation but did not execute the installer. Select and review relevant skills when the stack is chosen.
- [NEAR DevHub videos](https://www.youtube.com/channel/UCq0iWZQuXhvP8yQzDZsmWfQ): organizer-linked walkthroughs and track material; videos were not reviewed in this preparation.
- [NEAR Builders resource directory](https://nearbuilders.org/build): additional tools and community resources; not every external project has been audited here.

## Constraints to design around

The following come from the current organizer guide and starter notes. Recheck the underlying live integration docs before implementation.

- **NEAR Intents:** no testnet exists or is planned. Use real quotes with `dry: true` for a non-executing demonstration, or clearly label simulations. Any funded execution requires an explicit budget and authorization. Ordinary public quotes work without a partner JWT. The older organizer guide says 0.2% without one; current [fee docs](https://docs.near-intents.org/resources/fees) instead state an additional 0.25%, and a sampled USDC response differed again. Use actual quotes and the [technical findings](../technical/ARCHITECTURE.md). Confidential quote access requires separate verification/enablement; do not generalize anonymous public access to it. Partner registration is at https://partners.near-intents.org. Explorer analytics access has separate authentication requirements in the thesis prompt.
- **NEAR development:** free testnet funds and public RPC options exist. Testnet-only entries are eligible. Confirm current faucet/provider access in [NEAR docs](https://docs.near.org/) and [RPC providers](https://docs.near.org/api/rpc/providers).
- **Agent authority:** function-call keys have restrictions; do not describe them as arbitrary transfer keys. The security prompt warns that an account with only function-call keys cannot transfer NEAR/add keys and may become inaccessible when allowances run out. Design custody and recovery explicitly.
- **Private AI:** verify a TEE claim through the documented attestation process, including a fresh nonce; encryption or calling an API alone is not evidence of verified execution. The guide points to [NEAR AI Cloud](https://cloud.near.ai) for paid credits/API keys and a $10 claim via [NEAR Builders](https://nearbuilders.org/join). Rechecked November 10: claim through the [Builders dashboard](https://nearbuilders.org/dashboard); Q-000 specifies a separate API key with a $10 balance, not a credit applied to the cloud.near.ai account. No credit was claimed.
- **Research/data:** the BigQuery sample uses `bigquery-public-data.crypto_near_mainnet_us`. Query execution costs are the builder's responsibility; filter on `block_date`. Verify schema and access first. Do not invent missing data.
- **Agent commerce:** verify programmatic posting, hiring, verification and payment APIs before designing around Agent Market. The example Agent API uses temporary demo keys; do not assume they remain valid through judging.
- **Account-backed NFTs:** the Top Level Accounts starter note says there is no SDK yet; direct contract integration requires checking current contract interfaces and transfer authority.
- **near.social:** the social prompt documents a specific write/transaction-status convention. Recheck its live agent guide before interpreting a failed transaction status as success.

## Partner directory from the organizer guide


Partner tools and their documentation. Read the docs before integrating anything; verify endpoints, contract addresses and SDK versions there instead of assuming them. More ecosystem resources, updated as they become available: https://nearbuilders.org/build.

| Partner | What it is | Docs | Website | GitHub |
| --- | --- | --- | --- | --- |
| NEAR Intents | Cross-chain execution | https://docs.near-intents.org/ | https://intents.near.org/ | https://github.com/near/intents |
| Aurora | Ethereum on NEAR | https://doc.aurora.dev/ | https://aurora.dev/ | https://github.com/aurora-is-near |
| HOT | Chain abstraction | https://docs.hotdao.ai/ | https://hot-labs.org/ | https://github.com/hot-dao |
| Rhea | DeFi on NEAR | https://guide.rhea.finance/ | https://rhea.finance/ | https://github.com/rhea-finance |
| meme.cooking | Memecoin launchpad | https://docs.meme.cooking/ | https://meme.cooking/ |  |
| HEX | Cross-chain swaps | https://hot-labs.gitbook.io/hex/concepts-and-systems/interactive-blocks | https://hex.exchange/ |  |
| NEAR.AI | Private AI | https://docs.near.ai/ | https://near.ai/ | https://github.com/nearai/cloud-api |
| SVRN | Sovereign technology | https://svrn.net/research/near-protocol | https://svrn.net/ |  |
| Trezu | Multisig treasury for Web3 teams | https://github.com/NEAR-DevHub/trezu-docs | https://trezu.org/ | https://github.com/NEAR-DevHub/trezu |
| SputnikDAO | DAO infrastructure | https://github.com/near-daos/sputnik-dao-contract#setup | https://x.com/SputnikDAO | https://github.com/near-daos/sputnik-dao-contract |
| OutLayer | Secure transactions for AI agents | https://app.outlayer.ai/docs/getting-started | https://outlayer.ai/ | https://github.com/out-layer/outlayer |
| GoMining | Bitcoin mining superapp | https://docs.gomining.com/ | https://gomining.com/ |  |
| Agent Market | Marketplace for AI agents | https://docs.market.near.ai/ | https://market.near.ai/ |  |
| NEAR Builders | Builder community | https://nearbuilders.org/build | https://nearbuilders.org/ | https://github.com/nearbuilders |
| Gulf Labs | Invests in blockchain infrastructure |  | https://gulf-labs.com/ |  |
| BRRRAIN | Memecoin with AI rewards | https://brrrain.fun/docs/ | https://brrrain.fun/ |  |
| NEAR Business | Confidential multisig treasury | https://docs.business.near.com/ | https://business.near.com/ |  |

### Partner notes

- Rhea (rhea.finance): NEAR's DEX and lending protocol. Looking for something to build? Consider CLMM and AMM pools, the cross-chain swap API or vaults on top of its lending. SDKs and API docs: https://github.com/rhea-finance/rhea-sdk-docs. CLI: https://guide.rhea.finance/developers-1/cli-trading
- Agent Market (market.near.ai): a marketplace where AI agents get hired and paid by the job, by people and by other agents. List the agent you build so it can earn: https://docs.market.near.ai/list-your-agent. Hire agents from Claude or other MCP clients: https://docs.market.near.ai/guides/claude-desktop
- NEAR Business (business.near.com): a confidential multisig built on NEAR Intents. It keeps treasury balances and transfers hidden from the public, manages assets on 35+ chains from one dashboard and sets approval policies that fit your treasury. Sign up: https://business.near.com/create?ref=og. Demo: https://app.trupeer.ai/view/OEoiJVjUh/near-business-create-and-manage-a-treasury


## Community and questions

- [NEAR Discord](https://discord.gg/nearprotocol): technical questions and teammates.
- [NEAR builders Telegram](https://t.me/nearbuilderschat): builder support and collaboration.
- [NEAR Protocol on X](https://x.com/NEARProtocol): announcements.

No community messages were sent. Ask organizers about unpublished prize/scoring details only if they affect our plan.

## Documentation links from each starter

The source links below were collected from the reviewed prompts. They are discovery links, not a claim that every linked page has been read or its service tested.

### 01. Unstoppable DeFi

- [1Click API quickstart](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart)
- [Chain Signatures getting started](https://docs.near.org/chain-abstraction/chain-signatures/getting-started)
- [Rhea guide](https://guide.rhea.finance/)
- [Agent API overview](https://docs.agentsonintents.com/integration/agent-api/overview)
- [Aurora Intents](https://intents.aurora.dev/)

### 02. Investment Thesis

- [NEAR BigQuery public dataset](https://docs.near.org/data-infrastructure/big-query)
- [NEAR data infrastructure overview](https://docs.near.org/data-infrastructure/what-is)
- [NEAR Intents Explorer API](https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/introduction)

### 03. Privacy & Private AI

- [NEAR AI Cloud quickstart](https://docs.near.ai/cloud/quickstart)
- [NEAR AI Cloud verification docs](https://docs.near.ai/cloud/verification)
- [Verification example repo](https://github.com/near-examples/nearai-cloud-verification-example)
- [Agent API overview](https://docs.agentsonintents.com/integration/agent-api/overview)

### 04. Autonomous Business

- [AI and NEAR](https://docs.near.org/ai/introduction)
- [OutLayer getting started](https://app.outlayer.ai/docs/getting-started)
- [1Click API](https://docs.near-intents.org/integration/distribution-channels/1click-api/about-1click-api)
- [Agent API overview](https://docs.agentsonintents.com/integration/agent-api/overview)
- [PingPay Agent Pay facilitator](https://pingpay.gitbook.io/docs/pingpay-api/agent-pay-facilitator)

### 05. AI Swarms

- [What are intents](https://docs.near-intents.org/getting-started/what-are-intents)
- [Tools for AI agents](https://docs.near.org/getting-started/tools-for-ai)
- [NEAR MCP server](https://github.com/nearai/near-mcp)
- [Top Level Accounts](https://nearaccounts.com/)
- [Agent API overview](https://docs.agentsonintents.com/integration/agent-api/overview)

### 06. AI Security & Defense

- [Access keys](https://docs.near.org/protocol/accounts-contracts/access-keys)
- [OutLayer getting started](https://app.outlayer.ai/docs/getting-started)
- [NEAR AI Cloud verification](https://docs.near.ai/cloud/verification)
- [Agent API policies & limits](https://docs.agentsonintents.com/integration/agent-api/policies-and-limits)

### 07. Agent Economy

- [NEAR AI Agent Market](https://market.near.ai/jobs)
- [NEAR MCP server](https://github.com/nearai/near-mcp)
- [1Click API](https://docs.near-intents.org/integration/distribution-channels/1click-api/about-1click-api)
- [Agent API overview](https://docs.agentsonintents.com/integration/agent-api/overview)
- [PingPay Agent Pay facilitator](https://pingpay.gitbook.io/docs/pingpay-api/agent-pay-facilitator)

### 08. Real-World Money

- [1Click API quickstart](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart)
- [Building a meta transaction relayer](https://docs.near.org/web3-apps/tutorials/meta-transactions)
- [NEP-141 fungible token standard](https://github.com/near/NEPs/blob/master/neps/nep-0141.md)
- [PingPay Agent Pay facilitator](https://pingpay.gitbook.io/docs/pingpay-api/agent-pay-facilitator)

### 09. Games With Real Economies

- [NEP-245 multi token standard](https://github.com/near/NEPs/blob/master/neps/nep-0245.md)
- [near-dapp agent skill](https://github.com/near/agent-skills/tree/main/skills/near-dapp)
- [What are intents](https://docs.near-intents.org/getting-started/what-are-intents)

### 10. NFTs That Do Something

- [NEP-171 NFT standard](https://github.com/near/NEPs/blob/master/neps/nep-0171.md)
- [Access keys](https://docs.near.org/protocol/accounts-contracts/access-keys)
- [near-smart-contracts agent skill](https://github.com/near/agent-skills/tree/main/skills/near-smart-contracts)
- [Top Level Accounts contracts](https://github.com/houseofstake/tla-contracts)
- [Sharded NFT items draft](https://github.com/houseofstake/tla-contracts/blob/main/docs/sharded-nft-items.md)

### 11. Memecoins With Mechanics

- [NEP-141 fungible token standard](https://github.com/near/NEPs/blob/master/neps/nep-0141.md)
- [meme.cooking](https://meme.cooking/)
- [near-smart-contracts agent skill](https://github.com/near/agent-skills/tree/main/skills/near-smart-contracts)

### 12. Social Money

- [Sputnik DAO contract](https://github.com/near-daos/sputnik-dao-contract)
- [Trezu docs](https://github.com/NEAR-DevHub/trezu-docs)
- [Trezu repo](https://github.com/NEAR-DevHub/trezu)
- [near.social](https://near.social/)
- [near.social agent guide](https://near.social/skill.md)
- [Top Level Accounts](https://nearaccounts.com/)

### 13. Open Innovation

- [Chain Signatures getting started](https://docs.near.org/chain-abstraction/chain-signatures/getting-started)
- [NEAR docs](https://docs.near.org/)
- [HACKATHON.md](https://nearhackathon.com/HACKATHON.md)
