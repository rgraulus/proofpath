
# ProofPath PP-04-D — Historical Full-Assurance Integration
## Gate D0: Historical Assurance Feasibility Decision

**Milestone:** PP-04-D — Historical Full-Assurance Integration  
**Gate:** D0 — Historical Trust and Provenance Feasibility  
**Status:** DISCOVERY COMPLETE — CONDITIONAL GO FOR EVIDENCE RESOLUTION ONLY  
**Predecessor:** PP-04-C Historical Observation Acceptance  
**Environment:** Concordium Testnet  
**Evidence basis:** PP-04-C Blocks 239–253B; PP-04-D Blocks 254–255  
**Payment execution:** Excluded  
**C-08D implementation:** Excluded

---

## 1. Executive Decision

The PP-04-D Gate D0 discovery exercise is complete.

The existing ProofPath verification and evidence-composition architecture provides the relevant technical capabilities for evaluating Facilitator receipts, Concordium settlement observations, and transaction evidence composition.

However, the historical observation accepted under PP-04-C does not yet possess the independently established trust-policy authority and payment provenance required to support full historical assurance.

The discovery identified a plausible source of independent payment-contract information in the Gateway repository, but it did not identify independently approved historical signing-key or settlement-policy records.

Accordingly, Gate D0 adopts the following decision:

**CONDITIONAL GO:** Perform one narrowly bounded effort to substantiate existing independent historical trust and provenance records.

**NO-GO:** Claim full M3.2, M3.3, or M3.5 historical assurance using currently identified evidence alone.

**NO-GO:** Implement payment-execution functionality, fabricate retrospective authorization, or weaken verification requirements to obtain positive results.

This decision does not invalidate the historical payment observations accepted under PP-04-C.

---

## 2. Frozen Baselines

### ProofPath

Repository: `proofpath`

Branch: `main`

Baseline commit:

`4d2af852922ec08cc98db8bcc1d767566f61f6d6`

Published predecessor document:

`docs/pp04-c08c-historical-observation-final-acceptance.md`

### Facilitator

Repository: `xcf-concordium-facilitator`

Baseline commit:

`530b53c88eb7715beac3cb0afb1c8c277f5535b9`

### Other repositories inspected

- `payfi-gateway-demo`
- `xcf-orchestrator`

Gateway and Orchestrator HEAD revisions were not independently frozen by Blocks 254–255. Their discovered paths are candidate leads, not immutable historical evidence.

No source-code modifications, payments, database writes, or new network observations were performed during Gate D0 discovery.

---

## 3. Predecessor Evidence — PP-04-C

PP-04-C established the following bounded historical observations:

1. A previously recorded Concordium Testnet payment candidate was selected through a deterministic local evidence-correlation process.
2. The stored Facilitator receipt contained a three-segment JWS.
3. A public JWKS key obtained from the locally running Facilitator successfully verified the selected historical JWS signature.
4. The decoded signed payload matched the locally stored receipt payload.
5. A separate, read-only Concordium Testnet trusted-node observation corroborated a finalized, successful PLT transfer matching the selected local event and claim records.
6. The M3.5 evidence composer correctly rejected an attempt to compose a manifest without trusted transaction context.

The historical candidate is identified in the predecessor acceptance document by its non-authoritative selection fingerprint:

`aa1de1af6725bd3f5585c7579aca01ff`

The fingerprint is a local selection aid, not a cryptographic commitment or independent trust anchor.

These observations do not independently establish historical signing-key authorization, authorized settlement-policy configuration, transaction-specific payment expectations, or full Evidence Manifest assurance.

The historical receipt was expired at the time of the PP-04-C evaluation. The temporal limitations of M3.2 remain applicable.

---

## 4. D0-A — Historical Facilitator Signing-Key Authority

**Disposition:** NO-GO — HISTORICAL AUTHORITY NOT ESTABLISHED

### Observed evidence

The Facilitator provides an Ed25519/EdDSA signing implementation and a public JWKS endpoint.

PP-04-C demonstrated that the selected historical JWS signature was cryptographically compatible with the public signing key obtained from the running Facilitator.

Block 254 identified ProofPath verification-policy references, while the Facilitator inventory did not identify matching historical signing-authorization references under the applied content-search patterns.

Block 255 identified:

`xcf-concordium-facilitator/src/routes/jwks.ts`

This is an implementation artifact, not an independently approved historical signing-key authorization record.

### Outstanding authority requirement

Establish evidence that the relevant public signing key was authorized for the applicable Facilitator and receipt-verification policy when the historical receipt was issued.

Acceptable evidence must have credible origin, historical applicability, and an independently supportable authorization basis.

Potential candidates include contemporaneous approved key inventories, dated governance records, independently retained deployment attestations, or equivalent trustworthy records.

No such record was established during D0 discovery.

### Explicit limitations

A current JWKS response does not prove historical authorization.

Matching the historical receipt's `kid` or cryptographic public key does not independently prove policy approval.

A newly constructed historical policy cannot be treated as contemporaneously approved merely because it matches the observed receipt.

An expired receipt cannot be made currently valid by backdating a verification clock.

### Exit criterion

A historically applicable signing-key authority record and independently authorized receipt-verification policy must be established before claiming policy-supported historical M3.2 assurance.

Any formal M3.2 result must preserve the verifier's actual temporal and policy semantics.

---

## 5. D0-B — Independent Payment and Transaction Provenance

**Disposition:** CONDITIONAL GO — CANDIDATE SOURCE IDENTIFIED

### Observed evidence

Block 254 identified Facilitator challenge, payment-match, and event-claim handling.

Block 255 identified the following Gateway artifact:

`payfi-gateway-demo/config/contracts.json`

Related Gateway challenge-binding implementations were also identified.

The Facilitator payment flow accepts Gateway-originated contract metadata and associates settlement observations with locally stored challenge, payment, and event-claim records.

These mechanisms provide a plausible payment-provenance trail.

### Critical distinction

Internal agreement among a Facilitator receipt, Facilitator database records, and a blockchain observation is not equivalent to independently established payment expectations.

The expected payment must originate from an appropriately trusted source external to the evidence being verified.

### Outstanding provenance requirement

Establish the historical payment's independently retained expected:

- Merchant and frozen contract identity.
- Resource method and path.
- Network and applicable chain identity.
- PLT asset identity and decimals.
- Payment amount and recipient.
- Transaction-specific binding or independently anchored transaction reference.
- Origin, integrity, and historical applicability of the source records.

The current Gateway `contracts.json` is only a candidate source until its applicable historical revision and authority can be established.

The Facilitator receipt and its correlated internal event records may support consistency checks, but must not serve as their own independent authorization.

### Exit criterion

A trustworthy historical Gateway-side or equivalent external provenance record must be identified and linked to the selected historical transaction without circular reliance on the receipt being assessed.

---

## 6. D0-C — Concordium Settlement-Policy Authority

**Disposition:** NO-GO — APPROVED SETTLEMENT POLICY NOT ESTABLISHED

### Observed evidence

ProofPath implements a settlement-finality verification contract that requires a trusted policy, expected chain identity, trusted node endpoint, and an independently anchored policy digest.

PP-04-C performed a successful read-only Concordium Testnet observation through the existing settlement transport adapter.

That observation corroborated transaction and block finalization, successful execution, and a unique matching PLT transfer under the supplied expectations.

Blocks 254–255 did not identify an independently approved settlement-policy artifact in the scanned tracked repositories.

### Outstanding authority requirement

Establish an independently authorized historical settlement policy covering:

1. Full Concordium Testnet genesis hash.
2. Intended network and chain identity.
3. Explicitly approved trusted-node endpoint.
4. Applicable observation-freshness and clock-skew requirements.
5. Required block-finalization behavior.
6. Policy identity, version, approval provenance, and applicable timeframe.
7. Independently anchored policy digest.

The policy and its digest must be trusted independently of the untrusted observation and verifier invocation.

### Explicit limitations

A valid genesis hash is not sufficient evidence of policy approval.

An accessible Concordium Testnet endpoint is not automatically an approved trusted endpoint.

Computing `digestSettlementPolicy()` does not establish independent authorization.

A trusted-node verification result must not be described as independent Concordium consensus verification.

### Exit criterion

An independently supportable settlement trust configuration must be established before invoking M3.3 with the expectation of a policy-approved result.

---

## 7. M3.2, M3.3, and M3.5 Integration Readiness

| Component | Existing capability | Gate D0 readiness |
|---|---|---|
| M3.2 Facilitator receipt verification | Implemented | Blocked on historical authority and temporal requirements |
| M3.3 Concordium settlement verification | Implemented | Blocked on approved settlement policy and independent expected payment |
| M3.5 Evidence Manifest composition | Implemented | Blocked on sufficient trusted transaction and assessment context |

Technical implementation availability does not establish operational or governance approval.

No formal positive historical M3.2 or M3.3 assurance is claimed by this decision.

No genuine historical M3.5 Evidence Manifest has been produced.

A future manifest may contain indeterminate or unevaluated claims where the evidence model permits them, but unsupported claims must never be promoted to verified.

---

## 8. Controlled Evidence-Resolution Gate

The next permitted PP-04-D activity is limited to determining whether existing records can substantiate the three outstanding authority requirements.

### Authorized investigation scope

- Examine specific candidate historical trust and provenance artifacts.
- Identify their source, revision, historical applicability, and independence.
- Distinguish source-code configuration from approved trust records.
- Document objective evidence sufficiency and remaining blockers.
- Reuse existing ProofPath verification contracts only after their required trusted inputs are legitimately established.

### Not authorized by this decision

- New Concordium payment execution.
- C-08D implementation.
- Wallet signing or payment fulfillment.
- Production release.
- Database mutation.
- Private-key disclosure.
- Retrospective fabrication of signing or settlement-policy approval.
- Replacement of genuine historical context with unrelated synthetic fixtures.
- Weakening M3.2, M3.3, or M3.5 acceptance requirements.
- Unbounded exploratory implementation.
- Automatic authorization for new sensitive evidence acquisition.

Any new network acquisition, credential access, source mutation, or publication action requires separate assessment and authorization.

---

## 9. Finite Decision Model

The controlled evidence-resolution gate has three possible outcomes.

### GO — Full-assurance integration feasible

All required independent trust and transaction-provenance inputs are adequately substantiated.

Proceed to a separately scoped execution of existing M3.2/M3.3 verification and M3.5 composition, respecting temporal and claim-specific limits.

### CONDITIONAL GO — Partial assurance feasible

Some, but not all, independent trust requirements can be substantiated.

Proceed only with the assessments supported by actual evidence. Preserve unresolved components and claims as blocked, rejected, indeterminate, or unevaluated according to their contracts.

No fully verified historical transaction claim is permitted.

### NO-GO — Historical authority unavailable

The required historical approvals or independent provenance cannot be substantiated.

Stop historical full-assurance integration. Document the precise blockers and preserve the PP-04-C observation acceptance.

Do not create additional implementation work solely to manufacture a positive result.

A distinct future assurance demonstration may be considered separately, but it is not authorized by this gate.

---

## 10. Decision Register

| Workstream | Gate D0 decision | Required evidence |
|---|---|---|
| D0-A — Signing-key authority | NO-GO | Historical key authorization and trusted receipt policy |
| D0-B — Payment provenance | CONDITIONAL GO | Historically applicable independent contract and transaction binding |
| D0-C — Settlement-policy authority | NO-GO | Approved genesis, endpoint, policy and independently anchored digest |

**Overall Gate D0 disposition: CONDITIONAL GO FOR BOUNDED EVIDENCE RESOLUTION ONLY.**

**Full historical assurance: NO-GO.**

**New payment execution: NOT AUTHORIZED.**

**C-08D: OUT OF SCOPE.**

---

## 11. Relationship to PP-04-C

This decision does not reopen or weaken PP-04-C.

PP-04-C remains formally closed within its accepted historical-observation and fail-closed evidence-composition scope.

Its published acceptance record remains the authoritative description of what was demonstrated and what was not established.

PP-04-D exists to address the outstanding assurance gaps through independently supportable evidence, not by changing the historical facts or lowering verification standards.

---

## 12. Final Handoff

Gate D0 repository discovery is complete under the evidence reviewed in Blocks 254–255.

The next decision depends on whether genuine historical trust and independent payment-provenance records can be substantiated.

Until that condition is satisfied, ProofPath must not claim:

- Full historical M3.2 verified receipt assurance.
- Full historical M3.3 verified settlement assurance.
- A genuine composed historical Evidence Manifest.
- Verified end-to-end historical transaction assurance.

The PP-04-D objective remains active, but further integration work is gated by evidence sufficiency.

**Final position: Preserve the PP-04-C achievements, pursue the finite historical evidence-resolution opportunity, and fail closed wherever historical authority cannot be established.**
