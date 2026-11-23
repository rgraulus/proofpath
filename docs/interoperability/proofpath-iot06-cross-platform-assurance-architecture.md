
# ProofPath — Cross-Platform Payment and Agent-Authority Assurance Architecture

- **Record:** IOT-06
- **Status:** ACCEPTED — Architecture Only
- **Date:** 2026-11-23
- **Baseline:** ProofPath `main` — `d143c96c798fd10e5664a41f5a6cbcad15a1acf6`
- **SDK:** `@proofpath/core` v0.1.0
- **Scope:** Cross-platform payment, finality, agent authority, and transaction-specific assurance
**Nature:** Architecture specification; no implementation authorization

---

## 1. Executive Summary

ProofPath is a portable evidence and assurance framework for agent-mediated transactions.

IOT-01 through IOT-05 demonstrated that ProofPath's existing platform-neutral evidence infrastructure can represent, export, transfer, and independently reassess evidence originating from XDC Apothem.

Those experiments established evidence representation, structural validation, integrity assessment, tamper detection, and offline reverification using separately installed SDK consumers.

They did not establish independent blockchain consensus, payment settlement, source authentication, agent identity, or delegated transaction authority.

IOT-06 addresses the architectural requirements for extending ProofPath beyond evidence portability into independently supported, explicitly bounded payment and agent-authority assurance across blockchain ecosystems.

The recommended architecture preserves the existing PP-01 evidence foundation and Concordium-specific verification implementations.

It introduces a proposed platform-neutral assurance obligation model through which specialized verifiers can produce independently grounded, narrowly defined assessment results.

Cross-platform composition must preserve the meaning, provenance, trust assumptions, and limitations of every underlying result.

No observation, receipt, registry entry, digest match, or successful composition may automatically be promoted into broader transaction assurance.

**Guiding principle: Evidence tells a story. Assurance has boundaries.**

## 2. Scope and Non-Goals

### 2.1 In Scope

IOT-06 defines architectural requirements for:

1. Platform-neutral assurance obligations.
2. Payment execution, asset transfer, and settlement-finality verification.
3. Agent identity and external signing-key binding.
4. Historical authority and transaction-specific authorization.
5. Independently approved verification policies and trust anchors.
6. Cross-platform transaction and commercial-terms correlation.
7. Chain-specific verification adapter boundaries.
8. Portable verification results and bounded evidence composition.
9. Threat handling, failure semantics, and assurance non-promotion.
10. Future implementation readiness and acceptance requirements.

### 2.2 Out of Scope

IOT-06 does not authorize or implement:

- Changes to PP-01 evidence schemas or contracts.
- Changes to existing Concordium verifiers or composition semantics.
- XDC payment settlement verification.
- New blockchain adapters.
- Wallet connections, signing operations, or fund transfers.
- Production RPC infrastructure.
- New x402 payment mechanisms.
- A universal blockchain consensus verifier.
- Cross-chain agent identity federation.
- Production agent-delegation enforcement.
- Deployment, publication, or production certification.

IOT-06 is an architecture-definition milestone, not a software implementation project.

## 3. Existing ProofPath Architecture

### 3.1 Platform-Neutral Evidence Foundation

The `@proofpath/core` SDK provides:

- Portable evidence manifest types.
- Runtime schema validation.
- Canonical JSON serialization.
- SHA-256 artifact and structured commitments.
- Evidence provenance assessment.
- Audit journal operations.
- Disclosure-controlled evidence export.
- Export integrity verification.

These capabilities are not intrinsically tied to Concordium.

IOT-03 through IOT-05 demonstrated their use with XDC transaction observations.

The existing PP-01 contracts remain the accepted evidence foundation.

### 3.2 Registry and Seller Assessments

The `@proofpath/core/assessment` interface provides PP-02 assessments for:

- Registry trust.
- Owner assurance.
- Seller binding.

These are bounded assessments.

They do not independently authenticate all external facts or establish complete transaction authority.

Registry consistency, owner references, and seller relationships must not be treated as equivalent to independently established authorization.

### 3.3 Concordium Verification

The `@proofpath/core/concordium` interface exposes specialized capabilities for:

- Registry snapshot verification.
- Facilitator receipt signature and binding verification.
- Settlement and finality verification.
- Agent authority and external-key binding verification.
- Concordium x402 transaction evidence composition.

The existing settlement assurance model is:

`trusted_node_finalized_plt_transfer_v1`

Its supported claim is:

`finalized_plt_transfer_matches_expected_payment`

The existing agent-authority assurance model is:

`trusted_node_finalized_agent_key_binding_v1`

Its supported claim is:

`agent_registry_owner_external_key_binding_at_finalized_snapshot`

The existing facilitator receipt assurance model is:

`trusted_facilitator_receipt_signature_v1`

Its supported claim is:

`facilitator_receipt_signature_and_binding`

These models are specialized and must retain their existing semantics.

A positive trusted-node settlement result does not establish independent consensus verification.

A positive registry/key-binding result does not establish human identity, historical upgrade authority, or action-specific signing authorization.

A positive facilitator receipt result does not establish independent settlement.

### 3.4 Existing x402 Boundary

The `@proofpath/core/x402` interface currently provides bounded x402 v2 challenge mapping for Base Mainnet (`eip155:8453`).

This mapper does not independently authenticate the HTTP source or verify payment settlement.

Its current scope must not be broadened implicitly to XDC or other networks.

Any additional x402 network or payment mechanism requires separate compatibility and verification requirements.

### 3.5 Existing Composition

The existing PP-03 M3.5 composer:

`composeTransactionEvidence()`

is a deterministic offline composition function.

Its profile is:

`proofpath.concordium.x402.v1`

Its settlement profile is:

`xcf_crp_plt_v1`

It recognizes separate claims for:

- Facilitator receipt.
- Settlement finality.
- Agent authority.
- Seller binding.
- Delivery record.

Its results are:

- `composed`
- `incomplete`
- `rejected`

None of these results means that the entire transaction has been independently verified.

The composer validates specified relationships and preserves the individual assessment results. It does not execute settlement, authenticate presented results, approve trust policies, or perform independent verification.

This behavior is an architectural invariant.

## 4. Core Architectural Principles

### P1 — Preserve the Platform-Neutral Evidence Core

PP-01 remains independent of blockchain-specific consensus, transaction formats, token standards, and registries.

Chain-specific evidence may be represented within PP-01 without redefining PP-01 assurance semantics.

### P2 — Verification Mechanisms May Be Platform-Specific

Different blockchain environments may require different mechanisms for establishing:

- Transaction inclusion.
- Successful execution.
- Token transfer semantics.
- Finality.
- Registry state.
- External key authorization.

ProofPath must not declare different mechanisms equivalent without an explicitly approved assurance model.

### P3 — Assurance Claims Must Be Narrow and Explicit

Every positive assessment must identify exactly what was established.

A verified settlement claim must not automatically establish agent authority.

A verified registry/key binding must not automatically establish action-specific authorization.

A verified signature must not automatically establish the authority of its signing key.

### P4 — Trust Policy Must Be Independent of Presented Evidence

Trust policies, authorized signing keys, expected payment terms, trusted contracts, and source authorization must originate from independently controlled application configuration or another approved authority.

Evidence must not approve its own verification policy.

A matching policy digest does not independently prove policy approval.

### P5 — No Unsupported Assurance Promotion

Recorded observations, valid structures, matching hashes, and successfully composed assessments must not be promoted to verified claims without the required domain-specific verification.

### P6 — Fail Closed

Invalid, contradictory, incomplete, unsupported, or insufficiently trusted inputs must not produce unsupported positive assurances.

### P7 — Preserve Historical Context

Verification must distinguish the state observed at collection time from the state relevant to the transaction or authorization event.

A currently valid key or registry relationship does not necessarily establish historical authority.

### P8 — Maintain Evidence Portability

Verification outcomes must be representable using portable evidence and assessment records.

A receiving application must be able to determine the original assurance model, trust dependencies, supporting evidence, and unresolved limitations.

### P9 — Separate Assessment from Execution

ProofPath verification must not require the authority to execute payments or sign transactions.

Read-only and offline verification capabilities are preferable wherever technically sufficient.

## 5. Proposed Platform-Neutral Assurance Obligation Model

The proposed model defines *what must be established*, independently of *how a particular network establishes it*.

It is a requirements vocabulary, not a new implemented SDK interface.

| Obligation | Required finding |
|---|---|
| O1 — Network identity | Evidence belongs to the expected blockchain and network |
| O2 — Commercial terms | Expected asset, amount, recipient, and resource are independently established |
| O3 — Transaction execution | The relevant transaction executed successfully under network-specific rules |
| O4 — Asset transfer | A specific asset transfer satisfies the expected payment terms |
| O5 — Settlement finality | Required finality is established under an explicitly approved assurance model |
| O6 — Agent identity | The relevant agent reference is bound to a trusted identity or registry record |
| O7 — Key authority | The relevant signing key is associated with the agent or owner under approved policy |
| O8 — Historical validity | Authority existed at the transaction-relevant time or state |
| O9 — Action authorization | The key or agent was authorized for the specific operation |
| O10 — Cross-platform binding | Authorization, payment, and commercial terms refer to the intended transaction |

Not every transaction requires all obligations.

An approved assurance profile must declare which obligations are required, optional, unsupported, or not applicable.

Unsupported obligations must not silently disappear from the assessment.

## 6. Payment and Finality Assurance

### 6.1 Independent Expected Payment

A payment verification context must obtain its expected terms independently of the presented settlement evidence.

Required expected values may include:

- Network identifier.
- Payment transaction identifier.
- Asset identifier and asset-standard interpretation.
- Asset precision or decimals where applicable.
- Atomic amount.
- Recipient.
- Optional expected payer.
- Payment mechanism or settlement profile.
- Transaction or commercial-terms commitment.

Expected values must not be copied from the transaction or receipt being evaluated and then presented as independent confirmation.

Payment amounts must be compared using exact atomic representations rather than floating-point arithmetic.

### 6.2 Transaction Execution

A successful transaction status is necessary in many payment models but is not sufficient to establish a payment.

Execution success alone does not prove:

- The expected token moved.
- The expected quantity moved.
- The correct recipient received it.
- The transfer was finalized.
- The transfer satisfied an x402 payment requirement.

Network-specific verification must interpret the transaction's complete, relevant execution evidence.

### 6.3 Asset Transfer

A positive payment assessment must establish the expected transfer using the applicable asset semantics.

For an EVM-compatible network, this may require authenticated contract identity, decoded transaction execution, relevant event or state evidence, and token-specific validation rules.

An event log resembling a transfer is not automatically sufficient.

For Concordium PLT transfers, the existing specialized settlement verifier remains the reference implementation within its defined scope.

### 6.4 Settlement Finality

Finality verification must use a named, network-specific assurance model.

Potential models include:

- Finalized execution reported by an authenticated trusted node.
- Cryptographically verified consensus or state proofs.
- Independently verified finalized chain state.

These are distinct levels of assurance and must not be conflated.

The existing Concordium trusted-node model explicitly does not establish independent consensus verification.

Future XDC finality verification requires separate evaluation of the applicable consensus protocol, reliable finality indicators, source authentication, and chain-state verification mechanisms.

No XDC finality assurance model is approved by IOT-06.

### 6.5 Facilitator Receipt Independence

A facilitator receipt may authenticate an assertion and bind it to an expected payment under an authorized signing-key policy.

That does not independently establish that settlement occurred.

Receipt verification and settlement verification remain separate obligations.

## 7. Agent Identity and Authority

### 7.1 Agent Identity

An agent reference must be interpreted within a defined identity and registry framework.

Verification may require:

- Network or registry namespace.
- Registry or contract identity.
- Agent identifier.
- Registry-state evidence.
- Approved registry implementation.
- Relevant snapshot or block.
- Revocation or lifecycle state.

A syntactically valid identifier is not proof of identity or authority.

### 7.2 External Signing-Key Binding

ProofPath's Concordium agent-authority model uses finalized registry observations and CIS-8 external-key registration.

The current implementation evaluates a specific owner/key relationship under independently approved registry and module policies.

This provides a reference for bounded key-binding verification.

Other ecosystems may use different key and registry mechanisms.

A common result vocabulary must not erase these differences.

### 7.3 Historical Authority

Cross-platform authority assessment must identify the relevant temporal reference.

Examples include:

- Block or finalized state at transaction execution.
- Signature creation time where independently established.
- Delegation activation and expiration.
- Registry revocation effective state.
- Key rotation or contract upgrade history.

A present-day registry snapshot is not automatically evidence of authority at a historical transaction time.

If historical state cannot be established, historical authority remains indeterminate.

### 7.4 Action-Specific Authorization

Agent ownership and signing-key registration are not sufficient to establish authorization for a particular action.

A positive action-specific assessment may require independently verified evidence of:

- The action or transaction intent.
- The signing key that authorized it.
- Signature validity or equivalent authenticated authorization.
- Delegated permissions and scope.
- Resource and payment constraints.
- Network and contract restrictions.
- Nonce, expiration, and replay protection.
- Authority validity at the relevant time.

An approved policy must define which elements are mandatory for the particular authorization mechanism.

### 7.5 Cross-Platform Agent Relationships

A Concordium registry identity associated with a key used on another network may provide evidence of a relationship between those environments.

That relationship alone does not prove:

- Human identity.
- Transaction-specific signing.
- An enforceable delegation.
- Control of a receiving account.
- Authority to spend funds.
- Authorization of a particular x402 payment.

Cross-platform agent authority requires explicit binding evidence and independent verification of every claimed relationship.

## 8. Independent Trust Policies

### 8.1 Required Policy Properties

Every assurance verification policy should identify:

- Policy ID and version.
- Assurance model.
- Approved network and verification scope.
- Approved source or trust anchor.
- Permitted contract, registry, or signing-key identities.
- Expected finality or historical-state requirements.
- Observation freshness limits.
- Applicable verification constraints.
- Policy approval authority or independently verifiable approval reference.

These properties are proposed cross-platform requirements.

Existing policy types remain unchanged.

### 8.2 Policy Authority

A policy must be authorized independently of the evidence presenter.

Potential authorization mechanisms include trusted local configuration, approved signed policy distributions, or other independently established governance mechanisms.

The choice of mechanism is a future implementation decision.

A locally computed digest is not authorization.

### 8.3 Source Authentication

Source authentication must be assessed separately from artifact integrity.

A matching evidence digest establishes consistency with a commitment.

It does not establish that the evidence originated from a trusted RPC endpoint or represents genuine network state.

Authenticated trusted-node reporting and independent consensus verification must retain distinct assurance labels.

### 8.4 Policy and Source Separation

The same untrusted evidence package must not control:

1. The expected payment facts.
2. The trusted node or signing-key allowlist.
3. The approved verification policy.
4. The claimed verification outcome.

Trusted configuration and observed data must remain independently identifiable.

## 9. Cross-Platform Transaction Binding

### 9.1 Binding Objective

Cross-platform composition must determine whether independently assessed payment and authority evidence refer to the same intended commercial operation.

A shared string, hash, or correlation identifier is not sufficient unless its origin and meaning have been established.

### 9.2 Proposed Binding Requirements

The binding model should account for:

- Expected commercial contract or terms.
- Resource and merchant identity.
- Expected payment network and settlement mechanism.
- Asset, amount, and recipient.
- Agent and applicable authority references.
- Transaction-specific authorization or signed intent.
- Payment transaction reference.
- Nonce and expiration where applicable.
- Evidence provenance and relevant temporal context.

An assurance profile should specify which fields must be cryptographically bound and which may be correlated through independently trusted application state.

### 9.3 Replay and Substitution Resistance

The architecture must prevent a valid but unrelated payment or authorization record from being substituted into another transaction assessment.

Future verifiers must consider:

- Replayed payment evidence.
- Reused authorization evidence.
- Wrong-network substitution.
- Wrong-contract substitution.
- Wrong-resource binding.
- Wrong-recipient binding.
- Stale registry or delegation snapshots.
- Inconsistent transaction identifiers.

A structurally valid manifest is not sufficient to prevent such substitutions.

### 9.4 Cross-Chain Transactions

If identity and authority are established on one chain while payment executes on another, the architecture must distinguish:

- Identity-chain trust.
- Payment-chain trust.
- Cross-chain key or agent binding.
- Transaction-specific authorization.
- Settlement on the payment chain.

Successful assessment of one domain must not substitute for successful assessment of another.

## 10. Verification Adapter Architecture

### 10.1 Recommended Separation

The proposed architecture consists of:

1. Existing platform-neutral evidence primitives.
2. Explicit assurance obligations.
3. Independently approved verification policies.
4. Chain- or mechanism-specific verifiers.
5. Narrow verification results with evidence provenance.
6. Bounded composition into portable PP-01 assessments.

This is a conceptual separation, not a requirement to introduce six new SDK layers.

### 10.2 Adapter Responsibilities

A future verification adapter may be responsible for:

- Collecting or consuming domain-specific observations.
- Establishing network and transaction identity.
- Validating applicable contract and asset semantics.
- Evaluating relevant finality or registry state.
- Applying approved policy constraints.
- Producing a narrowly defined result.
- Recording supporting evidence and unresolved limitations.

An adapter must not self-authorize its trust policy.

### 10.3 Cross-Platform Result Requirements

Any proposed common result envelope should retain:

- Exact claim identity.
- Assurance model and version.
- Verification status.
- Reason code.
- Policy identity and commitment.
- Network and subject references.
- Supporting evidence references.
- Provenance and verifier identity.
- Evaluation timestamp or state reference.
- Explicit unresolved assurance limitations.

This is a proposed result vocabulary.

No common result interface is implemented or approved under IOT-06.

### 10.4 Platform-Neutral Composition

Future composition should correlate individually assessed obligations without reinterpreting their assurance level.

The existing Concordium composer remains unchanged.

A generic composition capability should be considered only after real cross-platform verifier results and their semantics have been independently validated.

## 11. Assurance Semantics and Failure Handling

### 11.1 Verification Statuses

ProofPath's PP-01 claim model supports:

- `verified`
- `failed`
- `indeterminate`
- `not_evaluated`
- `not_applicable`

These statuses must be interpreted relative to a specific claim and assurance model.

They do not describe the entire transaction unless a separately defined aggregate claim is explicitly supported.

### 11.2 Verified

A claim may be marked `verified` only when all obligations of its declared assurance model are satisfied under an independently authorized policy.

The scope of that model must be preserved.

### 11.3 Failed

A claim may be marked `failed` when reliable verification establishes a contradiction or violation within its declared scope.

An unavailable node or missing proof must not automatically imply that a transaction failed.

### 11.4 Indeterminate

Use `indeterminate` when evaluation was attempted but reliable evidence is insufficient, ambiguous, stale, unavailable, or unable to satisfy the necessary trust requirements.

### 11.5 Not Evaluated

Use `not_evaluated` when the relevant verification has not been performed.

### 11.6 Not Applicable

Use `not_applicable` only when an independently established assurance profile explicitly excludes the obligation.

It must not be used to hide missing mandatory verification.

### 11.7 Composition Outcomes

Preserve the distinction between:

- Successfully composing evidence.
- Having complete evidence.
- Independently verifying a claim.
- Establishing an authorized transaction.

A composed manifest may contain indeterminate or unverified claims.

Successful composition is not blanket transaction assurance.

## 12. Threat Model

The architecture must explicitly consider:

| Threat | Required mitigation principle |
|---|---|
| Fabricated RPC observation | Independent source trust or state verification |
| Self-approved policy | Independently authorized policy anchor |
| Fabricated verifier result | Authenticated verifier provenance and trusted execution context |
| Valid but unrelated payment | Independent expected terms and transaction binding |
| Wrong asset or recipient | Exact asset and recipient verification |
| Unfinalized or reverted transaction | Network-specific execution and finality checks |
| Revoked or rotated signing key | Historical authority-state verification |
| Registry spoofing or substitution | Approved registry and implementation identity |
| Unauthorized agent action | Transaction-specific authorization validation |
| Replay of authorization | Nonce, scope, expiration, and replay controls |
| Cross-network substitution | Explicit network and chain-identity binding |
| Altered evidence package | Portable integrity and reference checks |
| Misleading aggregate assurance | Narrow claim semantics and no unsupported promotion |

These mitigations are architecture requirements, not claims that current implementations satisfy them universally.

## 13. Required Verification Evidence

An assurance result should remain traceable to its supporting evidence.

Depending on the specific obligation, supporting evidence may include:

- Transaction observations.
- Receipt or execution evidence.
- Relevant asset-transfer records.
- Block and finality observations.
- Authenticated node or consensus evidence.
- Registry-state observations.
- Contract and implementation identities.
- External-key registration evidence.
- Signed transaction intent or delegation.
- Independently approved verification policy.
- Verification result and provenance.
- Commercial-terms commitments.

The evidence package should preserve enough information to understand what was verified, under which assumptions, and what remains unverified.

Portable evidence does not itself guarantee independent reverifiability of every underlying cryptographic or consensus claim.

## 14. Implementation Strategy

### 14.1 Preserve Accepted Implementations

Do not modify PP-01 or current Concordium verification semantics simply to support another network.

Do not widen existing network allowlists without an independently reviewed verification model.

### 14.2 Validate One End-to-End Assurance Profile

Before implementing a universal interface, select one narrowly scoped external payment environment and define:

- Trusted payment expectations.
- Asset and network semantics.
- Required settlement evidence.
- Source authentication model.
- Finality assurance model.
- Verification result contract.
- Negative and indeterminate test cases.

### 14.3 Treat Agent Authority Separately

Define and validate cross-platform agent authority as a distinct assurance profile.

Do not require payment-verification development to prove unrelated identity or delegation claims.

### 14.4 Combine Only Validated Obligations

Consider cross-platform transaction assurance composition only after the constituent obligations have well-defined and validated results.

Avoid introducing a universal verifier before establishing common semantics from actual implementations.

### 14.5 Prefer Focused Engineering Work

Future implementation should be driven by a concrete missing assurance capability.

No implementation work should begin merely because an architectural abstraction could be created.

## 15. Unresolved Architecture Questions

The following require future technical decisions:

1. Which external payment ecosystem should be the first independently verified non-Concordium assurance profile?
2. What minimum trust model is acceptable for positive payment-settlement claims?
3. Which finality mechanisms can be independently reverified, and which rely on authenticated trusted nodes?
4. How should independently approved trust-policy authorities be represented and distributed?
5. What cryptographic or independently trusted evidence is required for historical agent authority?
6. How should transaction-specific signatures bind an agent's authorization to payment and resource terms?
7. What are the required replay and expiration semantics for cross-platform authorization?
8. When is a platform-neutral result interface justified by validated implementation needs?
9. What evidence must be retained to allow another organization to independently reassess an assurance claim?
10. Which guarantees remain explicitly outside ProofPath's responsibility?

These are open decisions, not implementation commitments.

## 16. IOT-06 Acceptance Criteria

IOT-06 may be accepted when:

- [ ] Existing ProofPath assurance contracts and boundaries are documented.
- [ ] Cross-platform assurance obligations are defined.
- [ ] Payment and finality requirements are separated from source authentication.
- [ ] Agent identity, key binding, historical authority, and action authorization are distinguished.
- [ ] Independent policy authority and trusted expectations are explicitly required.
- [ ] Cross-platform binding and substitution risks are identified.
- [ ] Claim statuses and failure semantics are defined.
- [ ] Existing Concordium verification and PP-01 boundaries remain unchanged.
- [ ] Future implementation priorities and unresolved questions are recorded.
- [ ] The architecture specification is reviewed and accepted.

Approval of IOT-06 establishes architecture readiness only.

It does not certify implementation completeness or production assurance.

## 17. Architecture Decisions

The following decisions are proposed for formal acceptance.

| ID | Decision | Proposed disposition |
|---|---|---|
| IOT06-D1 | Preserve PP-01 as the platform-neutral evidence foundation | ACCEPT |
| IOT06-D2 | Preserve existing Concordium verifiers and composer | ACCEPT |
| IOT06-D3 | Separate payment, finality, agent identity, key binding, and action authorization | ACCEPT |
| IOT06-D4 | Require independently approved trust policies and expected facts | ACCEPT |
| IOT06-D5 | Define common assurance obligations without asserting equivalent verification mechanisms | ACCEPT |
| IOT06-D6 | Preserve explicit indeterminate and unsupported-assurance outcomes | ACCEPT |
| IOT06-D7 | Require independently evidenced transaction-specific and historical authority bindings | ACCEPT |
| IOT06-D8 | Defer generic verifier/composer implementation until justified by validated external profiles | ACCEPT |
| IOT06-D9 | Keep implementation, production certification, and network expansion outside IOT-06 | ACCEPT |

Decisions IOT06-D1 through IOT06-D9 were formally accepted on 2026-11-23.

## 18. Conclusion

The IOT-06 inspections establish that ProofPath already has a strong architectural foundation for independently bounded assurance.

Its existing verification implementations distinguish receipt authenticity, settlement finality, registry authority, and evidence composition.

Its platform-neutral PP-01 core has demonstrated evidence portability through XDC interoperability experiments.

The next architectural challenge is not simply to support additional blockchain transaction formats.

It is to establish which independently trusted evidence and verification mechanisms are sufficient to support each claimed payment, identity, key-authority, and transaction-authorization assertion.

The recommended direction is to preserve existing implementations, define cross-platform assurance obligations, introduce new verification profiles only when independently justified, and retain all unresolved trust limitations explicitly.

**IOT-06 disposition: ACCEPTED AND CLOSED — Architecture Only.**

No additional implementation is authorized by this document.

---

**ProofPath guiding principle**

*Evidence tells a story. Assurance has boundaries.*
