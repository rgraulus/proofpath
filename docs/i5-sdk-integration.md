
# ProofPath I5 — SDK Integration and Consumer Acceptance

**Milestone:** I5 — Controlled SDK Packaging & Independent Consumer Acceptance
**Status:** Implementation in progress; final acceptance pending
**Decision authority:** I4-D1 — Middleware Readiness Architecture Decision Record
**Repository:** `rgraulus/proofpath`
**Implementation branch:** `feat/i5-controlled-sdk-packaging-v1`
**Authoritative kickoff commit:** `76c17bff1dfd026619e676104deb0646b845de6c`
**Package:** `@proofpath/core`
**Version:** `0.1.0`
**Runtime:** Node.js >=22, ESM
**Publication:** Not authorized; package remains private

## 1. Purpose and scope

I5 establishes whether ProofPath's existing validated evidence-assurance functionality can be distributed as a reusable, embedded TypeScript SDK and consumed by an independent Node.js application.

The selected architecture is a single package with four explicit public entry points. It is intended to support controlled application integration without introducing new payment execution, source-authentication, blockchain verification, or transaction-wide assurance capabilities.

I5 is a packaging and consumer-acceptance milestone, not a redesign of PP-01, PP-02, PP-03, or the x402 challenge adapter.

Guiding principle:

**Evidence tells a story. Assurance has boundaries.**

## 2. Supported SDK entry points

The proposed public package contract consists of four entry points.

### 2.1 `@proofpath/core`

Platform-neutral PP-01 evidence primitives:

- Frozen evidence and audit contracts
- Canonical JSON representation
- SHA-256 evidence and structured-record commitments
- Runtime validation using caller-supplied trusted schemas
- Artifact provenance assessment
- Hash-linked audit-journal operations
- Public/restricted evidence exports
- Export-digest verification

Example:

```typescript
import {
  canonicalJson,
  sha256Bytes,
  sha256Record,
  createRuntimeValidator,
  assessArtifactProvenance,
  exportEvidence,
  verifyExportDigest
} from "@proofpath/core";
```

Structured commitments use supported domain identifiers only:

- `manifest`
- `audit-event`
- `terms`

Hash equality establishes integrity relative to a supplied commitment. It does not independently authenticate an evidence producer or establish transaction truth.

### 2.2 `@proofpath/core/x402`

The existing bounded Base Mainnet x402 v2 challenge-evidence mapper.

Example:

```typescript
import {
  mapX402ChallengeEvidence,
  type ChallengeEvidenceInput,
  type ChallengeEvidenceResult
} from "@proofpath/core/x402";
```

This API:

- Accepts a caller-provided HTTP 402 observation
- Requires independently specified expected payment terms
- Validates supported challenge structure
- Checks binding consistency
- Produces evidence artifacts and commitments
- Preserves explicit unverified claim status
- Rejects malformed, ambiguous, or conflicting critical inputs

Its current supported profile is Base Mainnet (`eip155:8453`) with the `exact` payment scheme.

It does **not** independently collect HTTP evidence, authenticate its source, execute payments, verify settlement, or establish resource delivery.

A successful mapping returns:

- `status: "mapped_unverified"`
- `reasonCode: "structural_binding_match_only"`

This result must not be represented as a verified payment.

### 2.3 `@proofpath/core/assessment`

Existing PP-02 deterministic assessments:

```typescript
import {
  evaluateRegistryTrust,
  evaluateOwnerAssurance,
  evaluateSellerBinding
} from "@proofpath/core/assessment";
```

These functions evaluate the consistency of presented evidence and independently governed policy expectations.

They do not automatically authenticate identities, blockchain observations, endpoint control, or source provenance.

### 2.4 `@proofpath/core/concordium`

Existing specialized PP-03 Concordium functionality:

- Registry snapshot verification
- Facilitator JWS receipt verification
- Finalized PLT settlement verification
- Agent ownership and external-key binding verification
- Concordium trusted-node transport adapters
- Concordium x402 reference normalization
- Bounded transaction-evidence composition

Example:

```typescript
import {
  verifyRegistrySnapshot,
  verifyFacilitatorReceipt,
  verifySettlementFinality,
  verifyAgentAuthority,
  composeTransactionEvidence
} from "@proofpath/core/concordium";
```

Each verifier retains its existing policy, expected-binding, transport, and assurance requirements.

For example:

- An authenticated Facilitator receipt does not independently establish settlement.
- A trusted-node finalized settlement observation is not independent consensus verification.
- A Registry snapshot result does not establish historical upgrade authority.
- An agent/key binding result does not establish human identity or action-specific signing authority.
- Evidence composition does not turn unverified inputs into authenticated facts.

The Concordium composition profile remains specialized. It is not a generalized multi-network payment verifier.

## 3. Package distribution model

The initial distribution is a single, private npm-compatible package:

```json
{
  "name": "@proofpath/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  }
}
```

The package provides explicit ESM export-map entries for the four supported APIs.

An independent application must use these public package paths rather than importing repository-internal source files.

The dedicated SDK build configuration is:

`tsconfig.sdk.json`

The SDK build command is:

```bash
npm run build:sdk
```

The repository's existing development build, test workflow, and original source modules are preserved.

### 3.1 Packaged schemas

Two existing versioned JSON schemas are included unchanged:

- `proofpath-evidence-v1.schema.json`
- `proofpath-audit-event-v1.schema.json`

They are accessible using package subpaths:

```text
@proofpath/core/schemas/proofpath-evidence-v1.schema.json
@proofpath/core/schemas/proofpath-audit-event-v1.schema.json
```

Schema selection and trust remain the integrating application's responsibility.

Schema accessibility does not itself establish approval of the evidence or the policy against which it is evaluated.

### 3.2 Installation dependencies

The package currently declares `@concordium/web-sdk` version `12.0.2` as a direct dependency.

The four entry points separate the supported runtime APIs, but this single-package architecture does not provide installation-time dependency isolation.

A generic or x402 consumer may therefore install Concordium-related dependencies even when it does not use the Concordium entry point.

This is an acknowledged limitation of the selected I4 architecture, not a claim of modular distribution.

The independent installation also emitted a deprecation warning associated with `uuid@8.3.2`. This warning did not prevent installation. Dependency maintenance and any future remediation require separate review; they do not authorize changes to frozen verification behavior during I5.

## 4. Independent consumer integration

I5 tests package consumability using an independent temporary Node.js project rather than relying solely on repository-relative imports.

The controlled acceptance workflow includes:

1. Build the SDK.
2. Inspect the npm package contents.
3. Create a local package archive.
4. Install the archive in an independent Node.js project.
5. Import all four supported public entry points.
6. Compile a strict TypeScript consumer.
7. Access the packaged versioned schemas.
8. Reproduce accepted interoperability evidence behavior.
9. Test rejection behavior and provenance boundaries.
10. Review import isolation, repository regressions, and change scope.

An npm-compatible archive can be created locally using:

```bash
npm pack --ignore-scripts
```

This command creates a local artifact; it does not publish the package.

Public npm publication remains outside I5's authorized scope.

## 5. Independent Fizzl x402 evidence acceptance

### 5.1 Evidence source

The initial independent interoperability evidence was captured from Fizzl's publicly accessible x402 Doctor endpoint.

The capture concerns an unpaid HTTP 402 challenge.

The preserved evidence directory is held outside the repository:

```text
~/Downloads/proofpath-i3-evidence/i3-a1-4yaSjOnm/
```

The preserved files are:

- `response.headers`
- `response.body`
- `capture.metadata`

These files are restricted local acceptance inputs and must not be committed into ProofPath or included in an SDK distribution archive.

### 5.2 Evidence commitments

The acceptance process verifies the previously recorded SHA-256 commitments.

| Evidence | SHA-256 |
| --- | --- |
| Response headers | `640639bf8fef61cd06cdf8d7379da96fba07464e128f654a053881ea34a81caf` |
| Response body | `661f6260f331cace4e7140c49bb744eb796bf8a382862e749b65a20a49fc0376` |
| Capture metadata | `eee4c02817995db6e3168c2c8c5a2b1b93152441eb099f3e23334029225cff3d` |
| Decoded challenge | `bf63cf4fd8e6b9c93389b89682715fef17174a69476b9c37b9b59e9b68930504` |
| Commercial terms | `26556fb1889e64918a53707588b32ca3968bf62b7260f1c9c6387c3561ec04d1` |

These commitments establish consistency relative to the captured evidence and expected structured terms.

They do not independently prove source identity, payment, settlement, or delivery.

### 5.3 Captured metadata contract

The original metadata uses UTF-8 `key=value` lines containing:

- `capture_utc`
- `request_method`
- `request_url`
- `curl_exit`
- `http_code`
- `collection_method`
- `authentication_status`
- `payment_executed`

The SDK acceptance harness validates the metadata contract and evidence integrity before processing the capture.

It does not treat metadata assertions as independently authenticated facts.

### 5.4 Acceptance result

The installed SDK reproduced the previously accepted I3 challenge result:

- Challenge mapping: `mapped_unverified`
- Mapping reason: `structural_binding_match_only`
- Artifact integrity: `matches`
- Source attribution: `claimed_only`
- Authentication: `not_evaluated`
- Claim verification: `not_evaluated`
- Payment-requirements claim: `not_evaluated`

The consumer acceptance harness also reproduced 14 adversarial rejection scenarios involving payment binding, HTTP/request context, and malformed or ambiguous evidence.

Result:

**SDK-05, SDK-06, and SDK-07 passed.**

No payment execution, settlement verification, or source authentication occurred during this acceptance.

## 6. Consumer acceptance harness

The permanent acceptance harness is:

```text
scripts/ci_i5_sdk_consumer_acceptance.mjs
```

It requires two environment variables:

```text
PROOFPATH_I5_EVIDENCE_DIR
PROOFPATH_I5_CONSUMER_DIR
```

The first identifies the preserved I3 evidence directory.

The second identifies an independently prepared Node.js project containing an installed ProofPath SDK.

Example invocation from the ProofPath repository:

```bash
PROOFPATH_I5_EVIDENCE_DIR="$HOME/Downloads/proofpath-i3-evidence/i3-a1-4yaSjOnm" \
PROOFPATH_I5_CONSUMER_DIR="/path/to/independent-consumer" \
node.exe scripts/ci_i5_sdk_consumer_acceptance.mjs
```

The consumer must already have the local SDK package installed.

The harness does not perform installation, fetch live Fizzl evidence, or execute a payment.

It is designed to report acceptance markers without printing original challenge headers or evidence bytes.

## 7. Runtime isolation and security boundaries

### 7.1 Observed import behavior

The four public SDK entry points successfully imported in an independent Node.js project.

An instrumented runtime test blocked commonly used Node.js networking APIs, including:

- Global `fetch`
- HTTP/HTTPS request interfaces
- TCP connection interfaces
- TLS connections

No calls through these instrumented APIs were observed during imports.

This demonstrates bounded import-time behavior under the test's instrumentation.

It is not proof that every possible network, filesystem, or side effect is absent.

### 7.2 Outstanding import-isolation review

SDK-08 additionally requires confirmation that generic and x402 entry points do not unintentionally load Concordium-specific modules.

The completed test did not yet independently establish this module-loading property.

SDK-08 therefore remains partially accepted pending that review.

### 7.3 External trust responsibilities

The consuming application remains responsible for:

- Independent payment and resource expectations
- Approved source identities and trust roots
- Policy approval and policy-digest governance
- Trusted blockchain and Facilitator transports
- Authentication of externally supplied evidence
- Restricted evidence storage and retention
- Disclosure authorization
- Deployment security and operational controls

The SDK does not assume these responsibilities merely because its functions can be imported successfully.

## 8. Acceptance-gate register

Status reflects the controlled I5 execution evidence available at the time this document was prepared.

| Gate | Requirement | Status |
| --- | --- | --- |
| SDK-01 | Intended package files only; no restricted evidence or tests | Provisional PASS; final documentation/archive review pending |
| SDK-02 | Install packed SDK in independent Node.js project | PASS |
| SDK-03 | Import all supported ESM entry points | PASS |
| SDK-04 | Compile strict external TypeScript consumer | PASS |
| SDK-05 | Reproduce original I3 live challenge outcome | PASS |
| SDK-06 | Reproduce adversarial rejection behavior | PASS — 14/14 |
| SDK-07 | Preserve evidence digests and provenance limits | PASS |
| SDK-08 | Import isolation, dependency behavior, no unintended effects | Partial PASS; module-loading review pending |
| SDK-09 | Existing tests, typecheck, and builds without regression | Pending |
| SDK-10 | Final focused diff, repository scope, and acceptance review | Pending |

A successful intermediate test is not equivalent to final I5 acceptance.

Final acceptance requires all ten gates to be addressed, including explicit treatment of remaining limitations.

## 9. Scope and change control

I5 is limited to the approved file-level packaging implementation.

Expected change categories are:

- Package metadata and public exports
- Dedicated SDK build configuration
- Four SDK entry-point modules
- Independent consumer acceptance harness
- SDK integration documentation
- Package-lock synchronization only if independently justified

Existing PP-01–PP-03 verification semantics, original x402 challenge-mapping behavior, frozen schemas, and regression tests remain protected.

No new blockchain verifier, settlement profile, generalized composer, payment execution path, production hosting capability, or authenticated evidence-custody service is authorized.

The target is one bounded implementation branch and one focused PR.

A material architectural incompatibility must be documented and brought back for an explicit scope decision rather than expanding into an open-ended sequence of PRs.

## 10. Parallel Concordium Registry track

The parallel Concordium Registry trust/provenance track remains **open and unchanged**.

Its existing decision gates remain separate:

- Gates 1–2: evidence pending from Concordium
- Gate 3: independent Registry trust-policy approval
- Gate 4: controlled live Testnet acceptance

Successful SDK packaging or interoperability validation does not approve an unapproved Registry module, establish historical module-upgrade authority, or bypass a Registry trust gate.

I5 may proceed independently only within its existing evidence and assurance boundaries.

## 11. Final I5 decision criteria

I5 may be accepted when:

1. All SDK-01 through SDK-10 gates have sufficient recorded evidence.
2. The supported SDK API contract is accurate and independently consumable.
3. The packed distribution contains only approved runtime, type, schema, and documentation assets.
4. The original I3 results are reproduced without assurance promotion.
5. Remaining dependency and runtime-isolation limitations are explicitly documented.
6. Existing repository regression tests, typecheck, and builds pass.
7. The implementation diff remains confined to the approved file list.
8. The focused implementation PR has been reviewed and approved.

I5 completion does not authorize npm publication, production hosting, new trust claims, or closure of the Registry track.

## 12. References

- [I4-D1 Middleware Readiness Architecture Decision Record](i4-middleware-readiness-decision.md)
- [ProofPath Interoperability Architecture](interoperability-architecture.md)
- [ProofPath repository README](../README.md)
- [Existing I2 challenge mapper](../src/adapters/x402/challengeEvidence.ts)
- [Existing public API entry point](../src/index.ts)
- [SDK acceptance harness](../scripts/ci_i5_sdk_consumer_acceptance.mjs)
- [Package metadata](../package.json)
- [SDK build configuration](../tsconfig.sdk.json)

**Document status:** I5 working integration contract. Final acceptance evidence and disposition remain pending.
