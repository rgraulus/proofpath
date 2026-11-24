
# ProofPath IOT-09A — XDC Trusted-Source Model and Policy Authority

**Record:** IOT-09A
**Status:** ACCEPTED — Architecture Only
**Date:** 2026-11-24
**Repository:** `rgraulus/proofpath`
**Baseline:** `main` at `ec420e5`
**Network:** XDC Apothem (`eip155:51`)
**Assurance profile:** `trusted_node_finalized_xdc_token_transfer_v1`
**Scope:** G1 trusted-source provenance and independent policy authority
**Implementation authorization:** Not granted

---

## 1. Executive Summary

IOT-09A establishes the trusted-source and evidence-provenance architecture for ProofPath's initial XDC Apothem payment-assurance profile.

It builds on:

- IOT-01–05: Cross-platform evidence portability and offline integrity reassessment.
- IOT-06: Cross-platform assurance architecture and independent trust boundaries.
- IOT-07: XDC Apothem Payment Assurance Profile.
- IOT-08: Controlled, simulation-only XDC token-transfer verifier.

The accepted architecture permits one independently approved and authenticated RPC source under an explicitly authorized ProofPath trust policy.

It establishes requirements for:

1. Independent policy authority and source admission.
2. Authenticated RPC endpoint identity.
3. Controlled read-only evidence acquisition.
4. Independently authorized collector provenance.
5. Portable evidence integrity and offline reassessment.
6. Explicit source-truthfulness and assurance boundaries.

The architecture does not establish independent XDPoS consensus verification, production payment assurance, commercial payment intent, or x402 settlement satisfaction.

**Architectural principle:** Evidence tells a story. Assurance has boundaries.

## 2. Background and Architectural Baseline

### 2.1 IOT-01 through IOT-05

Earlier interoperability testing established that ProofPath's platform-neutral evidence infrastructure can represent, preserve, transfer, and independently reassess evidence originating from XDC Apothem.

The tests demonstrated structural validation, cryptographic integrity assessment, tamper detection, independent SDK consumption, and offline evidence reverification.

They did not establish independently authenticated blockchain observations or payment settlement.

### 2.2 IOT-06

IOT-06 established the requirements for independently authorized trust policies, explicit assurance models, source authentication, historical context, fail-closed evaluation, and separation of verification from execution.

In particular:

- Trust policies must not be authorized by the evidence being assessed.
- Evidence integrity must not be confused with source authenticity.
- Positive assurance must be limited to established obligations.
- Historical trust and authorization context must be retained.
- Existing PP-01, PP-02, Concordium, and Base-specific assurance semantics must remain unchanged.

### 2.3 IOT-07

IOT-07 defined the XDC Apothem profile:

`trusted_node_finalized_xdc_token_transfer_v1`

Its intended positive claim concerns a specified token transfer reported as successfully executed and finalized by an authenticated, approved trusted node, with independently established payment expectations and approved token semantics.

IOT-07 identified three outstanding trust prerequisites:

- G1: Trusted source provenance and policy authority.
- G2: Historical token implementation and transfer semantics.
- G3: Canonical ancestry and trusted finality.

IOT-09A addresses G1 only.

### 2.4 IOT-08

IOT-08 implemented deterministic XDC token-transfer consistency checks using normalized simulation evidence.

The implementation was merged through PR #20 at commit `ec420e5`.

Its validation included 17 XDC-specific tests, 479 repository tests, TypeScript typechecking, and production build validation.

The implementation deliberately prevents matching simulated evidence from becoming live positive payment assurance.

The matching simulation result remains:

- `status = indeterminate`
- `reasonCode = simulated_checks_passed_trust_unestablished`
- `sourceTrust = indeterminate`
- `liveAssuranceEstablished = false`
- `consensusIndependentlyVerified = false`

IOT-09A does not modify or relax those boundaries.

## 3. G1 Assurance Objective

G1 must establish that blockchain observations were acquired by an independently authorized collector from an explicitly approved, authenticated RPC source under an independently approved trust policy.

The following claims must remain distinct:

1. Evidence integrity: Preserved evidence matches its cryptographic commitments.
2. Source authentication: The collector authenticated the approved RPC endpoint.
3. Acquisition provenance: An authorized collector attested to the acquisition context and evidence.
4. Source truthfulness: The blockchain assertions reported by the source are correct.
5. Payment assurance: All applicable transfer, token-semantics, and finality obligations are satisfied.

G1 addresses source authentication and acquisition provenance, with supporting policy authority and evidence integrity requirements.

G1 alone does not establish source-independent blockchain correctness or payment assurance.

## 4. Accepted Architecture Decisions

### 4.1 G1-D1 — Single Approved Trusted RPC Source

**Decision: ACCEPTED**

The initial XDC Apothem assurance profile may rely on one explicitly approved and authenticated RPC source.

This establishes a bounded trusted-node reporting model, not an independent consensus-verification model.

The historical discovery endpoint:

`https://rpc.apothem.network/`

remains a candidate source.

Its use during IOT-07 discovery does not constitute independent ProofPath source admission.

The source must be approved under the independently controlled policy authority before it may support positive trusted-node assurance.

Independent corroboration is not mandatory for the initial architecture.

Credible contradictory observations must nevertheless be evaluated explicitly and must not be silently ignored.

### 4.2 G1-D2 — Independent Trust-Policy Authority

**Decision: ACCEPTED**

ProofPath shall maintain an independently administered, versioned trust-policy registry.

The registry is authoritative for:

- Policy identity and version.
- Approval authority and approval record.
- Canonical policy integrity commitment.
- Approved network and RPC source.
- Source-admission authorization.
- Authorized collectors and verification keys.
- Permitted RPC methods.
- Effective periods.
- Revocation and supersession status.
- Historical policy retention.

Policy approval and source admission shall remain separately identifiable decisions.

For the initial implementation, trusted local configuration with documented administrative controls is an acceptable registry mechanism.

A decentralized policy registry, new governance blockchain, or additional policy-signing infrastructure is not required by this architectural decision.

Evidence packages may identify requested policies but cannot authorize their own policy or trust anchors.

A matching policy digest establishes content consistency, not independent approval.

#### Policy lifecycle

The required lifecycle states are:

1. Draft.
2. Approved.
3. Active.
4. Superseded.
5. Revoked.

Policy revisions affecting material trust requirements shall require explicit approval and versioning.

Historical versions must remain available for appropriately bounded reassessment.

### 4.3 G1-D3 — RPC Source Authentication

**Decision: ACCEPTED**

Evidence acquisition shall use:

- Policy-resolved endpoint identity.
- Explicit source allowlisting.
- HTTPS/TLS certificate-chain validation.
- TLS hostname validation.
- Rejection of invalid or unauthorized endpoints.
- No silent endpoint redirection.
- Network destination and DNS-related safeguards.
- Approved read-only RPC methods.
- Explicit chain-identity verification.
- Bounded request/response handling.
- Fail-closed source-authentication behavior.

For XDC Apothem, the expected chain identity is:

`eip155:51`

The corresponding JSON-RPC chain ID is:

`0x33`

The initial architecture may rely on standard, correctly validated TLS server authentication.

Specialized certificate or operator-key pinning is not mandatory unless subsequently required by an approved risk assessment.

TLS authentication establishes endpoint identity under its applicable trust model.

It does not independently establish backend-node identity, consensus correctness, blockchain truthfulness, or source governance approval.

#### Initial proposed RPC method allowlist

The initial design may consider:

- `eth_chainId`
- `eth_getTransactionByHash`
- `eth_getTransactionReceipt`
- `eth_getBlockByHash`
- `eth_getBlockByNumber`
- `eth_getCode`
- `eth_getStorageAt`

Actual method support and historical-state capabilities require verification before source admission.

The meaning and reliability of finalized-block reporting remain subject to G3.

No transaction submission, private-key management, wallet signing, or administrative RPC methods are authorized.

### 4.4 G1-D4 — Trusted Evidence Collector

**Decision: ACCEPTED**

ProofPath shall use an independently authorized collector to acquire source observations.

The collector shall:

1. Resolve the approved source through trusted configuration.
2. Enforce the applicable endpoint-authentication policy.
3. Execute only authorized read-only requests.
4. Preserve original RPC responses and request context.
5. Record source identity and acquisition metadata.
6. Bind the acquired evidence to an authenticated collector attestation.

The initial attestation design uses Ed25519.

The proposed domain separator is:

`proofpath:xdc-rpc-acquisition:v1`

The acquisition statement shall use an explicitly specified canonical encoding and bind all security-relevant acquisition fields.

The independently controlled policy registry shall authorize collector identities and public verification keys.

Collector private keys must be protected from unauthorized evidence presenters.

Collector key rotation, expiry, revocation, deployment integrity, and applicable access controls must be documented before operational use.

A valid collector signature demonstrates that the corresponding key signed the acquisition statement.

It does not independently prove that the collector operated honestly, correctly enforced TLS authentication, or recorded truthful observations.

These limitations remain part of the accepted collector trust model.

### 4.5 G1-D5 — Evidence Integrity and Offline Reassessment

**Decision: ACCEPTED**

ProofPath shall reuse its established PP-01 evidence integrity, reference validation, export, and portability mechanisms.

Original RPC evidence, request context, source references, policy references, collector attestations, and normalized observations shall remain traceably bound.

A new competing evidence framework shall not be introduced.

The architecture shall preserve:

- Original requests and response bytes or integrity-bound references.
- Source and collector identities.
- Collection context and timing information.
- Policy identity, version, and digest.
- Collector attestation and verification-key references.
- Cryptographic evidence commitments.
- Deterministic normalization context.
- Verification results, obligations, and limitations.

Normalized evidence must be reproducibly derived from preserved source observations.

A claimed normalized fact must not silently override contradictory original evidence.

#### Historical reproduction

Historical reproduction evaluates preserved evidence under the recorded historical trust context.

It must be clearly identified as a reproduction of the earlier assessment.

It must not imply current source approval, current collector authorization, or fresh blockchain state.

#### Current-policy reassessment

Current-policy reassessment evaluates preserved evidence against the applicable currently authorized policy and available revocation information.

It shall produce a separately identified result.

A changed policy or newly established compromise must not silently rewrite the historical record.

Offline reassessment cannot infer revocations or network changes not represented in the available authoritative evidence.

#### Time-trust limitation

A collector-recorded timestamp is not automatically independently authenticated time evidence.

Where historical policy applicability depends on trusted acquisition time, the applicable policy must define acceptable timing evidence.

Insufficient timing evidence shall produce an indeterminate result for the affected obligation.

### 4.6 G1-D6 — Source Truthfulness and Assurance Boundaries

**Decision: ACCEPTED**

ProofPath shall distinguish authenticated source reporting from independently established blockchain truth.

An approved and authenticated RPC source may support a bounded trusted-node payment-assurance claim only when all mandatory obligations are satisfied under the approved policy.

These obligations include:

- Independent trust-policy authorization.
- Source authentication and provenance.
- Independently approved payment expectations.
- Successful transaction execution.
- Exact supported token-transfer matching.
- Approved historical token semantics.
- Accepted canonical ancestry and finality.

G1 satisfaction alone is insufficient for positive payment assurance.

Definitive payment failures require sufficiently trusted evidence of contradiction.

Missing, untrusted, stale, ambiguous, unsupported, or insufficient evidence shall not establish definitive payment outcomes.

The accepted assurance model shall not claim:

- Independent XDPoS consensus verification.
- Trustless settlement.
- Independently established commercial payment intent.
- x402 payment requirement satisfaction.
- Agent identity or transaction-specific authority.
- Merchant entitlement or HTTP resource-release authorization.

Any future positive result must be expressly identified as verified under the approved trusted-node policy.

## 5. Proposed Logical Architecture

The future implementation may distinguish the following logical responsibilities:

| Component | Responsibility |
|---|---|
| Independent policy authority | Approve and revoke policies, sources, collectors, and keys |
| Trusted policy registry | Resolve independently authorized configuration |
| Controlled RPC collector | Acquire observations from approved authenticated endpoints |
| Acquisition attestation | Bind collector identity and original acquisition evidence |
| PP-01 evidence package | Preserve portable observations and integrity commitments |
| G1 provenance assessor | Evaluate source, policy, collector, and acquisition authority |
| IOT-08 deterministic verifier | Assess transaction and transfer consistency |
| Future G2 assessment | Evaluate historical token implementation and semantics |
| Future G3 assessment | Evaluate canonical ancestry and trusted-node finality |

These are logical boundaries and do not require a separate network service or repository module for every responsibility.

No implementation topology is authorized by this record.

## 6. Required Evidence Contract

The future acquisition-evidence contract must preserve five groups.

### 6.1 Original source observations

- Complete relevant RPC methods and parameters.
- Original response bytes or integrity-bound artifact references.
- Transaction and receipt evidence.
- Transfer logs.
- Relevant block observations.
- Historical token evidence where required.
- Finality observations where required.

### 6.2 Acquisition provenance

- Acquisition record version.
- Acquisition identifier.
- Approved source identity.
- Authorized collector identity.
- Applicable policy identity and version.
- Acquisition timestamp.
- Authentication and request context.

### 6.3 Collector attestation

- Attestation format/version.
- Signature algorithm and key identifier.
- Canonical signed acquisition statement.
- Signature.
- Integrity commitments to acquired evidence.
- Trusted collector authorization reference.

### 6.4 Trust-policy evidence

- Approved policy identifier and version.
- Canonical policy digest.
- Approval record reference.
- Source-admission record.
- Collector authorization.
- Applicable activation and revocation context.

### 6.5 Normalization and assessment

- Deterministic normalization rules or version.
- Source-to-normalized-evidence references.
- Verification findings.
- Individual obligation outcomes.
- Assurance limitations.
- Historical or current-policy reassessment context.

Exact field mappings to existing PP-01 contracts remain a future implementation-design task.

## 7. Required G1 Acceptance Criteria

The following matrix establishes minimum architecture-level expectations for later implementation and testing.

| ID | Acceptance requirement |
|---|---|
| G1-A01 | Independently approved and versioned policy |
| G1-A02 | Separately identifiable source admission |
| G1-A03 | Validated HTTPS/TLS endpoint identity |
| G1-A04 | Restricted read-only RPC acquisition |
| G1-A05 | Explicit network identity and request validation |
| G1-A06 | Independently approved collector identity and key |
| G1-A07 | Valid domain-separated acquisition attestation |
| G1-A08 | Complete original acquisition evidence and integrity binding |
| G1-A09 | Deterministic, traceable evidence normalization |
| G1-A10 | Explicit historical policy and collector authorization |
| G1-A11 | Defined revocation and acquisition-time treatment |
| G1-A12 | Bounded offline reassessment |
| G1-A13 | Trusted contradictions distinguished from untrusted reports |
| G1-A14 | No unsupported positive payment-assurance promotion |

### 7.1 Mandatory negative scenarios

Future controlled tests shall include:

- Missing independently approved policy.
- Self-approved policy digest.
- Unknown or unauthorized source.
- Endpoint substitution.
- Invalid TLS certificate or hostname.
- Unauthorized redirect or network destination.
- Unsupported RPC method.
- Incorrect chain identity.
- Unknown or unauthorized collector.
- Invalid collector signature.
- Modified acquisition statement.
- Tampered or missing RPC response.
- Incorrect normalization.
- Stale or incomplete evidence.
- Expired, superseded, or revoked authorization.
- Insufficient historical time evidence.
- Conflicting source observations.
- Unsupported finality assertions.
- Offline assessment with unavailable current trust information.

### 7.2 Outcome requirements

A G1 obligation may be satisfied only when its mandatory trust, authentication, and provenance requirements have been established.

An invalid source or collector authentication record shall not support positive provenance.

An unresolved mandatory trust prerequisite shall result in an indeterminate payment-assurance outcome.

A definitive payment failure requires sufficiently trusted evidence of the relevant contradiction.

A successful G1 assessment shall not automatically result in payment `verified`.

## 8. Outstanding Operational Dependencies

Architecture acceptance does not satisfy the following operational prerequisites.

### 8.1 Source admission

The candidate Apothem RPC endpoint requires:

- Operator and operational trust assessment.
- Approved endpoint identity.
- Verified TLS behavior.
- Supported RPC-method assessment.
- Applicable historical-state capability assessment.
- Source-admission approval record.

### 8.2 Policy authority

Operational deployment requires:

- Designated policy administrator.
- Protected registry configuration.
- Documented approval and change controls.
- Effective-period and revocation handling.
- Historical policy retention.

### 8.3 Collector trust

Operational deployment requires:

- Approved collector implementation and runtime boundary.
- Signing-key protection.
- Collector identity and key authorization.
- Key rotation and revocation controls.
- Acquisition audit and integrity handling.
- Defined acquisition-time trust rules.

### 8.4 Evidence contract

Implementation requires:

- Exact canonical acquisition statement.
- Signature encoding and verification rules.
- Raw-evidence commitment rules.
- PP-01 field mappings.
- Deterministic normalization rules.
- Historical and current-policy reassessment rules.

None of these operational prerequisites is declared satisfied by this architecture document.

## 9. Dependencies Beyond G1

### 9.1 G2 — Historical Token Semantics

Future work must establish the historical implementation identity and supported transfer behavior of the XDC Apothem test token at the transaction-relevant block.

Reported code presence, token metadata, or a matching Transfer event alone is insufficient.

### 9.2 G3 — Canonical Ancestry and Trusted Finality

Future work must establish an approved basis for interpreting canonical ancestry and node-reported finality.

A finalized height beyond the transaction block is insufficient when canonical ancestry or the applicable finality authority remains unresolved.

### 9.3 Independent Payment Expectations

Expected network, asset, recipient, atomic amount, and any required payer or transaction reference must originate from independently authorized expectations.

The observed transaction must not generate its own authoritative payment terms.

### 9.4 Combined Assurance

A future positive trusted-node result shall require all applicable G1, G2, G3, transaction, and payment-expectation obligations to be satisfied under an approved policy.

No live positive assurance is authorized by IOT-09A.

## 10. Scope Exclusions

IOT-09A excludes:

- Runtime code changes.
- Live RPC acquisition implementation.
- Actual source admission.
- Collector deployment or key generation.
- Production payment verification.
- Activation of live XDC `verified` results.
- Independent XDPoS consensus verification.
- General-purpose EVM verification.
- Wallet signing, payment execution, or custody.
- Cross-chain settlement or bridging.
- Agent registry or delegated-authority verification.
- x402 gateway, facilitator, or resource-release integration.
- Changes to existing public SDK exports.
- Changes to existing PP-01, PP-02, Concordium, or Base assurance semantics.

Expansion of these boundaries requires separately justified architecture and explicit authorization.

## 11. Recommended Next Steps

### IOT-09A — Documentation publication

Publish this accepted G1 architecture record through one narrowly scoped documentation-only PR.

No implementation changes are required for this publication.

### IOT-09B — G2 historical token semantics

Assess the historical XDC token implementation, applicable proxy or upgrade behavior, and supported token-transfer semantics.

Define evidence requirements, trust assumptions, and acceptance criteria.

### IOT-09C — G3 trusted finality

Assess the candidate RPC source's finalized-block semantics, canonical ancestry requirements, and supported trusted-node finality model.

Define evidence requirements and acceptance criteria without claiming independent consensus verification.

### Combined implementation-readiness decision

After G1, G2, and G3 architecture are accepted, evaluate the minimum controlled implementation required to satisfy their combined assurance prerequisites.

Do not begin production enablement merely because the individual architecture documents have been accepted.

## 12. Architecture Acceptance Decision

**Decision:** ACCEPTED — ARCHITECTURE ONLY

G1-D1 through G1-D6 are accepted as the architectural baseline for ProofPath's XDC trusted-source provenance and independent policy authority.

The accepted design preserves:

- A bounded single-source trusted-node model.
- Independently controlled policy and source authorization.
- Authenticated read-only acquisition.
- Authorized collector provenance.
- Portable, integrity-bound evidence.
- Bounded historical and current-policy reassessment.
- Explicit separation of source authentication from blockchain truth.
- Fail-closed assurance semantics.
- Existing ProofPath platform-neutral and chain-specific boundaries.

**Operational source approval:** NOT ESTABLISHED

**Collector implementation and authorization:** NOT ESTABLISHED

**Historical token semantics (G2):** NOT ESTABLISHED

**Trusted finality (G3):** NOT ESTABLISHED

**Production XDC payment assurance:** NOT ESTABLISHED

**Implementation authorization:** NOT GRANTED

This record is the accepted G1 architecture baseline for subsequent IOT-09 work.

---

**Evidence tells a story. Assurance has boundaries.**
