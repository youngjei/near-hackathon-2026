# NEAR Intents technical dossier for splitdbill

Checked 2026-11-09. This is implementation research, not a completed payment integration or a security audit.

## Start here

- [Privacy findings and live evidence](PRIVACY.md): the answer to the recipient-address question, tested API boundaries, and remaining access requirements.
- [Architecture and execution](ARCHITECTURE.md): verifier, solvers, bridges, confidential balances, signing and settlement.
- [API and tools map](API_MAP.md): every operation in the current 1Click OpenAPI, related interfaces and SDKs.
- [splitdbill integration plan](SPLITDBILL.md): receipt → shares → payment → reconciliation, with the privacy acceptance criteria.
- [Research evidence](evidence/RESULTS.md): exact results, limitations, source hashes and reproducibility.

The 72 pages in the official documentation index were downloaded and indexed. Core protocol, confidentiality, account authentication, quoting, execution, fees, bridges and SDK material were examined in depth. Downloading a page is not evidence that every line or every linked repository was audited. Solver internals, provider operations and inaccessible partner services have not been exhaustively verified.

Three separate questions must stay separate: who can read a confidential balance; who can learn the receiving account identifier; and whether that identifier identifies a wallet with existing public activity. The first has documented protection and a successful authentication probe. End-to-end recipient privacy for our proposed flow remains an integration test blocked by confidential quote access.
