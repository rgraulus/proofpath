
# ProofPath Registry Assurance Profile v1

## PP-R2-D1 — Design Specification and Governance Decision Record

**Document ID:** PP-R2-D1  
**Version:** 1.0  
**Design acceptance date:** 2026-11-17  
**Milestone:** R2 — Registry Assurance Profile v1 and Governance Decision  
**Repository:** `rgraulus/proofpath`  
**Baseline branch:** `main`  
**Baseline commit:** `3691a2048b264e3455ad8420eedea10bb4dfac2d`  
**Design status:** ACCEPTED — Approved for R3 validation planning  
**Technical execution status:** NOT AUTHORIZED  
**Registry trust status:** `TRUST-01 = OPEN`  
**Registry provenance disposition:** `PROVENANCE_NOT_APPROVAL_READY`  
**Implementation and publication status:** NOT AUTHORIZED

---

## 1. Executive Decision Summary

### 1.1 Purpose

This document defines the assurance criteria and governance requirements under which ProofPath may evaluate narrowly bounded trust claims concerning a deployed Concordium CIS-8004 Agent Registry.

The immediate subject is Concordium Testnet Registry contract instance `12802/0`, including the historical module transitions and the October 6, 2026 Module B to Module C upgrade.

The profile separates:

1. Authenticated blockchain observations.
2. Historical module-transition evidence.
3. Administrative authorization consistency.
4. Implementation source/build correspondence.
5. Independent governance approval.
6. Downstream agent, external-key, identity, seller, and transaction assurance.

A positive finding in one category does not automatically establish a stronger or different category.

### 1.2 Guiding principle

> Evidence tells a story. Assurance has boundaries.

ProofPath is a portable evidence-assurance and accountability layer. It is not a payment processor, independent blockchain consensus client, certificate authority, production-certified assurance service, or universal transaction verifier.

### 1.3 Accepted R2 design decision

**Disposition: APPROVED FOR R3 VALIDATION PLANNING.**

The project owner formally accepted the R2 design on November 17, 2026, including three review amendments:

- **Amendment A:** Clarify the independence, authority, and limits of ProofPath governance approval.
- **Amendment B:** Distinguish point-in-time historical findings from uninterrupted historical trust.
- **Amendment C:** Permit R3 technical closeout when source/build evidence remains insufficient, provided all deficiencies are explicitly recorded.

This acceptance establishes the governing design baseline for R3 planning.

It does not authorize R3 execution, Module C approval, policy changes, blockchain transactions, public SDK publication, or production deployment.

### 1.4 Milestone separation

- **R1:** Historical investigation — complete.
- **R2:** Assurance design — accepted.
- **R3:** Minimal independent technical validation — planning authorized; execution requires separate approval.
- **R4:** Final Registry trust disposition — pending.
- **I6:** Developer integration experience and roadmap closeout — remains separate until R4 disposition.

R2 through R4 must not become an open-ended Registry implementation program.

---

## 2. Established Engineering Baseline

### 2.1 Repository verification

The November 17, 2026 read-only inspections confirmed:

| Property | Verified baseline |
| --- | --- |
| Repository | `rgraulus/proofpath` |
| Branch | `main` |
| HEAD | `3691a2048b264e3455ad8420eedea10bb4dfac2d` |
| Working tree | Clean |
| Latest merged PR | #12 — I5 |
| Package | `@proofpath/core` |
| Version | `0.1.0` |
| Publication | `private: true` |
| Runtime | Node.js 22+, TypeScript/ESM |
| SDK entry points | Four |

The previously accepted I5 milestone recorded 10/10 SDK acceptance gates and 388/388 regression tests passing.

Those tests were not rerun during the R2 read-only inspections.

### 2.2 PP-02 — Deterministic consistency assessment

Existing functions:

- `evaluateRegistryTrust()`
- `evaluateOwnerAssurance()`
- `evaluateSellerBinding()`

These functions operate on supplied evidence and policy structures.

They assess consistency, required field structure, policy restrictions, and contradictions.

They do not independently authenticate blockchain observations, module authorization, signatures, identity credentials, seller endpoint control, settlement, or delivery.

Their existing implementations do not produce positive `verified` decisions.

A structurally consistent Registry observation under `evaluateRegistryTrust()` remains `indeterminate` unless the missing external assurance requirements are independently established outside that evaluator.

### 2.3 PP-03 — Specialized verification

Relevant functions:

- `verifyRegistrySnapshot()`
- `digestRegistryPolicy()`
- `verifyAgentAuthority()`
- `digestAgentAuthorityPolicy()`

Existing specialized receipt and settlement verifiers remain separately governed.

The Registry snapshot verifier uses the assurance model:

`trusted_node_finalized_snapshot_v1`

Its narrow claim is:

`registry_module_at_finalized_snapshot`

It verifies a node-reported finalized Registry snapshot against independently supplied policy expectations, including:

- Registry coordinates.
- Expected genesis hash.
- Trusted node endpoint.
- Snapshot freshness.
- Finalized-block assertion.
- Approved module reference.
- Policy digest integrity.

The implementation does not independently verify Concordium consensus or historical upgrade authorization.

Its result explicitly retains:

- `consensusIndependentlyVerified: false`
- `historicalUpgradeAuthorityVerified: false`

These fields must not be reinterpreted or changed as a side effect of R2 governance approval.

### 2.4 Concordium transport boundaries

`ConcordiumRegistrySnapshotTransport` uses TLS-enabled Concordium gRPC access to:

1. Obtain a node-reported latest finalized block.
2. Confirm returned block identity and finality.
3. Read the Registry contract instance at that block.
4. Extract the installed module reference.
5. Return a normalized observation.

The existing interface is designed for latest-finalized observations.

It does not expose arbitrary historical-block selection through its current public contract.

`ConcordiumAgentAuthorityTransport` separately reads CIS-8004 agent records and CIS-8 external-key registrations at the same finalized block.

Those reads require their own independently approved policies and trusted application composition.

### 2.5 Contract preservation

R2 does not authorize changes to:

- Frozen PP-01 schemas.
- PP-02 evaluators or result contracts.
- PP-03 verification semantics.
- Existing SDK statuses or reason codes.
- Existing Registry module allowlists.
- Existing trusted-policy interfaces.
- Gateway, Facilitator, Orchestrator, or Wallet Proxy.
- Deployed Concordium contracts.
- Payment execution or resource-release behavior.

Historical governance evidence may be recorded outside the existing runtime policy schema.

---

## 3. Registry Subject and R1 Evidence Baseline

### 3.1 Network and contract

**Network:** `concordium:testnet`

**Genesis hash:**

`4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796`

**Registry instance:** `12802/0`

**Recorded contract-instance owner:**

`3dt3UMPzRASZndjmKpSWgCP2HhmoxZrgs8FDPtZjNHZzj13hhB`

These identify the Registry under investigation.

They do not independently establish implementation trust.

### 3.2 Observed module references

| Label | Module reference |
| --- | --- |
| A | `2e4fd18a59868e9dbadc03bfab505d307b3f3f5ce9c704e6284d2a626a8e3e41` |
| D | `29f5b89cf1e7f4e38541c8070cbe217c3ed10d9e4ac015d4807002f5e89ea0ad` |
| E | `33e6e42b9d6610acc6c556aaba003cbc4d0de3c6089eab434ef9f7024b72d833` |
| B | `4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac` |
| C | `142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6` |

Module E appeared in earlier Demo4 references.

Module B was previously pinned in the Gateway allowlist.

Module C was the observed installed module during the R1 investigation.

**No module is newly approved by this document.**

### 3.3 Identified historical transitions

| Date | Transition | Observed replacement block |
| --- | --- | ---: |
| 2026-08-05 | A → D | 46,433,013 |
| 2026-08-07 | D → E | 46,520,314 |
| 2026-08-18 | E → B | 46,998,068 |
| 2026-10-06 | B → C | 49,121,731 |

R1 identified four historical upgrade transitions.

This constitutes an observed historical sequence, not an independently exhaustive deployment history.

### 3.4 October 6 upgrade

**Upgrade transaction:**

`c40cd097d516162bb74a57cb16462596057f84c4b5e3ddbf9fe9c021d10f3cb1`

**Pre-upgrade block:** `49,121,730`

**Post-upgrade block:** `49,121,731`

**Transaction sender:**

`3whdieGHx43KKRwQYbC5pAUdmWZ61B7yreNRU9i36MtdCvajR8`

The identified transition was Module B to Module C.

The recorded contract-instance owner remained unchanged.

### 3.5 Historical administrator investigation

R1 performed a historical `CIS-8004.getAdmin` query against the pre-upgrade Registry implementation.

The returned value was independently decoded and compared against the historical upgrade transaction sender.

The resulting findings were:

- `ADMIN_MATCHES_UPGRADE_SENDER=true`
- `ADMIN_MATCHES_INSTANCE_OWNER=false`

The sender/owner discrepancy identified during the initial investigation was thereby resolved.

The historical upgrade sender matched the administrator reported immediately before the upgrade.

### 3.6 R1 limitations

The result does not independently establish:

- The complete historical access-control algorithm.
- Enforcement of the intended administrator-only upgrade condition.
- The absence of alternative privileged upgrade paths.
- Administrative governance legitimacy.
- Source/build correspondence.
- Complete deployment-to-present upgrade history.
- Independent consensus verification.
- ProofPath trust-root approval.

The historical observations relied on configured Concordium Testnet node access and independently performed decoding and comparison.

They are not self-contained cryptographic consensus proofs.

### 3.7 R1 disposition

**Historical investigation:** COMPLETE.

**Administrator/sender discrepancy:** RESOLVED.

**Implementation provenance approval:** NOT ESTABLISHED.

**TRUST-01:** OPEN.

**Registry provenance:** `PROVENANCE_NOT_APPROVAL_READY`.

R2 preserves all of these findings.

---

## 4. Assurance Claim Taxonomy

Six separately assessable claims define this profile.

### C1 — Network identity

**Claim:** Evidence belongs to the intended Concordium network.

Required evidence:

- Independently specified expected genesis hash.
- Node-reported genesis hash.
- Configured network context.
- Trusted endpoint and authenticated transport assumptions.
- Reproducible comparison.

A matching string supplied by an untrusted source is insufficient to establish independently authenticated network provenance.

### C2 — Registry module at finalized snapshot

**Claim:** The specified Registry instance had the specified installed module at an identified finalized block, according to the declared trusted-node assurance model.

Required evidence:

- Correct network and genesis.
- Registry index and subindex.
- Exact block identity.
- Node-reported finality.
- Installed module reference.
- Trusted observation context.
- Independently approved module policy when asserting approved-module verification.

A positive C2 observation does not establish historical upgrade authorization or source/build integrity.

### C3 — Historical upgrade provenance

**Claim:** A specified module transition corresponds to an identified successful upgrade transaction.

Required evidence:

- Pre-upgrade finalized snapshot.
- Post-upgrade finalized snapshot.
- Previous and replacement module references.
- Upgrade transaction hash.
- Successful execution and relevant upgrade effect.
- Correct Registry coordinates.
- Exact block context and ordering.
- Reproducible observation procedure.

A positive C3 finding establishes the transition under the stated evidence-source assumptions.

It does not establish that the transaction sender was authorized.

### C4 — Historical administrative consistency

**Claim:** The administrator reported by the pre-upgrade implementation matches the sender of the historical upgrade transaction.

Required evidence:

- Correct pre-upgrade block.
- Correct pre-upgrade module.
- Relevant administrative query.
- Original return value or equivalent reproducible evidence.
- Documented decoding procedure.
- Independently obtained transaction sender.
- Exact account-address comparison.
- Successful upgrade transaction context.

A positive result demonstrates administrative consistency.

It does not independently establish enforcement semantics or governance legitimacy.

### C5 — Implementation integrity

**Claim:** The deployed module corresponds to a specifically reviewed implementation and authorization mechanism.

Required evidence:

- Exact deployed module reference.
- Retrieved module binary.
- Binary integrity commitment.
- Identified source revision.
- Build inputs and toolchain.
- Reproducible build or explicitly accepted independent correspondence methodology.
- Review of relevant authorization logic.
- Documented discrepancies and limitations.

Successful demonstrations, compatible entrypoint names, and administrator equality are insufficient to establish C5.

### C6 — Independent governance approval

**Claim:** ProofPath governance explicitly approves reliance on a precisely scoped Registry implementation and trust root.

Required evidence:

- Identified approval authority.
- Reviewable technical evidence.
- Approved claims.
- Exact Registry and network.
- Approved module references.
- Applicable block or time scope.
- Accepted source/build assurance tier.
- Governance decision record.
- Policy identifier, version, and digest.
- Review, expiry, suspension, and revocation conditions.
- Independently controlled approval record.

Approval cannot be derived from the Registry observation itself.

### 4.1 Claim independence

C1–C4 may be positively supported while C5 or C6 remains unestablished.

A positive C4 result does not imply C5.

A positive C5 result does not imply C6.

A positive C6 decision must specify exactly which claims, implementation, and period are approved.

### 4.2 Downstream exclusions

This profile does not automatically establish:

- Registration of a particular agent token.
- Agent Card authenticity or endpoint control.
- CIS-8 external-key registration or key ownership.
- Human identity.
- Seller authorization.
- Payment execution or settlement.
- Resource delivery.
- Transaction-wide assurance.

Each retains its own verification requirements.

---

## 5. Historical Authorization and Temporal Scope

### 5.1 Accepted administrative-consistency rule

**Decision: ACCEPTED.**

A historical `getAdmin` match combined with a successful upgrade transaction provides strong evidence of administrative consistency.

It does not independently establish comprehensive implementation authorization or governance approval.

### 5.2 Implementation enforcement review

A stronger historical authorization claim requires review of the implementation relevant to the upgrade.

Where applicable, R3 shall consider:

1. The deployed pre-upgrade implementation.
2. `getAdmin` semantics.
3. `transferAdmin` semantics.
4. Upgrade authorization checks.
5. Relevant alternative or indirect privileged paths.
6. Historical administrative state.
7. The actual successful upgrade transaction.
8. Source/build correspondence to the reviewed implementation.

Function names and matching account strings are not substitutes for implementation review.

### 5.3 Point-in-time versus continuous trust

**Amendment B — ACCEPTED.**

A positive claim concerning a particular historical block or transition does not establish uninterrupted Registry trust over an earlier or later interval.

Where historical continuity is claimed, all relevant intervening module changes and authority transitions within that interval must be accounted for.

Unknown intervening changes preclude a positive continuity claim but do not invalidate independently supported observations at specific blocks.

R3 is not required to reconstruct a complete deployment history when the accepted claim is limited to an exact historical transition.

### 5.4 Temporal requirements

Every approved historical claim must specify:

- Relevant block or bounded block interval.
- Applicable Registry instance.
- Applicable module reference.
- Evidence-source assumptions.
- Supported administrative and implementation claims.
- Known gaps.
- Whether the claim concerns historical observation or prospective operational reliance.

Approval at one block does not establish approval at all future blocks.

An observed historical module does not establish that the same module remains installed today.

### 5.5 Historical versus current verification

The existing `verifyRegistrySnapshot()` API imposes freshness requirements.

R3 must not manipulate its clock or freshness settings to manufacture a positive live-verification result for an old historical block.

Historical validation shall use a clearly identified historical evidence procedure.

It must not silently modify the current Registry verifier's contract.

---

## 6. Source/Build Assurance Tiers

The following tiers classify evidence and governance assurance.

They are **not new SDK result statuses**.

### Tier 1 — Observed binary

Requirements:

- Retrieve the relevant module bytes.
- Associate the binary with the declared Registry and module reference.
- Record source and historical block context.
- Record byte length.
- Compute and preserve a reproducible integrity commitment.
- Document the extraction procedure.

Supported claim:

The retrieved binary has been identified and integrity-committed within the declared observation context.

Not established:

Source-code correspondence, correctness, authorization enforcement, or governance approval.

### Tier 2 — Reviewed implementation correspondence

Requirements:

- Identify a source-code revision.
- Identify the build toolchain and configuration.
- Reproduce the deployed binary or establish independently defensible alternative correspondence.
- Document differences or limitations.
- Review the relevant upgrade and administrator authorization logic.
- Record reviewer findings.

A non-reproducible build may be considered only when an alternative correspondence method is independently justified and expressly accepted.

Supported claim:

The deployed implementation corresponds to reviewed implementation evidence within the recorded methodology.

### Tier 3 — Governance-approved implementation

Requirements:

- Sufficient Tier 2 implementation evidence.
- Explicit approval of the implementation and relevant authorization model.
- Bound network and contract coordinates.
- Exact approved module references.
- Applicable temporal scope.
- Accepted residual risk.
- Independent governance approval.
- Policy version and digest.
- Review and suspension conditions.

Supported claim:

The implementation is approved for reliance within the specifically documented scope.

### 6.1 Minimum threshold for full approval

**Decision D1 — ACCEPTED.**

Tier 3 is required for full implementation-level Registry trust approval under this profile.

Tier 1 alone is insufficient.

Tier 2 may support an implementation-integrity conclusion but does not establish governance approval.

C1–C4 findings remain independently assessable where evidence supports them.

### 6.2 R1 binary evidence

R1 retrieved the historical Module B and Module C binaries and recorded byte lengths and integrity commitments.

Those findings provide Tier 1 inputs, subject to R3 evidence reproducibility and integrity assessment.

Binary integrity commitments do not themselves prove reviewed source correspondence.

### 6.3 Missing source/build evidence

If the necessary source revisions, build artifacts, toolchain, or correspondence evidence cannot be obtained:

- Record the missing evidence.
- State the highest supportable tier.
- Preserve any independently established C1–C4 findings.
- Withhold a positive C5 or Tier 3 conclusion.
- Pass the documented limitation to R4.

The positive assurance threshold must not be weakened merely to produce an approved status.

---

## 7. Governance and Trust-Root Approval

### 7.1 Approval authority and independence

**Amendment A — ACCEPTED.**

ProofPath governance approval must be independent of the Registry observation, transaction presenter, and deployed contract under assessment.

The ProofPath project owner may approve a bounded trust policy based on independently reviewable technical evidence.

Such approval constitutes a ProofPath governance decision, **not certification by an independent external auditor**.

The approval record shall identify:

- Decision authority.
- Technical evidence reviewers.
- Review methodology.
- Any material conflicts of interest.
- Approved claims and implementation.
- Evidence and policy references.
- Residual assumptions and limitations.

Project-owner governance approval does not independently prove the correctness of the external evidence on which it relies.

### 7.2 Trust-root identity

Each approved trust root must identify:

- Network.
- Expected genesis hash.
- Contract index/subindex.
- Trusted observation source.
- Exact approved module reference or references.
- Approved purpose and assurance model.
- Applicable block or time scope.
- Implementation assurance tier.
- Policy identifier/version.
- Approval reference.
- Effective date and review conditions.

### 7.3 Runtime policy versus governance record

The existing `TrustedRegistryPolicy` remains the current Registry snapshot verifier's runtime policy contract.

Its fields include:

- `policyId`
- `policyVersion`
- `registry`
- `expectedGenesisHash`
- `approvedModuleReferences`
- `trustedNodeEndpoint`
- `maxSnapshotAgeSeconds`
- `requireFinalizedBlock`

R2 does not modify this interface.

Additional historical, governance, reviewer, and effective-range information may be maintained in a separate governance approval record.

That record must identify the exact runtime policy, if any, that it authorizes.

### 7.4 Policy digest

The existing Registry policy commitment is:

`SHA256(UTF8("proofpath:registry-policy:v1") || 0x00 || canonicalJsonBytes(policy))`

The commitment establishes content integrity relative to an expected digest.

It does not authenticate the approval authority.

A caller that controls the policy, expected digest, and injected transport can fabricate a synthetic positive verifier result.

Therefore, operational reliance requires independently approved policy content, independent digest anchoring, and authenticated application-controlled transport.

### 7.5 Governance record and runtime policy consistency

An R4 approval must not be interpreted as authorizing a runtime policy with broader module, Registry, or temporal scope than the approval record allows.

Where the existing runtime interface cannot enforce a governance restriction directly, the integrating application remains responsible for enforcing that restriction before relying on a positive result.

A policy digest match alone does not prove that all governance-specific conditions were enforced.

### 7.6 Policy changes

Changes to module references, approval assumptions, trust sources, Registry identity, or material governance requirements require deliberate review.

No automatic module pin migration is permitted.

Historical approval records shall remain traceable.

### 7.7 Suspension and revocation

Review or suspension is required when:

- An unexpected module reference appears.
- The approved scope is exceeded.
- The policy digest mismatches.
- Transport assumptions are invalidated.
- Source/build correspondence is contradicted.
- Material authorization evidence is invalidated.
- Approval expires.
- Relevant security or governance findings arise.

Suspending current reliance does not erase historical observations.

### 7.8 Unexpected upgrades

An unexpected upgrade is not automatically evidence of malicious activity.

It is also not automatically trusted.

Existing failure and indeterminate semantics remain applicable.

Any change to the trusted module list requires separate approval.

---

## 8. Existing SDK Result and Assurance Boundaries

### 8.1 PP-02 TRUST-01

`evaluateRegistryTrust()` remains a deterministic consistency evaluator.

It must not produce a positive verified conclusion merely because:

- A module matches a supplied allowlist.
- Evidence references appear complete.
- A module transition is structurally consistent.
- A successful-upgrade boolean is asserted.
- Administrator and transaction-sender strings match.

Its existing failure and indeterminate distinctions are preserved.

### 8.2 PP-03 Registry snapshot

`verifyRegistrySnapshot()` may produce `verified` for its narrow trusted-node snapshot claim when its accepted preconditions hold.

That result is not global TRUST-01 approval.

It does not establish historical upgrade authorization.

The existing explicit negative assurance flags remain unchanged.

### 8.3 Agent authority

`verifyAgentAuthority()` supports:

`agent_registry_owner_external_key_binding_at_finalized_snapshot`

Under:

`trusted_node_finalized_agent_key_binding_v1`

It requires independently approved policy assumptions concerning both the agent Registry and external-key Registry.

Approval of CIS-8004 Registry `12802/0` does not automatically approve any CIS-8 Registry contract or module.

A verified agent/key relationship does not establish human identity or action-specific signing authority.

### 8.4 Human-owner assurance

Registered account ownership is not equivalent to verified natural-person identity.

ID-01 L2 requires separately authenticated account control, identity evidence, and subject/account binding.

R2 does not close ID-01 L2.

### 8.5 Seller assurance

Registry membership and Agent Card integrity do not independently establish:

- Endpoint control.
- Seller commercial authorization.
- Authorized payment recipient.
- Finalized settlement.
- Seller-attributed delivery.

R2 does not close SELLER-01.

### 8.6 Transaction-wide assurance

Positive results from separate verifiers cannot be composed into a stronger transaction-wide claim without independently satisfying the composition contract's required evidence and trust conditions.

No new generalized transaction verification claim is authorized.

---

## 9. Concordium Standards Boundaries

### 9.1 Normative references

Official Concordium draft specifications:

- CIS-8004: https://proposals.concordium.com/CIS/cis-8004.html
- CIS-8: https://proposals.concordium.com/CIS/cis-8.html

R3 must identify the specification revision applicable to any implementation-specific conformance claim.

The deployed contract's actual implementation must not be assumed correct solely because its interface resembles a published draft.

### 9.2 CIS-8004

CIS-8004 defines an agent Registry interface, including agent records, ownership, status, and optional external references.

An external reference may identify a CIS-8 registration.

A CIS-8 registration is not a prerequisite for asserting basic CIS-8004 Registry record existence.

### 9.3 CIS-8

CIS-8 defines an external-key registration relationship associated with a Concordium account.

Such a relationship does not automatically establish:

- Verified natural-person identity.
- Unrestricted delegated agent authority.
- Authorization for a specific x402 payment.
- Seller endpoint control.
- Resource-delivery authority.

These claims require independent evidence and policies.

### 9.4 Implementation conformity

Method names and structurally compatible responses do not independently establish implementation conformity.

Any positive implementation-conformance claim requires review of the deployed implementation and the applicable normative requirements.

---

## 10. R3 — Minimal Technical Validation Contract

### 10.1 Entry conditions

R3 execution requires:

1. Accepted R2 governance design.
2. Preserved and reviewable R2 baseline.
3. Frozen C1–C6 claims.
4. Identified historical evidence inputs.
5. Accepted positive and adversarial test matrix.
6. Explicit authorization for the relevant execution activities.
7. Separate approval for any repository modifications.

R2 design acceptance does not itself authorize R3 execution.

### 10.2 Positive validation matrix

| Gate | Required assessment |
| --- | --- |
| R3-P01 | Correct Testnet genesis |
| R3-P02 | Correct Registry instance `12802/0` |
| R3-P03 | Module B at pre-upgrade block |
| R3-P04 | Correct October 6 transaction |
| R3-P05 | Successful upgrade effect |
| R3-P06 | Module C at post-upgrade block |
| R3-P07 | Historical `getAdmin` evidence reproduced |
| R3-P08 | Administrator/sender equality reproduced |
| R3-P09 | Source/build assurance tier assessed |
| R3-P10 | Governance status and outstanding gaps recorded |

Every result shall distinguish:

- Trusted-node observation.
- Independently validated representation or decoding.
- Cryptographic authentication, where actually performed.
- Implementation review.
- Governance approval.

No positive result may claim an assurance method that was not performed.

### 10.3 Adversarial validation matrix

| Case | Required behavior |
| --- | --- |
| Wrong genesis | No positive C1 |
| Wrong Registry | No positive C2 |
| Unfinalized block | No verified finalized-snapshot claim |
| Wrong module | No approved-module claim |
| Wrong transaction | No positive C3 attribution |
| Wrong sender | No positive C4 match |
| Wrong historical administrator block | No positive C4 temporal claim |
| Inconsistent module transition | Contradiction recorded |
| Tampered binary or digest | Integrity failure |
| Unapproved policy | No positive governance trust |
| Missing source/build evidence | C5 limitation recorded |
| Unsupported CIS-8 or Agent Card claims | No downstream assurance promotion |

The validation shall preserve the difference between:

- Contradictory evidence.
- Missing evidence.
- Unsupported claims.
- Unauthenticated evidence.
- Explicit governance rejection.

No new universal result status is introduced.

### 10.4 Reuse existing implementation

R3 should reuse, where applicable:

- `evaluateRegistryTrust()`
- `verifyRegistrySnapshot()`
- `verifyAgentAuthority()`
- Existing policy digest functions.
- Existing Registry snapshot transport.
- Existing agent-authority transport.
- Existing PP-02 and PP-03 tests.
- Existing PP-01 integrity primitives.

The November 17 inventory identified:

- 16 PP-02 Registry trust tests.
- 21 PP-03 Registry snapshot tests.
- 54 PP-03 agent-authority tests.

Total: **91 existing relevant tests**.

These tests provide useful synthetic and adversarial coverage.

They do not by themselves reproduce the October 6 historical upgrade.

### 10.5 Historical evidence preservation

R3 must distinguish:

- Evidence recorded in the R1 handover.
- Evidence preserved as original artifacts.
- Evidence reproducible through historical node reads.
- Evidence newly obtained during R3.

The R3 planning inventory did not identify a dedicated R1 evidence directory at the initially checked expected locations.

This is an evidence-location finding, not proof that R1 evidence was lost or never preserved.

No broad filesystem search is mandated.

Sensitive evidence must not be committed or printed unnecessarily.

### 10.6 Source/build evidence closeout

**Amendment C — ACCEPTED.**

R3-P09 is satisfied when the approved correspondence methodology has been applied to all available evidence and the resulting assurance tier, deficiencies, and remaining dependencies are explicitly recorded.

Failure to establish Tier 2 or Tier 3 does not prevent technical validation closeout; it prevents positive implementation-trust approval.

R4 must preserve that limitation in its final disposition.

Missing external evidence must not force an indefinite investigation.

### 10.7 R3 implementation restrictions

R3 is code-free-first.

A narrow validation harness may be considered only when an identified coverage gap makes it necessary and the project owner separately authorizes its scope.

R3 does not authorize:

- A generalized historical upgrade engine.
- New production Registry verifiers.
- Modifications to frozen SDK contracts.
- Automatic module approval.
- Wallet signing or transactions.
- Payment execution.
- Changes to the XCF repositories.
- Production deployment.
- Public package publication.

If implementation becomes necessary, prefer one focused branch and one focused PR.

### 10.8 R3 acceptance gates

| Gate | Requirement |
| --- | --- |
| R3-G1 | Accepted R2 baseline preserved |
| R3-G2 | R1 historical evidence inventory reconciled |
| R3-G3 | B → C historical transition assessed reproducibly |
| R3-G4 | Historical administrator/sender consistency assessed reproducibly |
| R3-G5 | Source/build assurance tier assessed |
| R3-G6 | Relevant adversarial behavior validated |
| R3-G7 | Applicable tests and regressions pass where execution or code changes require them |
| R3-G8 | C1–C6 outcomes and evidence limitations documented |
| R3-G9 | Technical disposition accepted by project owner |

An unreproducible finding is recorded explicitly.

It must not be converted into positive assurance.

### 10.9 R3 stopping rule

R3 may close when all required claims have an evidence-supported finding or explicitly documented limitation and the accepted validation scope has been completed.

A positive Module C approval is not an R3 completion requirement.

---

## 11. Claim Coverage and Outstanding Dependencies

| Claim | R1 basis | Existing SDK capability | Remaining R3/R4 requirement |
| --- | --- | --- | --- |
| C1 — Network | Historical Testnet genesis observations | Genesis and policy comparison | Reproducible trusted observation |
| C2 — Snapshot | Historical B/C module observations | Current finalized-snapshot verification | Historical evidence procedure |
| C3 — Upgrade | Four observed transitions | Structural consistency evaluation | Historical transaction reproduction |
| C4 — Administrator | Administrator/sender match | No dedicated historical authority verifier | Independent historical reproduction |
| C5 — Implementation | Retrieved module binaries | Integrity primitives | Source/build review and tier assessment |
| C6 — Governance | Not established | Policy digest mechanism | Explicit R4 approval decision |

### 11.1 Principal outstanding risks

**D-01:** Source/build correspondence unresolved.

**D-02:** Historical upgrade-rule enforcement not independently established.

**D-03:** Complete deployment history not exhaustively reconstructed.

**D-04:** Module C not approved as an operational trust anchor.

**D-05:** Trusted-node observations are not independent consensus proofs.

**D-06:** Dedicated historical evidence artifacts have not yet been fully reconciled.

**D-07:** Some existing documentation predates final R1/I5 acceptance.

**D-08:** No independent ProofPath Registry trust approval record has been issued.

**D-09:** CIS-8 Registry trust approval remains separate.

Each dependency must be resolved, bounded, or explicitly carried into R4.

None automatically authorizes a new implementation milestone.

---

## 12. R4 — Final Registry Trust Disposition

### 12.1 Purpose

R4 is the final governance decision concerning the supported Registry trust claims.

It is not an additional open-ended research phase.

### 12.2 Permitted dispositions

**APPROVED — BOUNDED**

The required evidence and governance conditions are satisfied for a precisely identified Registry trust claim.

**CONDITIONALLY ACCEPTED**

A narrower claim is supported, but broader implementation or operational trust remains unapproved.

**DEFERRED / INDETERMINATE**

Evidence or governance requirements remain unresolved.

**REJECTED**

Authenticated evidence contradicts a mandatory trust requirement.

These are governance dispositions, not new SDK status values.

### 12.3 Approval record

A positive R4 approval must specify:

- Approved claims.
- Network and genesis.
- Registry instance.
- Module reference.
- Applicable block/time range.
- Source/build tier.
- Historical authorization basis.
- Trusted observation assumptions.
- Approval authority.
- Policy identifier/version/digest.
- Residual limitations.
- Review and suspension conditions.

### 12.4 Limited or deferred outcome

If full implementation approval cannot be justified, R4 shall still record:

1. Established historical facts.
2. Supported administrative-consistency claims.
3. Implementation claims not independently established.
4. Missing source/build evidence.
5. Governance restrictions.
6. Permitted controlled demonstration claims, if any.
7. Prohibited assurance claims.
8. Triggers for future reconsideration.

Deferral is a legitimate final disposition for the current roadmap.

### 12.5 Policy authorization

An R4 governance decision does not automatically modify the runtime module allowlist.

Any actual policy change requires separate, explicit authorization.

---

## 13. I6 and Roadmap Closeout

I6 remains a distinct milestone until R4 reaches its final disposition.

I6 will document the supported SDK integration experience, existing verification capabilities, and the exact R4 limitations.

It must distinguish:

- `mapped_unverified` challenge evidence from verified payment evidence.
- Structural consistency from authenticated source evidence.
- Component-specific `verified` results from transaction-wide assurance.
- Trusted-node finality from independent consensus verification.
- Agent ownership from human identity.
- Agent/key registration from action-specific authority.
- Registry historical findings from implementation approval.
- Private SDK packaging from public distribution.
- Roadmap completion from production certification.

The current ProofPath roadmap may complete without claiming a production-certified or universally independent transaction-verification service.

Completion means the approved technical capabilities, evidence boundaries, developer experience, and outstanding governance decisions have been demonstrated and documented.

A deferred R4 Registry trust decision does not automatically prevent I6 roadmap closeout.

---

## 14. R2 Design Acceptance Register

| Gate | Requirement | Status |
| --- | --- | --- |
| R2-01 | Claims and exclusions defined | ACCEPTED |
| R2-02 | Registry trust-root identity specified | ACCEPTED |
| R2-03 | Historical administrative-consistency rule established | ACCEPTED |
| R2-04 | Source/build threshold defined | ACCEPTED |
| R2-05 | Governance authority and independence clarified | ACCEPTED — Amendment A |
| R2-06 | Existing verifier contracts preserved | ACCEPTED |
| R2-07 | Point-in-time and historical continuity distinguished | ACCEPTED — Amendment B |
| R2-08 | Minimal R3 validation defined | ACCEPTED |
| R2-09 | Evidence dependencies and stopping rules defined | ACCEPTED — Amendment C |
| R2-10 | Project-owner design acceptance | ACCEPTED — 2026-11-17 |

**R2 design acceptance: 10/10.**

This is design-governance acceptance, not live Registry trust acceptance.

---

## 15. Execution and Change Control

### 15.1 Authorized R2 documentation scope

The project owner authorized:

- One dedicated documentation branch.
- One new governance document:
  `docs/registry-assurance-profile-v1.md`
- Incorporation of the formally accepted design and Amendments A–C.

No source modifications, test modifications, or trust-policy changes are authorized under that approval.

### 15.2 Separate Git publication approvals

Creating and reviewing the document does not authorize:

- Git staging.
- Git commit.
- Remote push.
- Pull request publication.
- Pull request merge.
- Branch deletion.

Each remains subject to the established project-owner authorization workflow.

### 15.3 R3 execution approval

R3 planning is authorized.

R3 test execution, historical Testnet reads, file creation, implementation work, and related mutations require separate authorization.

### 15.4 Finite execution model

The intended remaining sequence is:

**R3 technical validation → R4 governance disposition → I6 developer experience and roadmap closeout.**

Additional implementation work is not justified merely because a positive Registry trust approval remains unavailable.

---

## 16. Formal Governance Decision Record

**Decision ID:** PP-R2-D1  
**Decision date:** 2026-11-17  
**Decision authority:** ProofPath project owner  
**Decision:** ACCEPTED — Approved for R3 validation planning  
**Accepted amendments:** A, B, and C  
**Implementation authorization:** NOT GRANTED  
**R3 execution authorization:** NOT GRANTED  
**Module C approval:** NOT GRANTED  
**Runtime trust-policy changes:** NOT AUTHORIZED  
**Public publication or production certification:** NOT AUTHORIZED

### 16.1 Accepted principles

1. Registry assurance must be claim-specific.
2. Historical administrator/sender equality supports administrative consistency, not unrestricted authorization claims.
3. Full implementation trust requires Tier 3 assurance.
4. ProofPath governance approval must be independent of the observed Registry evidence.
5. Project-owner approval is distinct from external independent certification.
6. Point-in-time historical findings do not establish uninterrupted trust.
7. Existing PP-02 and PP-03 verification contracts remain unchanged.
8. CIS-8004 and CIS-8 trust obligations remain separate.
9. R3 may close with documented C5/C6 gaps.
10. R4 must issue an explicit, bounded final disposition.
11. I6 remains separate until that disposition.
12. Roadmap completion does not imply production certification.

### 16.2 Final R2 disposition

**R2 DESIGN: ACCEPTED.**

**R3 VALIDATION PLANNING: AUTHORIZED.**

**R3 EXECUTION: PENDING SEPARATE AUTHORIZATION.**

**REGISTRY TRUST-01: OPEN.**

**REGISTRY PROVENANCE: `PROVENANCE_NOT_APPROVAL_READY`.**

### 16.3 Final decision statement

This accepted specification establishes ProofPath's bounded assurance standard for evaluating the Concordium Testnet CIS-8004 Registry.

It provides the design basis for minimal R3 technical validation and the governance basis for R4's final Registry trust disposition.

No evidence or governance approval may be promoted beyond the claims it actually supports.

---

## 17. References

### ProofPath implementation

- `src/pp02/types.ts`
- `src/pp02/registryTrust.ts`
- `src/pp02/ownerAssurance.ts`
- `src/pp02/sellerBinding.ts`
- `src/verification/types.ts`
- `src/verification/registrySnapshot.ts`
- `src/verification/agentAuthority.ts`
- `src/adapters/concordium/registrySnapshot.ts`
- `src/adapters/concordium/agentAuthority.ts`
- `tests/pp02-registry-trust.test.ts`
- `tests/pp03-registry-snapshot.test.ts`
- `tests/pp03-agent-authority.test.ts`

### ProofPath governance and architecture

- `docs/pp02-identity-seller-trust.md`
- `docs/pp03-registry-verification.md`
- `docs/i4-middleware-readiness-decision.md`
- `docs/i5-sdk-integration.md`
- `docs/interoperability-architecture.md`
- ProofPath Kick-off Pack, November 16, 2026.
- ProofPath Interoperability Implementation Roadmap — I5 Updated.
- R1 historical investigation, November 16, 2026.
- I5 PR #12 acceptance, November 15, 2026.

### Concordium standards

- [CIS-8004 — Agent Registry](https://proposals.concordium.com/CIS/cis-8004.html)
- [CIS-8 — External Key Registry](https://proposals.concordium.com/CIS/cis-8.html)

---

**END — PROOFPATH REGISTRY ASSURANCE PROFILE v1 — PP-R2-D1**
