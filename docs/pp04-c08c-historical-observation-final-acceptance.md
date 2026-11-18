
# ProofPath PP-04-C / C-08C
# Historical Observation — Final Acceptance Handoff

**Status:** Historical observation accepted within a restricted assurance boundary  
**Disposition:** GO — historical observation closeout; NO-GO — full policy-approved transaction assurance  
**Target environment:** Concordium Testnet  
**Integration profile:** XCF CRP / PLT / x402  
**Candidate fingerprint:** `aa1de1af6725bd3f5585c7579aca01ff`  
**Baseline repository:** `proofpath`  
**Baseline commit:** `6eb175f30e60b7b5f7794e3577b8191188093334`  
**Facilitator baseline:** `530b53c88eb7715beac3cb0afb1c8c277f5535b9`  
**Acceptance evidence:** Controlled execution outputs, Blocks 239–247  
**Document date:** 2026-11-18

---

## 1. Executive Summary

ProofPath PP-04-C completed a controlled historical-evidence observation exercise using an existing Concordium Testnet payment associated with the XCF CRP integration.

The exercise established that:

1. Existing historical payment records could be located and correlated with local PLT event and claim records.
2. A selected modern Facilitator receipt contained a structurally valid EdDSA JWS.
3. The historical JWS signature verified against the public Ed25519 signing key exposed by the currently running Facilitator.
4. The JWS-signed payload matched the JSON payload stored with the receipt.
5. A separate Concordium Testnet node observation reported a finalized, successfully executed transaction containing the expected PLT transfer.
6. ProofPath's existing M3.5 evidence composer rejected missing trusted transaction context without creating an unsupported Evidence Manifest.

These results demonstrate historical evidence compatibility, positive cryptographic and settlement observations, and fail-closed evidence-composition behavior.

They do **not** establish complete ProofPath M3.2 or M3.3 policy-approved assurance, independent consensus verification, seller or agent authority, delivery authentication, or a complete historical Evidence Manifest.

The historical observation exercise is accepted within this explicitly restricted boundary.

No new payment execution or C-08D implementation was required.

---

## 2. Scope and Constraints

### 2.1 In scope

- Read-only inspection of existing historical payment records.
- Correlation of payment challenges, receipts, PLT events and event claims.
- Deterministic selection of one historical payment candidate.
- JWS structural inspection and Ed25519 signature compatibility verification.
- Comparison of the JWS-signed payload with the stored receipt payload.
- One controlled Concordium Testnet settlement observation.
- Read-only verification of transaction finality, execution outcome and PLT transfer correspondence.
- Offline testing of the existing M3.5 composition safety boundary.
- Documentation of results, limitations and acceptance disposition.

### 2.2 Explicitly out of scope

- C-08D implementation.
- New Testnet payment execution.
- Wallet signing or transfer submission.
- Facilitator payment creation or fulfillment.
- Resource release.
- New payment or settlement infrastructure.
- Changes to existing ProofPath verification algorithms.
- Production deployment or production release authorization.
- Historical identity, agent authority, seller authorization or delivery authentication.
- Independent verification of Concordium consensus.
- Creation of unsupported trusted policies, provenance records or Evidence Manifest fields.

### 2.3 Operating safeguards

The historical observation workflow retained the following controls:

- Frozen Git baselines and clean-repository guards.
- Read-only PostgreSQL transactions.
- Bounded, specifically authorized network acquisitions.
- No raw JWS or receipt payload printed in acceptance outputs.
- No transaction identifiers printed in acceptance outputs.
- No private signing-key access.
- No payment execution.
- No repository-file modifications during verification commands.
- Separate authorization required for Git publication operations.

---

## 3. Historical Candidate Selection

### 3.1 Local historical inventory

The initial search inspected the latest 100 relevant `demo-merchant` EUDemo payment challenges.

The inventory identified:

| Metric | Observed count |
|---|---:|
| Challenges inspected | 100 |
| Fulfilled challenges | 85 |
| Modern receipt payloads | 85 |
| Modern transaction references | 85 |
| Exact event-claim-linked candidates | 26 |
| Candidates without complete event-claim linkage | 59 |
| Ambiguous event-claim links | 0 |

These are local database correlation results.

They do not independently authenticate the records' producer or establish blockchain settlement.

### 3.2 Candidate qualification

One candidate was selected deterministically using the historical challenge ordering and the established qualification criteria.

**Selected fingerprint:**

`aa1de1af6725bd3f5585c7579aca01ff`

The candidate passed checks for:

- Frozen payment contract.
- Merchant and nonce correspondence.
- Asset, decimal, amount and recipient correspondence.
- Resource method and path presence.
- Modern `ccd-plt-proof@v1` receipt structure.
- Three-segment JWS structure.
- Transaction reference correspondence with locally indexed PLT records.
- Exact local event-to-challenge claim linkage.
- Settlement timestamp presence and consistency.

The fingerprint is a local selection aid, not a cryptographic evidence commitment or independently authenticated transaction identity.

### 3.3 Receipt temporal state

Block 242 established:

- The recorded settlement time was not in the future.
- The recorded settlement time preceded receipt expiry.
- The stored settlement assertion indicated finalization.
- The receipt had expired at the time of inspection.

**Acceptance consequence:** The selected receipt cannot be represented as currently valid merely because its historical signature verifies.

A retrospective assessment and current receipt validity are separate claims.

---

## 4. Cryptographic Receipt Observation

### 4.1 Signing-key architecture

The Facilitator exposes public JWKS endpoints and signs receipt JWS records using Ed25519 / EdDSA.

ProofPath M3.2 requires an independently authorized signing-key policy and independently anchored policy digest.

The Facilitator's currently published JWKS is not, by itself, evidence that its signing key was approved for the historical issuance period.

### 4.2 Controlled compatibility result

After local Facilitator readiness was established, Block 244D performed one authorized JWKS acquisition and local Ed25519 verification.

| Check | Result |
|---|---|
| Candidate identity locked | PASS |
| JWS structure | PASS |
| JWS algorithm | EdDSA |
| JWKS HTTP status | 200 |
| Matching signing keys | 1 |
| Ed25519 signature compatibility | PASS |
| Private signing-key access | None |

**Supported claim:** The selected historical JWS signature verifies against the Facilitator's currently published public signing key.

**Unsupported claim:** The key was independently authorized for the historical receipt issuance.

### 4.3 Signed-payload integrity

Block 245 confirmed:

- The JWS-signed payload was equal to the stored JSON payload.
- The signed JWS key identifier matched the separately stored key identifier.
- Candidate identity remained unchanged.

This establishes internal consistency between the cryptographically checked JWS and the stored receipt record.

It does not independently authenticate the stored payment contract, historical policy authority or settlement.

### 4.4 M3.2 disposition

**Formal M3.2 assurance: NOT ESTABLISHED.**

Outstanding prerequisites include independently approved historical signing-key authority, trusted policy-digest provenance, and the independently established expected payment binding required by the M3.2 contract.

The receipt's expired temporal state must also be preserved.

No M3.2 `verified` result is claimed for this historical payment.

---

## 5. Concordium Testnet Settlement Observation

### 5.1 Observation mechanism

Block 246 used the existing ProofPath Concordium settlement transport:

`src/adapters/concordium/settlementFinality.ts`

The transport performed a bounded, read-only observation against the Concordium Testnet gRPC endpoint:

`https://grpc.testnet.concordium.com:20000/`

The expected transaction reference and transfer fields were obtained from locally correlated event and claim records.

Those records were not independently approved as authoritative application state for the formal M3.3 verification contract.

The transport configuration was used for observation only; it was not an independently approved settlement policy.

### 5.2 Observed results

| Test | Result |
|---|---|
| Testnet genesis prefix correspondence | TRUE |
| Transaction-hash correspondence | TRUE |
| Transaction finalized | TRUE |
| Finalized block confirmed | TRUE |
| Transaction execution succeeded | TRUE |
| Execution event evidence complete | TRUE |
| Expected PLT transfer matched | TRUE |
| Matching transfers | 1 |
| Node observation completed | TRUE |

The selected historical transaction was independently queried from a Concordium Testnet node, rather than accepted solely from the Facilitator's stored finalization assertion.

The node reported a finalized, successful transaction containing one matching EUDemo PLT transfer.

### 5.3 Settlement assurance limitations

The following were explicitly not established:

- Independently approved trusted settlement policy.
- Independently anchored full genesis hash.
- Independently approved settlement policy digest.
- Independently established transaction-specific expected payment context.
- Independent verification of blockchain consensus.

The existing `verifySettlementFinality()` function was not invoked during Block 246.

Therefore, the observation must not be represented as an M3.3 `verified` result.

The reported finality and transfer correspondence are **trusted-node observations subject to their source and policy assumptions**, not independent consensus proofs.

### 5.4 M3.3 disposition

**Formal M3.3 assurance: NOT ESTABLISHED.**

The successful node observation is accepted as historical settlement corroboration.

Formal settlement-policy verification remains outside the accepted scope.

---

## 6. M3.5 Offline Evidence-Composition Acceptance

### 6.1 Existing implementation

The exercise used the existing ProofPath M3.5 composer:

`src/composition/transactionEvidence.ts`

The composer correlates existing verifier results with trusted transaction context and evidence provenance.

It does not independently verify source authenticity, signatures, consensus, identity, authorization, delivery or policy approval.

### 6.2 Negative acceptance test

Block 247 invoked the existing composer with deliberately missing trusted transaction context and unavailable verifier assessments.

The test verified that M3.5 rejected the invalid context before manifest validation.

| Acceptance criterion | Result |
|---|---|
| Missing trusted context rejected | PASS |
| No Evidence Manifest created | PASS |
| Expected diagnostic returned | PASS |
| No verified claims generated | PASS |
| No unsupported assurance promotion | PASS |
| No network acquisition | PASS |
| No database acquisition | PASS |

The observed composition status was `rejected`, with the expected `invalid_trusted_context` diagnostic.

This is the correct fail-closed behavior for the intentionally invalid input.

### 6.3 M3.5 disposition

**M3.5 missing-context negative acceptance: PASS.**

**Historical Evidence Manifest composition: NOT PERFORMED.**

The negative test does not demonstrate a complete or incomplete-but-valid historical manifest. It demonstrates rejection of a deliberately invalid composition input.

A genuine historical composition would require independently supplied, coherent transaction and participant context, actual assessment results with appropriate provenance, and evidence artifacts consistent with the ProofPath manifest contract.

Missing values must not be filled using unrelated synthetic fixtures or fabricated approvals.

---

## 7. Consolidated Acceptance Matrix

| Capability or assurance claim | Disposition |
|---|---|
| Historical payment discovery | PASS |
| Local event/claim correlation | PASS |
| Deterministic candidate selection | PASS |
| Frozen-contract structural checks | PASS |
| Ed25519 signature compatibility | PASS |
| Signed/stored payload consistency | PASS |
| Testnet transaction finalization observation | PASS |
| Testnet successful execution observation | PASS |
| Expected EUDemo PLT transfer observation | PASS |
| M3.5 missing-context rejection | PASS |
| Historical signing-key authorization | NOT ESTABLISHED |
| M3.2 policy-approved receipt verification | NOT ESTABLISHED |
| M3.3 policy-approved settlement verification | NOT ESTABLISHED |
| Independent consensus verification | NOT ESTABLISHED |
| Agent authority verification | NOT EVALUATED |
| Seller authority verification | NOT EVALUATED |
| Delivery authentication | NOT EVALUATED |
| Genuine historical Evidence Manifest composition | NOT PERFORMED |
| C-08D payment execution | EXCLUDED |

A successful observation must not be promoted into a stronger assurance category without satisfying the relevant verification contract.

---

## 8. Relationship to Existing Gate C Acceptance

The earlier C-08C Gate C acceptance remains unchanged.

Reference:

`docs/pp04-c08c-gate-c-final-acceptance-handoff.md`

This historical-observation handoff supplements that acceptance record.

It does not modify:

- Previously frozen Gate C authorization boundaries.
- Earlier source-authentication conclusions.
- Earlier receipt-authentication conclusions.
- Earlier independent-settlement conclusions.
- Production release gates.
- Existing verifier contracts.

The historical payment investigated here is a separately selected candidate and must not be conflated with the earlier Gate C candidate.

The additional observations are recorded only at the assurance level demonstrated by Blocks 239–247.

---

## 9. Evidence Handling and Reproducibility

### 9.1 Execution evidence

The supporting execution records are the controlled terminal outputs for Blocks 239–247.

The milestone-level evidence includes:

- Candidate inventory and exact claim linkage.
- Selected candidate structural and temporal preflight.
- Signing-key source inventory.
- Facilitator readiness and JWKS compatibility.
- Signed-payload consistency.
- Concordium Testnet settlement observation.
- Offline M3.5 fail-closed negative acceptance.

### 9.2 Preservation limitations

The terminal outputs establish the reported outcomes but do not, by themselves, constitute an independently authenticated, durable evidence archive.

This exercise did not generate a signed observation package, independently authenticated source-provenance record, or complete historical Evidence Manifest.

The candidate fingerprint supports selection correlation but is not a substitute for retaining and authenticating the underlying evidence.

### 9.3 Reproduction constraints

Any future reproduction involving live endpoints requires separate authorization and must preserve the distinction between:

- Read-only historical acquisition.
- Cryptographic signature compatibility.
- Independently approved policy authority.
- Trusted-node settlement observation.
- Independent consensus verification.
- Evidence composition and disclosure.

No existing one-time acquisition authorization is implicitly renewed by this document.

---

## 10. Security and Operational Integrity

The completed historical verification commands did not:

- Submit a new Concordium transaction.
- Create or fulfill a new payment.
- Request wallet signing.
- Initiate a resource release.
- Execute C-08D.
- Mutate PostgreSQL records.
- Change tracked ProofPath or Facilitator source files.
- Stage, commit or push repository changes.

The final handoff document is a documentation-only addition.

This document contains no raw JWS, private signing key, transaction hash, nonce or payment receipt payload.

---

## 11. Open Assurance Requirements

The following requirements remain outside this closeout:

1. Independent historical signing-key authorization and policy provenance.
2. Independently anchored expected payment and transaction binding.
3. Approval of the complete Testnet genesis hash and trusted node endpoint.
4. Independently authorized M3.3 policy digest.
5. Evaluation under the actual M3.2 and M3.3 verification contracts.
6. Independently established composition context, participant relationships and provenance.
7. Actual historical Evidence Manifest construction and schema validation.
8. Agent, seller and delivery assurance where required.
9. Any stronger blockchain-consensus assurance.

These are unresolved trust and integration requirements, not evidence that the observed historical payment failed.

They require separate scoping if full-assurance integration becomes an approved objective.

### 11.1 Planned Roadmap Milestone — PP-04-D

**Milestone:** PP-04-D — Historical Full-Assurance Integration  
**Status:** PLANNED  
**Predecessor:** PP-04-C Historical Observation Acceptance  
**Payment execution:** Explicitly excluded  
**C-08D implementation:** Explicitly excluded

#### Objective

Close the outstanding historical trust-policy, transaction-provenance, and evidence-composition gaps using existing Concordium Testnet payment records and existing ProofPath verification modules.

The objective is to establish the strongest defensible assurance supported by independently authorized historical evidence, culminating, where the required trusted context exists, in a genuine Evidence Manifest v1.

#### Workstreams

1. Establish historically applicable Facilitator signing-key authority and independently approved receipt-verification policy.
2. Independently establish transaction-specific payment expectations and source provenance.
3. Establish the approved Concordium Testnet genesis hash, trusted node endpoint, and settlement policy digest.
4. Evaluate the historical payment through the existing M3.2 and M3.3 verification contracts without bypassing receipt-expiry or historical-authority requirements.
5. Assemble actual assessment provenance, evidence artifacts, and independently supported transaction context for M3.5 composition.
6. Validate a genuine historical Evidence Manifest while preserving indeterminate or unevaluated agent, seller, and delivery claims.

#### Entry Gate

Before implementation, perform one bounded feasibility assessment to determine whether the required historical trust and provenance records can be independently substantiated.

No retrospective trust approval may be fabricated. Missing historical evidence must result in an explicitly documented limitation.

#### Acceptance Target

- Independently supported historical trust configuration.
- Defensible M3.2 assessment under applicable temporal constraints.
- Policy-approved M3.3 trusted-node settlement verification.
- Genuine, schema-valid M3.5 historical Evidence Manifest where sufficient context exists.
- No unsupported assurance promotion.
- No new payment execution.
- No C-08D implementation.

A `verified` result must never be manufactured by weakening existing verification contracts.

#### Scope Control

PP-04-D is a bounded assurance-integration milestone, not an open-ended implementation program.

Reuse existing verification and composition modules wherever possible. Additional development must be justified by a demonstrated integration gap and separately authorized.

Failure to establish historical trust authority is a legitimate, documented feasibility outcome, not authorization to bypass security requirements.

#### Relationship to PP-04-C

This planned milestone does not modify the PP-04-C acceptance disposition.

PP-04-C remains accepted for historical observations and M3.5 fail-closed behavior. Its full-assurance NO-GO remains in force until independently verified evidence supports a stronger claim.

---

## 12. Final Acceptance Decision

### Accepted

The PP-04-C historical-observation exercise is accepted as a controlled, read-only demonstration of:

- Existing historical payment evidence discovery.
- Local payment/event correlation.
- Ed25519 signature compatibility.
- Signed-payload integrity.
- Separately sourced trusted-node settlement corroboration.
- Correct M3.5 fail-closed behavior when trusted context is absent.

### Not accepted

This exercise does not establish:

- Current validity of the expired receipt.
- Historical signing-key policy approval.
- A complete M3.2 `verified` receipt result.
- A complete M3.3 `verified` settlement result.
- Independent Concordium consensus verification.
- Verified agent, seller or delivery claims.
- A composed historical Evidence Manifest.
- A fully verified end-to-end ProofPath transaction.

### Final disposition

**GO:** Close the bounded PP-04-C historical-observation and M3.5 negative-acceptance exercise.

**NO-GO:** Represent the historical payment as fully verified under all ProofPath assurance models.

**NO-GO:** Treat this closeout as authorization for C-08D, new payment execution or production release.

The accepted milestone demonstrates positive historical cryptographic and blockchain observations while preserving ProofPath's independent trust-policy requirements and fail-closed assurance boundaries.

---

## 13. Handoff

The historical-observation workstream is complete within the stated scope.

No additional payment-candidate discovery, Testnet transfer, new verifier implementation or further PR ladder is required for this restricted milestone.

Any future full-assurance integration must be separately authorized and grounded in independently approved trust configuration and source provenance.

Git staging, committing, pushing and merging remain subject to explicit authorization.

**End of historical-observation acceptance handoff.**
