# ProofPath — EU AI Act Technical Alignment

- **Evidence, Traceability & Accountability | Technical Paper v1.0 (initial release)**
- **Assessment date:** 2026-11-08
- **Repository baseline:** `rgraulus/proofpath`, `main`, merge commit `e731994f156583ffbcd2b29bce45d13741547170` (PP-04-B)
**Document classification:** Engineering alignment paper; not a legal opinion, conformity assessment, certification or declaration of compliance.

## Executive summary

ProofPath is an **independent evidence and accountability infrastructure layer** for agent-mediated transactions. It supplies portable evidence representations, integrity and provenance assessment, selected verification functions, bounded evidence composition, and controlled export mechanisms. These technical capabilities may support regulatory oversight and selected recordkeeping processes, including processes relevant to Articles 12, 19 and 26 of the EU Artificial Intelligence Act, Regulation (EU) 2024/1689 as amended.

ProofPath does **not** determine whether an AI system is high-risk; continuously capture an AI system's lifetime events; provide production evidence custody or legal retention enforcement; operate an incident-monitoring program; or establish that an operator complies with the AI Act. The currently integrated PP-04-B demonstration is **offline and synthetic**. Independently authenticated live transactions and production interoperability have not been validated in that application.

**Core assurance rule:** *Evidence tells a story. Assurance has boundaries.* Integrity of a representation, authenticity of a source, verification of a particular claim, and assurance of an entire transaction are separate propositions.

## 1. Scope, audience and intended use

This paper addresses engineers, platform operators, compliance architects, auditors and ecosystem partners examining how ProofPath may support evidentiary requirements. It describes the merged PP-01 through PP-04-B implementation and identifies integration obligations and gaps. It does not map every AI Act requirement, every Annex III use case, every member-state law or every data-protection obligation.

The AI Act's high-risk logging and recordkeeping duties are addressed to relevant **providers and deployers of qualifying high-risk AI systems**, depending on classification and circumstances. Not every autonomous agent or payment service is a high-risk AI system. An operational assessment must establish the system's intended purpose, relevant classification route, operator roles, territorial scope, dates and transitional conditions before assigning obligations.

The relationship between agents and an accountable owner or principal is an important ProofPath design objective. It is **not** a universal statement that Article 12 requires every AI-agent action to be attributed to a named human.

### Legal reference date

This paper uses the **consolidated AI Act text as of 27 July 2026**, and the European Commission's implementation guidance available at the assessment date. Under the amended timetable, Annex III high-risk provisions generally apply from **2 December 2027** and Annex I product-related high-risk provisions from **2 August 2028**; other AI Act provisions became applicable earlier. Dates, exceptions and later changes must be reassessed for specific deployments.

## 2. Regulatory-to-engineering mapping

| Provision | Regulatory focus | Relevant ProofPath contribution | Not provided by ProofPath |
| --- | --- | --- | --- |
| Article 12(1) | Technical ability of relevant high-risk AI systems to automatically record events over the system's lifetime | Typed audit-event contract and append/verify primitives | Automatic system-wide instrumentation and lifetime coverage |
| Article 12(2) | Traceability of functioning, monitoring and analysis of risks and substantial changes as appropriate | Transaction/correlation identifiers; event types, outcomes and evidence references; hash-linked continuity checks | Risk taxonomy completeness, monitoring program, event-source coverage guarantees |
| Article 12(3) | Additional logging for specified biometric identification systems | No specialized claim | Required biometric-system-specific event elements |
| Article 19 | Provider retention of automatically generated high-risk-system logs under provider control, subject to applicable qualifications | Manifest retention policy, responsible-party and retention-until metadata | Durable storage, enforcement, access controls, legal holds, deletion and privacy law compliance |
| Article 26(5) | Deployer monitoring and relevant notifications | Reviewable observed outcomes and supporting evidence where captured | Operational monitoring, escalation and notification processes |
| Article 26(6) | Deployer retention of logs under its control, subject to applicable qualifications | Exportable records and audit references | Enforced records management or legally sufficient retention |

For Articles 19 and 26(6), the regulatory text includes a generally applicable **at least six-month** period for relevant controlled logs, subject to qualifications and applicable Union or national law, particularly data-protection law. This is **not** a ProofPath default retention setting or a universal permission to keep personal data for six months.

## 3. Architecture and evidence semantics

### 3.1 PP-01 — Portable evidence and audit foundations

**Verified implementation references:**

- `schemas/proofpath-evidence-v1.schema.json` and `schemas/proofpath-audit-event-v1.schema.json` — versioned schema contracts.
- `src/core/types.ts` and `src/core/validate.ts` — typed records and runtime structural/reference validation.
- `src/core/canonical.ts`, `src/core/hash.ts`, `src/core/provenance.ts` — deterministic representation, SHA-256 commitments and bounded provenance assessment.
- `src/core/audit.ts` — in-memory hash-linked journal, event count/head and sequence consistency verification.
- `src/core/export.ts` — public and restricted portable export representations and export-digest validation.

The manifest represents transaction context, participants, commercial terms, authorization, payment, delivery, evidence artifacts, claim assessments, audit metadata and governance references. Audit events correlate through `transactionId`, `correlationId` and evidence identifiers. Key properties include `eventId`, `eventType`, `sequence`, `sourceEventAt`, `observedAt`, `outcome`, `previousDigestSha256` and `eventDigestSha256`.

`sourceEventAt` is a source-attributed event timestamp; `observedAt` is a collector observation timestamp. Neither is inherently a trusted timestamp. The journal's integrity check needs an **independently trusted expected head and event count**. A hash chain is not automatically immutable, complete, durable or externally anchored.

The manifest declares coverage as `complete_for_declared_scope`, `partial` or `unknown`; the first value never proves all real-world or AI-system events were captured.

### 3.2 PP-02 — Identity, trust and seller binding

`src/pp02/sellerBinding.ts` evaluates consistency among seller registry information, receiving wallet, advertised/authorized endpoint, payment recipient, settlement recipient and delivery evidence. It is deterministic, offline and fail-closed. It does **not** authenticate registry observations, settlement proofs, endpoint signatures or delivery signatures by itself. A consistent set of caller-supplied claims is not proof of seller authenticity or delivery.

Agent-to-owner/principal evidence must distinguish registry assertions, authenticated identity, permitted delegation, scope of authority and policy approval. ProofPath's current functions are not a generalized legal identity or ownership determination.

### 3.3 PP-03 — Specialized verification and composition

- `src/verification/facilitatorReceipt.ts` — checks a narrowly defined facilitator receipt JWS and transaction binding against independently approved signing-key policy and expectations; receipt authentication **does not establish settlement**.
- `src/verification/settlementFinality.ts` — evaluates a successful, finalized Concordium PLT transfer based on trusted-node observations and an independently anchored policy; **does not independently implement consensus verification or authenticate injected transports**.
- `src/verification/agentAuthority.ts` — evaluates a registry/key authority claim against trusted policy and trusted-node observations; **does not independently authenticate the production transport or prove unrestricted legal authority**.
- `src/composition/transactionEvidence.ts` — deterministic, fail-closed composition of bounded source results into a transaction evidence manifest; prevents missing or conflicting evidence from being silently promoted into transaction-wide assurance.

### 3.4 PP-04-B — Integrated offline application and exports

`src/application/pp04/orchestrator.ts` invokes the existing verifiers, seller-binding evaluator and composer using trusted synthetic fixture construction. The CLI and localhost browser are demonstrations, not a production ingestion or compliance service. `src/application/pp04/trustedConfig.ts` pins approved schema digests. `src/application/pp04/export.ts` adds a local application disclosure boundary to PP-01 exports.

**Acceptance outcomes:** F01 consistent input remains `incomplete`; F02 missing evidence remains `incomplete`; F03 binding conflict is `rejected`; F04 unsupported assurance promotion is `rejected`. Rejected outcomes provide no manifest/export. Public export follows an explicit minimized representation; restricted export includes the validated manifest, with explicit local CLI acknowledgement. Acknowledgement is not user authentication, legal access authorization or encryption.

At the PP-04-B acceptance checkpoint, **370 repository tests** and **10 targeted PP-04-B integration tests** passed, with successful TypeScript checks/build and browser/CLI acceptance. Tests validate defined software behavior under synthetic inputs, not real regulatory compliance.

## 4. Traceability and accountability model

A credible deployment should preserve distinct levels of evidence:

1. **Recorded assertion:** what a component or collector reported.
2. **Representation integrity:** whether artifact bytes or structured records match trusted expected commitments.
3. **Source authenticity:** whether a trusted policy and authenticated transport/signature establish who produced the source record.
4. **Claim verification:** whether a verifier established a *specific* fact under declared expectations, evidence and trust assumptions.
5. **Transaction-wide assurance:** whether the necessary set of independently supported claims is sufficient for a defined purpose; otherwise the outcome stays incomplete, indeterminate or rejected.

The application should also record who made or approved applicable policy decisions, which observations were missing, and the scope and limitations of collection. Policy identifiers or hashes do not prove a policy was duly authorized unless independently governed.

## 5. Governance, privacy and disclosure

The evidence manifest can reference `governance.retentionPolicyRef`, `governance.retentionResponsibleParty`, `governance.retentionUntil`, `governance.disclosureProfile` and `governance.auditProfile`. These are **declarations**, not an operational records-management system.

Production deployments need documented purposes and lawful bases for any personal-data processing, data minimization, access restrictions, retention schedules and deletion/legal-hold handling. The AI Act must be considered alongside applicable data-protection law; a security or audit rationale does not justify indiscriminate collection or indefinite retention.

Public portable exports use a restrictive projection; restricted exports preserve more detailed material. Consumers remain responsible for recipient authorization, key management, custody, signing/encryption where appropriate, secure transmission and disclosure accounting. A valid export digest demonstrates representation consistency relative to the checked data; it does not prove the underlying event occurred.

## 6. Implemented capabilities, open gaps and ownership

| Area | Status at PP-04-B | Primary production responsibility |
| --- | --- | --- |
| Versioned evidence/event schemas | Implemented | ProofPath core; host selects approved versions |
| Structural/reference validation | Implemented | ProofPath core with trusted schemas |
| Hash and logical journal verification | Implemented, in memory | Host preserves trusted head/count and custody |
| Selected receipt/settlement/agent-authority verification | Implemented for narrow configured claims; synthetic integrated demonstration | Host supplies authenticated sources, policy and expected context |
| Bounded evidence composition | Implemented | Host selects and governs input claims and policies |
| Public/restricted portable export | Implemented; local demo controls only | Host implements production authentication, consent/authorization and custody |
| Automatic logging for full AI-system lifetime | Not implemented | AI-system provider/integrator |
| Production immutable/durable logging and retention | Not implemented | Operator and records platform |
| Comprehensive AI-system risk monitoring and notification | Not implemented | Provider/deployer as applicable |
| EU AI Act classification and conformity | Not implemented | Responsible organizations and qualified advisers |
| Live transaction and multi-platform integration in PP-04-B | Not implemented | Future, separately accepted adapters/deployments |

## 7. Deployment assessment checklist

Before claiming any support for regulatory processes in a specific implementation, an integrator should record:

- The relevant AI system, intended purpose, user and deployment context, operator roles, risk classification and legal basis for the regulatory mapping.
- All events required for the *declared* audit scope and whether collection is automatic, complete, time-bounded and monitored.
- Exact sources, source-authentication mechanisms, expected transaction binding and approved verification policies.
- Rules governing authorization/delegation evidence and how any owner/principal claim is authenticated and appropriately limited.
- Retention requirements, durable storage, trusted commitments/anchors, recoverability, lawful deletion and incident response.
- Personal-data inventory, minimization policy, public/restricted disclosure and access decisions.
- Evidence freshness, replay controls, failure handling, clock accuracy and any service-level assumptions.
- Reproducible tests against *independently operated* sources; external review where appropriate.
- Regulatory review dates and change-management process for new law, guidance, system roles or business use cases.

**No deployment compliance claim should be inferred solely from passing ProofPath unit/integration tests.**

## 8. Documentation lineage

- [`article12-mapping.md`](article12-mapping.md) — historical **PP-01** Article 12/19/26 technical mapping, assessed 2026-11-03. Its pending/deferred status statements refer to that checkpoint, not the merged PP-04-B state.
- [`pp04-demo-runbook.md`](pp04-demo-runbook.md) — controlled synthetic PP-04-B demonstration and acceptance procedures.
- [`../demo/pp04/README.md`](../demo/pp04/README.md) — supported CLI/browser demo commands and boundaries.
- [`../README.md`](../README.md) — public architecture overview and status.

This paper is the cross-milestone engineering alignment view; historical mapping documents remain intact for audit traceability.

## 9. Normative legal and implementation references

- [Regulation (EU) 2024/1689 — consolidated text (27 July 2026)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727)
- [European Commission — AI Act implementation timeline](https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline)
- [European Commission — AI Act overview and amendments](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [AI Act Article 12](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)
- [AI Act Article 19](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-19)
- [AI Act Article 26](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26)

**Maintenance rule:** re-evaluate this document when the AI Act, relevant guidance, ProofPath's implementation or a deployment's operator responsibilities change.
