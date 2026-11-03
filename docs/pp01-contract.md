# ProofPath PP-01 — Evidence Schema, Provenance & Audit Trail Contract

**Contract:** PP-01 v1  
**Milestone:** M1 — Evidence Schema, Provenance & Audit Trail  
**Implementation profile:** `proofpath.concordium.x402.v1`  
**Document status:** Implementation contract; final acceptance pending  
**Documentation date:** 2026-11-03

## 1. Purpose

ProofPath is an independent evidence and accountability layer for
agent-mediated commercial transactions.

PP-01 establishes a portable technical foundation for recording,
validating, correlating, assessing and exporting transaction evidence.

The core is platform-neutral. A separate Concordium x402 reference
profile enables integration with that ecosystem without embedding
Concordium payment execution or blockchain verification.

PP-01 is not a transaction executor, wallet, facilitator, payment
settlement engine, identity-verification service or compliance
certification system.

Its primary objective is to preserve **what was recorded, by whom it
was claimed to have been produced, how it is referenced, and which
integrity checks are technically possible**.

A record's existence does not establish the truth of its contents.

## 2. Frozen scope

PP-01 is implemented within a single planned branch and pull request
with a frozen ceiling of 22 repository files.

The implementation checkpoints are:

| Checkpoint | Purpose | Status |
| --- | --- | --- |
| M1.1 | Repository foundation and evidence schemas | Implemented |
| M1.2 | Canonicalization, hashing, provenance and validation | Implemented and tested |
| M1.3 | Hash-linked audit journal and Article 12 mapping | Implemented and tested |
| M1.4 | Portable exports, conformance, integration profile and API | Implementation tests passed; documentation and final acceptance pending |

The current contract uses the existing Evidence Manifest v1 and
Audit Event v1 schemas. No additional schema or protocol versions are
introduced by this document.

The frozen schema definitions are:
- `schemas/proofpath-evidence-v1.schema.json`
- `schemas/proofpath-audit-event-v1.schema.json`

The JSON Schemas, associated TypeScript types and validation
implementation determine the exact supported field vocabulary.
This document is an explanatory contract, not a replacement schema.

## 3. Evidence Manifest v1

The Evidence Manifest is a transaction-scoped structured record.

Its principal sections are:

| Section | Purpose |
| --- | --- |
| `schema` | Record type, version and integration profile |
| `transaction` | Transaction identity, correlation and recorded status |
| `participants` | Claimed buyer and seller identities and references |
| `commercialTerms` | Available commercial context |
| `authorization` | Evidence references concerning authority |
| `payment` | Evidence references concerning payment |
| `delivery` | Evidence references concerning delivery |
| `evidence` | Evidence artifact metadata and commitments |
| `audit` | Journal identifiers, declared coverage and head |
| `assurance` | Claims and their recorded assessment information |
| `governance` | Retention, disclosure and audit-policy metadata |

The schema identifier is `proofpath.transaction-evidence`,
version `1.0.0`.

The Concordium x402 profile identifier is
`proofpath.concordium.x402.v1`.

Evidence artifact references are subject to runtime semantic
validation, including uniqueness and referential consistency.

The manifest does not imply that all transaction activity was observed.

## 4. Audit Event v1

Audit events use the schema identifier `proofpath.audit-event`,
version `1.0.0`.

The schema defines 26 controlled event classifications.

Examples include:
- agent action and identity observations;
- delegation, authorization and policy evaluations;
- presentation and acceptance of commercial terms;
- payment challenge, submission, finalization and failure;
- delivery, evidence and claim assessment events;
- oversight, export and retention actions.

The frozen event type for a recorded finalization event is
`payment_finalized`, not `payment_settled`.

An Audit Event contains transaction and correlation identifiers,
event identity, sequence, source metadata, timestamps, outcome,
versioned payload, evidence references and digest commitments.

Relevant integrity fields include:
- `previousDigestSha256`
- `eventDigestSha256`

The source occurrence field `sourceEventAt` is distinct from
collector observation field `observedAt`.

Neither timestamp is independently authenticated by PP-01.

A `payment_finalized` classification is an assertion captured in
the record. It is not independent proof of blockchain finality.

## 5. Runtime validation

The runtime validator is implemented in `src/core/validate.ts`.

The public constructor is `createRuntimeValidator`.

It uses Ajv with JSON Schema 2020-12 and supported format validation,
configured against caller-supplied trusted schema definitions.

Validation includes supported structural and semantic consistency
checks. These include required fields, versions, field formats,
identifiers, cross-references and audit consistency constraints.

Invalid records are rejected rather than silently repaired or
promoted to a trusted state.

The evidence and audit schemas remain frozen within PP-01.

Validation does not establish:
- authenticity of an artifact's producer;
- identity or agency authority;
- validity of an external ZKP or receipt;
- actual delivery or payment;
- settlement finality; or
- completeness of the observed real-world history.

Callers must provide trusted schema definitions and separately
establish any required external trust assumptions.

## 6. Canonicalization contract

The canonicalization module is `src/core/canonical.ts`.

Public operations:
- `canonicalJson`
- `canonicalJsonBytes`

ProofPath uses a restricted deterministic JSON representation.

The implementation:
- orders object keys deterministically using UTF-16 ordering;
- preserves supported Unicode exactly;
- requires valid Unicode scalar representation;
- permits only supported JSON values and safe integer numbers;
- rejects unsupported, ambiguous or noncanonical inputs;
- rejects cycles, accessors, sparse arrays and unsupported values; and
- provides a UTF-8 byte representation for hashing.

This is a ProofPath-specific canonicalization contract.

**PP-01 does not claim RFC 8785 / JCS conformance.**

Canonicalization makes a supported representation reproducible.
It does not authenticate who created that representation.

## 7. SHA-256 commitment contract

The hashing module is `src/core/hash.ts`.

Public operations:
- `sha256Bytes`
- `sha256Record`

Artifact byte commitments use SHA-256 over the exact supplied bytes.

Structured commitments use domain-separated input:

`proofpath:structured:v1:<domain>\0`

followed by the canonical JSON bytes of the structured payload.

Supported structured commitment domains include:
- `manifest`
- `audit-event`
- `terms`

The domain prefix prevents a structured commitment from being
silently substituted across those supported domains.

The manifest commitment and audit-event commitment are separate
from any digest of a derived export representation.

SHA-256 digest equality establishes integrity relative to the
supplied reference digest. An unkeyed digest is not a digital
signature, source authentication or proof of transaction truth.

Independent trust in the expected digest remains necessary.

## 8. Provenance and assurance boundaries

The provenance module is `src/core/provenance.ts`.

Public operation:
- `assessArtifactProvenance`

The assessment can compare available artifact bytes with their
recorded SHA-256 commitment.

It distinguishes byte-integrity results from claimed source
attribution and external verification.

Source attribution may remain `claimed_only`.

Authentication and claim verification may remain `not_evaluated`.

Historical context can be recorded without asserting that the
history is verified.

A successful byte-integrity check must never upgrade:
- a claimed producer to an authenticated producer;
- an Agent Card to authorized agency;
- a recorded receipt to a verified facilitator receipt;
- a ZKP reference to a verified proof; or
- a payment reference to finalized settlement.

Evidence integrity, provenance authenticity and claim veracity
are distinct properties.

## 9. Hash-linked audit-journal contract

The audit implementation is `src/core/audit.ts`.

Public operations:
- `computeAuditEventDigest`
- `verifyAuditJournal`
- `appendAuditEvent`

The journal is a logical, in-memory append-only sequence.

Each event is assigned a sequence number and predecessor commitment.

The event's own `eventDigestSha256` field is excluded when
computing that event's commitment.

Journal verification evaluates:
- genesis and sequence continuity;
- predecessor hash links;
- event digest consistency;
- event identifier uniqueness;
- transaction and correlation binding; and
- externally supplied expected count and terminal head.

Append verification rejects invalid existing chains and stale
expected commitments before accepting a new event.

The returned journal is a new logical representation rather than
an in-place mutation of its caller-supplied input.

**The implementation is not durable or immutable storage.**

A valid journal establishes consistency relative to the
expected journal commitment and count.

If an attacker can replace both the journal and the expected
commitment, the verifier cannot establish the original history.

Independent retention and authentication of the expected head,
count and applicable capture scope remain integration duties.

The audit module does not replace runtime JSON Schema validation
of untrusted audit events.

## 10. Audit completeness and coverage

The manifest's `audit` section contains:
- `eventIds`
- `headDigestSha256`
- `completeness`
- `coverageScope`

Supported completeness classifications include:
- `complete_for_declared_scope`
- `partial`
- `unknown`

`complete_for_declared_scope` is limited to the declared observation
scope. It does not certify exhaustive coverage of an AI system,
all external services or every real-world transaction event.

Collectors must disclose meaningful observation gaps and
unavailable evidence where applicable.

Clock trust, collection outages, independent head retention
and source-system observability require separate consideration.

## 11. Portable evidence export

The export implementation is `src/core/export.ts`.

Public operations:
- `exportEvidence`
- `verifyExportDigest`

Two disclosure profiles are supported.

### Restricted export

The restricted export contains an isolated, validated copy of the
full Evidence Manifest.

It includes:
- the complete validated manifest;
- the original structured manifest commitment;
- a verification notice; and
- a separate commitment over the export representation.

The restricted profile does not itself provide confidentiality,
encryption, recipient authentication or access control.

Those protections must be imposed by the integrating application.

### Public export

The public export is a derived and deliberately minimized
representation.

It includes digest commitments only for artifacts classified
as public, plus omission metadata and a verification notice.

It omits:
- the full manifest;
- the original manifest commitment;
- transaction and participant identifiers;
- commercial terms;
- artifact identifiers;
- source metadata;
- restricted artifact commitments; and
- assurance and detailed audit contents.

The public export discloses an omission count for restricted
artifacts.

A public export does not claim that omitted evidence was reviewed,
authenticated or verified.

Public artifact digests can still permit correlation when the same
artifact commitment is visible elsewhere. Operators must review
whether a public digest itself is suitable for disclosure.

### Export integrity versus authenticity

Each export has its own `exportDigestSha256` field.

That digest is computed over the export representation excluding
the digest field itself.

`verifyExportDigest` checks the representation's consistency with
its recorded digest.

It does not prove:
- the export came from a trusted producer;
- publication was authorized;
- the export conforms to an independently trusted export schema;
- the original manifest was authentic; or
- its evidence claims were true.

Because the export digest is unkeyed, anyone can recompute it
after modifying the representation.

Export integrity and source authenticity must not be conflated.

## 12. Concordium x402 reference profile

The optional adapter is `src/profiles/concordium-x402.ts`.

Public identifier:
`CONCORDIUM_X402_PROFILE`

Public operation:
`normalizeConcordiumX402Profile`

The profile supports explicit caller-supplied references for:
- x402 payment requirement and submission records;
- facilitator receipts;
- Concordium transactions and finality evidence;
- Agent Registry entries, Agent Cards and acting keys;
- authorization evidence and ZKP proofs; and
- delivery evidence.

It accepts explicitly declared network, transaction, correlation,
challenge, PLT asset, amount and reference metadata.

Supported networks are:
- `concordium:testnet`
- `concordium:mainnet`

The implementation validates the profile input shape, decimal
representation, precision and uniqueness of evidence identifiers.

It creates a deterministic reference record and preserves
caller-provided references without authenticating their meaning.

The assessment explicitly retains `claimed_only` source
attribution and `not_evaluated` values for external trust claims.

**The normalized profile record is not an Evidence Manifest.**

A caller must construct and separately validate any eventual
Evidence Manifest using the frozen manifest schema.

This adapter does not interact with the Gateway, Facilitator,
Orchestrator, Wallet Proxy or Concordium blockchain.

It performs no x402 payment, JWS verification, CIS-8 verification,
ZKP verification or settlement-finality verification.

## 13. Public TypeScript API

The single public entry point is `src/index.ts`.

It exposes the intended PP-01 runtime API:

| Function | Module |
| --- | --- |
| `canonicalJson` | Canonicalization |
| `canonicalJsonBytes` | Canonicalization |
| `sha256Bytes` | Hashing |
| `sha256Record` | Hashing |
| `createRuntimeValidator` | Validation |
| `assessArtifactProvenance` | Provenance |
| `computeAuditEventDigest` | Audit |
| `verifyAuditJournal` | Audit |
| `appendAuditEvent` | Audit |
| `exportEvidence` | Export |
| `verifyExportDigest` | Export |
| `normalizeConcordiumX402Profile` | Concordium x402 profile |

The public runtime API also exposes
`CONCORDIUM_X402_PROFILE` and relevant TypeScript types.

This entry point does not add behavior beyond the existing modules.

No network calls or blockchain operations occur merely by
importing the module.

## 14. Conformance testing

PP-01 has four persistent test files:

| Test file | Persistent scenarios |
| --- | ---: |
| `tests/schema.test.ts` | 30 |
| `tests/integrity.test.ts` | 15 |
| `tests/audit.test.ts` | 29 |
| `tests/export.test.ts` | 24 |
| **Total** | **98** |

The tests use synthetic fixtures.

They cover supported schema behavior, malformed input rejection,
referential integrity, deterministic hashing, provenance boundaries,
hash-chain integrity, tampering, audit substitution, disclosure
minimization and export representation consistency.

The Concordium x402 profile also passed 20 controlled smoke
scenarios, and the public API passed 10 import smoke scenarios.
Those smoke scenarios are not yet separate persistent test files.

The latest recorded Step 27 execution reported:
- strict TypeScript typecheck: PASS;
- public API smoke tests: 10/10 PASS;
- persistent regression tests: 98/98 PASS;
- 21 protected files unchanged;
- exact 22-file repository ceiling preserved; and
- no staging, commits, pushes, blockchain operations or payments.

These are implementation checkpoint results, not a completed
publication review or independently audited certification.

## 15. EU AI Act Article 12 alignment

`docs/article12-mapping.md` provides the dedicated recordkeeping
mapping for selected EU AI Act requirements.

It addresses Articles 12, 19 and 26 as applicable to the
technical scope of ProofPath and deployment responsibilities.

ProofPath's current caller-driven audit functions do not by
themselves implement automatic, whole-lifetime logging for a
high-risk AI system.

Retention metadata does not implement durable storage,
retention enforcement or deletion workflows.

Regulatory applicability, role classification, compliance
assessment and operational obligations remain external
responsibilities.

PP-01 makes no certification or general compliance claim.

## 16. Operational and security responsibilities

A production integration must independently address, as relevant:
- secure collection and custody of artifact bytes;
- trusted source identity and receipt verification;
- authorization and delegation checks;
- actual chain settlement and finality verification;
- independent preservation of audit head and count;
- durable and access-controlled journal storage;
- appropriate capture completeness monitoring;
- clock trust and timestamp integrity;
- public and restricted disclosure authorization;
- personal-data minimization and retention;
- secure storage, key management and incident response; and
- deployment-specific regulatory requirements.

The PP-01 library must not infer success in any such area from
the mere presence of references or self-consistent digests.

## 17. Explicitly deferred capabilities

PP-01 does not implement:
- live payment initiation, orchestration or settlement;
- direct Concordium RPC or wallet connections;
- authenticated facilitator JWS receipt verification;
- independent settlement-finality verification;
- Agent Registry, Agent Card or acting-key authenticity checks;
- ZKP proof verification;
- end-to-end delegation or agency authorization;
- automated commercial claim verification;
- independently authenticated audit-head anchoring;
- immutable or persistent journal storage;
- an export-signing or authorization service;
- an independently trusted portable-export JSON Schema;
- automated retention or deletion enforcement; or
- EU AI Act conformity assessment or compliance certification.

These capabilities must not be reported as shipped PP-01 features.

## 18. Final PP-01 acceptance boundary

The M1 implementation checkpoints establish engineering readiness
for a final acceptance review.

Final acceptance remains conditional on:
1. Completion of the project README.
2. Confirmation of the exact 22-file scope.
3. A clean strict TypeScript typecheck.
4. A complete pass of all 98 persistent tests.
5. Confirmation of the documented public API and trust boundaries.
6. Review of the final repository contents and publication scope.
7. Explicit authorization before staging, committing, pushing,
   opening or merging a pull request.

Completion of these checks will establish acceptance of the
declared PP-01 implementation scope, not independent external
verification of real transactions or regulatory certification.

## 19. Repository and contract references

Implementation:
- `src/core/types.ts`
- `src/core/canonical.ts`
- `src/core/hash.ts`
- `src/core/validate.ts`
- `src/core/provenance.ts`
- `src/core/audit.ts`
- `src/core/export.ts`
- `src/profiles/concordium-x402.ts`
- `src/index.ts`

Schemas:
- `schemas/proofpath-evidence-v1.schema.json`
- `schemas/proofpath-audit-event-v1.schema.json`

Tests:
- `tests/schema.test.ts`
- `tests/integrity.test.ts`
- `tests/audit.test.ts`
- `tests/export.test.ts`

Related documentation:
- `docs/article12-mapping.md`
- `README.md`

**Versioning principle:** Any change to the frozen schemas,
commitment semantics, trust boundaries or public contract requires
an explicit future versioning and change-control decision.
