# ProofPath

**Portable evidence, provenance and accountability for agent-mediated transactions.**

ProofPath is an independent TypeScript evidence layer designed to help
applications record, correlate, validate and export structured evidence
associated with commercial transactions involving AI agents.

Its initial implementation, **PP-01 / Milestone M1**, establishes a
platform-neutral foundation for evidence manifests, provenance assessment,
cryptographic integrity commitments, hash-linked audit records and
controlled evidence disclosure.

An optional **Concordium x402** integration profile provides a way to
normalize references produced by an existing x402 payment infrastructure.

> **Project status:** PP-01 implementation checkpoints validated.
> Final repository acceptance and publication review remain pending.
> ProofPath is not presented as production-ready or independently audited.

## Why ProofPath?

Agent-mediated transactions can involve several distinct systems:

- An agent acting on behalf of a buyer or another principal.
- A seller or resource provider.
- Payment negotiation and execution infrastructure.
- Identity, authorization and policy mechanisms.
- Evidence collectors and auditors.

A successful transaction may leave behind records distributed across
these components.

ProofPath aims to provide a portable evidence and accountability layer
that can describe those records without taking ownership of payment
execution or silently treating recorded claims as verified facts.

The guiding principle is:

**Evidence recorded is not necessarily evidence authenticated,
independently verified or proven true.**

## PP-01 capabilities

| Capability | Implementation |
| --- | --- |
| Evidence Manifest v1 | Frozen JSON Schema and TypeScript contracts |
| Audit Event v1 | Frozen schema and controlled event vocabulary |
| Runtime validation | Structural and semantic consistency checks |
| Canonicalization | Deterministic restricted JSON representation |
| Integrity commitments | SHA-256 byte and domain-separated structured digests |
| Provenance | Artifact integrity assessment with explicit trust limitations |
| Audit journal | Hash-linked logical event journal and verification |
| Portable exports | Public and restricted disclosure profiles |
| Concordium x402 | Optional reference-normalization profile |
| Public API | Explicit TypeScript exports through `src/index.ts` |

These features form an evidence-processing foundation.

They do not provide live settlement verification, source
authentication, persistent audit storage or a payment service.

## Architecture

```text
        Transaction and agent systems
                     |
                     v
       Caller-supplied evidence records
                     |
          +----------+----------+
          |                     |
          v                     v
   Generic PP-01 core    Concordium x402
                         reference profile
          |                     |
          +----------+----------+
                     |
                     v
           Schema and semantic
                validation
                     |
                     v
       Provenance and integrity checks
                     |
                     v
           Hash-linked audit trail
                     |
                     v
          Public / restricted export
                     |
                     v
        Consuming application or auditor
```

The diagram illustrates conceptual integration boundaries, not an
automatic end-to-end processing pipeline.

Applications are responsible for invoking the required components,
providing trusted schemas, collecting evidence and enforcing
appropriate trust and disclosure policies.

## Repository structure

```text
proofpath/
  schemas/
    proofpath-evidence-v1.schema.json
    proofpath-audit-event-v1.schema.json
  src/
    core/
      types.ts
      canonical.ts
      hash.ts
      validate.ts
      provenance.ts
      audit.ts
      export.ts
    profiles/
      concordium-x402.ts
    index.ts
  tests/
    schema.test.ts
    integrity.test.ts
    audit.test.ts
    export.test.ts
  docs/
    pp01-contract.md
    article12-mapping.md
  package.json
  tsconfig.json
  README.md
```

## Development setup

The initial repository is a Node.js / TypeScript implementation.

For an existing checkout with Node.js and npm available:

```bash
npm ci
npm run typecheck
npm test
```

The test suite uses synthetic fixtures. It does not require a live
Concordium node, wallet, payment facilitator or blockchain operation.

These commands are local development and validation commands,
not a package-publication or production-deployment procedure.

## Public TypeScript API

The public entry point is:

`src/index.ts`

It exposes the following runtime functions:

| Area | Functions |
| --- | --- |
| Canonicalization | `canonicalJson`, `canonicalJsonBytes` |
| Hashing | `sha256Bytes`, `sha256Record` |
| Validation | `createRuntimeValidator` |
| Provenance | `assessArtifactProvenance` |
| Audit | `computeAuditEventDigest`, `verifyAuditJournal`, `appendAuditEvent` |
| Export | `exportEvidence`, `verifyExportDigest` |
| Concordium x402 | `normalizeConcordiumX402Profile` |

The entry point also exports the relevant TypeScript types and the
`CONCORDIUM_X402_PROFILE` constant.

The public API is an implementation-level TypeScript entry point.
This README does not claim that the package has been published to
a package registry or that a compiled distribution is available.

See [PP-01 Contract](docs/pp01-contract.md) for the exact contracts,
commitment semantics and trust boundaries.

## Evidence schemas

PP-01 defines two frozen v1 JSON Schemas:

1. [Evidence Manifest v1](schemas/proofpath-evidence-v1.schema.json)
2. [Audit Event v1](schemas/proofpath-audit-event-v1.schema.json)

The Evidence Manifest captures transaction identity, participants,
commercial context, authorization, payment and delivery evidence,
audit coverage, assurance claims and governance metadata.

The Audit Event schema defines a controlled vocabulary for
transaction-related observations and a hash-linked journal model.

Runtime validation can reject malformed records, duplicate identifiers,
dangling references and semantic inconsistencies.

Schema validity does not establish that a transaction occurred,
that an agent was authorized or that payment was finalized.

## Integrity and provenance

ProofPath uses SHA-256 over exact artifact bytes and a separate,
domain-separated commitment scheme for structured records.

The canonicalization contract provides deterministic serialization
for supported JSON values.

It is not claimed to be an implementation of RFC 8785 / JCS.

The provenance layer distinguishes recorded source attribution
from observed byte integrity.

A matching SHA-256 digest does not authenticate a producer
or establish the truth of the underlying evidence.

## Audit journal

PP-01 includes an in-memory, logically append-only hash-linked
audit-journal implementation.

Its verification functions can detect inconsistent sequence
numbers, altered event contents, invalid predecessor links,
missing events and truncation relative to a supplied expected
head commitment and event count.

A consuming system must independently preserve and authenticate
the expected journal head and count.

The journal does not itself provide immutable storage, durable
retention, clock authentication or complete event capture.

## Portable evidence exports

PP-01 supports two disclosure profiles.

**Restricted export** preserves the complete validated manifest
and provides manifest and derived-export commitments.

It does not implement encryption or access control.

**Public export** provides a minimized representation containing
approved public artifact commitments and omission metadata.

It excludes restricted artifact commitments, the full manifest
and other transaction details.

Even a public artifact digest may enable correlation with information
available elsewhere.

`verifyExportDigest` checks representation integrity against a
recorded digest; it does not independently authenticate the
export producer or certify schema conformance.

Disclosure authorization and privacy review remain the
responsibility of the consuming application.

## Concordium x402 integration

The optional profile is:

`proofpath.concordium.x402.v1`

It accepts explicit references concerning:

- x402 payment requirements and submissions;
- facilitator receipts;
- Concordium transaction and finality evidence;
- Agent Registry entries, Agent Cards and acting keys;
- authorization and zero-knowledge proof evidence; and
- delivery records.

The adapter also accepts transaction, correlation, challenge,
network, PLT asset and amount metadata.

It validates the input shape and creates a normalized,
platform-specific reference record.

**The resulting record is not a ProofPath Evidence Manifest.**

It does not verify facilitator receipts, agent identities,
delegation, CIS-8 registrations, ZKP proofs or actual
Concordium settlement finality.

The existing Gateway, Facilitator, Orchestrator and Wallet Proxy
remain independent systems and are not modified by ProofPath.

## Validation status

The PP-01 implementation includes four persistent test suites:

| Suite | Tests |
| --- | ---: |
| Schema conformance | 30 |
| Integrity and provenance | 15 |
| Audit journal | 29 |
| Portable export | 24 |
| **Total persistent tests** | **98** |

The latest completed implementation checkpoints additionally
validated 20 controlled Concordium x402 profile scenarios and
10 controlled public API smoke scenarios.

The Step 28 checkpoint recorded:

- strict TypeScript compilation: PASS;
- persistent regression tests: 98/98 PASS;
- documentation acceptance checks: 30/30 PASS;
- protected-file integrity and file-scope checks: PASS.

Those results establish the scope of engineering validation
completed so far, not independent security certification.

Final PP-01 repository acceptance and publication review
remain separate activities.

## Security and trust boundaries

ProofPath intentionally does not implement:

- Payment initiation, execution or settlement.
- Concordium RPC queries or independent finality verification.
- Facilitator JWS signature verification.
- Agent Registry, Agent Card or acting-key authentication.
- ZKP proof verification or independent authorization checks.
- Durable, immutable or independently anchored audit storage.
- Comprehensive source-system observation.
- Export signing, encryption or disclosure authorization.
- Automated retention and deletion enforcement.
- EU AI Act compliance certification.

A recorded `payment_finalized` event is not proof that a
Concordium transaction has independently reached finality.

A hash-consistent audit journal is not independently authenticated
unless its expected commitment and capture scope are trusted.

**Consumers must not promote claimed evidence into verified evidence
without separate checks.**

## EU AI Act recordkeeping

ProofPath includes an engineering mapping of selected recordkeeping
requirements associated with EU AI Act Articles 12, 19 and 26.

See [Article 12 Mapping](docs/article12-mapping.md).

This mapping is not a legal opinion or certification that a
specific AI system satisfies applicable regulatory obligations.

Deployment classification, retention, operational logging,
human oversight and conformity assessment remain
deployment-specific responsibilities.

## Documentation

- [PP-01 Technical Contract](docs/pp01-contract.md) — authoritative
  implementation semantics, interfaces, security boundaries,
  deferred capabilities and acceptance requirements.
- [Article 12 Mapping](docs/article12-mapping.md) — technical
  recordkeeping alignment and regulatory limitations.
- [Evidence Manifest Schema](schemas/proofpath-evidence-v1.schema.json)
- [Audit Event Schema](schemas/proofpath-audit-event-v1.schema.json)

## Project status and next steps

**M1.1, M1.2 and M1.3:** Implementation checkpoints completed.

**M1.4:** Export, conformance, Concordium x402 profile, public API
and technical contract implementation checkpoints completed.

**Repository README:** This is the final planned documentation file
within the frozen 22-file PP-01 scope.

**Remaining gate:** Final PP-01 acceptance and publication review.

Until that gate is completed and explicitly authorized, the
implementation should be regarded as a validated local project
candidate rather than a published release.

Any expansion of the frozen schemas, trust semantics or public
contract requires a separate versioning and change-control decision.
