
# PP-04-C / C-08B — Controlled Testnet Integration

**Project:** ProofPath / x402 XCF  
**Milestone:** PP-04-C, C-08B  
**Date:** 2026-11-17  
**Classification:** Offline implementation and deterministic acceptance  
**Implementation status:** Implemented and offline tests passed  
**Final acceptance status:** Pending documentation and scope review  
**Operational Testnet status:** NOT AUTHORIZED

## 1. Executive Summary

C-08B implements an isolated, offline-testable integration boundary between Concordium Facilitator/CRP payment-search observations and ProofPath's existing verification and Evidence Manifest composition engines.

The implementation introduces deterministic CRP receipt-candidate mapping, an isolated verification runner, an unconditional operational live-acquisition prohibition, and adversarial offline integration tests.

The implementation does not enable live Testnet access, initiate payments, create or fulfill CRP challenges, invoke wallets, or modify the established PP-04 application orchestrator.

C-08B does not establish new trust anchors or approve previously unapproved Concordium Agent Registry modules.

**Result:** The C-08B suite passed 28 of 28 tests. All six existing regression suites passed 202 of 202 tests, for 230 passing tests in total.

These suites were executed individually rather than as one combined test invocation.

## 2. Scope and Authorization

### 2.1 Authorized

- Implement ProofPath-only C-08B functionality.
- Create exactly five new files.
- Reuse existing receipt, settlement, agent-authority, seller-binding, and composition engines.
- Preserve frozen PP-01 Evidence Manifest schemas.
- Execute deterministic offline tests using synthetic fixtures and injected observations.
- Fail closed where necessary evidence or independently established expectations are unavailable.

### 2.2 Not Authorized

- C-08C operational live Testnet connectivity.
- C-08D payment execution or settlement mutation.
- Wallet interaction or transaction submission.
- CRP create, match, or fulfill operations.
- Modification of existing ProofPath application or verification files.
- Modification of the Gateway, Facilitator, Orchestrator, or Wallet Proxy repositories.
- Trust-policy approval or authorization of new Registry modules.
- Staging, committing, pushing, merging, or branch deletion.

## 3. Frozen Baseline

ProofPath repository:

- Branch: `main`
- HEAD: `0b566f97c419f7eb02eb6cc6cfe4913b525f099b`

The C-08B implementation was developed as five new, untracked files against this frozen baseline.

Existing tracked ProofPath files remained unchanged throughout the recorded implementation and regression sequence.

## 4. Implementation Inventory

| File | Responsibility |
|---|---|
| `src/application/pp04/testnetConfig.ts` | Unconditional default-deny operational activation |
| `src/application/pp04/testnetSource.ts` | Deterministic CRP search-response candidate mapping |
| `src/application/pp04/testnetRunner.ts` | Isolated offline verification and composition |
| `tests/pp04-testnet-source.test.ts` | Offline adversarial and runner integration tests |
| `docs/pp04-c08b-controlled-testnet-integration.md` | Architecture, limitations, and acceptance record |

No existing application or verifier files are included in the C-08B change set.

## 5. CRP Source Contract

### 5.1 Read-Only Search Boundary

The existing Facilitator exposes:

`GET /v1/crp/payments/search`

The underlying search implementation reads the `challenges` table and returns challenge records.

A challenge contains payment correlation fields, status, and a nullable receipt.

The database mapping includes:

`receipt: row.receipt ?? null`

The Facilitator's fulfillment persistence path can store the signed receipt in a JSON object containing:

- `jws`
- `payload`

Accordingly, a fulfilled challenge may expose a compact JWS through `receipt.jws`.

A pending challenge or a challenge without receipt evidence cannot provide an authenticated receipt.

### 5.2 Source Limitations

CRP payment-search observations are candidate evidence only.

The search result does not independently establish:

- CRP service authenticity.
- Facilitator signature authenticity.
- Signing-key authorization.
- Approved policy provenance.
- Independently observed settlement finality.
- Completeness of historical search results.
- Buyer identity or agent action-specific authority.

The current search implementation is challenge-oriented, uses a capped result set, and does not itself provide independently verified PLT transfer evidence.

A missing search result therefore does not prove that a payment never existed.

No live CRP search request was made during C-08B acceptance.

## 6. Offline Candidate Mapping

The mapper exports:

`mapC08BCrpSearchResponse(expected, response)`

The independently supplied expected payment contains:

- Merchant identifier.
- Nonce.
- Network.
- PLT token identifier and decimals.
- Amount.
- Recipient.

The mapper requires exact correlation across these fields.

Its C-08B expected-payment contract restricts the network to `concordium:testnet` and PLT decimals to `6`.

### 6.1 Mapping Outcomes

| Status | Meaning |
|---|---|
| `candidate` | Exactly one matching fulfilled challenge exposes a syntactically valid compact JWS |
| `unavailable` | Matching challenge or usable receipt evidence is absent |
| `rejected` | Expectations, response, challenge record, receipt shape, or matching cardinality are invalid |

The mapper rejects duplicate matching challenges as ambiguous.

It does not decode, authenticate, or trust assertions contained in the receipt payload.

A `candidate` result explicitly carries:

- `receiptAuthenticated: false`
- `settlementIndependentlyVerified: false`

A syntactically well-formed JWS is not proof of signature validity.

## 7. Isolated Verification Runner

The runner exports:

`runC08BOfflineEvaluation(input)`

The caller supplies:

- Independently specified CRP payment expectations.
- An injected CRP search response.
- A trusted synthetic PP-04 scenario.
- The existing runtime validator.

The runner first performs CRP candidate mapping.

If the mapping does not produce a unique candidate, composition is not performed.

If the candidate does not match the independently expected payment tuple in the supplied trusted scenario, evaluation is blocked.

For an eligible candidate, the runner invokes the existing ProofPath verification functions:

- `verifyFacilitatorReceipt`
- `verifySettlementFinality`
- `verifyAgentAuthority`
- `evaluateSellerBinding`

It then invokes:

`composeTransactionEvidence`

The frozen PP-01 Evidence Manifest validation requirements remain in effect.

### 7.1 Important Assurance Distinction

The runner's `evaluated` status means the verification and composition functions executed.

It does not mean the transaction was fully verified.

The individual verification outcomes and composed assessment retain their own statuses and limitations.

An incomplete composition cannot be interpreted as fully verified.

### 7.2 Independent Expectations

The receipt verifier requires an expected payment contract, nonce, transaction hash, authorized signing-key policy, policy digest, and evaluation clock.

These expectations must not be inferred solely from the presented receipt.

The runner reuses the independently supplied expectations in the scenario. It does not construct policy authority, choose an approved transaction hash, or authenticate an external evidence source.

The offline harness is trusted only for purposes of controlled synthetic testing.

## 8. Operational Activation Prohibition

The configuration module exports:

- `getC08BActivationDecision()`
- `assertC08BLiveAcquisitionAuthorized()`

The operational activation decision is unconditionally:

`allowed: false`

The denial reason is:

`c08b_live_acquisition_not_authorized`

The runner's operational entry point, `runC08BLiveAcquisition()`, invokes this guard and throws.

No caller input or environment variable is authorized to enable live acquisition in C-08B.

There is no network-capable source client in the C-08B implementation.

Any future operational acquisition capability requires separate C-08C authorization, design, implementation, and acceptance.

Payment execution requires separate C-08D authorization.

## 9. Offline Adversarial Acceptance

The new C-08B test suite contains 28 tests.

Its coverage includes:

- Unique candidate correlation.
- No promotion of a candidate to authenticated evidence.
- Rejection of malformed CRP observations.
- Missing and pending receipt handling.
- Exact merchant/payment tuple correlation.
- Rejection of ambiguous matching records.
- Compact JWS structural checks.
- Deterministic, non-mutating source mapping.
- Invalid expected-payment rejection.
- Default-deny activation.
- Unconditional live-acquisition refusal.
- Invalid offline dependency handling.
- Canonical synthetic scenario evaluation.
- Trusted receipt-binding mismatch rejection.
- Tampered JWS signature rejection.
- Missing-record and duplicate-record composition prevention.
- Independent expected transaction-hash enforcement.
- Preservation of incomplete composition outcomes.

Test command:

```bash
CI=true PROOFPATH_SOURCE_MODE=fixture \
node.exe --import tsx --test \
  --test-reporter=spec \
  tests/pp04-testnet-source.test.ts
```

**Observed result:** 28 passed, 0 failed.

A no-emit TypeScript compilation also passed:

```bash
node.exe node_modules/typescript/bin/tsc \
  --noEmit \
  --incremental false \
  --composite false
```

## 10. Existing Regression Acceptance

All six previously accepted C-07 test suites were rerun individually.

| Suite | Passed | Failed |
|---|---:|---:|
| `pp03-facilitator-receipt.test.ts` | 41 | 0 |
| `pp03-settlement-finality.test.ts` | 47 | 0 |
| `pp03-agent-authority.test.ts` | 54 | 0 |
| `pp03-registry-snapshot.test.ts` | 21 | 0 |
| `pp03-evidence-composition.test.ts` | 29 | 0 |
| `pp04-integration.test.ts` | 10 | 0 |
| **Existing regression subtotal** | **202** | **0** |
| **New C-08B tests** | **28** | **0** |
| **Combined acceptance coverage** | **230** | **0** |

Each regression command completed with a zero test exit code and passing repository-integrity checks.

The existing PP-04 application continued to reject unsupported source execution.

## 11. Trust and Governance Status

C-08B does not change the project's trust-governance position.

- `TRUST-01`: OPEN.
- Module C: UNAPPROVED.
- Historical C5/C6 assurances: NOT ESTABLISHED.
- Provenance: NOT APPROVAL READY.

A positive synthetic verifier result does not prove that operational policy anchors or module approvals have been independently established.

The existing agent-authority limitations remain:

- No independently verified human identity.
- No verified action-specific signing authority.
- No independently verified historical upgrade authority.
- No independent verification of Concordium consensus.

These restrictions must remain visible in subsequent milestones.

## 12. Explicit Non-Achievements

C-08B has not demonstrated:

- An authenticated live CRP connection.
- Operational Testnet evidence acquisition.
- An independently approved live Facilitator trust policy.
- Live Concordium node finality observation.
- Live Agent Registry or CIS-8 key authority verification.
- A wallet-initiated payment.
- An actual on-chain PLT transfer.
- Resource release following payment.
- End-to-end live x402 payment execution.
- Full real-world Evidence Manifest verification.

Those claims cannot be inferred from the 230 passing offline tests.

## 13. Deferred Work

### C-08C — Separately Authorized Live Connectivity

Potential future activities include authenticated, strictly read-only acquisition from approved CRP and Concordium sources, independently pinned expected payment context, source identity verification, controlled failure handling, and approved trust-policy provenance.

C-08C must not be considered authorized by this document.

### C-08D — Separately Authorized Payment Execution

Actual payment execution, wallet interaction, transaction submission, CRP mutation, settlement fulfillment, and payment-gated resource release are outside C-08B.

C-08D must not be considered authorized by this document.

## 14. C-08B Acceptance Decision

### Demonstrated

- Exact five-file implementation scope maintained.
- Existing tracked source files unchanged.
- Operational acquisition unconditionally denied.
- Offline CRP candidate mapping implemented.
- Existing verification and composition engines reused.
- Frozen PP-01 schemas preserved.
- TypeScript compilation passed.
- New C-08B tests: 28/28 passed.
- Existing regression tests: 202/202 passed.
- Total: 230/230 passed.
- No live connectivity or payment execution performed.

### Pending

Final review of this documentation file and its integration into the exact five-file C-08B working-tree scope.

**Recommended milestone disposition:** Accept C-08B as an offline-only implementation after final documentation and integrity review.

**Explicit exclusion:** Acceptance of C-08B does not authorize C-08C or C-08D.

---

**End of C-08B Implementation and Acceptance Record**
