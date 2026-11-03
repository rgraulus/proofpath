# ProofPath PP-01 — EU AI Act Article 12 Recordkeeping Mapping

**Document status:** PP-01 v1.0 technical alignment mapping  
**Scope:** ProofPath transaction evidence and audit-journal architecture  
**Regulatory reference:** Regulation (EU) 2024/1689, Articles 12, 19 and 26  
**Assessment date:** 2026-11-03

## 1. Purpose and boundaries

This document maps ProofPath PP-01 technical capabilities to selected
recordkeeping and traceability concepts in the EU Artificial Intelligence
Act (AI Act).

ProofPath is a portable evidence and accountability layer for agent-mediated
commercial transactions. Its first integration profile concerns Concordium
and x402, while its core evidence and audit primitives are platform-neutral.

This is a **technical alignment mapping**, not:
- a legal opinion or determination that a particular AI system is high-risk;
- a conformity assessment or certification;
- a declaration of AI Act compliance;
- a claim that ProofPath captures every internal AI-system event; or
- a substitute for provider and deployer obligations.

Applicability depends on the actual AI system, its intended purpose,
classification, relevant operator roles, deployment context and applicable law.
The application dates and any applicable transitional provisions must also
be assessed separately.

## 2. Relevant regulatory requirements

### Article 12(1) — Automatic event recording

Article 12(1) concerns the technical capability of high-risk AI systems to
record events automatically over the system's lifetime.

**PP-01 mapping:** ProofPath defines an audit-event schema and provides
in-memory event append and verification functions.

**Implementation status:** Core event recording primitives implemented;
automatic capture across the lifetime of an AI system is not implemented.

**Integration responsibility:** The host application must instrument
relevant event sources and trigger recording. The operator must establish
capture coverage, deployment lifetime and operational logging behavior.

### Article 12(2) — Traceability and monitoring

Article 12(2) addresses logging appropriate to a high-risk AI system's
intended purpose, including events relevant to identifying risks or
substantial modifications, supporting post-market monitoring and monitoring
operation under Article 26(5).

**PP-01 mapping:** Transaction IDs, correlation IDs, typed audit events,
outcomes, source assertions, timestamps, evidence references, sequence
numbers and journal commitments support reconstructing recorded activity.

**Implementation status:** Structured records, correlation checks and
hash-linked continuity checks implemented.

**Gap:** PP-01 does not automatically identify all relevant AI-system risks,
substantial modifications, post-market monitoring events or operational
failures. Appropriate event selection and monitoring processes are
deployment-specific responsibilities.

### Article 12(3) — Specific biometric identification systems

Article 12(3) specifies additional logging elements for the high-risk
systems described in Annex III, point 1(a), including periods of use,
reference databases, matched input data and persons involved in verification.

**PP-01 mapping:** No dedicated implementation of these requirements.

**Implementation status:** Out of the PP-01 transaction-evidence scope.

A generic transaction event must not be represented as satisfying
Article 12(3)'s specialized requirements.

### Article 19 — Provider-controlled logs

Article 19 addresses automatically generated logs under the control of
providers of high-risk AI systems.

Subject to applicable qualifications, providers must retain relevant logs
for an appropriate period of at least six months, unless otherwise provided
by applicable Union or national law, particularly personal-data law.
Special provisions also address certain financial institutions.

**PP-01 mapping:** Manifest governance metadata can identify a retention
policy reference, responsible party and retention-until value.

**Implementation status:** Retention metadata is defined; durable storage,
retention enforcement, access controls, legal holds and deletion workflows
are not implemented in PP-01.

**Responsibility:** The relevant operator must determine the legally
applicable retention period, storage obligations and lawful handling.

### Article 26(5)–(6) — Deployer monitoring and logs

Article 26(5) concerns deployer monitoring and related notifications.
Article 26(6) addresses automatically generated logs controlled by
deployers, including retention requirements subject to applicable law.

**PP-01 mapping:** Event outcomes, correlation identifiers and evidence
references may support a deployer's review of recorded transactions.

**Implementation status:** Evidence structures and journal verification
implemented; no automated operational monitoring, notification process,
incident response workflow or enforceable retention service is provided.

**Responsibility:** The deployer must implement any applicable monitoring,
incident escalation, records management and retention controls.

## 3. PP-01 audit-record structure

The Audit Event v1 schema defines a transaction-correlated event record.

Relevant fields include:

| Record element | Recordkeeping contribution |
| --- | --- |
| `eventId` | Event identity within a journal |
| `transactionId` | Transaction association |
| `correlationId` | Cross-component correlation |
| `eventType` | Controlled event classification |
| `sequence` | Position in the declared journal |
| `source` | Claimed source and collector attribution |
| `sourceEventAt` | Claimed source-event timestamp, possibly null |
| `observedAt` | Collector observation timestamp |
| `outcome` | Recorded event outcome |
| `payloadVersion`, `payload` | Versioned contextual event data |
| `evidenceIds` | Associated evidence references |
| `previousDigestSha256` | Previous event commitment |
| `eventDigestSha256` | Current event commitment |
| `externalAnchorRefs` | References to possible external anchors |

These fields support technical traceability. Presence of a source reference,
timestamp or external anchor reference does not authenticate its content.

The event vocabulary covers agent actions, identity observations,
delegation and policy evaluation, authorization, commercial terms,
payment progression, delivery, evidence collection, claim assessments,
oversight, export and retention actions.

The event type `payment_finalized` denotes a recorded event classification.
It is not itself evidence that settlement finality was independently verified.

## 4. Time and provenance semantics

`sourceEventAt` represents a timestamp attributed to the source event.
It may be null when the occurrence time is unknown.

`observedAt` records the collector's observation timestamp.

These fields must remain distinct. Their presence does not prove the
source clock was accurate, the collector clock was trusted, or the event
occurred at the stated time.

Provenance assessments distinguish:
- digest-matching artifact integrity;
- claimed producer and collector attribution;
- independently authenticated source identity;
- recorded but unverified historical context; and
- independently verified commercial claims.

PP-01 does not promote a digest match into authenticated source identity,
authorized agency, payment finality or true commercial claims.

## 5. Journal integrity and independent commitments

The PP-01 audit module implements a logical in-memory hash-linked journal.

Each event commitment uses ProofPath's domain-separated SHA-256 operation
over canonical event content, excluding `eventDigestSha256` itself.

Verification checks:
- expected event count;
- sequence continuity and genesis predecessor;
- duplicate or invalid event identifiers;
- transaction and correlation binding;
- predecessor links;
- event commitment consistency; and
- the expected terminal head commitment.

The caller must independently retain and authenticate the expected head
and count. An attacker who controls both a journal and its supplied
expectation can create a self-consistent replacement.

The in-memory implementation is not immutable or persistent storage.
A production integration requires durable storage, access governance,
trusted head preservation and recovery procedures.

The audit hash-chain verifier does not replace independent JSON Schema
validation of untrusted Audit Event records.

## 6. Declared coverage and limitations

The evidence manifest declares audit event identifiers, the journal head (`audit.headDigestSha256`),
a completeness classification and a coverage scope.

The supported completeness values are:
- `complete_for_declared_scope`;
- `partial`;
- `unknown`.

`complete_for_declared_scope` never means complete coverage of all
AI-system activity or every real-world event.

A deployment should document:
- the observation boundaries and components being instrumented;
- included and excluded event sources;
- unavailable evidence and collection failures;
- collector outages, clock limitations and delayed observation;
- whether journal commitments were independently preserved; and
- any gaps between source-system logs and ProofPath evidence.

A completeness declaration is an assertion to assess, not independently
established proof of exhaustive event capture.

## 7. Retention and governance metadata

The PP-01 manifest includes:
- `governance.retentionPolicyRef`;
- `governance.retentionResponsibleParty`;
- `governance.retentionUntil`;
- `governance.disclosureProfile`; and
- `governance.auditProfile`.

These fields describe governance intentions or references. They do not
automatically enforce retention, deletion, legal holds, access management
or compliance with applicable data-protection obligations.

Public and restricted disclosure handling must be evaluated against
confidentiality, privacy, personal-data minimization and retention needs.

## 8. Implemented, deferred and external responsibilities

| Capability | PP-01 assessment |
| --- | --- |
| Versioned evidence and event schemas | Implemented |
| Strict runtime schema validation | Implemented |
| Evidence-reference consistency | Implemented |
| Canonical JSON and SHA-256 commitments | Implemented |
| Artifact byte-integrity assessment | Implemented |
| Provenance assertions with trust separation | Implemented |
| In-memory hash-linked journal | Implemented |
| Expected journal-head and count verification | Implemented |
| Synthetic adversarial audit tests | Implemented |
| Whole-lifetime automatic AI-system logging | Not implemented |
| Durable immutable or tamper-resistant storage | Not implemented |
| Trusted external head publication or anchoring | Not implemented |
| Independent source identity authentication | Deferred |
| Agent authorization verification | Deferred |
| Independent payment and finality verification | Deferred |
| Regulatory risk classification and conformity assessment | External responsibility |
| Automated regulatory monitoring and notifications | External responsibility |
| Retention-period enforcement and deletion | External responsibility |
| Portable public/restricted export implementation | PP-01 M1.4 pending |

For a given integration, operator obligations and verification
responsibilities must be assessed separately from PP-01's data model.

## 9. Verification and evidence limitations

A successful schema validation proves conformity to configured structural
and semantic checks, not authenticity.

A matching artifact digest proves byte consistency relative to a supplied
reference, not source truth.

A valid audit journal proves consistency relative to a supplied expected
head and count, not that those expectations are independently trusted.

Synthetic tests prove the tested software behavior. They are not evidence
of actual Concordium transactions, payment settlement, blockchain finality
or regulatory compliance.

## 10. PP-01 acceptance relationship

This document supports PP-01's recordkeeping documentation checkpoint.

Related implementation files:
- `schemas/proofpath-evidence-v1.schema.json`
- `schemas/proofpath-audit-event-v1.schema.json`
- `src/core/types.ts`
- `src/core/canonical.ts`
- `src/core/hash.ts`
- `src/core/provenance.ts`
- `src/core/validate.ts`
- `src/core/audit.ts`
- `tests/integrity.test.ts`
- `tests/audit.test.ts`

M1.4 export, schema conformance and remaining public/restricted
disclosure checks must still be completed before final PP-01 acceptance.

## 11. Authoritative legal references

- Regulation (EU) 2024/1689, consolidated text:
  https://eur-lex.europa.eu/eli/reg/2024/1689
- European Commission AI Act Service Desk, Article 12:
  https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12
- European Commission AI Act Service Desk, Article 19:
  https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-19
- European Commission AI Act Service Desk, Article 26:
  https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26

This mapping reflects the technical and legal references reviewed on
2026-11-03. It should be reassessed when relevant law, implementation
guidance, deployment scope or ProofPath functionality changes.
