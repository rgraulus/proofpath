
# ProofPath Hackathon — Technical Scope & Roadmap v1.0

**Project:** ProofPath — Independent Accountability for Agent Commerce  
**Hackathon:** Encode Club — Concordium Trusted Agents Hackathon 2026  
**Challenge:** Make your Agents Accountable with Concordium  
**Document version:** 1.0  
**Baseline date:** 2026-11-20  
**Decision:** APPROVED WORKING BASELINE  
**Implementation authorization:** NOT YET GRANTED  
**Target submission:** 2026-12-08  
**Official deadline:** 2026-12-09 23:59 UTC (2026-12-10 00:59 CET)

---

## 1. Executive Summary

ProofPath is an independent, platform-agnostic evidence-assurance infrastructure layer for autonomous AI-agent commerce.

Its purpose is to collect, correlate, assess, preserve, and export evidence concerning agent identity and authority, commercial transaction binding, payment settlement, provenance, delivery assertions, and accountability.

ProofPath does not execute payments, control wallets, authorize resource release, or replace transaction infrastructure.

The hackathon objective is to demonstrate that the existing ProofPath TypeScript SDK can consume authentic Concordium Testnet evidence through a standalone integration, evaluate supported claims, preserve explicit assurance limitations, and produce a portable evidence result.

The demonstration will reuse existing Concordium x402/XCF infrastructure without modifying its payment execution or resource-release logic.

**Primary outcome:** A reproducible, read-only ProofPath SDK consumer demonstrating bounded independent evidence assessment against authentic Concordium Testnet evidence.

**Secondary outcome:** A negative-case demonstration showing that inconsistent transaction bindings cannot be promoted into verified assurance.

**Strategic objective:** Demonstrate ProofPath's value as reusable accountability middleware for independently operated agent-commerce applications, with Concordium as the first hackathon integration.

---

## 2. Hackathon Submission Contract

### 2.1 Administrative milestones

| Milestone | Deadline (UTC) | Status |
|---|---|---|
| Project creation, team and idea | Nov 22, 23:59 | Administrative preparation completed; no Stage 1 submission required |
| Final submission opens | Nov 22, 23:59 | Pending |
| Internal target submission | Dec 8 | Planned |
| Final submission closes | Dec 9, 23:59 | Pending |

All times above are in UTC.

### 2.2 Required deliverables

| ID | Requirement | Planned ProofPath deliverable |
|---|---|---|
| SUB-01 | Description | Architecture, implementation, Concordium use, demo instructions, and assurance limits |
| SUB-02 | Public code | Public ProofPath repository with reproducible integration |
| SUB-03 | Demo video | Public video, maximum 3 minutes, showing the core working flow |
| SUB-04 | Testnet link | Public CCDScan or CCDExplorer link to relevant Concordium Testnet agent, contract, or transaction |
| SUB-05 | Concordium technologies | Accurate selection of technologies actually demonstrated |
| SUB-06 | Path to Mainnet | Remaining engineering, intended users, production integration, and operational requirements |

Slides and live demo are optional.

Optional deliverables must not delay completion of mandatory requirements.

All submission URLs must be publicly accessible.

---

## 3. Current Engineering Baseline

### 3.1 ProofPath repository

Repository:

https://github.com/rgraulus/proofpath

Baseline:

- Branch: `main`
- Commit: `a94d0033abfa82c1870cf126d2d91c96c9e4ef8b`
- PR #18 merged on November 19, 2026
- Existing PP-01 through PP-04-B implementation available
- Private SDK package `@proofpath/core` v0.1.0
- Node.js 22+ / ESM
- Four supported package entry points

### 3.2 SDK entry points

| Entry point | Purpose |
|---|---|
| `@proofpath/core` | Portable evidence, canonicalization, integrity, provenance, audit, validation, and export |
| `@proofpath/core/x402` | Bounded Base Mainnet x402 v2 challenge-evidence mapping |
| `@proofpath/core/assessment` | Identity, trust, and seller-binding consistency assessments |
| `@proofpath/core/concordium` | Specialized Concordium verification and transaction-evidence composition |

The package remains private and supports controlled local packaging and consumption.

No public npm publication is authorized.

### 3.3 Independent Linux interoperability result

External developer Frits reported successful validation of commit `a94d003` using:

- Clean Linux LF checkout
- Node.js 22.22.0
- `npm ci`: PASS
- Typecheck: PASS
- Automated tests: 458/458 PASS
- `build:sdk`: PASS
- `npm pack`: approximately 106.6 kB and 86 files
- Clean independent-consumer installation: PASS
- All four ESM entry-point imports: PASS

These results are externally reported validation evidence, not independently repeated within this hackathon planning exercise.

The result supports SDK packaging and runtime portability.

It does not, by itself, establish independent live transaction-evidence interoperability.

### 3.4 Local working-tree note

At baseline:

- Local `main` and `origin/main` are synchronized at `a94d003`.
- Ahead/behind counts: 0/0.
- Git reports `demo/pp04/fixtures/canonical.json` as modified.
- HEAD, index, raw working-file, and filtered working-file hashes are identical.
- File contents have not been modified during A6.
- The persistent local Git status discrepancy remains unresolved.

The validated fixture must not be rewritten solely to eliminate this status indicator.

New implementation work should be isolated in a clean worktree or otherwise safely prepared.

### 3.5 XCF source baselines

| Repository | Baseline commit |
|---|---|
| `payfi-gateway-demo` | `3246e9c0015c227b8082cd071f4fb6d4c8ce0119` |
| `xcf-concordium-facilitator` | `530b53c88eb7715beac3cb0afb1c8c277f5535b9` |
| `xcf-orchestrator` | `49d3b100c36a2d465021a5ee0e0f21bc3062203e` |
| `xcf-wallet-proxy` | `aecc62326ff726ad045c7973759061127cebd7c3` |

These repositories provide the existing Concordium/x402 transaction infrastructure.

No modifications are included in the approved hackathon scope.

---

## 4. Technical Discovery — A6 Findings

### A6.1 Repository inventory — COMPLETE

Confirmed:

- ProofPath SDK and specialized verification modules are present.
- Demo4 Gateway scripts and supporting evidence artifacts are available.
- Facilitator, Orchestrator, and Wallet Proxy baselines are available.
- Existing XCF repositories are clean.
- ProofPath's persistent local fixture-status discrepancy is documented.

### A6.2 Evidence baseline — COMPLETE

The historical ProofPath M0 readiness investigation identified:

- Concordium Testnet Registry contract `<12802,0>`.
- Demo4 agent token ID `287`.
- Historical finalized Registry observations.
- An active agent and populated account/wallet relationship at the recorded state.
- Existing reusable Gateway Registry and identity-related functionality.

These observations do not establish unrestricted agent authority, seller authentication, verified-human identity, or current Registry state.

### A6.3 Evidence and handoff discovery — COMPLETE

Identified:

- CIS-8004 registration evidence.
- CIS-8 acting-key evidence.
- Finalized Registry transaction references.
- Independent finalized Registry read artifacts.
- Existing Demo4 E2E runner.
- Controlled acceptance and payer-continuation entry points.

The payer-continuation implementation exposes payment transaction hash, payment outcome, and finality indicators.

However:

- A transaction hash alone is insufficient for complete commercial assurance.
- Registration transactions must not be confused with PLT payment transactions.
- The inspected artifacts do not yet establish a complete transaction-specific ProofPath evidence package.
- Existing diagnostic output is not automatically a portable evidence manifest.

**Decision:** Reuse existing Demo4/XCF infrastructure as an evidence source, with a minimal standalone ProofPath adapter.

### A6.4 SDK contract inspection — COMPLETE

Confirmed public interfaces:

- `verifyRegistrySnapshot()`
- `verifyFacilitatorReceipt()`
- `verifySettlementFinality()`
- `composeTransactionEvidence()`

The transaction composer consumes existing verification results.

It does not independently repeat the underlying verification operations.

The composer requires independently established trusted context, including payment, agent, seller, and delivery expectations.

Missing evidence assessments may be represented explicitly as `null`.

Missing trusted context must not be invented or copied from untrusted evidence merely to satisfy the type contract.

---

## 5. Approved Technical Architecture

### 5.1 Integration flow

```text
Existing Concordium / XCF Infrastructure
                |
                v
Authentic Testnet Evidence Sources
                |
                v
Minimal Read-Only Evidence Adapter
                |
                v
Packaged @proofpath/core SDK
                |
                v
Bounded Verification and Composition
                |
                v
Portable Evidence Manifest / Audit Result
                |
                v
CLI or Existing ProofPath Viewer
```

### 5.2 Architectural invariants

1. ProofPath remains independent from payment execution.
2. XCF Gateway retains resource-release authority.
3. Facilitator/CRP retains payment matching and receipt-issuance responsibility.
4. ProofPath consumes evidence without modifying prior transaction decisions.
5. Payment expectations must be independently established.
6. Receipt authentication does not independently prove settlement.
7. A finalized trusted-node observation is not independent consensus verification.
8. Registry observations do not establish unrestricted agent authority.
9. Agent ownership does not establish verified-human identity.
10. Delivery assertions do not independently establish authenticated delivery or buyer satisfaction.
11. Missing, stale, conflicting, or unsupported evidence must not be promoted into verified assurance.
12. Public exports must exclude secrets and unnecessarily sensitive data.

### 5.3 Implementation location

Preferred location:

`proofpath/`

Implementation form:

A standalone SDK consumer using supported public package imports.

The exact file paths and module boundaries will be determined during implementation planning.

### 5.4 Explicit exclusions

The hackathon implementation will not include:

- A new payment Gateway or Facilitator.
- New payment rails.
- New smart contracts without a separately approved necessity.
- Changes to existing XCF payment execution.
- Changes to existing Gateway release authority.
- Generalized multi-chain settlement verification.
- Public npm SDK publication.
- Production deployment or certification.
- New verified-human identity infrastructure.
- New seller-authentication infrastructure solely for demo completeness.
- Unrestricted Registry governance approval.
- A large open-ended PR sequence.

---

## 6. Approved Work Packages

### WP1 — Authentic Evidence Acquisition

**Roadmap phase:** B  
**Status:** NOT STARTED  
**Target:** November 22–25

Objective:

Obtain or establish a transaction-specific evidence package suitable for a reproducible ProofPath assessment.

Required investigation:

1. Identify a genuine Concordium Testnet payment transaction.
2. Establish its independent commercial expectations.
3. Identify the corresponding receipt, if available.
4. Identify trustworthy finalized PLT settlement observations.
5. Identify relevant Registry and agent evidence.
6. Preserve source provenance, timestamps, and trust assumptions.
7. Identify missing seller or delivery evidence explicitly.
8. Establish a valid public explorer reference.

Preferred approach:

Reuse sufficient historical Demo4 evidence.

Fallback:

Plan one controlled Testnet execution only if historical evidence is insufficient.

Any state-changing execution, wallet signing, payment submission, or secret access requires separate authorization.

**Exit gate:** Evidence availability and assurance limitations documented; integration inputs selected.

### WP2 — Standalone SDK Integration

**Roadmap phase:** C  
**Status:** NOT STARTED  
**Target:** November 25–December 1

Objective:

Build one minimal read-only ProofPath consumer of authentic Concordium evidence.

Implementation principles:

1. Use the packaged SDK's public entry points.
2. Normalize evidence without inventing missing values.
3. Keep trusted expectations separate from presented claims.
4. Supply applicable verifier contexts and trust policies.
5. Execute existing verifier functionality.
6. Preserve structured verification outcomes and provenance.
7. Compose bounded transaction evidence.
8. Export a portable manifest where contract requirements are satisfied.

The integration must not modify XCF transaction infrastructure or core SDK verifier behavior to force a positive outcome.

**Exit gate:** Standalone integration demonstrates the selected authentic evidence case with appropriately bounded results.

### WP3 — Verification and Negative Acceptance

**Roadmap phase:** D  
**Status:** NOT STARTED  
**Target:** December 1–4

Objective:

Demonstrate accurate accountability assessment in both supported and contradictory evidence conditions.

Scenario A — Authentic evidence:

- Consume authentic Testnet evidence.
- Run applicable independent checks.
- Produce supported verification and composition outcomes.
- Preserve unresolved assurance claims explicitly.
- Export appropriate evidence and audit records.

Scenario B — Transaction-binding mismatch:

- Reuse the same verification pipeline.
- Introduce a controlled inconsistency in an expected commercial binding.
- Confirm the mismatch is detected.
- Do not incorrectly classify an otherwise valid cryptographic signature as invalid.
- Do not report unsupported transaction-wide verification.

Validation must include available tests, build/typecheck, schema validation, source-provenance checks, and clean-consumer reproducibility.

**Exit gate:** Both scenarios validated, documented, and reproducible.

### WP4 — Demonstration and Submission

**Roadmap phases:** E–F  
**Status:** NOT STARTED  
**Target:** December 4–8

Objective:

Convert validated engineering results into a complete and accurate hackathon submission.

Required outputs:

1. Public code and reproducible README.
2. Clear project description.
3. Maximum three-minute demo video.
4. Valid public Concordium Testnet explorer link.
5. Accurate Concordium technology selections.
6. Practical path-to-mainnet statement.

Optional slides and live demo may be added only if mandatory deliverables are complete.

**Exit gate:** All mandatory submission fields reviewed, public URLs checked, and submission completed.

---

## 7. Technical Acceptance Criteria

| Gate | Requirement | Current status |
|---|---|---|
| A6-AC1 | Independent consumer imports packaged SDK public entry points | PENDING — existing I5/PR18 portability baseline available |
| A6-AC2 | Authentic Testnet evidence is linked to a public explorer reference | PENDING — historical Registry evidence identified |
| A6-AC3 | Trusted commercial expectations are independent of presented evidence | PENDING |
| A6-AC4 | Applicable existing verifiers execute under documented policies and source assumptions | PENDING |
| A6-AC5 | Composition preserves missing, failed, and indeterminate assurance | PENDING |
| A6-AC6 | Negative transaction-binding mismatch is correctly detected | PENDING |
| A6-AC7 | Portable manifest and audit result are produced and validated where permitted | PENDING |
| A6-AC8 | Demonstration, documentation, and public submission artifacts are reproducible and accurate | PENDING |

No gate is automatically passed merely because an underlying SDK component passed historical unit or acceptance tests.

A complete positive transaction-wide assurance outcome is not required.

The required outcome is faithful, traceable, and appropriately bounded reporting.

---

## 8. Consolidated Hackathon Roadmap

| Phase | Date target | Deliverable | Status |
|---|---|---|---|
| A — Administration and scope | By Nov 20 | Project setup, challenge, technical baseline | COMPLETE |
| B — Evidence acquisition | Nov 22–25 | Authentic evidence package and provenance | NEXT |
| C — SDK integration | Nov 25–Dec 1 | Minimal standalone ProofPath consumer | PENDING |
| D — Validation | Dec 1–4 | Authentic and negative evidence scenarios | PENDING |
| E — Submission preparation | Dec 4–7 | Documentation, video, explorer link, production path | PENDING |
| F — Final QA/submission | Dec 8 | All six required items submitted | PENDING |

The dates are internal targets.

The official final submission deadline is December 9, 2026, at 23:59 UTC.

### Roadmap control rules

- Maintain one primary implementation objective at a time.
- Close each phase against explicit exit criteria.
- Do not expand technical scope merely because additional functionality is possible.
- Reuse validated components before introducing new ones.
- Prefer one focused implementation PR, subject to necessary review and safety gates.
- Treat new payment execution as a separate operational authorization.
- Protect time for video production and final submission.
- Update this roadmap whenever a phase changes state.

---

## 9. Risks, Dependencies, and Fallbacks

### DEP-01 — Complete authentic payment evidence

**Status:** OPEN  
**Priority:** HIGH

Historical Registry evidence is available, but a complete matched commercial payment evidence package has not yet been established.

Mitigation:

Prioritize historical evidence discovery and establish a bounded acquisition decision.

Fallback:

One separately authorized controlled Testnet payment.

### DEP-02 — Independent commercial expectations

**Status:** OPEN  
**Priority:** HIGH

The SDK requires independently established expected payment, agent, seller, and delivery bindings.

Mitigation:

Use authenticated transaction context and documented source provenance.

Do not synthesize trusted expectations from untrusted receipt or settlement observations.

### TRUST-01 — Registry assurance

**Status:** OPEN

R4 governance restrictions remain:

- `TRUST-01 = OPEN`
- `Module C = UNAPPROVED`
- `C5 = NOT ESTABLISHED`
- `C6 = NOT ESTABLISHED`
- `PROVENANCE_NOT_APPROVAL_READY`

No hackathon artifact may imply these issues are resolved.

### SELLER-01 — Seller authenticity

**Status:** NOT FULLY ESTABLISHED IN HISTORICAL M0

Seller Registry identity, receiving-wallet authority, endpoint binding, and delivery authenticity must be evaluated independently where claimed.

Missing evidence must remain explicit.

### ID-01 — Verified-human identity

**Status:** OPEN

Agent ownership or account control does not establish verified real-world human identity.

No verified-human assurance or identity-disclosure capability may be claimed without appropriate authenticated evidence and policy.

### OPS-01 — Local Git working tree

**Status:** NON-BLOCKING FOR READ-ONLY WORK

The local ProofPath checkout reports one modified fixture despite identical verified content hashes.

Mitigation:

Use a clean worktree or otherwise safe isolation before new implementation work.

Do not alter the validated fixture solely to clear the status flag.

### TIME-01 — Submission deadline

**Status:** ACTIVE

The primary delivery risk is consuming too much remaining time on investigation, additional features, or optional submission materials.

Mitigation:

Freeze scope, complete the minimum integration, and prioritize mandatory outputs.

---

## 10. Three-Minute Demo Outline

| Time | Content |
|---|---|
| 0:00–0:25 | Accountability problem and ProofPath positioning |
| 0:25–0:50 | Authentic Concordium Testnet agent/transaction reference |
| 0:50–1:50 | Standalone SDK evidence verification and composition |
| 1:50–2:25 | Portable evidence result and negative binding case |
| 2:25–3:00 | Interoperability vision, assurance limitations, and production roadmap |

This outline is provisional until the executable evidence scenario is validated.

The video must show the actual implemented behavior, not a simulated live verification represented as genuine execution.

---

## 11. Path to Mainnet — Initial Outline

Production adoption will require:

1. Authenticated, independently operated evidence-source integrations.
2. Production Concordium network configuration and trusted-source policies.
3. Appropriate Registry module and authority governance.
4. Security reviews and credential/key-management controls.
5. Operational logging, monitoring, and error handling.
6. Evidence retention, custody, disclosure, and privacy policies.
7. External developer interoperability and reproducibility testing.
8. Versioned SDK distribution and support policies.
9. Production transaction evidence validation.
10. Defined legal, commercial, and regulatory responsibilities.

Potential users include agent-commerce developers, marketplace operators, merchants, compliance and audit teams, and providers of payment or agent infrastructure.

The longer-term product strategy remains platform-agnostic interoperability, including integrations with other x402 ecosystems and networks where independently supported evidence-verification capabilities exist.

The hackathon demonstration is not a claim of production readiness, certification, or complete EU AI Act compliance.

---

## 12. Progress Register

### Completed checkpoints

- [x] A1 — Encode dashboard and project inspection
- [x] A2 — Project description updated
- [x] A3 — Initial Discord announcement posted
- [x] A4 — Initial collaborator recruitment launched
- [x] A5 — Concordium accountability challenge selected
- [x] A6.1 — Repository inventory
- [x] A6.2 — Evidence baseline inspection
- [x] A6.3 — Evidence discovery and architecture selection
- [x] A6.4 — SDK contracts and acceptance criteria
- [x] A6.5 — Working technical scope approved

### Active and pending work

- [ ] B1 — Identify suitable authentic payment evidence
- [ ] B2 — Establish independent commercial expectations
- [ ] B3 — Identify applicable source provenance and assurance limitations
- [ ] B4 — Decide historical reuse versus controlled new execution
- [ ] C1 — Safely isolate implementation workspace
- [ ] C2 — Implement standalone SDK evidence consumer
- [ ] C3 — Produce bounded evidence composition/export
- [ ] D1 — Validate authentic evidence scenario
- [ ] D2 — Validate negative transaction-binding scenario
- [ ] D3 — Complete reproducibility and regression checks
- [ ] E1 — Finalize public implementation documentation
- [ ] E2 — Prepare and record three-minute demo
- [ ] E3 — Validate CCDExplorer/CCDScan reference
- [ ] E4 — Finalize Concordium technology and mainnet statements
- [ ] F1 — Review all six mandatory submission fields
- [ ] F2 — Submit before official deadline

### Current next action

**Phase B / WP1 — Authentic Evidence Acquisition.**

Identify whether a sufficient historical Demo4 commercial transaction package exists.

If historical evidence cannot meet the SDK's independently trusted input requirements, document the gap and decide whether one controlled Testnet execution is necessary.

No payment or state-changing activity is authorized by this document.

---

## 13. Decision and Change Control

### Decision record — A6.5

**Date:** 2026-11-20  
**Decision:** APPROVED WORKING BASELINE

Approved:

- Standalone ProofPath SDK consumer.
- Authentic Concordium Testnet evidence as the target input.
- Reuse of existing XCF infrastructure.
- Bounded verification and evidence composition.
- One authentic evidence scenario.
- One controlled negative binding scenario.
- Portable manifest and reproducible demonstration.
- Explicit preservation of unresolved assurance limitations.

Not approved:

- New wallet signing or payments.
- Modification of existing XCF production or Testnet execution logic.
- New deployment or on-chain registration.
- Modification of verifier assurance semantics.
- Public package publication.
- Repository staging, commit, push, merge, or branch deletion.

Changes to the technical scope require explicit review and project-owner approval.

Routine read-only analysis and planning may proceed within the approved baseline.

Implementation file changes and subsequent Git publication actions require appropriate authorization.

### Baseline status

This document records the approved working technical scope and intended roadmap.

Repository publication and technical implementation are separate milestones.

---

## 14. Final Project Principle

**ProofPath does not make evidence trustworthy by declaring it trustworthy.**

It makes agent-commerce accountability more practical by preserving evidence, evaluating independently supportable claims, exposing gaps and contradictions, and producing portable records with explicit assurance boundaries.

For the Concordium hackathon, success means demonstrating that capability credibly against authentic Testnet evidence while remaining independent of the payment system.

**One focused integration. Two demonstrable evidence scenarios. Six mandatory submission deliverables. No unnecessary scope expansion.**
