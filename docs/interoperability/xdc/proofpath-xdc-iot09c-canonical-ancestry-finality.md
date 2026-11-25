
# ProofPath IOT-09C — XDC Canonical Ancestry and Trusted Finality Architecture

**Record:** IOT-09C\
**Status:** ACCEPTED — Architecture Only\
**Date:** 2026-11-25\
**Repository:** `rgraulus/proofpath`\
**Baseline:** `main` at `7ab2832`\
**Network:** XDC Apothem (`eip155:51`)\
**Assurance profile:** `trusted_node_finalized_xdc_token_transfer_v1`\
**Scope:** G3 Canonical Ancestry and Trusted Finality\
**Architecture decisions:** G3-D1 through G3-D6 — accepted\
**Consolidated architecture:** ACCEPTED\
**Implementation authorization:** NOT GRANTED\
**Operational G3 assurance:** NOT ESTABLISHED\
**Independent XDPoS consensus verification:** NOT ESTABLISHED\
**Production XDC payment assurance:** NOT ESTABLISHED

---

## 1. Executive Summary

IOT-09C establishes ProofPath's architecture for evaluating canonical transaction-block identity, historical block ancestry and trusted-node finality assertions for token transfers on XDC Apothem.

It addresses **G3 — Canonical Ancestry and Trusted Finality**, the final outstanding architectural trust gate identified by the accepted IOT-07 XDC Payment-Assurance Profile:

- **G1:** Trusted-source provenance and independent policy authority.
- **G2:** Historical token implementation and transfer semantics.
- **G3:** Canonical ancestry and trusted finality.

IOT-09A established the accepted architecture for G1, while IOT-09B established the accepted architecture for G2.

IOT-09C defines the complementary architectural requirements for G3.

The fundamental problem is that a successful token-transfer transaction, a matching receipt, a historically reported block hash and a finalized checkpoint at a greater block height do not, by themselves, establish that the transaction belongs to the finalized canonical history.

ProofPath must establish an adequately supported ancestry relationship between the transaction block and the reported finalized checkpoint. It must also independently authorize the interpretation of the trusted node's finality assertion.

### 1.1 Accepted assurance approach

IOT-09C adopts **policy-authorized trusted-node finality assurance**, rather than independent XDPoS consensus verification.

Under this model, ProofPath may establish that an authenticated and independently authorized XDC node reports a finalized checkpoint whose canonical ancestry relationship to the evaluated transaction block satisfies an approved finality policy.

The initial architecture prefers explicit, reproducible parent-hash ancestry evidence.

It does not independently validate XDPoS validator signatures, quorum certificates, consensus correctness or unconditional blockchain irreversibility.

### 1.2 Architecture disposition

Six architectural decisions, G3-D1 through G3-D6, have been individually accepted.

The consolidated architecture record has also been formally accepted.

This record documents those decisions, their assurance boundaries, supporting evidence requirements, acceptance criteria, operational dependencies and exclusions.

Acceptance of the consolidated architecture does not authorize operational source admission, finality-policy deployment, implementation changes or positive live XDC payment assurance.

**Architectural principle:** Evidence tells a story. Assurance has boundaries.

---

## 2. Background and Architectural Baseline

### 2.1 IOT-01 through IOT-05 — Portable evidence

Earlier XDC interoperability milestones demonstrated compatibility between XDC observations and ProofPath's portable evidence architecture.

These milestones established the ability to preserve, exchange, validate and independently reassess evidence packages.

They did not establish independent XDC transaction settlement or consensus finality.

### 2.2 IOT-06 — Cross-platform assurance architecture

IOT-06 established the separation of payment-assurance obligations, including:

- Network identity.
- Independently approved payment expectations.
- Transaction execution.
- Asset-transfer correctness.
- Settlement finality.
- Source and policy authority.
- Historical validity.
- Agent identity and authorization.
- Cross-platform transaction binding.

IOT-09C preserves this separation.

Finality must not be inferred from unrelated assurances, and a finality result must not be promoted into an unrestricted payment-verification claim.

### 2.3 IOT-07 — XDC Payment-Assurance Profile

IOT-07 established the proposed XDC Apothem profile:

`trusted_node_finalized_xdc_token_transfer_v1`

The profile's intended positive claim concerns an exact expected token transfer, successfully executed in a historical transaction, whose containing block is covered by an approved trusted-node finality assertion.

IOT-07 requires:

- An exact transaction and historical block binding.
- A canonical historical block matching the evaluated reference.
- A node-reported finalized checkpoint.
- Adequate evidence connecting the transaction block to the finalized canonical history.
- Independently approved finality-source authority.
- Explicitly bounded assurance outcomes.

IOT-07 also identified the absence of independent canonical ancestry and approved finality interpretation as unresolved dependencies.

### 2.4 IOT-08 — Deterministic simulated verification

IOT-08 introduced an isolated XDC token-transfer verifier using simulation-only inputs.

Its finality observation includes:

- A canonical block hash and number.
- A finalized block hash and number.
- A source-reported canonical ancestry assertion.

These are simulated observations, not independently authenticated live finality evidence.

The existing implementation explicitly preserves the distinction between deterministic simulation results and operational payment assurance.

IOT-09C defines the future architecture required to substantiate the finality obligation without changing the current IOT-08 implementation.

### 2.5 IOT-09A — G1 Trusted-source provenance

IOT-09A established the accepted architecture for independent RPC-source authorization, collector authentication, acquisition provenance, policy authority and portable evidence.

G3 shall reuse these governance and acquisition controls.

An authenticated source does not automatically establish that its blockchain assertions are true or that its finality-reporting semantics are approved.

### 2.6 IOT-09B — G2 Historical token semantics

IOT-09B established the requirements for identifying historically applicable token implementations, resolving supported delegation and upgrade behavior and independently authorizing supported transfer semantics.

G3 remains separate from those obligations.

A satisfactory finality assessment does not establish that the underlying token implementation behaved according to an approved semantic profile.

---

## 3. G3 Assurance Objective and Reference Scope

### 3.1 Assurance objective

G3 shall evaluate whether the historical transaction block is part of the canonical blockchain history covered by an independently authorized trusted-node finalized-checkpoint assertion.

The assessment must distinguish:

1. Exact transaction-block identity.
2. Canonical block identity under the trusted-source model.
3. Ancestry between the transaction block and finalized checkpoint.
4. Meaning and authority of the reported finality state.
5. Historical observation timing and consistency.
6. Independent finality-policy authorization.
7. Portable evidence and bounded reassessment.

G3 does not independently establish token-transfer semantics, commercial payment intent, balance-state effects or complete x402 settlement.

### 3.2 Historical XDC Apothem reference fixture

The initial architecture remains scoped to the technical fixture accepted by IOT-07.

| Property | Reference |
|---|---|
| Network | `eip155:51` |
| Asset | XDC Apothem USDC test token |
| Token contract | `0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4` |
| Transaction hash | `0xc7d36e42643c270ab70436770bae39c680782b70b6f63f2940a53b9cc2232520` |
| Transaction block | `0x51ceee7` |
| Transaction block hash | `0xf04560246430c88fe02cf327d60b9f2dc7070bc0bd1564b70ddece9823d56554` |
| Previously reported finalized block | `0x51cf0a5` |
| Previously reported finalized-height coverage | 446 blocks beyond the transaction |
| Canonical transaction-block hash match | Reported by the queried node |
| Complete ancestry independently established | No |
| Approved operational finality policy | Not established |
| Independent consensus verification | Not performed |

The previously observed finalized checkpoint is a historical technical observation.

It is not a persistent guarantee regarding future node responses or network state.

### 3.3 Initial trust model

The initial profile shall use the independently approved trusted-node model established by IOT-07 and G1.

ProofPath shall not silently substitute arbitrary confirmation counts, unauthenticated RPC responses or unsupported finality assumptions for approved canonicality and finality requirements.

### 3.4 Initial scope restriction

G3 shall prioritize bounded evidence for the specific historical transaction-to-finalized-checkpoint relationship.

It shall not require a general-purpose blockchain explorer, continuous chain monitor or independent XDPoS consensus client.

---

## 4. Accepted Architecture Decisions

### 4.1 G3-D1 — Canonical Transaction-Block Identity

**Status: ACCEPTED**

ProofPath shall establish an exact, internally consistent binding between the evaluated transaction, its execution receipt and the historical block claimed to contain it.

The assessment shall require the transaction hash, receipt transaction hash, block hash and block number to agree under the applicable verification policy.

The claimed historical block identity shall be evaluated against sufficient authenticated canonical-chain observations obtained through the approved G1 evidence-acquisition framework.

A matching block number alone shall not establish canonicality.

The block hash must be treated as the relevant historical block identity, and the source's canonicality assertions must remain explicitly subject to independently approved trust-policy interpretation.

Missing, inconsistent or unresolved transaction-to-block or canonical-block evidence shall not support a positive G3 assessment.

Definitive failure shall require sufficient trusted evidence of a contradiction.

Where the evidence is incomplete, unapproved or ambiguous, the result shall remain **indeterminate**.

**Architectural implications:**

- Transaction identity and historical block identity are distinct but must be consistently bound.
- Receipt observations must agree with the evaluated transaction and block.
- Historical canonicality must be assessed through an approved source and policy.
- Block height is not a substitute for exact block-hash identity.
- The evidence must preserve the basis for the canonicality conclusion.

**Boundary:** G3-D1 does not independently establish finalized ancestry, XDPoS consensus validity or overall payment settlement.

### 4.2 G3-D2 — Canonical Ancestry and Finalized-Checkpoint Binding

**Status: ACCEPTED**

ProofPath shall establish an explicit, independently policy-authorized relationship between the historical transaction block and the node-reported finalized checkpoint.

The assessment shall bind the transaction block and finalized checkpoint by their exact block hashes and heights, not merely by comparing block numbers.

The preferred initial ancestry model shall require a complete, internally consistent parent-hash chain connecting the transaction block to the finalized checkpoint, or an independently approved equivalent ancestry proof.

A bounded alternative based on a trusted-node canonicality guarantee may be permitted only when its semantics, prerequisites and evidentiary sufficiency are independently documented and approved under the applicable trust policy.

A matching checkpoint height, matching historical block hash in an isolated query, unverified ancestry Boolean or arbitrary confirmation count shall not independently satisfy the ancestry obligation.

Any acquired block headers, ancestry assertions or equivalent evidence shall remain subject to G1 source authentication, acquisition provenance and independently authorized policy interpretation.

Ancestry evidence shall establish the relationship between the transaction block and reported checkpoint under the approved trusted-node model.

It shall not independently establish that the checkpoint satisfies XDPoS consensus-finality rules.

Missing, incomplete, inconsistent or unauthorized ancestry evidence shall prevent a positive G3 assessment.

Definitive failure shall require sufficient trusted contradictory evidence; otherwise the outcome shall remain **indeterminate**.

**Accepted constraints:**

1. No independent XDPoS consensus verification requirement.
2. No blind reliance on undocumented or unapproved node ancestry assertions.
3. No unnecessary blockchain-wide historical reconstruction.

**Boundary:** Structural ancestry and checkpoint finality authority are separate obligations.

### 4.3 G3-D3 — Independently Approved Trusted-Node Finality Semantics

**Status: ACCEPTED**

ProofPath shall interpret XDC Apothem finalized-checkpoint observations only under an independently approved trusted-node finality policy.

The policy shall explicitly identify the approved network, applicable consensus-finality model, authorized node implementation and supported version context, permitted finality-reporting interfaces, checkpoint identity requirements and relevant operational prerequisites.

A node-reported `finalized` checkpoint shall be eligible to support G3 only when the reporting source and acquisition process satisfy the applicable G1 requirements and the asserted finality semantics have been independently authorized.

The finality assessment shall bind the reported checkpoint to an exact block hash and height.

The existence of a finalized-height response, arbitrary confirmation count or greater block height shall not independently establish finalized canonical ancestry.

G3 shall require the canonical ancestry relationship established under G3-D2, together with the independently approved interpretation of the checkpoint's finality.

Node implementation differences, unsupported RPC semantics, unresolved consensus-transition behavior, unavailable operational prerequisites or contradictory finality observations shall prevent positive G3 assessment.

Definitive failure shall require sufficient trusted contradictory evidence.

Where the finality meaning, authority or supporting evidence remains unresolved, the outcome shall be **indeterminate**.

**Accepted constraints:**

1. No independent XDPoS consensus verification.
2. No implicit trust in an RPC `finalized` response.
3. No conflation of ancestry and finality authority.

**Boundary:** A satisfactory finding establishes coverage by an approved trusted-node finality assertion, not independently verified XDPoS consensus or unconditional irreversibility.

### 4.4 G3-D4 — Historical Finality Evidence and Temporal Consistency

**Status: ACCEPTED**

ProofPath shall assess trusted-node finality observations within an explicitly defined historical acquisition and assessment context.

Each relevant finality observation shall be bound to its authenticated source, acquisition record, observed checkpoint hash and height, applicable network, policy identity and acquisition-time context under the G1 provenance architecture.

The approved finality policy shall define the permitted temporal relationships, observation-age constraints, synchronization assumptions and consistency requirements necessary to interpret historical checkpoint evidence.

A finalized checkpoint shall be evaluated using its exact block identity and its established ancestry relationship to the evaluated transaction block.

Later checkpoints may constitute consistent progression only where the applicable policy and available evidence adequately support their relationship to the previously reported finalized history.

A greater reported height alone shall not establish consistency.

Conflicting checkpoint hashes, incompatible finalized ancestry, inconsistent source reports, unexplained checkpoint regression or other material finality contradictions shall be evaluated explicitly rather than silently reconciled or ignored.

Where sufficiently authenticated and trusted evidence establishes a definitive violation of an applicable finality requirement, the corresponding G3 obligation may be classified as **failed**, with the contradiction documented.

Where provenance, timing, source reliability, historical consistency or the significance of contradictory observations remains unresolved, G3 shall remain **indeterminate** and fail closed for payment-assurance purposes.

Historical acquisition evidence shall remain preserved and independently reassessable.

A later observation or reassessment shall not silently overwrite the original observation or retroactively represent it as having been known at an earlier time.

**Accepted constraints:**

1. No continuous blockchain-monitoring requirement.
2. No automatic definitive failure from unexplained disagreement.
3. No retroactive rewriting of historical assurance.

**Boundary:** Preserved historical observations do not independently establish the current network state.

### 4.5 G3-D5 — Independently Authorized Finality Trust Policy

**Status: ACCEPTED**

ProofPath shall authorize canonical ancestry and trusted-node finality interpretations through a separately governed, versioned finality-policy component within the independent trust-policy architecture established by G1.

Each approved finality profile shall explicitly bind the applicable network, consensus-finality interpretation, authorized node implementation and version context, supported RPC finality interfaces, checkpoint identity requirements, accepted ancestry-evidence model, operational prerequisites and known assurance limitations.

Source authentication and collector authorization under G1 shall remain necessary but insufficient for G3 finality authorization.

The node, evidence producer, verifier caller or acquired observations shall not independently approve their own finality semantics.

Finality-policy approval shall require an independently justified evidentiary basis, identifying why the supported node implementation and reporting mechanism are suitable for the bounded trusted-node assurance claim.

Policy identity, version, integrity commitment, approval authority, effective period, supersession and revocation shall be independently established and verifiable.

Matching policy digests, successful RPC responses, reported finalized heights or previously recorded positive assessments shall not substitute for independently valid policy authorization.

Historical finality observations and their policy context shall remain distinguishable from later current-policy reassessments.

Retrospective policy approval or revocation shall not silently rewrite the original assessment or be represented as contemporaneous authorization.

Missing, unauthorized, expired, revoked or otherwise insufficient finality-policy authority shall prevent positive G3 assurance under the applicable assessment rules.

Where authority or applicability remains unresolved, the result shall be **indeterminate**, unless sufficient trusted evidence establishes a definitive contradiction.

**Accepted constraints:**

1. Reuse G1 governance; do not introduce an unnecessary second trust registry or service.
2. Do not permit self-authorizing node finality assertions or policy digests.
3. Preserve historical policy and assessment context across subsequent policy changes.

**Boundary:** Finality-policy approval does not independently establish G1 source truthfulness, G2 historical token semantics, independent XDPoS consensus verification, commercial payment purpose or x402 settlement.

### 4.6 G3-D6 — Portable Finality Evidence and Bounded Reassessment

**Status: ACCEPTED**

ProofPath shall preserve canonical transaction-block identity, ancestry and trusted-node finality evidence in a portable, integrity-protected format consistent with its existing PP-01 evidence architecture and PP-02 assessment boundaries.

The evidence package shall retain sufficient information to reproduce the applicable historical transaction-block binding, approved ancestry relationship, finalized-checkpoint interpretation, temporal consistency assessment, governing policy authorization and individual G3 findings.

For the preferred explicit ancestry model, the package shall preserve the ordered historical block-header evidence necessary to deterministically validate parent-hash continuity between the transaction block and the reported finalized checkpoint.

Where an independently approved equivalent ancestry proof or trusted-node guarantee is used, its supporting evidence, approved interpretation and limitations shall remain identifiable and independently reassessable.

Finality evidence shall retain G1 source and collector provenance, exact checkpoint identities, acquisition-time context, relevant consistency observations and independently approved policy references.

Offline reassessment shall distinguish historical reproduction under the original policy from a new assessment under a separately authorized later policy.

Original observations, findings and authorization context shall remain preserved without retrospective rewriting.

G3 outcomes shall be explicit, deterministic and explainable, using `satisfied`, `failed` or `indeterminate` obligation findings.

Definitive failure shall require sufficient trusted contradictory evidence; missing, unsupported, unauthenticated or unresolved observations shall remain indeterminate and fail closed.

Evidence integrity, authenticated acquisition, canonical ancestry, trusted-node finality authority, historical token semantics and independently established payment expectations shall remain separate assurance obligations.

G3 satisfaction shall establish only the approved trusted-node finality conclusion supported by the preserved evidence.

It shall not be represented as independent XDPoS consensus verification, unconditional blockchain irreversibility, independent historical balance-state proof or completed x402 settlement.

**Accepted constraints:**

1. Reuse PP-01 and PP-02 rather than creating a parallel evidence framework.
2. Require reproducible ancestry evidence or an independently approved equivalent basis.
3. Keep historical offline reassessment bounded to preserved evidence and its authorized trust context.

**Boundary:** G3 evidence portability or reassessment does not independently enable positive live XDC payment assurance.

---

## 5. Consolidated Logical Architecture

G3 defines a logical finality-assessment responsibility within ProofPath's existing assurance architecture.

The design does not require a new service, independent finality registry or blockchain consensus client.

### 5.1 Independent policy authority

The G1 trust-policy authority shall govern the approval and validity of the finality interpretations used by G3.

G3-specific finality-policy entries must be distinguishable from G1 source authorization and G2 token-semantics approval.

These are separate logical approvals within the established independent governance architecture.

### 5.2 Authenticated finality evidence acquisition

G1-controlled acquisition provides the provenance boundary for transaction, block, ancestry and finalized-checkpoint observations.

The source identity, collector authorization, acquisition context and evidence commitments must remain verifiable.

Successful acquisition does not independently establish that the reported chain history or finality assertion is correct.

### 5.3 Canonical transaction-block binding

The G3 assessment establishes the consistency of the evaluated transaction, receipt and containing block.

The relevant historical block identity must include its exact hash and height.

Canonicality assertions require the independently approved source and policy context.

### 5.4 Ancestry assessment

The preferred initial model validates an ordered parent-hash chain connecting the transaction block to the finalized checkpoint.

This establishes structural linkage among the preserved headers.

A separately approved equivalent proof or node canonicality guarantee may be supported where independently justified.

Neither approach automatically establishes consensus finality without the applicable checkpoint authority.

### 5.5 Trusted-node finality assessment

The G3 finality interpretation determines whether the reported checkpoint is eligible to represent finality under the independently approved network, node implementation, RPC interface and operational conditions.

The policy must explicitly define the accepted meaning of the finality assertion.

### 5.6 Temporal consistency assessment

Historical observations must be assessed in their acquisition context.

The policy must define permitted observation age, time relationships, source synchronization assumptions and contradictory-evidence handling.

Later checkpoint progression must be distinguished from evidence of incompatible finalized histories.

### 5.7 Portable evidence and reassessment

The G3 evidence and its policy context shall be retained through ProofPath's established PP-01 evidence architecture.

Offline reassessment shall preserve the distinction between evidence integrity, authenticated provenance and the substantive finality conclusion.

### 5.8 Separation from G2 and combined payment assurance

G3 does not establish historical token implementation correctness or supported transfer semantics.

Those obligations remain governed by G2.

A future positive XDC payment-assurance outcome shall require all applicable G1, G2, G3, transaction and independently approved payment-expectation obligations to be satisfied.

---

## 6. Required G3 Evidence Contract

The following sections specify architectural evidence obligations.

Exact TypeScript schemas, serialization formats, field mappings and repository integration points remain future implementation-design matters.

### 6.1 Transaction and historical block identity

The evidence must preserve:

- Network identity.
- Transaction hash.
- Transaction and receipt block references.
- Transaction-containing block hash.
- Transaction-containing block number.
- Evidence of transaction inclusion under the approved source model.
- Source-reported canonicality observations.
- Relevant transaction and receipt consistency findings.

A block-height match without sufficient block-hash and transaction-binding evidence is insufficient.

### 6.2 Finalized-checkpoint identity

The evidence must preserve:

- Reported finalized block hash.
- Reported finalized block height.
- Permitted finality-reporting interface.
- Relevant node and acquisition context.
- Applicable finality-policy identity.
- Observation time and supporting acquisition references.

The checkpoint's hash and height must be treated together as the reported historical checkpoint identity.

### 6.3 Explicit ancestry evidence

For the preferred parent-hash ancestry model, preserve sufficient ordered block-header evidence to establish the relationship between the transaction block and finalized checkpoint.

The assessment must be able to verify that the historical headers form the required continuous parent-hash relationship.

An implementation shall validate the relevant header identities, heights, ordering and parent references under the approved policy.

A complete path is not automatically an independently authenticated canonical history.

Its source provenance and checkpoint authority remain separate obligations.

### 6.4 Approved equivalent ancestry evidence

Where an approved alternative is permitted, preserve:

- The approved ancestry method or guarantee.
- Its authorization and policy reference.
- The exact historical blocks to which it applies.
- Supporting source observations or proof material.
- Preconditions and known limitations.
- The assessment's reasoned basis for accepting the relationship.

A bare source Boolean or unsupported node assertion shall not qualify as an approved equivalent.

### 6.5 Trusted-node finality interpretation

The evidence must identify the governing finality interpretation, including:

- Applicable network.
- Relevant consensus-finality model.
- Authorized node implementation and version context.
- Approved RPC reporting semantics.
- Applicable consensus-transition or compatibility assumptions.
- Operational prerequisites.
- Approved checkpoint interpretation and limitations.

These properties must be authorized independently of the observations being assessed.

### 6.6 Acquisition provenance and timing

The evidence must preserve its relationship to G1 source and collector records.

Required architectural context includes:

- Approved source reference.
- Collector authorization and acquisition attestation.
- Acquisition identifier.
- Observation timestamps.
- Relevant request and response references.
- Evidence integrity commitments.
- Applicable time and freshness policy.
- Assessment timestamp or equivalent evaluation context.

A collector timestamp is not automatically independent trusted-time evidence. Any required time authority or acceptable acquisition-time basis must be established by the applicable policy.

### 6.7 Finality consistency and contradiction evidence

Where relevant, preserve:

- Multiple finalized-checkpoint observations.
- Their source and acquisition contexts.
- Exact checkpoint hashes and heights.
- Available ancestry relationships among checkpoints.
- Potentially conflicting canonicality assertions.
- Supporting contradiction or resolution evidence.
- Explicit unresolved limitations.

Conflicting observations must not be silently replaced with the most recent or most favorable result.

### 6.8 Finality-policy provenance

Preserve references sufficient to establish:

- Finality-policy identity and version.
- Policy integrity commitment.
- Independent approval record and authority.
- Approved source and node context.
- Accepted ancestry method.
- Effective period.
- Supersession and revocation state.
- Applicable historical or current assessment mode.

A policy digest demonstrates content consistency, not independent policy approval.

### 6.9 Assessment findings

The portable package must preserve:

- Evaluated finality obligations.
- Relevant evidence references.
- Applicable trust policy.
- Individual obligation outcomes.
- Reason codes.
- Contradiction findings.
- Assurance limitations.
- Assessment mode.
- Original or reassessment policy context.

The evidence contract must support independent reassessment without erasing the original assessment's provenance or limitations.

---

## 7. G3 Outcome Semantics and Assurance Boundaries

### 7.1 Satisfied

The G3 obligation may be classified as `satisfied` only where sufficient authorized evidence establishes:

- Exact transaction-to-block binding.
- Supported historical canonical block identity.
- An approved ancestry relationship to the reported checkpoint.
- Authorized interpretation of the checkpoint's finalized state.
- Required historical and temporal consistency.
- Applicable source, collector and finality-policy authority.

G3 satisfaction is a bounded trusted-node finality finding.

It does not independently establish complete payment assurance.

### 7.2 Failed

The G3 obligation may be classified as `failed` when sufficient trusted evidence establishes a definitive contradiction to an applicable mandatory finality requirement.

Examples may include:

- Definitively incompatible transaction and historical block binding.
- Trusted evidence establishing an incompatible canonical block identity.
- An established parent-hash discontinuity in evidence represented as a complete required ancestry path.
- Sufficiently trusted evidence of incompatible finalized histories.
- An established mandatory finality-policy contradiction.

The failure must identify the contradicted requirement and supporting evidence.

A failed finality obligation does not automatically mean that the token-transfer transaction reverted or that the token-transfer semantics were invalid.

### 7.3 Indeterminate

The G3 obligation shall remain `indeterminate` where the evidence or authority is insufficient to establish satisfaction or definitive failure.

Examples include:

- Missing historical block evidence.
- Incomplete ancestry path.
- Unsupported node ancestry assertion.
- Unapproved finality-reporting semantics.
- Unresolved node-version compatibility.
- Insufficient synchronization or acquisition-time evidence.
- Missing independent finality-policy authority.
- Unresolved conflicting checkpoint observations.
- Insufficiently authenticated acquisition provenance.

Indeterminate results must fail closed for payment-assurance purposes.

### 7.4 Integrity failure

Invalid portable evidence commitments or failed evidence-integrity verification must prevent positive assurance.

An integrity failure must not be silently converted into a trusted assertion that the underlying blockchain transaction or finalized history was incorrect.

Integrity and substantive finality findings remain separate.

### 7.5 Overall payment-verification separation

The existing IOT-08 result architecture distinguishes transaction execution, transfer consistency, token semantics, source trust and finality.

A future implementation shall preserve these boundaries.

Even where G3 is satisfied, the overall payment-assurance result must not become positive while any other mandatory obligation remains unresolved.

---

## 8. Historical Finality Reassessment and Policy Evolution

### 8.1 Historical reproduction

Historical reproduction shall evaluate preserved finality evidence under the original applicable policy and assessment context.

Its purpose is to reproduce the original bounded finding.

It does not imply that the original policy remains currently authorized.

It also does not constitute a fresh finality observation.

### 8.2 Current-policy reassessment

Current-policy reassessment shall evaluate preserved historical evidence under a separately authorized later policy.

The new assessment must identify its own policy basis, relevant authorization context and applicable restrictions.

Where the later policy requires evidence not available in the preserved package, the outcome must remain appropriately bounded or indeterminate.

### 8.3 Historical observation preservation

Original source observations, checkpoint identities, acquisition context, assessment results and policy references shall remain preserved.

Later evidence and new assessments shall be separately identifiable.

An earlier positive finding may be reevaluated under later policy requirements, but the original historical record must not be silently rewritten.

### 8.4 Changing finalized checkpoints

A subsequently reported checkpoint at a higher height may represent consistent finalized-chain progression if its relationship to the earlier history is adequately established.

Greater height alone does not establish that relationship.

Conflicting finality observations must be evaluated under the applicable authorized policy.

### 8.5 Offline assurance limitations

Offline reassessment shall not imply:

- Fresh RPC source authentication.
- New network observations.
- Present-day node synchronization.
- Current network finality beyond preserved evidence.
- Independent XDPoS consensus verification.
- Unconditional transaction irreversibility.
- Independent token balance-state proof.

The reassessment claim must remain anchored to the preserved evidence and the expressly identified trust model.

---

## 9. Required G3 Acceptance Criteria

The following matrix defines minimum architecture-level requirements for future implementation and testing.

It does not report completed operational tests.

| ID | Acceptance requirement |
|---|---|
| G3-A01 | Bind the assessment to exact XDC Apothem network identity |
| G3-A02 | Establish transaction, receipt and historical block consistency |
| G3-A03 | Require exact block-hash identity, not height-only matching |
| G3-A04 | Establish an independently policy-authorized ancestry relationship |
| G3-A05 | Support complete, reproducible parent-hash ancestry evidence |
| G3-A06 | Permit equivalent ancestry evidence only under explicit independent approval |
| G3-A07 | Reject unsupported ancestry Boolean or height-only evidence as sufficient |
| G3-A08 | Require independently approved node-reported finality semantics |
| G3-A09 | Bind finality interpretation to approved node and interface context |
| G3-A10 | Require applicable historical timing, synchronization and consistency evidence |
| G3-A11 | Distinguish consistent checkpoint progression from conflicting observations |
| G3-A12 | Preserve independently authorized policy approval, validity and revocation context |
| G3-A13 | Preserve G1 source and collector provenance |
| G3-A14 | Preserve PP-01 portability and PP-02 assessment boundaries |
| G3-A15 | Support historical reproduction and separately authorized current-policy reassessment |
| G3-A16 | Produce deterministic, explainable `satisfied`, `failed` and `indeterminate` obligation findings |
| G3-A17 | Preserve G1, G2, finality and payment-expectation separation |
| G3-A18 | Prevent G3-only findings from enabling positive live payment assurance |

### 9.1 Required negative scenarios

| Scenario | Expected architectural disposition |
|---|---|
| Transaction and receipt block hashes disagree without adequate resolution | No positive G3 assurance |
| Trusted evidence definitively establishes an incompatible transaction-block binding | Failed |
| Transaction block number matches but block hash differs | No positive G3 assurance; failed if trusted contradiction is definitive |
| Finalized height exceeds transaction height but ancestry is unresolved | Indeterminate |
| Required intermediate ancestry headers are missing | Indeterminate |
| Authenticated, complete ancestry evidence definitively contradicts the claimed path | Failed |
| Unapproved `canonicalAncestryReported=true` assertion | Indeterminate |
| Finality RPC semantics are not independently approved | Indeterminate |
| Node implementation or version compatibility unresolved | Indeterminate |
| Relevant operational readiness cannot be established | Indeterminate |
| Acquisition timing insufficiently established | Indeterminate |
| Later checkpoint is higher but relationship to earlier history is unresolved | Indeterminate |
| Conflicting checkpoint reports with uncertain provenance or interpretation | Indeterminate |
| Definitively incompatible finalized histories established by sufficient trusted evidence | Failed |
| Finality-policy approval missing | Indeterminate |
| Policy digest matches but independent approval is missing | Indeterminate |
| Applicable revocation state unresolved | Indeterminate |
| Portable evidence-integrity validation fails | Integrity failure; no positive assurance |
| G3 satisfied but G1 source trust unresolved | Overall payment assurance remains indeterminate |
| G3 satisfied but G2 token semantics unresolved | Overall payment assurance remains indeterminate |
| G3 satisfied but independent payment expectations are missing | Overall payment assurance remains indeterminate |

### 9.2 Required positive eligibility scenario

A future G3 assessment may be eligible for `satisfied` when:

- Transaction, receipt and historical block identities are consistently established.
- The relevant canonical block identity is supported under an approved source model.
- The transaction block is linked to the finalized checkpoint by an approved ancestry method.
- The checkpoint's finality meaning is independently authorized.
- Required temporal and operational conditions are satisfied.
- G1 source and collector provenance are sufficient.
- The applicable finality policy is independently approved and valid for the assessment.

This is a future acceptance criterion.

It is not a claim that the IOT-07 historical fixture currently satisfies these requirements.

### 9.3 Combined assurance restriction

Satisfaction of G3-A01 through G3-A18 shall not automatically establish a positive overall XDC payment-assurance outcome.

All remaining profile obligations must also be satisfied under the applicable independent trust policy.

---

## 10. Outstanding Operational and Implementation Dependencies

The following dependencies remain unresolved by this architecture record.

### 10.1 Finality-source and node compatibility

- Establish operational approval of the candidate XDC Apothem source.
- Identify the actual node implementation and relevant version context.
- Validate the supported finality-reporting interface.
- Establish the applicable interpretation of node-reported `finalized`.
- Resolve relevant XDPoS consensus-transition and compatibility assumptions.
- Establish operational synchronization and readiness requirements.

### 10.2 Historical ancestry evidence

- Establish the acquisition method for the required historical block headers.
- Define permitted resource and path-length bounds.
- Preserve exact transaction and checkpoint identities.
- Validate the transaction-to-checkpoint parent-hash relationship.
- Determine whether any explicitly approved equivalent ancestry method is justified.
- Validate incomplete, inconsistent and contradictory historical evidence handling.

### 10.3 Independent finality-policy approval

- Establish an independently justified basis for the supported trusted-node finality interpretation.
- Define and approve the applicable G3 finality-policy entry.
- Establish its approval authority, effective period and revocation rules.
- Integrate the policy entry with the independently governed G1 registry.

### 10.4 G1 operational readiness

- Establish approved and authenticated acquisition sources.
- Operationalize the authorized collector and evidence-attestation process.
- Establish acquisition provenance and sufficient timing evidence.
- Validate required source consistency and operational safeguards.

### 10.5 G2 and payment-expectation readiness

- Establish the historical token implementation applicable to the reference transaction.
- Independently authorize its transfer semantics.
- Establish all independently approved expected payment terms.
- Preserve the separation between transaction, token-semantics, finality and payment-purpose obligations.

### 10.6 Evidence and assessment integration

- Map G3 evidence into existing PP-01 portable evidence structures.
- Define exact implementation-level schemas and normalization rules.
- Integrate G3 findings into the existing IOT-08 obligation model.
- Establish deterministic negative and positive-eligibility tests.
- Preserve historical reproduction and current-policy reassessment.
- Prevent unsupported live assurance promotion.

None of these operational prerequisites is declared satisfied by acceptance of the architecture.

---

## 11. Scope Exclusions

IOT-09C excludes:

- Runtime code changes.
- Live RPC acquisition.
- Operational admission of an RPC source.
- Collector deployment or signing-key generation.
- Deployment of an independent finality-policy registry.
- New wallet signing or custody functions.
- Token-transfer execution or payment submission.
- Continuous blockchain monitoring.
- General-purpose blockchain ancestry indexing.
- Universal EVM finality verification.
- Independent XDPoS validator-signature or quorum-certificate verification.
- Independent reconstruction of XDPoS consensus.
- Independent historical token balance-state proof.
- G2 token-semantics implementation.
- Production XDC payment verification.
- Activation of positive live `verified` results.
- x402 facilitator, gateway or resource-release integration.
- Agent identity, registry or delegated-authority verification.
- Cross-chain settlement or bridging.
- Changes to existing public SDK exports.
- Changes to existing PP-01, PP-02, Concordium or Base assurance semantics.

Expansion of these boundaries requires separate justification and explicit authorization.

---

## 12. Recommended Next Steps

### 12.1 IOT-09C — Documentation acceptance and publication

The consolidated architecture review is complete, and the architecture record has been accepted.

Publish the accepted record through one narrowly scoped documentation-only pull request.

No runtime implementation shall be included.

### 12.2 Combined G1/G2/G3 implementation-readiness review

Following publication of IOT-09C, conduct one consolidated implementation-readiness assessment for the XDC Apothem payment-assurance profile.

That review shall evaluate:

- Independent trust-policy governance.
- Approved RPC source identity and operational suitability.
- Collector authorization and acquisition provenance.
- Historical token implementation identity.
- Approved historical transfer semantics.
- Transaction-block identity.
- Canonical ancestry evidence.
- Trusted-node finalized-checkpoint semantics.
- Temporal consistency and contradiction handling.
- Independently approved payment expectations.
- Portable evidence sufficiency.
- Bounded offline reassessment.
- Deterministic negative and positive-eligibility testing.
- Live-assurance activation prerequisites and exclusions.

The review shall distinguish architectural readiness from operational readiness and implementation authorization.

### 12.3 Focused future implementation

If the combined readiness review establishes a justified implementation scope, subsequent engineering shall preserve the existing ProofPath assurance boundaries.

Implementation should be limited to the minimum independently authorized functionality required to satisfy the selected profile's obligations.

The review should avoid creating an unnecessary sequence of narrowly fragmented implementation pull requests.

### 12.4 Production assurance remains separately gated

Neither G1/G2/G3 architecture acceptance nor successful simulation testing authorizes positive live payment assurance.

Any subsequent operational activation requires explicit authorization and evidence that all mandatory prerequisites are satisfied.

---

## 13. Architecture Acceptance Decision

### 13.1 Decision register

| Decision | Subject | Disposition |
|---|---|---|
| G3-D1 | Canonical Transaction-Block Identity | ACCEPTED |
| G3-D2 | Canonical Ancestry and Finalized-Checkpoint Binding | ACCEPTED |
| G3-D3 | Independently Approved Trusted-Node Finality Semantics | ACCEPTED |
| G3-D4 | Historical Finality Evidence and Temporal Consistency | ACCEPTED |
| G3-D5 | Independently Authorized Finality Trust Policy | ACCEPTED |
| G3-D6 | Portable Finality Evidence and Bounded Reassessment | ACCEPTED |

All six decisions were individually accepted during the IOT-09C architectural review.

The consolidated architecture record was subsequently reviewed and formally approved without substantive architectural changes.

### 13.2 Consolidated acceptance classification

**Record disposition:** ACCEPTED — Architecture Only.

**G3 architectural decisions:** ACCEPTED.

**Authenticated operational finality evidence established:** NO.

**Transaction-to-checkpoint ancestry operationally established:** NO.

**Independent finality-policy approval established:** NO.

**G1 operational source and collector trust established:** NO.

**G2 operational historical token semantics established:** NO.

**Independent XDPoS consensus verification established:** NO.

**Production XDC payment assurance established:** NO.

**Implementation authorization:** NOT GRANTED.

### 13.3 Final architectural conclusion

IOT-09C establishes the architectural requirements for assessing whether a historical XDC token-transfer transaction belongs to the canonical blockchain history covered by an independently authorized trusted-node finality assertion.

It requires exact transaction-block identity, a policy-approved ancestry relationship, approved finality semantics, historically consistent observations and independently authorized policy governance.

The preferred initial architecture uses reproducible parent-hash ancestry evidence, without requiring independent XDPoS consensus verification or unbounded historical reconstruction.

G3 preserves the separation between source authenticity, ancestry, finality, token semantics and complete payment assurance.

The accepted G1, G2 and G3 decisions together provide an architectural foundation for a subsequent combined implementation-readiness assessment.

They do not, by themselves, establish operational trust gates or authorize positive live XDC payment-assurance results.

Acceptance of this record authorizes documentation of the agreed G3 architecture only.

**Evidence tells a story. Assurance has boundaries.**

---

## References

### Internal architecture and implementation

- `docs/interoperability/proofpath-iot06-cross-platform-assurance-architecture.md`
- `docs/interoperability/xdc/proofpath-xdc-iot07-payment-assurance-profile.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09-trusted-evidence-readiness.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09b-historical-token-semantics.md`
- `src/verification/xdcTypes.ts`
- `src/verification/xdcTokenTransfer.ts`

### Supporting technical references

- XDC Network documentation: https://docs.xdc.network/
- XDC Network GitHub repositories: https://github.com/XinFinOrg
- Ethereum JSON-RPC block and transaction query conventions: https://ethereum.org/en/developers/docs/apis/json-rpc/

These references provide supporting technical context. Their existence does not independently authorize a particular node implementation, finalized-checkpoint assertion or historical XDC consensus interpretation for ProofPath assurance.
