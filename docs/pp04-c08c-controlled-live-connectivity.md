# PP-04-C / C-08C — Controlled Live Connectivity

**Status:** Gate A offline implementation validated; Gate B not authorized  
**Repository:** `proofpath`  
**Branch:** `feat/pp04-c08c-controlled-live-connectivity-v1`  
**Frozen parent HEAD:** `642cbc0569d5cc97c7203e472683919a67386991`  
**Scope:** Four new files, one feature branch, one PR

## 1. Purpose

C-08C establishes the controlled boundary between a Concordium Testnet CRP payment-search response and the accepted C-08B exact-tuple candidate mapper.

The implementation is intentionally separated into two authorization stages:

- **Gate A:** Deterministic offline response-fixture processing and regression validation.
- **Gate B:** Separately authorized, controlled, read-only live connectivity.

Only Gate A is implemented and validated in this milestone.

C-08C does not execute a payment, verify a receipt signature, independently establish settlement finality, approve a trust context, or release a protected resource.

## 2. Frozen Scope

The only new files are:

1. `src/application/pp04/testnetLiveSource.ts`
2. `src/application/pp04/testnetLiveRunner.ts`
3. `tests/pp04-testnet-live-source.test.ts`
4. `docs/pp04-c08c-controlled-live-connectivity.md`

The accepted C-08B modules remain unchanged:

- `src/application/pp04/testnetConfig.ts`
- `src/application/pp04/testnetSource.ts`
- `src/application/pp04/testnetRunner.ts`
- `tests/pp04-testnet-source.test.ts`

No application entry-point wiring, public viewer integration, Facilitator repository modifications, or CRP mutations are part of C-08C Gate A.

## 3. CRP Integration Contract

The intended future observation target is:

`GET http://127.0.0.1:8080/v1/crp/payments/search`

The supported CRP query filters are:

- `merchantId`
- `network`
- `tokenId`
- `payTo`
- `limit`

The source constructs the query from independently supplied expected-payment fields.

It does not supply `nonce` or `amount` as server-side query filters because the inspected CRP route does not support them.

The response envelope is expected to contain:

- `ok`
- `filters`
- `matches`

The accepted C-08B mapper validates the response and performs exact local correlation using the expected payment tuple, including merchant, nonce, network, asset, amount, and recipient.

A server-side search result is not itself an authenticated payment record.

### Search completeness limitation

The CRP search endpoint returns a bounded, descending-created-time result set. The C-08C query limit is 100.

Because the endpoint lacks nonce and amount filters, a sufficiently large result set can exclude the desired challenge.

A missing match therefore means **not observed in this bounded result**, not proof that no corresponding payment exists.

C-08C must not interpret the absence of a result as a definitive blockchain or payment-system finding.

### Network identifier compatibility

The frozen C-08B mapper expects `concordium:testnet` in matching records.

The Facilitator also supports a Concordium Testnet CAIP-2 identifier in its network-normalization path.

C-08C does not silently rewrite returned network identifiers to force a match. Identifier differences remain an explicit compatibility limitation until separately addressed and tested.

## 4. Gate A Architecture

The offline processing sequence is:

1. A trusted test harness constructs a synthetic HTTP `Response` fixture.
2. The C-08C source validates its fixed endpoint and expected-payment configuration.
3. The source reads the supplied response body with bounded-size and JSON validation.
4. The runner passes the resulting observation to the accepted C-08B mapper.
5. The mapper performs exact payment-tuple correlation.
6. The runner returns only a sanitized status and reason code.

Gate A does not invoke `fetch`, open a network connection, call the Facilitator, or initiate a CRP payment operation.

The response fixture is untrusted payment-search data. Its construction and provenance belong to the offline test harness.

## 5. Source Security Controls

The implementation includes:

- An exact loopback endpoint allowlist
- Concordium Testnet-only expected-payment validation
- PLT asset precision validation
- A fixed bounded search limit
- HTTP status and content-type validation
- Declared content-length checks
- Incremental response-body size enforcement
- Strict UTF-8 decoding and JSON parsing
- Generic failure responses without raw exception details
- No executable transport callback in Gate A
- A hard-disabled operational live path

The configured response-size ceiling is 65,536 bytes.

The Gate A source accepts a preconstructed `Response`; it does not perform HTTP acquisition.

Consequently, runtime connection timeouts, redirect control, transport credentials, TLS policy, authentication, and operational socket restrictions are not established by Gate A. They must be implemented and validated separately before any Gate B connectivity.

## 6. Runner and Evidence Boundaries

The runner reuses `mapC08BCrpSearchResponse` from the accepted C-08B implementation.

Its sanitized results distinguish:

- `blocked`
- `unavailable`
- `rejected`
- `candidate`

A `candidate` result establishes only that the offline observation contains a uniquely correlated receipt candidate under the accepted mapper rules.

It does **not** establish:

- Authenticated source provenance
- Cryptographic JWS signature validity
- Independent settlement verification
- On-chain finality
- Trust or compliance approval
- Authorization for resource release

The runner preserves these assurance flags as false:

- `sourceAuthenticated`
- `receiptAuthenticated`
- `settlementIndependentlyVerified`

The runner does not return raw CRP records or compact JWS material.

The lower-level source observation may contain untrusted raw response data; it must not be treated as a sanitized public output.

## 7. Operational Default Deny

C-08C Gate A does not enable operational live connectivity.

The source rejects `controlled_live` mode, and the operational runner throws `c08c_gate_b_live_not_authorized`.

The accepted C-08B default-deny configuration remains unchanged.

No user-supplied mode label or fixture can authorize live connectivity.

A future Gate B implementation requires separate approval, security review, and validation. Approval of this offline PR is not approval to perform live requests.

## 8. Gate A Test Coverage

The C-08C deterministic suite covers:

- Fixed search URL and supported query filters
- Endpoint and network restrictions
- PLT precision restrictions
- Hard-disabled operational mode
- Offline operation without global fetch
- Preservation of untrusted source and settlement flags
- HTTP status and redirect-like response rejection
- Content-type and response-size limits
- Malformed JSON and missing-body handling
- Invalid fixture dependencies
- Unique candidate correlation
- Missing and pending challenges
- Duplicate matching challenges
- Amount mismatches
- Malformed receipt JWS shape
- Malformed search envelopes
- Sanitized runner output
- Explicit operational runner prohibition

The suite does not prove live-network security or actual Concordium settlement.

## 9. Gate A Validation Record

**Command Block 154 — Security hardening**

- C-08C tests: 26 passed, 0 failed
- TypeScript no-emit compilation: passed
- Offline transport callback removed
- Four-file scope preserved
- No live requests or payment operations

**Command Block 155 — Combined regression**

- C-08C tests: 26 passed
- Accepted C-08B tests: 28 passed
- Combined total: 54 passed, 0 failed
- TypeScript no-emit compilation: passed
- Existing tracked files: unchanged
- Nothing staged
- Frozen parent HEAD: preserved
- Documentation file: empty at the time of Block 155

These are local validation observations, not a claim of live Testnet integration or cryptographic payment assurance.

## 10. Gate B — Explicitly Deferred

Before any controlled live observation, Gate B must separately establish:

1. Explicit authorization for the intended read-only connectivity.
2. A narrow destination and route allowlist.
3. Bounded connection and response timeouts.
4. Redirect rejection and response-size enforcement.
5. A documented CRP endpoint access and authentication model.
6. Protection against arbitrary destinations and unintended network access.
7. A safe logging and sensitive-data handling policy.
8. Read-only request semantics without CRP mutations.
9. A known search-completeness and network-identifier compatibility policy.
10. Controlled acceptance tests and rollback/stop conditions.

No Gate B implementation or live invocation is authorized by this document.

## 11. C-08D and Trust Boundaries

C-08D payment execution remains outside the authorized scope.

C-08C does not resolve outstanding ProofPath trust approval or provenance requirements.

Historic C5/C6 assurance is not established merely because an offline CRP observation correlates with an expected payment tuple.

A receipt candidate must pass the appropriate independent authentication and settlement-verification boundaries before it can contribute to any higher-assurance decision.

## 12. Completion Criteria

C-08C Gate A may be considered ready for review when:

- All four intended files exist within the exact scope.
- Source and runner implement offline response-fixture processing.
- Live connectivity remains default-denied.
- The accepted C-08B mapper is reused without modification.
- C-08C offline tests pass.
- C-08B/C-08C regression tests pass.
- TypeScript no-emit compilation passes.
- Repository and accepted C-08B integrity checks pass.
- This architecture and acceptance document is complete.
- No unauthorized staging, commit, push, merge, live request, or payment occurs.

**Acceptance designation:** Gate A review-ready, subject to final four-file integrity verification and normal PR review.

**Gate B status:** Not authorized.

**C-08D status:** Not authorized.
