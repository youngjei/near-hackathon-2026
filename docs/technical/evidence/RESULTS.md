# Research evidence and reproduction

Collected November 9, 2026. Source pages were downloaded around 05:52 UTC. Live probes in the committed results record their individual timestamps.

- `source-manifest.json`: URL, timestamp and SHA-256 for 72 documentation-index pages, plus OpenAPI and the confidentiality changelog. Full downloaded pages remain in ignored local scratch; paths are provenance, not files included in this repository.
- `probe-results.json`: selected actual API results. Keys and authentication token values are not included. The authentication record stores response field names only. Receiving/refund addresses used by ordinary quote probes are synthetic and MUST NOT be funded.
- `signature-verification.json`: three response signatures checked successfully against the official SDK's Ed25519 public key and field projection.

## Reproduce without spending

From the repository root, use Python 3.11+ and curl and cryptography (the original environment had cryptography 46.0.5):

```sh
python3 -m venv .venv
.venv/bin/pip install cryptography==46.0.5
.venv/bin/python scripts/probe_near_intents.py
```

Expected: fetch supported assets, generate a fresh in-memory identity, sign an empty ownership proof, query its empty private balance, inspect history access, request dry public/private quotes, and write results to ignored `work/near-probe/results.json`. No user wallet is read. No spending payload is created or submitted. Fresh private keys and returned auth tokens are discarded when the process exits.

To additionally reproduce the ordinary status-address disclosure:

```sh
.venv/bin/python scripts/probe_near_intents.py --allocate-public
```

This allocates one unfunded public quote and reads its status. It does not transfer tokens. Never fund its synthetic recipient or refund addresses.

Verify the three saved response signatures offline:

```sh
.venv/bin/python scripts/verify_near_quote_evidence.py
```

Expected: three `signature_valid: true` results.

HTTP outcomes can change with service rollout. The expected outcomes at the snapshot are listed in [PRIVACY.md](../PRIVACY.md). Partner enablement and funds are not part of this script.

## Limits and discrepancies

The private quote path did not pass access checks, so no confidential quote status response or funded settlement was inspected. Valid user-session authentication is not evidence of partner enablement. We did not probe arbitrary users' balances or transactions.

The spec's `User-Session` is a bearer security-scheme name, not a header name. An initial scratch attempt used the wrong header and was corrected before the committed successful balance probe. Authentication returns 201; the final script handles it and never records token values.

The fee guide and sampled quote disagree: docs state an additional 25 bps unauthenticated fee; our public USDC response exposed a 1 bp appFees entry. The returned execution deadline also differed from the request by three days. Preserve actual quote fields; do not hardcode fee or timing claims from this sample.

No funded transaction, private relay connection, partner-only history call, refresh-token exchange, generated spending intent, submission, refund execution or withdrawal was tested. No application or payment system has been built yet.

The committed dry-probe script was rerun successfully after refactoring. It reproduced HTTP 201 authentication, HTTP 200 owner balances, HTTP 401 confidential quote access failures, HTTP 403 history gating and HTTP 201 ordinary dry quotes. curl supplies the HTTPS transport; no certificate verification is disabled.
