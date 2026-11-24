
# ProofPath IOT-09B — XDC Historical Token Implementation and Transfer Semantics Architecture

**Record:** IOT-09B
**Status:** ACCEPTED — Architecture Only
**Date:** 2026-11-24
**Repository:** `rgraulus/proofpath`
**Baseline:** `main` at `9b79c24`
**Network:** XDC Apothem (`eip155:51`)
**Assurance profile:** `trusted_node_finalized_xdc_token_transfer_v1`
**Scope:** G2 Historical Token Implementation and Transfer Semantics
**Architecture decisions:** G2-D1 through G2-D6 — accepted
**Implementation authorization:** NOT GRANTED
**Operational G2 assurance:** NOT ESTABLISHED
**Production XDC payment assurance:** NOT ESTABLISHED

---

## 1. Executive Summary

IOT-09B defines ProofPath's architecture for establishing the historically applicable implementation identity and independently approved transfer semantics of a fungible token involved in an XDC payment observation.

It addresses **G2 — Historical Token Implementation and Transfer Semantics**, the second of three outstanding trust prerequisites identified by the accepted IOT-07 XDC Payment-Assurance Profile:

- **G1:** Trusted-source provenance and independent policy authority.
- **G2:** Historical token implementation and transfer semantics.
- **G3:** Canonical ancestry and trusted finality.

IOT-09A established the accepted architecture for G1. IOT-09B defines the complementary requirements for G2.

The fundamental G2 problem is that a successful blockchain transaction, correctly formatted `transfer(address,uint256)` calldata, a matching `Transfer` event and an identifiable token contract do not, individually or collectively, establish that the historically applicable contract implementation possessed the transfer behavior required by ProofPath's payment-assurance claim.

A token contract may be upgradeable, delegate execution to another implementation, exhibit nonstandard balance effects or depend on historical state that is not recoverable from a simple block-end observation.

Accordingly, G2 requires an independently governed process for identifying the applicable historical implementation, resolving supported delegation and upgrade behavior, establishing the relevant execution context and authorizing a bounded interpretation of token-transfer semantics.

### 1.1 Accepted assurance approach

IOT-09B adopts **approved-semantics transfer assurance**, rather than independent historical balance-state proof.

Under this model, ProofPath may establish that authenticated historical transaction observations are consistent with the transfer behavior of an independently approved implementation, operating under sufficiently established historical execution conditions.

This does not represent independent reconstruction or proof of actual balance-state transitions.

### 1.2 Architecture disposition

Six architectural decisions, G2-D1 through G2-D6, have been individually and collectively accepted.

Their consolidated architectural requirements are documented below.

Acceptance of this record does not constitute operational semantic-policy approval, implementation authorization, validation of the historical reference token or authorization to emit positive live XDC payment-assurance results.

**Architectural principle:** Evidence tells a story. Assurance has boundaries.

---

## 2. Background and Architectural Baseline

### 2.1 IOT-01 through IOT-05 — Evidence portability

Earlier XDC interoperability milestones established the ability to package, preserve, exchange and reassess XDC-related evidence using ProofPath's portable evidence architecture.

These milestones demonstrated evidence integrity and portability, not independently verified XDC token settlement.

### 2.2 IOT-06 — Cross-platform assurance

IOT-06 established the architectural separation between network identity, independently approved payment expectations, transaction execution, asset transfer, settlement finality, agent authority and cross-platform transaction binding.

IOT-09B preserves the IOT-06 principles of independent trust policy, historical context, explicit assurance claims, fail-closed evaluation and separation between assessment and execution.

### 2.3 IOT-07 — XDC Payment-Assurance Profile

IOT-07 established the proposed profile:

`trusted_node_finalized_xdc_token_transfer_v1`

The initial profile concerns an explicitly approved fungible token on XDC Apothem, a direct `transfer(address,uint256)` transaction, independently established payment expectations and a trusted-node finality model.

IOT-07 identified historical implementation identity and token-transfer semantics as unresolved prerequisites.

In particular, reported contract-code presence, metadata and matching transfer events do not establish the full historical implementation or its behavior.

### 2.4 IOT-08 — Deterministic simulated verification

IOT-08 introduced an isolated, deterministic XDC token-transfer verifier with simulation-only inputs.

The verifier separates the `tokenSemantics` obligation from transaction execution, transfer matching, source trust and finality.

Its historical implementation reference and supported-semantics assertion are simulation inputs, not independently approved or authenticated historical findings.

Consequently, successful deterministic checks remain insufficient for positive live payment assurance.

IOT-09B defines the future architecture required to substantiate the G2 obligation without modifying the current IOT-08 implementation.

### 2.5 IOT-09A — Trusted-source provenance and policy authority

IOT-09A established six accepted G1 architectural decisions addressing:

- Independently approved trusted RPC sources.
- Separately governed trust-policy authority.
- Controlled source authentication.
- Authorized evidence acquisition and collector attestations.
- Portable evidence and bounded offline reassessment.
- Separation of authenticated source reporting from blockchain truth.

G2 shall reuse these architectural foundations.

G1's acceptance as an architecture does not mean that source admission, collector authentication or operational policy authorization has already been established.

---

## 3. G2 Assurance Objective and Reference Scope

### 3.1 Assurance objective

G2 shall determine whether the observed historical token transfer is consistent with an independently approved interpretation of the implementation and transfer behavior applicable when the transaction executed.

This requires distinguishing:

1. Token account identity.
2. Historical runtime implementation identity.
3. Effective delegation and upgrade state.
4. Relevant transaction-time execution conditions.
5. Independently approved transfer semantics.
6. Sufficient evidence and applicable policy authority.

G2 does not independently establish canonical-chain finality, commercial intent, independently proven balance mutations or complete x402 payment satisfaction.

### 3.2 Reference network and token

The initial scope remains the XDC Apothem reference environment documented by IOT-07.

| Property | Reference |
|---|---|
| Network | `eip155:51` |
| Asset | XDC Apothem USDC test token |
| Contract | `0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4` |
| Reported decimals | 6 |
| Transaction | `0xc7d36e42643c270ab70436770bae39c680782b70b6f63f2940a53b9cc2232520` |
| Block number | `0x51ceee7` |
| Block hash | `0xf04560246430c88fe02cf327d60b9f2dc7070bc0bd1564b70ddece9823d56554` |
| Transfer selector | `0xa9059cbb` |
| Atomic amount | `10000` |
| Reported execution | Successful |
| Matching transfer events | 1 |

These values define the previously accepted technical reference fixture.

They do not establish an approved historical implementation, identify the actual proxy pattern or prove historical balance-state changes.

### 3.3 Initial scope restriction

The initial architecture prioritizes directly implemented token contracts with independently approved, conventional ERC-20/XRC-20-compatible direct-transfer behavior.

Supported proxy or upgrade patterns may be admitted only where their applicability, historical resolution and evidentiary requirements are independently justified.

The design shall not become a generic EVM contract analyzer or universal proxy-resolution engine.

---

## 4. Accepted Architecture Decisions

### 4.1 G2-D1 — Historical Contract Identity

**Status: ACCEPTED**

ProofPath must identify and bind the historically effective runtime implementation of an explicitly approved token contract to the transaction-relevant execution context.

Contract address, token metadata and emitted events are insufficient substitutes for historical implementation identity.

If that identity cannot be established under the approved trust model, G2 remains indeterminate.

**Architectural implications:**

- The approved token account and its executable implementation are distinct concepts.
- Historical runtime code identity must be established through sufficient authenticated observations.
- Relevant delegated implementation identity must be resolved where applicable.
- Current implementation identity does not automatically establish historical implementation identity.
- Matching code commitments identify code but do not independently approve its semantics.

**Boundary:** G2-D1 establishes implementation identity requirements, not behavioral approval or independent execution correctness.

### 4.2 G2-D2 — Historical Delegation and Upgrade Resolution

**Status: ACCEPTED**

ProofPath shall resolve the historically effective implementation and relevant delegation path of an approved token contract at the transaction's execution point.

Only explicitly supported and independently approved delegation or upgrade patterns may satisfy G2.

Historical code and storage observations must be temporally consistent with the evaluated transfer.

Block-end implementation state, current implementation state, proxy metadata or upgrade events alone shall not be treated as definitive proof of the implementation that executed the transaction.

Unsupported, ambiguous or historically unresolved delegation and upgrade behavior shall produce an indeterminate G2 assessment.

**Initial support boundary:**

| Implementation pattern | Architectural treatment |
|---|---|
| Direct implementation | Initial priority |
| Conventional ERC-1167 delegation | Candidate for bounded support |
| Conventional ERC-1967 transparent/UUPS delegation | Candidate for bounded support |
| Beacon-based delegation | Deferred unless specifically justified |
| Diamond/facet architecture | Excluded initially |
| Custom or unknown delegation | Excluded initially |

Candidate status does not constitute approval.

**Boundary:** Correct proxy resolution requires historical execution applicability, not merely knowledge of the proxy's implementation at a later state boundary.

### 4.3 G2-D3 — Independently Approved Historical Transfer Semantics

**Status: ACCEPTED**

ProofPath shall evaluate historical token-transfer evidence against an independently authorized semantic profile bound to the approved token contract, historically effective implementation identity and applicable execution context.

The initial profile shall support only explicitly approved, conventional ERC-20/XRC-20-compatible direct `transfer(address,uint256)` behavior, with exact atomic-amount semantics, corresponding sender and recipient balance effects under the approved behavioral model, and consistent transfer-event emission.

Implementation identity, successful transaction status, calldata matching, token metadata or emitted transfer events shall not independently establish semantic correctness.

Fee-on-transfer, rebasing, reflection, unapproved hooks, nonstandard balance effects, unsupported execution paths or other materially ambiguous behavior shall not qualify for positive G2 assessment.

Where the historical implementation's supported behavior, applicable conditions or independent semantic approval cannot be sufficiently established, G2 shall remain indeterminate.

**Accepted assurance model:**

Approved-semantics transfer assurance, not independent balance-effect proof.

G2 satisfaction establishes that the observed transfer is consistent with approved historical token semantics under the stated trusted-source model.

It does not independently prove balance-state changes, finality, commercial payment purpose or complete x402 settlement.

### 4.4 G2-D4 — Historically Applicable Execution Context

**Status: ACCEPTED**

ProofPath shall evaluate token-transfer semantics against the contract implementation and relevant execution conditions applicable at the historical transaction's execution point.

Historical block-level code and storage observations may support this assessment but shall not automatically establish transaction-level implementation identity or state when intra-block changes are possible.

The approved semantic profile shall define the evidence necessary to establish the relevant execution context, including implementation continuity, supported delegation behavior and material state-dependent transfer conditions.

For immutable direct implementations with independently approved and sufficiently constrained transfer behavior, a bounded historical code-identity assessment may be accepted without full transaction replay, provided the applicable policy establishes why the available evidence is sufficient.

For upgradeable or materially state-dependent implementations, ProofPath shall require additional independently approved historical evidence sufficient to resolve the applicable execution path and relevant conditions.

Historical execution traces, storage observations or other node-reported execution evidence shall remain subject to G1 authentication, provenance and policy authorization. Their availability alone shall not establish independent execution correctness.

Missing, incomplete, contradictory or temporally ambiguous evidence shall result in an indeterminate G2 assessment unless sufficient trusted evidence establishes a definitive failure.

**Accepted constraints:**

1. No universal execution-replay requirement.
2. No unsupported inference from block-end state where transaction-time conditions remain unresolved.

**Boundary:** G2 satisfaction shall not be represented as independent state-transition proof, independently verified consensus or final settlement assurance.

### 4.5 G2-D5 — Independently Authorized Historical Semantics Policy

**Status: ACCEPTED**

ProofPath shall authorize historical token-transfer interpretations through a separately governed, versioned semantic-policy component within the independent trust-policy architecture established by G1.

Each approved semantic profile shall bind an explicit network and token contract to the approved historical implementation identity, supported delegation or upgrade pattern, applicable execution context, transfer-behavior classification, required evidence and known exclusions.

Semantic approval shall require an independently evaluated evidentiary basis.

Contract metadata, bytecode hashes, RPC assertions, published audits or evidence-producer declarations shall not independently constitute policy authorization.

Approval authority, policy identity, version, integrity commitment, effective period, supersession and revocation shall be independently established and verifiable.

Historical implementation applicability and semantic-policy authorization shall remain distinct obligations.

Retrospective approval or reassessment shall not be represented as contemporaneous authorization.

Missing, expired, revoked, unauthorized or insufficiently supported semantic-policy authority shall not produce positive G2 assurance under the applicable assessment rules.

Where authority is unresolved, the result shall remain indeterminate unless sufficient trusted evidence establishes a definitive contradiction.

**Accepted constraints:**

1. Reuse G1's independent governance; do not create a second trust registry unnecessarily.
2. A code hash identifies code but does not automatically approve its semantics.
3. Later policy approval or reassessment shall not retroactively rewrite the original assurance history.

**Boundary:** G2 semantic-policy approval does not establish G1 source authentication, G3 finality, independent execution-state proof, commercial payment purpose or x402 settlement satisfaction.

### 4.6 G2-D6 — Portable Historical Semantics Evidence and Bounded Reassessment

**Status: ACCEPTED**

ProofPath shall preserve historical token-implementation and transfer-semantics evidence in a portable, integrity-protected format consistent with its existing PP-01 evidence architecture and PP-02 assessment boundaries.

The evidence package shall retain sufficient information to identify the evaluated transaction, approved token contract, historically applicable runtime implementation, relevant delegation and execution context, authorized semantic profile, governing policy version, acquisition provenance and assessment findings.

Evidence sufficiency shall be determined by the independently approved semantic profile and the historical implementation's supported behavior.

Universal execution replay shall not be required, and unsupported assumptions about historical execution state shall not be accepted.

Offline reassessment shall distinguish historical reproduction under the original policy from reassessment under a separately authorized later policy.

The original assessment and its policy basis shall remain preserved and identifiable.

Evidence integrity, authenticated acquisition, implementation identity, semantic authorization, execution applicability and finality shall remain separate assurance obligations.

A valid evidence package shall not automatically establish the truth or completeness of its underlying observations.

G2 outcomes shall be explicit, deterministic and explainable, using `satisfied`, `failed` or `indeterminate` obligation findings.

Definitive failure shall require sufficient trusted contradictory evidence; unresolved or insufficient evidence shall remain indeterminate.

**Accepted constraints:**

1. Reuse PP-01 and PP-02 rather than creating a parallel evidence framework.
2. Keep offline claims bounded to reproducibility against preserved evidence.
3. Preserve fail-closed semantics whenever independent authorization or historical interpretation is unresolved.

**Boundary:** No positive live payment assurance shall be enabled solely through G2 evidence portability or reassessment.

---

## 5. Consolidated Logical Architecture

G2 introduces a logical historical semantics assessment within the existing ProofPath assurance architecture.

The design does not require a separate network service or independent repository subsystem for each responsibility.

### 5.1 Independent policy authority

The G1 trust-policy authority governs source trust and the independently approved historical semantic profiles used by G2.

Semantic-policy authorization shall remain independently verifiable and distinguishable from the evidence producer's assertions.

### 5.2 Authenticated historical observations

G1-controlled acquisition provides the provenance boundary for relevant historical contract-code observations, implementation-resolution evidence, transaction observations and any required execution-context data.

Authenticated acquisition does not independently prove that source-reported historical execution facts are correct.

### 5.3 Historical implementation resolution

The G2 assessment establishes the token account, applicable runtime implementation, supported delegation path and transaction-time applicability.

The applicable semantic profile determines whether the available historical evidence is sufficient.

### 5.4 Approved semantic assessment

The independently authorized semantic profile governs the interpretation of the effective implementation's supported transfer behavior.

This interpretation is evaluated alongside the transaction-specific consistency checks established by IOT-08.

### 5.5 Portable evidence and reassessment

The relevant observations, policy provenance, implementation commitments and semantic-assessment findings are retained through the existing PP-01 evidence architecture.

Offline assessment preserves the distinction between the integrity of evidence and the authority or truthfulness of its origin.

### 5.6 Separation from G3 and combined payment assurance

G2 does not determine whether the transaction belongs to a finalized canonical chain.

That remains G3's responsibility.

A future combined payment-assurance result may be positive only after all mandatory, independently authorized obligations have been satisfied under the applicable policy.

---

## 6. Required G2 Evidence Contract

The following defines architectural evidence obligations.

Exact TypeScript interfaces, field names, serialization formats and mappings to the existing PP-01 manifest remain implementation-design tasks, not decisions made by this record.

### 6.1 Transaction reference

The portable evidence must identify:

- Network.
- Transaction hash.
- Relevant block hash and number.
- Transaction position or equivalent execution-context reference.
- Approved token contract.
- Relevant transaction and receipt observations.

### 6.2 Historical code identity

The evidence must preserve the historical runtime-code identity required by the approved semantic profile.

Depending on that profile, the evidence may include code bytes, verifiable commitments to code bytes or sufficient referenced acquisition evidence.

A code commitment without sufficient provenance or authority does not establish historical truth.

### 6.3 Delegation and upgrade resolution

Where relevant, preserve:

- Supported delegation or proxy pattern.
- Applicable implementation address.
- Relevant historical implementation code identity.
- Historical storage or delegation-resolution observations.
- Evidence supporting the applicable execution-point implementation.
- Any unresolved ambiguity or unsupported delegation path.

### 6.4 Historical execution applicability

The evidence must identify the basis on which the resolved implementation and relevant operating conditions are considered applicable to the evaluated transaction.

This may require transaction ordering, historical state observations, supported execution-path evidence or other profile-approved information.

Block-end state alone shall not be presumed sufficient when material intra-block changes remain possible.

### 6.5 Semantic-policy authority

Preserve references sufficient to establish:

- Approved semantic-profile identity and version.
- Relevant network and token binding.
- Approved implementation identity and applicability.
- Supported transfer behavior.
- Required operating conditions.
- Unsupported or excluded behavior.
- Approval evidence and authority.
- Policy integrity commitment.
- Applicable effective-period, supersession and revocation context.

### 6.6 Source and collector provenance

G2 evidence must retain its relationship to G1 acquisition evidence, including the applicable source authorization, collector attestation and evidence-integrity commitments.

G2 shall not independently declare source authentication merely because it can parse or validate acquired historical data.

### 6.7 Assessment findings

The package must preserve:

- Evaluated G2 obligations.
- Applicable semantic profile.
- Relevant evidence references.
- Assessment mode.
- Outcome and reason codes.
- Explicit limitations.
- Original or reassessment policy context.

The evidence format must support later independent reassessment without silently changing the originally recorded conclusion.

---

## 7. Outcome Semantics and Assurance Boundaries

### 7.1 Satisfied

The G2 obligation may be classified as `satisfied` only where sufficient evidence establishes, under an independently approved applicable policy:

- The historical token and implementation identity.
- The applicable delegation and execution context.
- The approved transfer-behavior interpretation.
- Consistency of the evaluated transaction with the supported semantic conditions.

G2 satisfaction is not equivalent to overall payment assurance.

### 7.2 Failed

The G2 obligation may be classified as `failed` when sufficiently trusted evidence establishes a definitive contradiction to the applicable approved implementation or semantics requirements.

Examples include an established prohibited implementation or an established unsupported transfer behavior contrary to mandatory policy requirements.

A failure must identify the contradicted obligation.

A missing observation or unresolved authorization is not automatically a definitive failure.

### 7.3 Indeterminate

The G2 obligation shall remain `indeterminate` when the available evidence or authority is insufficient to establish either satisfaction or definitive contradiction.

Examples include:

- Unknown historical implementation.
- Unresolved delegation or upgrade behavior.
- Ambiguous transaction-time execution conditions.
- Missing approved semantic profile.
- Unresolved semantic-policy validity.
- Insufficient authenticated historical evidence.
- Materially contradictory observations that cannot be resolved.

Indeterminate results fail closed for payment-assurance purposes.

### 7.4 Overall payment-verification separation

The existing XDC result model distinguishes the token-semantics obligation from source trust, transaction execution, transfer matching and finality.

A future implementation must preserve this separation.

Even where G2 is satisfied, the overall result cannot be promoted to positive live assurance while any mandatory G1, G3, payment-expectation or transaction obligation remains unresolved.

---

## 8. Offline Reassessment and Policy Evolution

### 8.1 Historical reproduction

Historical reproduction evaluates preserved evidence against the original policy and assessment context.

Its purpose is to reproduce the earlier bounded conclusion.

It does not imply that the original policy remains currently authorized.

### 8.2 Current-policy reassessment

Current-policy reassessment evaluates preserved historical evidence against a separately authorized later policy.

It must identify the policy and applicable authorization context used for the new decision.

Where current policy introduces additional requirements that cannot be satisfied from the preserved evidence, the reassessment must remain appropriately bounded or indeterminate.

### 8.3 No retrospective rewriting

The original assessment, its provenance, policy references and historical limitations shall remain preserved.

Later approval, supersession or revocation does not silently alter what was originally established.

### 8.4 Offline assurance limitations

Offline reproducibility does not establish:

- Fresh RPC authentication.
- Fresh acquisition of historical state.
- Independent blockchain consensus.
- Independent balance-state proof.
- Current finality beyond what the preserved evidence and applicable trust model support.

---

## 9. Required G2 Acceptance Criteria

This matrix defines architecture-level requirements for future implementation and testing.

It does not report completed operational tests.

| ID | Requirement |
|---|---|
| G2-A01 | Bind evaluation to the exact approved network and token contract |
| G2-A02 | Establish historically applicable runtime implementation identity |
| G2-A03 | Resolve supported delegation paths where applicable |
| G2-A04 | Resolve material transaction-time upgrade ambiguity |
| G2-A05 | Require independently approved implementation semantics |
| G2-A06 | Validate supported direct-transfer behavior under the approved model |
| G2-A07 | Reject positive assessment for unsupported or materially ambiguous token behavior |
| G2-A08 | Require sufficient evidence of relevant historical execution conditions |
| G2-A09 | Preserve independent semantic-policy authorization and historical applicability |
| G2-A10 | Preserve effective-period, supersession and revocation context |
| G2-A11 | Retain authenticated provenance and historical evidence commitments |
| G2-A12 | Preserve PP-01 portability and PP-02 assessment boundaries |
| G2-A13 | Distinguish historical reproduction from current-policy reassessment |
| G2-A14 | Produce explicit and explainable G2 obligation outcomes |
| G2-A15 | Keep G2 separate from G1 source trust and G3 finality |
| G2-A16 | Prevent G2-only evidence from enabling positive live payment assurance |

### 9.1 Required negative scenarios

| Scenario | Expected architectural disposition |
|---|---|
| Historical code identity unavailable | Indeterminate |
| Current implementation known but historical implementation unknown | Indeterminate |
| Unsupported proxy or delegation mechanism | No positive G2 assurance |
| Intra-block upgrade timing unresolved | Indeterminate |
| Effective implementation explicitly prohibited by trusted policy | Failed |
| Material transfer behavior unsupported by the approved profile | Failed if sufficiently established by trusted evidence; otherwise indeterminate |
| Semantic-policy approval missing | Indeterminate |
| Semantic-policy validity or revocation unresolved | Indeterminate |
| Producer-supplied policy digest matches but independent authorization is missing | Indeterminate |
| Execution trace supplied without sufficient approved provenance | Indeterminate |
| Material execution condition unestablished | Indeterminate |
| Portable evidence integrity invalid | Integrity failure; no positive assurance |
| G2 satisfied but G1 unresolved | Overall payment assurance remains indeterminate |
| G2 satisfied but G3 unresolved | Overall payment assurance remains indeterminate |
| G2 satisfied but independent payment expectations missing | Overall payment assurance remains indeterminate |

### 9.2 Required positive eligibility scenario

A future G2 assessment may be eligible for `satisfied` when the approved token and its historically effective implementation are established, supported behavior is independently authorized, relevant execution conditions are adequately evidenced and transaction-specific observations are consistent with that behavior.

This is a future acceptance criterion, not a claim that the IOT-07 reference fixture currently satisfies it.

---

## 10. Outstanding Operational and Implementation Dependencies

The following dependencies remain unresolved by this architecture record.

### 10.1 Historical token investigation

- Establish the actual runtime implementation of the XDC Apothem reference token at the historical transaction.
- Determine whether the reference token is direct, proxied or otherwise delegated.
- Determine the evidence sufficient to establish historical execution-point applicability.
- Identify any material token-specific execution conditions.

### 10.2 Independent semantic approval

- Establish the evidentiary basis for approving the relevant historical implementation's transfer behavior.
- Define and approve the applicable semantic-policy entry.
- Establish independent policy authorization, validity and revocation handling.

### 10.3 G1 operational readiness

- Admit and authenticate the approved historical evidence source.
- Operationalize the independently governed policy authority.
- Implement and authorize the acquisition collector.
- Establish the relevant provenance and acquisition-attestation controls.

### 10.4 Evidence and assessment integration

- Map G2 evidence requirements into existing PP-01 structures.
- Define exact implementation-level data contracts.
- Integrate future G2 findings with the existing IOT-08 obligation model.
- Validate deterministic negative and positive-eligibility scenarios.
- Preserve historical and current-policy reassessment semantics.

### 10.5 G3 and combined payment assurance

- Establish the approved canonical ancestry and trusted-finality model.
- Resolve all remaining transaction and independently approved payment-expectation obligations.
- Conduct a separate combined implementation-readiness assessment.

None of these requirements is declared operationally satisfied by acceptance of the G2 architecture.

---

## 11. Scope Exclusions

IOT-09B excludes:

- Runtime code changes.
- Live RPC acquisition or transaction execution.
- Source admission or collector deployment.
- Production semantic-policy approval.
- Wallet signing, custody or token transfers.
- General-purpose EVM execution replay.
- Universal token or proxy semantics.
- Independent historical balance-state proof.
- Independent XDPoS consensus verification.
- G3 finality implementation.
- Production XDC payment verification.
- Activation of live `verified` outcomes.
- x402 facilitator, gateway or resource-release integration.
- Cross-chain settlement or bridging.
- Agent identity, registry or delegated-authority verification.
- Changes to existing public SDK exports.
- Changes to established PP-01, PP-02, Concordium or Base assurance behavior.

Any expansion requires separate justification and explicit authorization.

---

## 12. Recommended Next Steps

### 12.1 IOT-09B — Documentation acceptance and publication

Publish the formally accepted architecture through one narrowly scoped documentation-only pull request.

No runtime implementation should be included.

### 12.2 IOT-09C — G3 Canonical Ancestry and Trusted Finality

Develop the architecture for establishing an approved trusted-node interpretation of historical canonical-chain ancestry and finalized checkpoints.

The resulting assurance claim must distinguish node-reported finality from independent XDPoS consensus verification.

### 12.3 Combined implementation-readiness review

After G1, G2 and G3 architectural decisions are accepted and documented, conduct one consolidated readiness review covering:

- Operational trust-policy governance.
- Source and collector authorization.
- Historical token implementation and semantic-policy approval.
- Canonical ancestry and finality.
- Independently approved payment expectations.
- Evidence completeness, portability and reassessment.
- Explicit live-assurance activation prerequisites.

This review shall determine whether a focused implementation phase is justified.

It shall not assume that architecture acceptance authorizes production operation.

---

## 13. Architecture Acceptance Decision

### 13.1 Decision register

| Decision | Subject | Disposition |
|---|---|---|
| G2-D1 | Historical Contract Identity | ACCEPTED |
| G2-D2 | Historical Delegation and Upgrade Resolution | ACCEPTED |
| G2-D3 | Independently Approved Historical Transfer Semantics | ACCEPTED |
| G2-D4 | Historically Applicable Execution Context | ACCEPTED |
| G2-D5 | Independently Authorized Historical Semantics Policy | ACCEPTED |
| G2-D6 | Portable Historical Semantics Evidence and Bounded Reassessment | ACCEPTED |

All six decisions were individually accepted during the IOT-09B architecture review.

The consolidated architecture record was subsequently approved without substantive architectural changes.

### 13.2 Consolidated acceptance classification

**Record disposition:** ACCEPTED — Architecture Only.

**G2 architectural decisions:** ACCEPTED.

**Historical reference implementation verified:** NO.

**Historical semantic-policy approval established:** NO.

**G1 operational source/collector trust established:** NO.

**G3 trusted finality established:** NO.

**Production XDC payment assurance established:** NO.

**Implementation authorization:** NOT GRANTED.

### 13.3 Final architectural conclusion

IOT-09B establishes the architectural requirements for assessing whether an observed XDC token transfer is consistent with the historically applicable, independently approved behavior of its token implementation.

It does so without requiring universal execution replay, permitting self-authorized semantic interpretations or elevating evidence consistency into independent proof of token balances or blockchain finality.

The architecture preserves ProofPath's separation of evidence integrity, source provenance, historical implementation identity, independently authorized semantics, transaction execution and settlement finality.

Acceptance authorizes documentation of the agreed architecture only.

Operational implementation and any future positive live XDC payment-assurance capability remain subject to separately approved prerequisites.

**Evidence tells a story. Assurance has boundaries.**

---

## References

### Internal architecture and implementation

- `docs/interoperability/proofpath-iot06-cross-platform-assurance-architecture.md`
- `docs/interoperability/xdc/proofpath-xdc-iot07-payment-assurance-profile.md`
- `docs/interoperability/xdc/proofpath-xdc-iot09-trusted-evidence-readiness.md`
- `src/verification/xdcTypes.ts`
- `src/verification/xdcTokenTransfer.ts`

### Supporting token and proxy standards

- ERC-20 — Fungible Token Standard: https://eips.ethereum.org/EIPS/eip-20
- ERC-1167 — Minimal Proxy Contract: https://eips.ethereum.org/EIPS/eip-1167
- ERC-1967 — Proxy Storage Slots: https://eips.ethereum.org/EIPS/eip-1967
- ERC-2535 — Diamonds, Multi-Facet Proxy: https://eips.ethereum.org/EIPS/eip-2535

These external standards provide supporting terminology. They do not independently authorize any historical XDC token implementation for ProofPath assurance.
