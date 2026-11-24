# ProofPath IOT-07 — XDC Apothem Payment-Assurance Profile Specification

**Record:** IOT-07C
**Status:** ACCEPTED — Architecture Only
**Date:** 2026-11-24
**Repository:** `rgraulus/proofpath`
**Target document:** `docs/interoperability/xdc/proofpath-xdc-iot07-payment-assurance-profile.md`
**Network:** XDC Apothem (`eip155:51`)
**Candidate profile:** `trusted_node_finalized_xdc_token_transfer_v1`
**Scope:** Architecture and verification contract only; no implementation authorization

---

## 1. Executive Summary

IOT-07 defines ProofPath's first non-Concordium payment-assurance profile.

The objective is to extend ProofPath beyond portable evidence integrity to bounded verification of an actual blockchain token-transfer observation, using XDC Apothem as the initial external environment.

The proposed profile evaluates whether independently established payment expectations match a successful, finalized token-transfer transaction, according to an expressly approved trusted-node policy.

This profile does not claim independent consensus verification, trustless settlement, proof of commercial payment purpose, or end-to-end x402 payment authorization.

The design must preserve the platform-neutral ProofPath evidence core, existing Concordium-specific verifiers, and existing Base-specific x402 mapper without semantic weakening.

**Architectural principle:** Evidence tells a story. Assurance has boundaries.

## 2. Background and Prior Milestones

### 2.1 IOT-01 through IOT-05

Earlier interoperability testing demonstrated:

- Compatibility of XDC observations with the existing portable ProofPath evidence architecture.
- Evidence manifest validation and cryptographic integrity assessment.
- Tamper detection.
- Independent installation and consumption of the packaged ProofPath SDK.
- Producer-to-verifier evidence exchange and offline reassessment without fresh RPC access.

These results established evidence portability and integrity, not independently verified payment settlement.

### 2.2 IOT-06

IOT-06 established the accepted cross-platform assurance architecture, including separate obligations for network identity, payment expectations, execution, asset transfer, settlement finality, agent identity, key binding, historical validity, action-specific authority, and cross-platform transaction binding.

IOT-07 must respect IOT-06 decisions D1–D9 and must not collapse these distinct obligations into a single unexplained verified flag.

### 2.3 IOT-07A and IOT-07B

IOT-07A identified a historical XDC Apothem token-transfer transaction and demonstrated consistency between transaction calldata, receipt, transfer event, and reported block.

IOT-07B established that the queried XDC RPC endpoint reports a canonical block matching the fixture and a finalized checkpoint beyond the fixture height.

Those observations support technical feasibility but do not, by themselves, constitute independent trust-policy approval or independent consensus verification.

## 3. Proposed Profile Identity

**Identifier:** `trusted_node_finalized_xdc_token_transfer_v1`

**Network:** `eip155:51`

**Asset type:** Fungible token with ERC-20/XRC-20-compatible transfer behavior.

**Initial asset:** XDC Apothem USDC test token.

**Transfer form:** Direct `transfer(address,uint256)` transaction, with matching token `Transfer(address,address,uint256)` event.

**Verification model:** Policy-approved trusted-node observation with independently established expected transfer terms.

**Primary assurance target:** Exact expected token transfer included in a successfully executed transaction, in a block whose finality is established under the approved trusted-node policy.

This profile is specific to XDC Apothem. It is not a generic EVM verifier or a multi-chain settlement-verification interface.

## 4. Historical Reference Fixture

### 4.1 Network and asset

| Field | Value |
|---|---|
| Network | `eip155:51` |
| RPC endpoint used during discovery | `https://rpc.apothem.network` |
| Token contract | `0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4` |
| Externally published asset reference | XDC Apothem testnet USDC |
| Self-reported token name | `USDC` |
| Self-reported token symbol | `USDC` |
| Self-reported decimals | `6` |

The contract address matches publicly documented XDC Apothem USDC references from Circle, XDC Network, and the x402 Foundation.

These references establish a basis for proposing an explicit asset allowlist. They do not replace ProofPath trust-policy approval or establish the historical runtime implementation.

### 4.2 Reference transaction

| Field | Value |
|---|---|
| Transaction hash | `0xc7d36e42643c270ab70436770bae39c680782b70b6f63f2940a53b9cc2232520` |
| Block number | `0x51ceee7` |
| Block hash | `0xf04560246430c88fe02cf327d60b9f2dc7070bc0bd1564b70ddece9823d56554` |
| Transaction sender | `0xa29e266009ccfc899f1135a0fc904b785e8e90b0` |
| Token-transfer recipient | `0x5d778f347eb5fcc0bc04c11624245985b0dbcc21` |
| Atomic transfer amount | `10000` |
| Display amount | `0.01` token units, assuming six decimals |
| Transaction destination | Token contract |
| Function selector | `0xa9059cbb` |
| Receipt execution status | `0x1` |
| Matching transfer logs | `1` |
| Historical contract code | Reported present |

### 4.3 Observed finality checkpoint

During IOT-07B, the queried endpoint reported:

| Field | Value |
|---|---|
| Latest block | `0x51cf0a7` |
| Finalized block | `0x51cf0a5` |
| Canonical fixture block match | `true` |
| Fixture height covered by finalized height | `true` |
| Independent consensus verification | `false` |
| Approved RPC-source trust policy | Not established |

The finalized checkpoint was 446 blocks above the fixture block.

This is a historical RPC observation, not a persistent guarantee about all future endpoint responses.

The original preflight compared block height and canonical block hash but did not independently prove the complete ancestry path from fixture to finalized checkpoint.

### 4.4 Fixture disposition

**Accepted as a controlled technical transfer fixture.**

The fixture may be used to exercise transaction binding, event matching, finality-policy assessment, evidence capture, and negative tests.

It must not be described as an independently authenticated commercial payment, proof of merchant intent, or completed x402 settlement.

## 5. Assurance Statement

The proposed positive assurance claim is:

> Under an independently approved ProofPath trust policy, an authenticated and authorized XDC Apothem node reports that a specified transaction executed successfully and produced the exact expected token transfer, in a canonical block covered by the node's finalized checkpoint.

The claim must identify its trust model and verification limitations.

A positive result means **verified under the approved trusted-node policy**, not independently consensus-verified or trustless.

Any stronger claim requires a separately designed and approved assurance profile.

## 6. Required Assurance Obligations

### 6.1 Network identity

The verifier must confirm that all relevant observations and expectations refer to `eip155:51`.

A mismatched chain identity must not produce positive assurance.

### 6.2 Independently approved payment expectations

The expected transfer must be established independently of the transaction evidence being verified.

The verifier must receive approved values for:

- Network.
- Token contract.
- Expected recipient.
- Exact amount in atomic units.
- Expected transaction reference, where required by policy.
- Any required sender or payer identity.
- Permitted execution and settlement evidence sources.

The observed transaction must not be used to silently generate its own authoritative expected values.

An historical fixture can use a deliberately approved test assertion, but that assertion does not establish a pre-existing commercial payment request.

### 6.3 Transaction execution

The verifier must require:

- A valid transaction and receipt.
- Matching transaction hashes.
- Successful receipt execution status.
- Coherent transaction, receipt, and block bindings.
- Inclusion in the relevant block under the approved source model.

A successful receipt alone does not establish the correctness of a token transfer.

### 6.4 Token-transfer evidence

For the initial direct-transfer profile, the verifier must require:

- The explicitly approved token contract.
- Supported direct-transfer calldata.
- The expected calldata recipient and atomic amount.
- A correctly formed transfer event from the approved token contract.
- Exact agreement between the supported calldata, observed event, and independently approved expectations.
- Transaction-level log binding, including transaction hash, block hash, and log location where available.

Additional token-transfer logs, unexpected transfer effects, unsupported token behavior, or contradictory evidence must be handled explicitly rather than ignored.

The profile must define and enforce a strict supported-token behavior policy. Generic event matching cannot establish arbitrary token balance semantics, especially for unusual, upgradeable, fee-on-transfer, rebasing, or otherwise nonstandard contracts.

If approved historical contract behavior cannot be established sufficiently for the claimed assurance, the outcome must remain indeterminate.

### 6.5 Settlement finality

The trusted-node finality policy must require:

- A canonical fixture block matching the expected reference.
- A node-reported finalized checkpoint.
- The finalized checkpoint at or beyond the fixture height.
- An adequate policy-supported basis for establishing that the fixture lies on the finalized canonical chain.
- No contradictory canonical-chain or finality evidence.

A height comparison alone is insufficient if ancestry or an equivalent trusted canonical-finality guarantee is unresolved.

Arbitrary confirmation counts must not replace the approved finality policy.

### 6.6 Source authentication and trust

The source must be authenticated under an independently established trust policy.

Transport security, endpoint identity, permitted RPC behavior, provenance, policy approval, and relevant operational assumptions must be documented.

HTTPS alone does not establish consensus independence or source governance approval.

An unauthenticated, unapproved, or unavailable source cannot support a positive trusted-node assurance result.

### 6.7 Evidence integrity and provenance

The verifier must preserve the source observations and their provenance sufficiently to support later independent reassessment.

Evidence-integrity validation must remain distinct from the truth or trustworthiness of the originating node.

### 6.8 Cross-domain separation

Payment execution and settlement results must remain separate from:

- Agent identity and registry authority.
- Key ownership and historical authorization.
- Transaction-specific signing authority.
- x402 payment requirement satisfaction.
- Merchant entitlement or resource-release decisions.

No such assurance may be inferred merely because the token-transfer result is positive.

## 7. Proposed Trust Policy

The policy must be independently approved before it is used to authorize a positive assurance result.

### 7.1 Network and asset allowlist

The policy must explicitly pin:

- `eip155:51`.
- The approved token contract address.
- The supported asset interpretation.
- Relevant historical implementation assumptions.
- Supported transfer behavior and exclusions.

### 7.2 Approved source

The policy must define:

- Accepted endpoint identity and authentication requirements.
- Source ownership or operational trust basis.
- Approved RPC methods.
- Required response consistency.
- Source-failure handling.
- Any required independent corroboration.

The discovery endpoint is a candidate source, not an automatically approved trust anchor.

### 7.3 Policy provenance

The policy must include a stable identifier, version, approval authority, effective period, integrity commitment, and approval evidence.

A verifier must not approve its own policy solely by observing that it can communicate with an RPC endpoint.

### 7.4 Finality authority

The policy must state precisely what the node's `finalized` report means for this profile and which canonicality or ancestry checks are required.

It must not describe node-reported finality as independently verified XDPoS consensus unless consensus verification is actually performed.

## 8. Proposed Verification Result Contract

The implementation should return a structured result with at least:

| Field | Meaning |
|---|---|
| `profileId` | Exact assurance profile |
| `status` | `verified`, `failed`, or `indeterminate` |
| `network` | Evaluated chain identity |
| `transactionHash` | Evaluated transaction |
| `policyId` | Approved trust-policy reference |
| `policyVersion` | Applicable policy version |
| `policyDigest` | Policy integrity commitment |
| `expectedTransfer` | Independently approved expected transfer |
| `observedTransfer` | Matched observed transfer |
| `executionAssessment` | Supported execution finding |
| `transferAssessment` | Supported asset-transfer finding |
| `finalityAssessment` | Supported finality finding |
| `sourceTrustAssessment` | Source authorization and trust finding |
| `evidenceReferences` | Referenced observations and commitments |
| `reasonCodes` | Machine-readable findings or limitations |
| `limitations` | Explicit assurance exclusions |
| `consensusIndependentlyVerified` | `false` for this profile |

The result must communicate the scope of its assertions without requiring consumers to infer meaning from the status label.

The schema and API integration remain implementation design tasks. This section is a proposed contract, not an existing SDK API.

## 9. Outcome Semantics

### 9.1 Verified

Return `verified` only when all required obligations are satisfied under the applicable approved policy.

Positive status must not be issued if an obligatory source, policy approval, asset interpretation, transaction binding, or finality requirement is missing.

### 9.2 Failed

Return `failed` when sufficient trusted evidence establishes a definitive contradiction to approved expectations or a required verification condition.

Examples include:

- Wrong approved-network identity.
- Wrong token contract.
- Wrong transfer recipient.
- Wrong atomic amount.
- Reliably established reverted execution.
- Reliably established incompatible transaction or event evidence.

The result must explain the specific failed obligation.

### 9.3 Indeterminate

Return `indeterminate` when the available evidence is insufficient to establish either a positive result or a definitive failure.

Examples include:

- Missing or unapproved trust policy.
- Unavailable or unauthenticated evidence source.
- Missing transaction or receipt without authoritative evidence of nonexistence.
- Unavailable or unsupported finalized checkpoint.
- Unresolved block ancestry.
- Unestablished historical token implementation behavior.
- Contradictory source observations that cannot be resolved.
- Incomplete or unverifiable evidence provenance.

All indeterminate results must fail closed for payment-assurance purposes.

### 9.4 Unsupported inputs

Unsupported network, asset, transaction form, or profile combinations must be rejected or classified as unsupported under an explicit API contract.

They must never produce positive assurance through permissive fallback.

## 10. Evidence Capture and Offline Reassessment

The profile should preserve:

- Network and transaction references.
- Transaction and receipt observations.
- Required transfer logs.
- Relevant block and finalized-checkpoint observations.
- Evidence-source identity and acquisition context.
- Approved policy identifiers and integrity commitments.
- Applicable asset and historical implementation references.
- Verification findings and limitations.

ProofPath's existing portable evidence contracts and integrity mechanisms should be reused where appropriate.

Offline reassessment may establish that preserved evidence remains intact and that the recorded observations satisfy a selected approved policy.

It must not silently claim fresh network state, current source authentication, or independent consensus verification that was not performed.

A changed trust policy must result in an explicitly identified reassessment, not silent reinterpretation of an earlier positive outcome.

## 11. Historical Contract Implementation Boundary

The original IOT-07A test confirmed that contract code was reported present at the fixture block.

That check does not establish:

- The complete historical implementation identity.
- Proxy or upgrade state.
- Contract implementation authenticity.
- Token behavior under every possible execution path.
- That events alone capture all relevant token balance changes.

The implementation profile must determine how the approved asset and token semantics are bound to the historical transaction.

If these requirements cannot be met, the profile must narrow its assertion or return an indeterminate result.

## 12. Acceptance Test Matrix

| Test | Scenario | Expected result |
|---|---|---|
| T01 | Valid reference transfer with approved policy, source, asset interpretation, and finality | `verified` |
| T02 | Wrong token contract | `failed` |
| T03 | Wrong recipient | `failed` |
| T04 | Wrong atomic amount | `failed` |
| T05 | Reliably established reverted transaction | `failed` |
| T06 | Missing approved trust policy | `indeterminate` |
| T07 | Unavailable or unauthenticated RPC source | `indeterminate` |
| T08 | Finality not established | `indeterminate` |
| T09 | Canonical block or ancestry unresolved | `indeterminate` |
| T10 | Insufficient historical implementation evidence | `indeterminate` |
| T11 | Tampered evidence commitment | Integrity failure; no positive assurance |
| T12 | Unsupported chain, asset, or transaction form | Reject or unsupported |
| T13 | Offline reassessment with complete preserved evidence and approved policy | Bounded reassessment result |
| T14 | No independent consensus proof | Explicit `consensusIndependentlyVerified=false` |
| T15 | Commercial payment intent not independently established | No commercial-intent claim |
| T16 | Contradictory transfer effects or unsupported token behavior | No positive assurance |

T01 is a future implementation acceptance criterion. The historical discovery tests do not themselves satisfy all of its preconditions.

## 13. Scope Exclusions

The initial IOT-07 profile excludes:

- Live payment creation or token transfers.
- Wallet signing, private keys, or custody.
- x402 facilitator integration and HTTP resource release.
- General-purpose x402 payment verification.
- Cross-chain settlement or bridging.
- Cross-platform agent authority.
- Registry delegation and transaction-specific agent authorization.
- Independent consensus cryptographic verification.
- Production payment certification.
- Universal EVM token semantics.
- Modification of existing Concordium assurance behavior.

Future scope expansion requires a separately justified profile and explicit acceptance criteria.

## 14. Relationship to Existing ProofPath Components

The implementation must preserve:

**PP-01 portable evidence core:** No weakening of existing evidence integrity, provenance, manifest, or schema contracts.

**PP-02 assessment layer:** Retain existing assessment semantics without claiming that evidence consistency alone proves payment settlement.

**Concordium-specific verifiers:** Preserve existing receipt, settlement, agent-authority, and composer boundaries.

**Existing x402 mapper:** Retain its supported network and protocol scope. Do not relabel the existing Base-specific mapper as a generic EVM or XDC mapper.

The preferred design is an isolated XDC assurance profile built on reusable platform-neutral evidence primitives.

No universal payment verifier or shared multi-chain composer is authorized by this specification.

## 15. Proposed Architecture Decisions

| Decision | Proposal | Disposition |
|---|---|---|
| IOT07-D1 | Restrict the initial profile to XDC Apothem (`eip155:51`) | Accepted |
| IOT07-D2 | Explicitly allowlist the documented Apothem USDC token with historical behavior requirements | Accepted |
| IOT07-D3 | Require independently established exact transfer expectations | Accepted |
| IOT07-D4 | Require an independently approved authenticated trusted-node source policy | Accepted |
| IOT07-D5 | Require canonicality, supported finalized coverage, and adequate ancestry/finality evidence | Accepted |
| IOT07-D6 | Use bounded `verified`, `failed`, and `indeterminate` outcomes with fail-closed behavior | Accepted |
| IOT07-D7 | Preserve portable evidence and policy provenance for independent reassessment | Accepted |
| IOT07-D8 | Preserve PP-01, Concordium verifier, and existing x402 mapper boundaries | Accepted |

Decisions IOT07-D1 through IOT07-D8 were formally accepted on 2026-11-24.

## 16. Implementation Readiness Gates

Before implementation is authorized, the following must be resolved:

1. Explicit approval of IOT07-D1 through D8.
2. Approval of the exact asset and historical token-behavior trust requirements.
3. Selection and approval of the authenticated RPC source and governance model.
4. Definition of sufficient finality and canonical-ancestry evidence.
5. Approval of the expected-transfer fixture policy and its non-commercial scope.
6. Agreement on the result contract and negative-test semantics.
7. Confirmation that implementation can be contained without modifying unrelated verification paths.

Implementation should be limited to the smallest viable verification component and corresponding tests.

Documentation acceptance alone must not be interpreted as permission to deploy, transact, or change live payment workflows.

## 17. Normative and Supporting References

### Internal

- ProofPath IOT-01 through IOT-05 acceptance record:
  `docs/interoperability/xdc/proofpath-xdc-iot01-iot05-acceptance-record.md`
- ProofPath IOT-06 cross-platform assurance architecture:
  `docs/interoperability/proofpath-iot06-cross-platform-assurance-architecture.md`

### External

- Circle, USDC on XDC Network:
  https://www.circle.com/multi-chain-usdc/xdc
- Circle, USDC and CCTP V2 on XDC:
  https://www.circle.com/blog/now-available-usdc-cctp-v2-on-xdc-network
- XDC Network, USDC QuickStart:
  https://docs.xdc.network/xdcchain/developers/usdc-quickstart/
- XDC Network, JSON-RPC documentation:
  https://docs.xdc.network/xdcchain/developers/rpc/
- XDC Network, Apothem RPC:
  https://docs.xdc.network/xdcchain/developers/apothemrpc/
- x402 Foundation, Network and Token Support:
  https://github.com/x402-foundation/x402/blob/main/docs/core-concepts/network-and-token-support.mdx

External references establish relevant published network, asset, and protocol information. They do not constitute ProofPath trust-policy approval.

## 18. IOT-07 Disposition

**IOT-07A:** Technical transfer fixture identified and accepted for controlled testing.

**IOT-07B:** Trusted-node finality reporting and canonical-block feasibility demonstrated; formal source and finality policy approval outstanding.

**IOT-07C:** Architecture specification accepted; decisions D1–D8 approved.

**Overall IOT-07 status: ACCEPTED AND CLOSED — Architecture Only.**

No payment-verification implementation, production assurance claim, live transaction, or additional repository publication is authorized by this document alone.

---

**Concluding principle**

ProofPath's first external payment-assurance profile must establish not merely that evidence is internally consistent, but that its verified claims are supported by independently approved expectations, an explicit trust model, defensible asset interpretation, and appropriately bounded finality evidence.

**Evidence tells a story. Assurance has boundaries.**
