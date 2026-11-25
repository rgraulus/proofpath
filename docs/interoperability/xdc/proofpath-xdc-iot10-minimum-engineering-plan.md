
# ProofPath IOT-10 — Minimum Controlled XDC Assurance Engineering Plan

**Record:** IOT-10\
**Status:** ACCEPTED — PLANNING BASELINE ONLY\
**Date:** 2026-11-25\
**Repository:** `rgraulus/proofpath`\
**Baseline:** `main` at `f339b904b6d9d83a795e310bec9bd4c07467eade`\
**Network:** XDC Apothem (`eip155:51`)\
**Assurance profile:** `trusted_node_finalized_xdc_token_transfer_v1`\
**Dependencies:** IOT-07, IOT-08, IOT-09A/G1, IOT-09B/G2, IOT-09C/G3\
**Planning baseline:** ACCEPTED\
**Implementation authorization:** NOT GRANTED\
**Operational trust approval:** NOT ESTABLISHED\
**Live positive payment assurance:** NOT AUTHORIZED

---

## 1. Executive Summary

IOT-10 defines the minimum controlled engineering work required to operationalize the accepted XDC payment-assurance architecture.

IOT-09A, IOT-09B and IOT-09C established three complementary assurance obligations:

- **G1:** Independently approved source trust, collector authorization and acquisition provenance.
- **G2:** Historically applicable token implementation identity and independently approved transfer semantics.
- **G3:** Canonical ancestry and independently authorized trusted-node finality.

These architectures are accepted and published.

Their operational prerequisites are not yet established.

The objective of IOT-10 is to integrate these obligations into a narrowly scoped XDC Apothem assurance path that reuses ProofPath's existing evidence, verification and assessment infrastructure.

The implementation shall preserve IOT-08's simulation-only restrictions until separate operational activation is explicitly authorized.

IOT-10 shall not become a new general-purpose blockchain verification platform.

### 1.1 Engineering Objective

Deliver an internally controlled capability to:

1. Independently validate applicable trust-policy authorization.
2. Acquire and attest evidence from an approved XDC RPC source.
3. Establish the historical token implementation and supported transfer semantics.
4. Validate transaction-block identity, canonical ancestry and trusted finality.
5. Compare observed payment effects against independently authorized expectations.
6. Produce bounded assurance findings and portable, independently reassessable evidence.

### 1.2 Delivery Approach

Use one integrated implementation milestone with four internal readiness gates.

The workstreams may share code and proceed where dependencies permit, but operational assurance must remain gated by the required approvals.

Avoid separate pull requests for every minor helper, type or test.

A single coherent implementation PR is preferred where reviewability permits; any necessary split must have a clear security or review rationale.

### 1.3 Acceptance Boundary

Completion of the engineering milestone shall establish only the capabilities demonstrated by accepted tests and authorized operational evidence.

It shall not automatically enable production payment assurance.

**Architectural principle:** Evidence tells a story. Assurance has boundaries.

---

## 2. Confirmed Repository Baseline

### 2.1 Existing Reusable Foundations

The repository inventory confirms the following components.

| Component | Existing files | Reuse decision |
|---|---|---|
| Canonical encoding | `src/core/canonical.ts` | Reuse, subject to G1 encoding contract |
| Integrity commitments | `src/core/hash.ts` | Reuse |
| Evidence provenance | `src/core/provenance.ts` | Reuse |
| Audit journal | `src/core/audit.ts` | Reuse |
| Portable evidence export | `src/core/export.ts` | Reuse |
| Evidence contracts | `src/core/types.ts` | Preserve |
| PP-02 assessment | `src/pp02/` | Reuse applicable evaluation concepts |
| XDC contracts | `src/verification/xdcTypes.ts` | Limited internal extension if necessary |
| XDC simulated verifier | `src/verification/xdcTokenTransfer.ts` | Preserve |
| Settlement verifier reference | `src/verification/settlementFinality.ts` | Reference design |
| Trusted-node adapter reference | `src/adapters/concordium/settlementFinality.ts` | Reference design |
| Trusted application bootstrap | `src/application/pp04/trustedConfig.ts` | Reference design |
| Controlled acquisition reference | `src/application/pp04/testnetLiveSource.ts` | Reference design |
| Offline evidence composition | `src/composition/transactionEvidence.ts` | Preserve existing scope |

### 2.2 Existing XDC Implementation

IOT-08 currently provides:

- Deterministic transaction and receipt consistency checks.
- Direct token-transfer calldata validation.
- Transfer-event matching.
- Simulated token-semantics checks.
- Simulated finality checks.
- Explicit individual obligation outcomes.
- Fail-closed handling of unapproved live contexts.

Its current `canonicalAncestryReported` input is insufficient for independently supported operational ancestry assurance.

Its existing simulation-only restriction must remain intact.

### 2.3 Existing Test and Build Infrastructure

The baseline provides:

- `npm run typecheck`
- `npm run build`
- `npm run build:sdk`
- `npm test`

The repository inventory identified 18 existing test files, including `tests/iot08-xdc-token-transfer.test.ts`.

No new test framework is required.

### 2.4 Important Reuse Restrictions

The existing canonical JSON implementation is not RFC 8785/JCS.

Its use for G1 acquisition attestation requires explicit acceptance of the exact encoding contract.

The existing PP-03 composition model contains Concordium-specific settlement expectations. It shall not be generalized to XDC without separate compatibility review.

PP-04's controlled source code provides reusable engineering patterns, not an XDC transport implementation or independent trust authorization.

---

## 3. Initial Implementation Scope

### 3.1 Supported Network and Asset

The initial implementation shall target:

- XDC Apothem (`eip155:51`).
- The explicitly approved reference USDC test-token contract.
- The accepted direct `transfer(address,uint256)` profile.
- Exact independently authorized payment terms.
- One independently approved trusted RPC source.
- One approved trusted-node finality model.

The initial profile excludes native XDC coin payments and arbitrary ERC-20/XRC-20 tokens.

### 3.2 Reference Contract

The historical reference token is:

`0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4`

This identifies the investigation target, not an independently approved historical implementation or semantic profile.

### 3.3 No Generalized Proxy Requirement

The G2 implementation shall support the actual historical implementation structure only where sufficiently evidenced and independently approved.

Direct implementation resolution is preferred where applicable.

Supported proxy behavior may be introduced within the accepted G2-D2 scope only when necessary for the reference token.

Unsupported delegation, upgrades or execution contexts must remain indeterminate.

### 3.4 Trusted Finality Model

The initial G3 implementation shall prefer complete parent-hash ancestry evidence between the transaction block and the approved finalized checkpoint.

It shall not independently verify XDPoS consensus.

---

## 4. Proposed Engineering File Boundaries

The following file map is accepted as a provisional planning boundary, not as implementation authorization.

### 4.1 New Internal Source Modules

| File | Responsibility |
|---|---|
| `src/verification/xdcTrustAuthority.ts` | Verify independently authorized policies, source admission, collector identity and G2/G3 policy references |
| `src/adapters/xdc/rpcEvidence.ts` | Bounded read-only RPC acquisition and raw-response preservation |
| `src/verification/xdcAcquisition.ts` | Validate G1 collector attestations, acquisition provenance and source-binding evidence |
| `src/verification/xdcHistoricalSemantics.ts` | Evaluate historically applicable token identity, delegation and approved transfer semantics |
| `src/verification/xdcFinality.ts` | Evaluate transaction-block identity, ancestry, checkpoint interpretation and temporal consistency |
| `src/verification/xdcAssurance.ts` | Integrate independently authorized expectations and separate G1/G2/G3 findings |

These six modules constitute the preferred initial source-file boundary.

They are logical responsibilities, not separate runtime services.

The policy verifier and acquisition validator must preserve a strict separation between independent authorization and evidence supplied by the party being assessed.

### 4.2 Files Eligible for Narrowly Justified Modification

| Existing file | Permitted modification |
|---|---|
| `src/verification/xdcTypes.ts` | Add internal G1/G2/G3 evidence and policy contracts where necessary |
| `src/core/export.ts` | Only if current export functionality cannot represent required evidence without loss |
| `src/core/provenance.ts` | Only if an additional evidence-provenance requirement cannot be handled through existing contracts |
| Existing evidence adapters | Internal mapping only where required for PP-01 compatibility |

Any modification to an existing file requires a clear necessity.

The preferred approach is to add internal adapters rather than change frozen public contracts.

### 4.3 Files Protected from Modification Initially

The following shall remain unchanged unless a separate review identifies a concrete blocker:

- `src/verification/xdcTokenTransfer.ts`
- `src/index.ts`
- `src/sdk/core.ts`
- `src/sdk/assessment.ts`
- `src/sdk/concordium.ts`
- `src/sdk/x402.ts`
- `src/composition/transactionEvidence.ts`
- `src/composition/types.ts`
- Existing Concordium adapters.
- Existing PP-02 evaluators.
- Existing frozen PP-01 schemas.

The IOT-08 simulation verifier must not be repurposed as an implicitly authorized live verifier.

### 4.4 Proposed New Test Files

| Test file | Primary coverage |
|---|---|
| `tests/iot10-xdc-trust-acquisition.test.ts` | Independent policy authority, source admission, attestation and acquisition |
| `tests/iot10-xdc-historical-semantics.test.ts` | G2 historical identity, applicability and semantic approval |
| `tests/iot10-xdc-finality.test.ts` | G3 ancestry, checkpoint semantics and temporal consistency |
| `tests/iot10-xdc-assurance.test.ts` | Combined assurance, independently authorized expectations and portable evidence |

The exact distribution of tests may change to preserve reviewability without increasing the authorized scope.

### 4.5 Test Fixtures and Supporting Documentation

If test fixtures require separate files, they shall be sanitized, deterministic and clearly identified as non-authoritative simulation evidence.

Operational secrets, protected collector keys and unredacted sensitive acquisition data must not be committed.

Any additional file requires an explicit scope justification before implementation.

---

## 5. Workstream A — G1 Independent Trust and Acquisition

### 5.1 Objective

Establish independently authorized provenance for XDC evidence.

### 5.2 Required Functionality

The implementation shall support:

- Versioned and independently authorized source admission.
- Authorized collector identities and public verification keys.
- Policy validity, effective-period and revocation assessment.
- Approved HTTPS/TLS source binding.
- Restricted read-only JSON-RPC methods.
- Bounded requests, responses, timeouts and evidence size.
- Preservation of raw acquisition evidence.
- Domain-separated Ed25519 acquisition attestation.
- Deterministic attestation verification.
- Explicit acquisition-time and policy references.

The accepted G1 acquisition domain is:

`proofpath:xdc-rpc-acquisition:v1`

No caller-supplied policy, digest, endpoint or signature may authorize itself.

### 5.3 Trust-Authority Deployment Boundary

The independent administrator, policy records, approval process and collector-key authorization are operational dependencies.

A verifier library can validate their evidence but must not silently create their independent authority.

Node.js cryptographic primitives may be considered for implementation without introducing a new cryptographic dependency, subject to the accepted signing and encoding specifications.

### 5.4 Stop Conditions

Stop progression toward operational assurance if:

- The source identity cannot be authenticated sufficiently.
- Independent source admission is absent.
- Collector authorization is missing.
- Collector key protection or revocation cannot be established.
- The acquisition-attestation contract is ambiguous.
- The required historical RPC capability is unavailable.
- Raw evidence cannot be preserved and bound reliably.

---

## 6. Workstream B — G2 Historical Token Semantics

### 6.1 Objective

Establish the historically effective token implementation and independently approved supported transfer behavior.

### 6.2 Required Functionality

The G2 assessor shall:

- Identify the historical token contract.
- Establish effective runtime code at the applicable transaction-execution point.
- Resolve supported delegation or proxy behavior where applicable.
- Bind the historical implementation to approved semantic policy.
- Confirm that the relevant transfer behavior fits the approved conventional profile.
- Identify unsupported fee, rebasing, reflection, hook or upgrade semantics.
- Preserve historical evidence and assessment provenance.

A contract address, current code hash, token metadata or Transfer event alone is insufficient.

### 6.3 Evidence Sufficiency

If the evidence cannot establish the applicable implementation at the transaction-execution point, the finding shall remain indeterminate.

No inference from later code or block-end state is permitted where a relevant intra-block change may invalidate that inference.

### 6.4 Stop Conditions

Stop progression toward positive eligibility if:

- Historical effective implementation identity is unresolved.
- Required historical state is unavailable.
- Relevant proxy behavior is unsupported.
- Independent semantic approval is absent.
- Material transfer behavior falls outside the approved profile.
- The evidence cannot support the claimed historical execution applicability.

---

## 7. Workstream C — G3 Canonical Ancestry and Trusted Finality

### 7.1 Objective

Establish the accepted trusted-node finality relationship between the transaction block and an independently authorized finalized checkpoint.

### 7.2 Required Functionality

The G3 assessor shall:

- Bind transaction and receipt to the exact historical block.
- Establish the block's relevant canonical identity under the approved trusted-source model.
- Validate complete parent-hash ancestry evidence or an approved equivalent.
- Bind the ancestry path to the reported finalized checkpoint.
- Verify the checkpoint's applicable node-reported finality interpretation against approved policy.
- Evaluate node/version compatibility.
- Enforce applicable timing and observation-age constraints.
- Detect contradictory checkpoint and ancestry observations.
- Preserve historical evidence for offline reassessment.

### 7.3 Preferred Ancestry Method

The initial implementation shall support complete deterministic parent-hash continuity between the transaction block and finalized checkpoint.

Acquisition must be bounded by approved maximum path length, response size and time/resource limits.

A valid chain of supplied headers does not independently establish checkpoint finality.

### 7.4 Finality Authority

The relevant node implementation, version context and `finalized` semantics require independent approval.

The implementation shall not treat RPC syntax support as sufficient evidence of consensus finality.

### 7.5 Stop Conditions

Stop progression toward positive eligibility if:

- Ancestry evidence is incomplete or contradictory.
- The finality checkpoint cannot be bound to an exact identity.
- The node's finality-reporting semantics are unresolved.
- Node implementation/version compatibility is unapproved.
- Historical synchronization or timing requirements are unresolved.
- Sufficient trusted evidence establishes incompatible finalized histories.

An unresolved condition shall be indeterminate unless sufficiently trusted evidence establishes a definitive violation.

---

## 8. Workstream D — Combined Assurance and Portable Evidence

### 8.1 Objective

Integrate G1, G2, G3 and independently authorized payment expectations into one bounded assessment.

### 8.2 Independent Expectations

The assessment shall require independently authorized:

- Network identity.
- Token contract.
- Recipient.
- Atomic amount.
- Relevant payer identity or transaction reference where required.
- Applicable payment and trust-policy identities.

The observed transaction shall not define its own authoritative expectations.

### 8.3 Combined Decision Model

The assessment shall preserve separate findings for:

- Network.
- Policy.
- Source trust.
- Transaction execution.
- Exact transfer.
- Token semantics.
- Finality.

The implementation must not promote unresolved obligations into positive verification.

A definitive failure requires sufficiently trusted evidence of a relevant contradiction.

Missing trust or evidence remains indeterminate.

### 8.4 Portable Evidence

Reuse PP-01 evidence artifacts, integrity commitments and provenance structures.

The package shall retain:

- Raw acquisition references.
- Collector attestations.
- Policy identity and authorization references.
- Historical implementation evidence.
- Approved token semantics.
- Finality checkpoint and ancestry evidence.
- Independent payment-expectation references.
- Individual obligation assessments.
- Reason codes and limitations.

### 8.5 Offline Reassessment

Support:

**Historical reproduction:** Reproduce the original result under the original applicable policy and evidence context.

**Current-policy reassessment:** Perform a separately identified assessment under an independently authorized later policy.

Neither mode may silently rewrite the original observations or claim fresh network state.

### 8.6 Live Assurance Activation

The integrated capability shall remain fail-closed for live positive assurance until separately approved operational trust and activation conditions are satisfied.

IOT-10 engineering acceptance alone shall not authorize production activation.

---

## 9. Controlled Engineering Sequence

The implementation shall use four internal readiness gates.

### R1 — Operational Trust Prerequisites

**Purpose:** Establish that the selected reference profile is operationally supportable.

Required evidence:

- Candidate RPC source identity and operational assessment.
- Relevant node implementation and supported `finalized` behavior.
- Approved independent trust-policy administration model.
- Collector authorization and signing-key boundary.
- Feasibility of obtaining the necessary historical token evidence.
- Feasibility of obtaining the necessary historical ancestry evidence.
- Independently established expected-payment terms.

**Exit condition:** Each dependency is satisfied with supporting evidence, or an explicitly approved narrower implementation-only path preserves unresolved operational trust as indeterminate.

**Stop condition:** A fundamental unsupported requirement invalidates the selected trust model or historical reference profile.

### R2 — Controlled Evidence Acquisition and Assessment

**Purpose:** Implement and test the minimum G1/G2/G3 evidence responsibilities.

Required work:

- Policy authorization and source/collector controls.
- Restricted acquisition and attestation.
- Historical token-implementation assessment.
- Canonical ancestry and finality assessment.
- Negative tests for unsupported or missing evidence.

**Exit condition:** Controlled fixtures and authorized acquisition evidence can be assessed reproducibly without unsupported positive claims.

**Stop condition:** Evidence must be fabricated, self-authorized or interpreted beyond the accepted profile to obtain success.

### R3 — Integrated Assurance

**Purpose:** Combine the individually supported obligations with independent payment expectations.

Required work:

- Independent expected-payment authorization.
- Transaction and transfer evaluation.
- G1/G2/G3 obligation integration.
- Explicit `satisfied`, `failed` and `indeterminate` results.
- Fail-closed behavior for every unresolved mandatory gate.

**Exit condition:** Deterministic positive-eligibility and negative scenarios pass without weakening the existing simulation boundary.

**Stop condition:** A result can become positive through a caller-supplied digest, unapproved source assertion, unresolved semantics or unresolved finality.

### R4 — Portability, Regression and Acceptance

**Purpose:** Validate portable evidence and compatibility with the existing repository.

Required work:

- PP-01/PP-02 evidence mapping.
- Offline historical reproduction.
- Current-policy reassessment.
- Evidence-tampering tests.
- Existing XDC regression tests.
- Existing PP-01, PP-02, PP-03 and PP-04 regression tests.
- Build, typecheck and SDK build verification.
- Security and assurance-boundary review.

**Exit condition:** All required tests pass, evidence remains independently reassessable, and no unauthorized live positive assurance is enabled.

**Stop condition:** Existing assurance semantics regress or evidence integrity/provenance cannot be preserved.

---

## 10. Minimum Acceptance Test Matrix

### 10.1 G1 — Trust and Provenance

| ID | Required test |
|---|---|
| I10-G1-01 | Approved source and authorized collector |
| I10-G1-02 | Unknown or unapproved source |
| I10-G1-03 | Unauthorized collector key |
| I10-G1-04 | Invalid acquisition signature |
| I10-G1-05 | Altered signed acquisition statement |
| I10-G1-06 | Missing, expired or revoked policy authorization |
| I10-G1-07 | Unsupported RPC method or endpoint |
| I10-G1-08 | Timeout, oversized response or incomplete acquisition |

### 10.2 G2 — Historical Token Semantics

| ID | Required test |
|---|---|
| I10-G2-01 | Approved historical direct implementation |
| I10-G2-02 | Historical implementation mismatch |
| I10-G2-03 | Unsupported delegation or proxy behavior |
| I10-G2-04 | Unresolved intra-block execution applicability |
| I10-G2-05 | Missing independent semantic approval |
| I10-G2-06 | Unsupported transfer semantics |
| I10-G2-07 | Reassessment under a changed semantics policy |

### 10.3 G3 — Ancestry and Finality

| ID | Required test |
|---|---|
| I10-G3-01 | Complete valid parent-hash ancestry |
| I10-G3-02 | Missing intermediate header |
| I10-G3-03 | Parent-hash discontinuity |
| I10-G3-04 | Correct height but wrong historical block hash |
| I10-G3-05 | Finality checkpoint beyond transaction without adequate ancestry |
| I10-G3-06 | Unapproved `finalized` interpretation |
| I10-G3-07 | Unsupported node/version context |
| I10-G3-08 | Contradictory checkpoint observations |
| I10-G3-09 | Stale or temporally inconsistent observations |
| I10-G3-10 | Approved equivalent ancestry evidence, if supported |

### 10.4 Integrated Assurance

| ID | Required test |
|---|---|
| I10-A01 | All eligible obligations independently satisfied |
| I10-A02 | Incorrect network |
| I10-A03 | Incorrect token contract |
| I10-A04 | Incorrect recipient or amount |
| I10-A05 | Reverted transaction |
| I10-A06 | Incomplete or conflicting transfer evidence |
| I10-A07 | G1 satisfied, G2 unresolved |
| I10-A08 | G1/G2 satisfied, G3 unresolved |
| I10-A09 | Independently authorized payment expectations missing |
| I10-A10 | Caller attempts to self-authorize policy |
| I10-A11 | Historical reproduction from preserved evidence |
| I10-A12 | Current-policy reassessment |
| I10-A13 | Tampered portable evidence |
| I10-A14 | Unapproved live context remains fail-closed |
| I10-A15 | Existing IOT-08 simulation behavior unchanged |
| I10-A16 | No unintended SDK, Concordium or composition regressions |

Tests shall distinguish operationally trusted evidence from fabricated simulation fixtures.

A passing synthetic test cannot by itself establish operational source trust or payment finality.

---

## 11. Explicit Scope Exclusions

IOT-10 shall not include:

- Independent XDPoS consensus verification.
- Validator quorum-certificate verification.
- General-purpose Ethereum or EVM execution replay.
- Independent historical token balance-state proof.
- Native XDC coin payment assurance.
- Universal ERC-20/XRC-20 token coverage.
- Unbounded historical proxy resolution.
- Permanent blockchain monitoring.
- General-purpose multi-chain settlement.
- Wallet creation, custody or signing.
- Transaction submission or payment execution.
- x402 gateway, facilitator or resource-release changes.
- Agent registry or delegated-authority verification.
- New public SDK exports without separate approval.
- Unnecessary changes to frozen PP-01 schemas.
- Changes to Concordium or Base assurance semantics.
- Production activation of XDC `verified` outcomes.

Any expansion requires explicit scope review and authorization.

---

## 12. Governance and Change Control

### 12.1 Repository Baseline

Engineering work shall begin only from a verified, synchronized and clean repository state.

The current reference baseline is:

`f339b904b6d9d83a795e310bec9bd4c07467eade`

If `main` advances, the baseline must be reverified before implementation begins.

### 12.2 File Scope

The proposed six new modules and four test files constitute the accepted provisional file-level planning boundary.

Any additional source, schema, package, SDK or configuration modification must have a documented justification.

### 12.3 Pull Request Discipline

Prefer one coherent implementation milestone with internal acceptance gates.

Avoid an extended PR ladder.

A PR split is justified only when needed for independent trust-boundary review, safe integration or clear operational separation.

### 12.4 No Implicit Authorization

Acceptance of this plan does not authorize:

- Repository implementation mutations.
- Creation of an implementation branch.
- Installation of dependencies.
- Live RPC acquisition.
- Collector-key generation.
- Policy approval or deployment.
- Production assurance activation.
- Staging, committing, pushing or merging implementation changes.

These actions require their own appropriate authorization.

The separately authorized documentation-only publication of this planning record does not change these restrictions.

---

## 13. Final Readiness Decision

### 13.1 Confirmed Readiness

**G1 architecture:** ACCEPTED.

**G2 architecture:** ACCEPTED.

**G3 architecture:** ACCEPTED.

**Repository inventory:** COMPLETED — READ-ONLY.

**Reusable implementation foundations:** IDENTIFIED.

**Minimum logical engineering scope:** DEFINED.

**IOT-10 planning baseline:** ACCEPTED.

### 13.2 Outstanding Readiness

**Operational RPC source approval:** NOT ESTABLISHED.

**Independent trust-policy authority:** NOT OPERATIONALIZED.

**Collector authorization and signing-key custody:** NOT ESTABLISHED.

**Historical token semantic approval:** NOT ESTABLISHED.

**Trusted-node finality-policy approval:** NOT ESTABLISHED.

**Complete operational ancestry evidence:** NOT ESTABLISHED.

**Independently authorized payment expectations:** NOT ESTABLISHED.

**Live positive XDC payment assurance:** NOT AUTHORIZED.

### 13.3 Accepted Planning Decision

**IOT-10 planning disposition: ACCEPTED — PLANNING BASELINE ONLY.**

The accepted G1/G2/G3 architecture and existing ProofPath repository provide a sufficient foundation for a focused engineering milestone.

The preferred implementation shall reuse the existing evidence and verification infrastructure, preserve IOT-08 simulation restrictions and introduce only the minimum independently authorized G1/G2/G3 functionality.

Before implementation, the operational prerequisites and file-level scope must be reviewed under the appropriate authorization process.

The implementation shall remain fail-closed wherever source trust, token semantics, finality, independent expectations or evidence integrity are unresolved.

**Implementation authorization remains NOT GRANTED.**

---

## References

### Accepted Architecture

- `docs/interoperability/xdc/proofpath-xdc-iot07-payment-assurance-profile.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09-trusted-evidence-readiness.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09b-historical-token-semantics.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09c-canonical-ancestry-finality.md`

### Existing Implementation

- `src/verification/xdcTypes.ts`
- `src/verification/xdcTokenTransfer.ts`
- `src/core/canonical.ts`
- `src/core/hash.ts`
- `src/core/provenance.ts`
- `src/core/export.ts`
- `src/core/audit.ts`
- `src/composition/transactionEvidence.ts`
- `src/application/pp04/trustedConfig.ts`
- `src/application/pp04/testnetLiveSource.ts`

### Existing Tests

- `tests/iot08-xdc-token-transfer.test.ts`
- Existing PP-01, PP-02, PP-03 and PP-04 test suites.

---

**Evidence tells a story. Assurance has boundaries.**
