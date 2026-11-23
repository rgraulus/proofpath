# ProofPath — XDC Interoperability Acceptance Record (IOT-01 through IOT-05)

**Record:** IOT-01 through IOT-05  
**Status:** ACCEPTED — CLOSED  
**Closure date:** 2026-11-23  
**Scope:** Cross-platform evidence portability and independent reverification  
**Reference implementation:** ProofPath SDK v0.1.0

## 1. Executive Summary

ProofPath successfully demonstrated that its platform-neutral
evidence infrastructure can represent, export, transfer and
independently reassess evidence originating from a blockchain
environment other than Concordium.

The validation used an XDC Apothem transaction observation
and two separately installed ProofPath SDK consumers.

The receiving application verified the transferred evidence
without access to the producing application's runtime and
without making additional blockchain RPC calls.

Positive and negative tests demonstrated evidence-integrity
checks, tamper detection, structural validation and
preservation of explicit assurance limitations.

No changes to the ProofPath core architecture or existing
blockchain-specific implementations were required.

This acceptance establishes evidence portability within the
tested scope. It does not establish payment settlement,
blockchain consensus, source authentication or cross-chain
agent-authority verification.

## 2. Frozen Technical Baseline

Repository: rgraulus/proofpath

Branch: main

Commit:
fd869f95ad65be4791c217d25ace183aaf030320

SDK: @proofpath/core v0.1.0

SDK archive SHA-256:
ca4e15d02b58de3b79101ef0b2ee35f660e83819fa34ecfba8f1af8d302f737e

Blockchain: XDC Apothem

Network: eip155:51

Reference transaction:
0xdae4c167bbface838e4eeb73130aa00ce3286f560448079d620f0724bf2ea73d

Receipt observation SHA-256:
44603cf0eeb4bede306d4a4a1a8ee6f8b73c3654bad8e2c290ac16c06d45bc78

The receipt commitment covers the UTF-8 JSON serialization
used during collection, not the original HTTP response bytes.

## 3. Interoperability Acceptance Results

| Test | Acceptance result |
|---|---|
| IOT-01 — SDK architectural inspection | PASS |
| IOT-02 — XDC RPC and transaction discovery | PASS |
| IOT-03 — PP-01 schema compatibility | PASS |
| IOT-04A — Live evidence collection and commitments | PASS |
| IOT-04B — SDK integrity and tamper detection | PASS |
| IOT-04C — Independently installed SDK consumer | PASS |
| IOT-05A — Evidence exchange preparation | PASS |
| IOT-05B — Independent evidence producer | PASS |
| IOT-05C — Offline evidence reverification | PASS |
| IOT-05D — Negative and assurance-boundary checks | PASS |
| IOT-05E — Local workflow without core changes | PASS |

Acceptance applies to the tested local environment and
defined test cases.

## 4. Producer and Verifier Workflow

### Application A — Evidence Producer

The producer:

1. Retrieved the XDC Apothem transaction receipt.
2. Serialized the receipt as UTF-8 JSON.
3. Calculated its SHA-256 evidence commitment.
4. Constructed a PP-01 evidence manifest.
5. Validated the manifest using ProofPath's runtime validator.
6. Created a restricted portable evidence export.
7. Wrote the evidence package to a local exchange directory.

Generated package:

- receipt-observation.json
- restricted-export.json

### Application B — Independent Verifier

The verifier operated through a separate installation of
the pinned ProofPath SDK.

It:

1. Loaded locally trusted ProofPath schemas.
2. Validated the restricted export commitment.
3. Recomputed the manifest commitment.
4. Validated the manifest's structural and reference integrity.
5. Checked the transaction and network against expected values.
6. Compared transferred receipt bytes against their commitment.
7. Tested altered bytes and modified export data.
8. Verified that payment-assurance limitations remained intact.

The verifier performed zero live RPC calls.

## 5. Positive and Negative Results

Positive evidence:

- Export digest valid.
- Original manifest commitment matched.
- PP-01 manifest schema valid.
- Transaction and network binding checks passed.
- Original evidence integrity matched.
- Explicit assurance limitations preserved.

Negative evidence:

- Modified receipt bytes detected.
- Modified export rejected.
- Missing evidence reference rejected.

These results establish internal consistency and integrity
relative to the supplied commitments.

They do not establish that those commitments originated
from an authenticated or independently trusted producer.

## 6. Assurance Boundaries

The following remain explicitly unverified:

- Independent authentication of the RPC evidence source.
- Blockchain consensus and finality.
- XDC token-payment settlement.
- x402 challenge-to-payment binding.
- Agent identity and delegated authority.
- Cross-chain agent-authority relationships.
- Historical truth of the producing application's claims.

A successful digest match does not prove that evidence is
authentic or that a commercial transaction occurred.

No production-grade payment or identity-assurance claims
are supported by this experiment.

## 7. Portability Assessment

The experiment supports three conclusions.

**Evidence portability:** The existing PP-01 representation
can accommodate the tested XDC blockchain observation.

**Implementation portability:** The packaged ProofPath SDK
can operate in separately installed consumer applications.

**Reverification portability:** A receiving application
can independently validate transferred evidence integrity
and structural consistency without contacting the producer.

Further testing is required to demonstrate interoperability
across independent organizations, execution environments
and trust infrastructures.

## 8. Remaining Work

Future interoperability priorities:

1. Independently authenticated evidence acquisition and
   trustworthy source commitments.
2. Payment-specific verification against an external x402
   ecosystem.
3. Independent blockchain settlement and finality evidence.
4. Cross-chain agent-identity and authority verification.
5. Broader interoperability validation across independently
   operated applications and infrastructure.

These activities are outside the IOT-05 acceptance scope.

## 9. Closure Decision

**IOT-05: ACCEPTED AND CLOSED**

The defined evidence-exchange and offline-reverification
objectives were demonstrated successfully.

The ProofPath repository remained unchanged during the
executed interoperability tests.

No additional ProofPath core changes were required.

The tested exchange package is retained locally and must
not be treated as a public disclosure artifact.

Future engineering work should proceed through a separately
defined scope rather than extending the completed IOT-05
acceptance milestone.

---

**Guiding principle:**

Evidence tells a story. Assurance has boundaries.
