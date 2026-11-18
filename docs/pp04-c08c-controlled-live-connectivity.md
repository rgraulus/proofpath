# PP-04-C / C-08C — Controlled Live Connectivity

**Status:** Gate A validated; Gate B offline implementation validated; live execution not authorized
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


---

## 13. Gate B Implementation and Offline Acceptance

**Implementation branch:** `feat/pp04-c08c-gate-b-controlled-live-connectivity-v1`

**Frozen parent:** `77607b7ccac39647c7e5d143f8d9f4f31d0c133d`

**Acceptance designation:** Gate B offline implementation validated.
Live Testnet invocation remains separately unauthorized.

### 13.1 Scope

Gate B extends the existing Gate A architecture without modifying
the accepted C-08B mapper or Facilitator repository.

The four-file change boundary is:

1. `src/application/pp04/testnetLiveSource.ts`
2. `src/application/pp04/testnetLiveRunner.ts`
3. `tests/pp04-testnet-live-source.test.ts`
4. `docs/pp04-c08c-controlled-live-connectivity.md`

Gate A response-fixture processing remains available and its existing
operational prohibition is preserved.

Gate B introduces a separate controlled acquisition function and
a sanitized runner. It does not activate a public application
entry point, viewer, payment executor, or resource-release path.

### 13.2 Fixed read-only transport

Gate B uses Node's native HTTP client, with these restrictions:

- HTTP method: `GET` only.
- Fixed destination: `127.0.0.1:8080`.
- Fixed route: `/v1/crp/payments/search`.
- Query constructed from independently supplied expected-payment fields.
- Fixed search limit: 100 records.
- Testnet-only expectation validation.
- No caller-supplied destination, method, request headers, or transport.
- No redirects, proxy dispatcher, authentication-header forwarding,
  cookies, retries, or request bodies.
- HTTP 200 and JSON content type required.
- Unsupported response encoding rejected.
- Maximum accepted response body: 65,536 bytes.
- Bounded response-header processing through Node HTTP limits.
- Connection deadline: 2,000 milliseconds.
- Total request deadline: 5,000 milliseconds.
- Generic failure results without exposing raw transport exceptions.

The socket timeout is also configured at 2,000 milliseconds.
The overall 5-second deadline remains an independent upper bound
on the acquisition operation.

These are implementation controls and offline-tested behaviors,
not a claim of completed real-network security acceptance.

### 13.3 Operational authorization

The dedicated Gate B acquisition path is default-denied.

Both environment variables must have the exact value `true`:

- `PROOFPATH_C08C_GATE_B_LIVE_ENABLED`
- `PROOFPATH_C08C_GATE_B_LOOPBACK_CONFIRMED`

No other value enables the path.

The loopback-confirmation flag is an operator assertion, not
a technical measurement of the Facilitator's listening address.

The Gate A `controlled_live` mode remains hard-blocked, and the
original `runC08CLiveObservation()` prohibition remains intact.

Deploying or merging Gate B code does not authorize operators to
set these flags or execute a live request.

### 13.4 Facilitator contract and access limitations

The inspected Facilitator implementation is:

- Repository: `xcf-concordium-facilitator`.
- Reviewed commit: `530b53c88eb7715beac3cb0afb1c8c277f5535b9`.
- Route: `GET /v1/crp/payments/search`.
- Source: `src/routes/crp.payments.ts`.
- Query persistence: `src/store/match.pg.ts`.

The inspected route and server wiring show no explicit authentication
requirement for payment search.

The Facilitator's default server host is `0.0.0.0`, rather than
loopback-only.

Therefore, the ProofPath client's numeric loopback destination
does not independently secure the Facilitator's listening interface.

Before any live invocation, deployment must independently establish
and document an appropriate access boundary, preferably an explicit
`HOST=127.0.0.1` bind for the controlled local test environment,
plus verification of the actual listening interface.

The absence of explicit authentication must remain an acknowledged
operational limitation. Loopback connectivity does not establish
cryptographic source authenticity.

### 13.5 Evidence and trust boundaries

The live search response is untrusted observational input.

The accepted C-08B mapper continues to perform local exact-tuple
correlation without modification.

The Gate B runner returns only sanitized statuses and reason codes.
Raw CRP records and compact JWS values are not exposed in its output.

The following assurance fields remain false:

- `sourceAuthenticated`
- `receiptAuthenticated`
- `settlementIndependentlyVerified`

A uniquely correlated candidate is not proof of receipt signature
validity, on-chain settlement finality, approved trust context,
compliance satisfaction, or permission to release a resource.

No payment is created, fulfilled, transferred, or executed by Gate B.

### 13.6 Search completeness and identifier compatibility

The CRP endpoint does not support nonce or amount as server-side
search filters. The results are bounded and ordered by creation time.

Consequently, absence of a matching record means only that a match
was not observed in the bounded result set.

It must not be interpreted as definitive absence of a payment.

Network identifier compatibility remains governed by the existing
C-08B/C-08C rules. Gate B does not silently rewrite response
identifiers to force correlation.

### 13.7 Offline acceptance evidence

The Gate B validation sequence established:

- Imported native HTTP interception using Node's in-memory mocks.
- A secondary socket-connect guard for the mock tests.
- Default denial before acquiring HTTP data.
- Fixed request target, method, headers, and supported filters.
- Synthetic successful acquisition without real sockets.
- Sanitized candidate reporting with false assurance flags.
- Fail-closed redirect and HTTP authentication rejection.
- Fail-closed invalid content type and unsupported encoding.
- Fail-closed oversized declared and streamed response bodies.
- Fail-closed truncated response, malformed JSON, and stream abort.
- Fail-closed transport error and socket timeout.
- Five-second total deadline on a synthetic established connection
  whose HTTP response never completes.

**Command Block 197R:**

- Gate A tests: 26 passed.
- Gate B tests: 16 passed.
- Combined C-08C tests: 42 passed, 0 failed.
- TypeScript typecheck: passed.

**Command Block 199:**

- Complete offline repository suite: 458 passed, 0 failed.
- TypeScript no-emit typecheck: passed.
- SDK build: passed.
- Git diff whitespace check: passed.
- Three-file implementation/test scope preserved.
- No live Facilitator request or payment execution.

The above results establish deterministic offline acceptance.
They do not establish that the Facilitator was contacted live.

### 13.8 Live acceptance prerequisites

Before any controlled live Testnet observation, require:

1. Separate explicit authorization for the live read.
2. Confirmation of the exact target Facilitator instance and
   reviewed deployment version.
3. Verification of the server's actual listening interface and
   local access restrictions.
4. Confirmation that the search route's access and authentication
   limitations are understood and acceptable for the rehearsal.
5. Healthy Facilitator and required database dependencies.
6. A frozen expected-payment tuple with a known Testnet-only asset.
7. Confirmation that the request is a bounded read-only GET.
8. A plan for handling missing matches and network-ID mismatches
   without weakening mapper rules.
9. Logging restrictions prohibiting raw response, JWS, secret,
   and personal-data disclosure.
10. A recorded stop/rollback procedure and acceptance observer.

Live acceptance must remain a separate operational checkpoint
even if the implementation PR is merged.

### 13.9 Stop conditions and rollback

Immediately stop controlled live acquisition if any of the
following occurs:

- Unexpected destination, route, or request method.
- Unverified Facilitator network exposure or access restrictions.
- Unexpected HTTP authentication requirement or rejection.
- Redirect or unexpected response encoding.
- Timeout, failed connection, truncated response, or oversized body.
- Malformed response envelope or incompatible network identifier.
- Ambiguous candidate correlation or unexpected record content.
- Unintended disclosure of sensitive data.
- Any indication of payment mutation or resource release.

Rollback is operationally fail-closed:

1. Disable `PROOFPATH_C08C_GATE_B_LIVE_ENABLED`.
2. Disable `PROOFPATH_C08C_GATE_B_LOOPBACK_CONFIRMED`.
3. Stop the controlled invocation.
4. Preserve only sanitized acceptance diagnostics.
5. Do not proceed to payment or trust promotion.

No automated payment action or external rollback transaction is
part of this milestone.

### 13.10 Explicit exclusions

Gate B does not authorize:

- C-08D payment execution.
- CRP create, match, or fulfill mutations.
- Wallet signing or asset transfers.
- Independent receipt cryptographic verification.
- Independent settlement/finality verification.
- Automatic trust or compliance approval.
- Viewer release or protected-resource access.
- Production deployment or unattended live polling.

**Gate B implementation:** Offline-validated.

**Live Testnet acceptance:** Not yet performed or authorized.

**C-08D payment execution:** Not authorized.
