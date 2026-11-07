
# ProofPath

**Portable evidence, provenance, verification and accountability for agent-mediated transactions.**

ProofPath is an independent TypeScript evidence-assurance layer designed to help applications collect, evaluate, correlate, compose and export structured evidence associated with commercial transactions involving autonomous AI agents.

ProofPath distinguishes between:

- Evidence that has been recorded.
- Evidence whose integrity has been checked.
- Evidence whose source or provenance has been authenticated.
- Specific claims that have been verified under defined trust assumptions.
- Transaction-wide assurance that may remain incomplete or unsupported.

Its guiding principle is:

**Evidence tells a story. Assurance has boundaries.**

ProofPath does not execute payments, control wallets, release purchased resources or substitute for the underlying transaction infrastructure.

## Project Status

ProofPath has progressed through four implementation stages:

| Stage | Capability | Status |
| --- | --- | --- |
| PP-01 | Portable evidence and audit foundations | Implemented and validated |
| PP-02 | Identity, trust and seller-binding assessment | Implemented and validated |
| PP-03 | Specialized verification and evidence composition | Implemented and validated |
| PP-04-B | Integrated application, CLI, browser demo and portable exports | Implemented; final PR preparation in progress |
| PP-04-C | Live/Testnet application integration | Not implemented in PP-04-B |

The integrated PP-04-B demonstration uses deterministic synthetic fixtures and exercises existing ProofPath verification and composition logic.

It is not a live Concordium transaction demonstration.

At the PP-04-B full repository acceptance checkpoint:

- **370 automated tests passed**
- **0 tests failed**
- TypeScript project typecheck passed
- TypeScript project build passed
- Four CLI scenarios passed
- Four browser scenarios passed visual acceptance
- HTTP scenario, disclosure and negative security acceptance passed
- Public/restricted portable export controls passed

These are engineering validation results, not independent security certification or production-readiness approval.

## Why ProofPath?

Agent-mediated commercial transactions can involve multiple independent systems:

- A buyer or buyer-controlled agent.
- A seller or resource provider.
- Payment negotiation and settlement infrastructure.
- Agent identity, registry and authorization mechanisms.
- Policy and compliance controls.
- Resource-delivery mechanisms.
- Evidence collectors, auditors and oversight systems.

Each system may produce different records and assertions.

For example, a payment facilitator may issue a signed receipt, a blockchain node may report a finalized transaction, an agent registry may identify an agent owner, and a resource server may report successful delivery.

Those records are related, but they do not automatically establish the same facts.

A verified payment receipt does not prove delivery.

A finalized payment does not independently authenticate a seller.

An Agent Registry entry does not establish human identity or unrestricted authority.

A recorded delivery event does not necessarily authenticate the delivery source.

ProofPath provides a structured evidence layer that preserves these distinctions.

## Architecture

ProofPath separates evidence representation, verification, composition and application presentation.

```text
          Agent-Mediated Transaction Systems
                          |
                          v
                 Evidence and Records
                          |
             +------------+------------+
             |                         |
             v                         v
      PP-01 Foundations        PP-02 / PP-03 Verification
      -----------------        ------------------------
      Evidence schemas         Receipt verification
      Canonicalization         Settlement verification
      Integrity commitments    Agent authority
      Provenance               Identity / trust
      Audit journals           Seller binding
             |                         |
             +------------+------------+
                          |
                          v
              PP-03 Evidence Composition
              --------------------------
              Correlation and binding
              Claim preservation
              Assurance boundaries
              Incomplete / rejected outcomes
                          |
                          v
                  PP-01 Validation
                          |
             +------------+------------+
             |                         |
             v                         v
       Portable Evidence        PP-04 Application
       Public / Restricted      -----------------
             |                  Shared orchestrator
             |                  CLI demonstration
             |                  Local browser viewer
             |                         |
             +------------+------------+
                          |
                          v
              Consuming Applications,
                Auditors and Operators
```

This diagram illustrates the logical architecture.

It does not imply that every capability is automatically executed for every transaction or that all verification sources are independently authenticated.

The consuming application is responsible for establishing trusted inputs, invoking the appropriate verification functions, and enforcing authorization and disclosure policy.

## PP-01 — Portable Evidence Foundations

PP-01 establishes the platform-neutral evidence and audit contracts.

| Capability | Description |
| --- | --- |
| Evidence Manifest v1 | Frozen JSON Schema and TypeScript contracts |
| Audit Event v1 | Frozen schema and controlled event vocabulary |
| Runtime validation | Structural and semantic consistency checks |
| Canonicalization | Deterministic supported-JSON representation |
| Integrity commitments | SHA-256 byte and domain-separated record digests |
| Provenance | Artifact-integrity and source-attribution assessment |
| Audit journal | Hash-linked logical event records and verification |
| Portable exports | Public and restricted disclosure profiles |
| Concordium x402 profile | Optional reference normalization |

The evidence manifest captures transaction identity, participants, commercial terms, authorization, payment and delivery evidence, audit coverage, assurance claims and governance metadata.

The audit-journal implementation can detect altered events and inconsistent hash links relative to trusted commitments.

PP-01 does not independently authenticate source systems, establish payment finality, or provide durable immutable storage.

### Portable evidence exports

The `public` profile exposes a deliberately minimized representation, including approved public artifact digest commitments and omission metadata.

It excludes the full manifest, original manifest commitment, restricted artifact commitments, transaction and participant details, and assurance claims.

The `restricted` profile preserves the complete validated manifest and its commitments.

Both profiles include a digest of the exported representation.

`verifyExportDigest()` checks representation consistency. It does not authenticate the producer, certify the truth of evidence claims, or authorize disclosure.

Restricted exports require access control and privacy governance in any production application.

See [PP-01 Technical Contract](docs/pp01-contract.md).

## PP-02 — Identity, Trust and Seller Binding

PP-02 introduces specialized evidence assessment with explicit trust limitations.

Its assessment areas include:

- Agent and owner identity evidence.
- Registry ownership and account-control observations.
- Human-identity assurance boundaries.
- Agent implementation and module trust.
- Seller identity and commercial binding.
- Seller endpoint, payment-recipient and delivery relationships.

The implementation distinguishes registry observations, source attribution, cryptographic integrity and independently supported authority claims.

Missing or insufficient evidence may produce an `indeterminate` outcome rather than an unsupported positive assertion.

A registry entry alone does not prove that an agent is controlled by a particular human.

A seller's Agent Card alone does not establish that the seller controls the advertised endpoint.

A verified payment or delivery record does not automatically establish seller authenticity.

PP-02 assessments retain these boundaries instead of promoting related but insufficient evidence into verified claims.

## PP-03 — Specialized Verification and Composition

PP-03 supplies specialized verification modules and a transaction-evidence composer.

### Facilitator receipt verification — M3.2

Evaluates a facilitator receipt against trusted signing and policy configuration, including supported cryptographic and transaction-binding requirements.

Its checks include signature validation, trusted key selection, receipt-policy commitments, transaction details and relevant temporal constraints.

A valid receipt under the configured trust policy does not, by itself, independently establish blockchain finality or resource delivery.

### Settlement verification — M3.3

Evaluates Concordium PLT settlement evidence against expected transaction and payment parameters.

Relevant checks include transaction identity, network context, finalized execution status, asset, amount and recipient.

Production verification requires an appropriately trusted Concordium observation source.

Synthetic fixture success must not be confused with independent live consensus verification.

### Agent authority verification — M3.4

Evaluates narrowly defined Concordium Agent Registry and CIS-8 authority evidence.

Its checks include registry coordinates, finalized observations, agent status, supported module policy, external key registration and applicable trust anchors.

These checks do not establish unrestricted delegation, human identity or general authority to perform arbitrary actions.

### Evidence composition — M3.5

Correlates specialized verification results and constructs transaction evidence under explicit consistency and assurance rules.

The composer:

- Preserves the narrow meaning of source assessments.
- Checks transaction and evidence bindings.
- Rejects contradictory or unsupported assertions.
- Avoids fabricating missing verification results.
- Prevents unsupported assurance promotion.
- Produces an evidence manifest only when permitted by its composition contract.

An `incomplete` composition may have a valid evidence manifest without representing a fully verified transaction.

A `rejected` composition does not produce an evidence manifest.

## PP-04-B — Integrated Application Demo

PP-04-B integrates the existing ProofPath components into an executable application demonstration.

It includes:

- A shared application orchestrator.
- Deterministic synthetic fixtures.
- A command-line demonstration.
- A localhost browser viewer.
- A diagnostic-only HTTP API.
- Controlled public/restricted portable evidence exports.
- Automated integration regression tests.

The shared orchestrator is located at:

`src/application/pp04/orchestrator.ts`

Both the CLI and browser server use this orchestrator instead of independently implementing verification logic.

### Four demonstration scenarios

| Scenario | Composition | Manifest | Principal demonstration |
| --- | --- | --- | --- |
| F01 — Consistent evidence | `incomplete` | Present | Missing seller and delivery assurance |
| F02 — Missing evidence | `incomplete` | Present | Missing verification result is not fabricated |
| F03 — Binding conflict | `rejected` | Absent | Conflicting transaction binding is rejected |
| F04 — Unsupported assurance | `rejected` | Absent | Unsupported seller verification is rejected |

Across all four scenarios, the original synthetic source assessments remain:

| Source assessment | Result |
| --- | --- |
| Facilitator receipt | `verified` |
| Settlement | `verified` |
| Agent authority | `verified` |
| Seller binding | `indeterminate` |

These results are based on controlled synthetic evidence and configured trust assumptions.

They are not claims that an actual external transaction was independently verified.

### Run the CLI

Install dependencies from the repository root:

```bash
npm ci
```

Execute the four scenarios:

```bash
node --import tsx demo/pp04/cli.ts --scenario consistent
node --import tsx demo/pp04/cli.ts --scenario missing-evidence
node --import tsx demo/pp04/cli.ts --scenario binding-conflict
node --import tsx demo/pp04/cli.ts --scenario unsupported-assurance
```

The CLI reports composition status, source-assessment status, diagnostic codes and manifest presence.

It also explicitly reports:

`TRANSACTION_VERIFIED=false`

### Run the browser

Start the local demonstration server:

```bash
PP04_DEMO_PORT=4174 node --import tsx demo/pp04/server.ts
```

Then open:

`http://127.0.0.1:4174`

The browser supports all four scenarios and displays their evidence-composition outcomes.

The server binds to the loopback interface and exposes only an allowlisted set of static assets and diagnostic endpoints.

It does not expose raw evidence manifests or restricted exports.

The browser is a local demonstration interface, not a production-authenticated application.

### Export portable evidence

F01 and F02 support portable evidence export through the CLI.

Public example:

```bash
node --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export public \
  --output /absolute/path/to/new-public-export.json
```

Restricted example:

```bash
node --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export restricted \
  --output /absolute/path/to/new-restricted-export.json \
  --acknowledge-restricted
```

Replace the example paths with valid absolute paths for the host operating system, outside the repository.

The CLI requires explicit disclosure selection and refuses to overwrite existing files.

Restricted export requires explicit acknowledgement.

F03 and F04 cannot be exported.

The restricted acknowledgement is not authentication or access authorization. Restricted export is intended only for a trusted local demonstration context.

See:

- [PP-04-B Demo README](demo/pp04/README.md)
- [PP-04-B Controlled Demo Runbook](docs/pp04-demo-runbook.md)

## Concordium and x402 Integration

ProofPath is independent of the payment-execution infrastructure.

Its optional Concordium x402 profile supports normalization of references associated with:

- x402 payment requirements and payment submissions.
- Facilitator receipts.
- Concordium transactions and settlement evidence.
- Agent Registry entries and Agent Cards.
- CIS-8 acting keys and authority-related evidence.
- Authorization and zero-knowledge proof records.
- Resource delivery and commercial context.

The reference-normalization profile does not itself verify those records.

PP-03 provides separate verification capabilities for selected receipt, settlement and agent-authority evidence.

PP-04-B demonstrates the integration of those verification components using synthetic fixtures.

Real integration with the Gateway, Facilitator, Orchestrator, Wallet Proxy, Concordium node and external evidence sources is outside the PP-04-B execution path.

ProofPath does not modify or replace those systems.

## Repository Structure

The main implementation areas are:

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

    application/
      pp04/
        contracts.ts
        trustedConfig.ts
        fixtures.ts
        orchestrator.ts
        export.ts

    index.ts

  demo/
    pp04/
      fixtures/
        canonical.json
      viewer/
        index.html
        app.js
        style.css
      cli.ts
      server.ts
      README.md

  tests/
    pp04-integration.test.ts
    ...existing PP-01 through PP-03 tests

  docs/
    pp01-contract.md
    article12-mapping.md
    pp04-demo-runbook.md
    ...other project documentation

  package.json
  tsconfig.json
  README.md
```

The architecture separates reusable evidence and verification modules from application-specific orchestration and presentation.

PP-04-B does not modify the frozen PP-01 schema contracts.

## Development and Validation

ProofPath requires Node.js 22 or newer.

From the repository root:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Run the dedicated PP-04-B regression suite:

```bash
node --import tsx --test tests/pp04-integration.test.ts
```

### Latest PP-04-B acceptance baseline

| Validation | Result |
| --- | --- |
| Full repository tests | 370 passed, 0 failed |
| PP-04-B integration tests | 10 passed, 0 failed |
| TypeScript project typecheck | PASS |
| TypeScript project build | PASS |
| Four CLI scenarios | PASS |
| HTTP scenario acceptance | PASS |
| HTTP static/disclosure acceptance | PASS |
| HTTP negative security acceptance | PASS |
| Browser F01–F04 visual acceptance | PASS |
| Public/restricted export acceptance | PASS |
| Export digest tampering detection | PASS |
| Rejected-composition export prevention | PASS |

The standard project typecheck does not include `demo/**/*.ts`. CLI and server entrypoint typechecking is therefore validated separately.

These results describe the PP-04-B engineering acceptance baseline. They are not a production certification or an independent security audit.

## Public TypeScript API

The existing public library entrypoint is:

`src/index.ts`

Its PP-01 runtime exports include:

| Area | Functions |
| --- | --- |
| Canonicalization | `canonicalJson`, `canonicalJsonBytes` |
| Hashing | `sha256Bytes`, `sha256Record` |
| Validation | `createRuntimeValidator` |
| Provenance | `assessArtifactProvenance` |
| Audit | `computeAuditEventDigest`, `verifyAuditJournal`, `appendAuditEvent` |
| Export | `exportEvidence`, `verifyExportDigest` |
| Concordium x402 profile | `normalizeConcordiumX402Profile` |

PP-02, PP-03 and PP-04-B modules are implementation and application capabilities.

Their existence does not automatically imply that all modules have been added to the root public API, published to a package registry or designated stable production interfaces.

Any public API expansion requires explicit review and versioning decisions.

## Integrity, Provenance and Audit Boundaries

ProofPath uses SHA-256 commitments over exact artifact bytes and separately domain-separated structured records.

Its canonicalization contract supports deterministic serialization for defined JSON values.

It is not claimed to implement RFC 8785 / JCS.

Matching commitments establish consistency with recorded values, provided the relevant commitments themselves are trusted.

Hash consistency does not independently authenticate an evidence producer.

The audit journal is a logically append-only, hash-linked structure. Its verification depends on trusted expected commitments and declared capture scope.

It does not independently provide immutable storage, durable retention, independently authenticated timestamps or comprehensive event capture.

A recorded claim must not be treated as independently verified merely because the record is schema-valid or digest-consistent.

## Security and Trust Boundaries

ProofPath does not currently constitute a complete production transaction-verification or evidence-custody platform.

In particular, the PP-04-B application does not provide:

- Live payment initiation, settlement or resource release.
- Live Concordium consensus verification.
- Production-connected facilitator receipt validation.
- Live Agent Registry or CIS-8 observation.
- Independent human identity or ZKP proof verification.
- Production source-system authentication.
- Authenticated seller endpoint or delivery confirmation.
- General-purpose agent delegation authorization.
- Production authentication and authorization for restricted exports.
- Export signing or encryption.
- Durable, immutable or independently anchored audit storage.
- Comprehensive evidence capture or retention enforcement.
- A public multi-user hosted service.
- Independent security certification.

Some of these areas have specialized verification logic implemented in PP-02 or PP-03, but PP-04-B exercises that logic under synthetic fixture assumptions.

This distinction is essential.

**Implemented verification logic is not the same as independently authenticated real-world evidence.**

Likewise, a `verified` source assessment is not automatically equivalent to a fully verified commercial transaction.

## EU AI Act Recordkeeping

ProofPath includes an engineering mapping of selected recordkeeping considerations associated with EU AI Act Articles 12, 19 and 26.

See [Article 12 Mapping](docs/article12-mapping.md).

This is a technical mapping, not a legal opinion or compliance certification.

Applicable obligations, deployment classification, operational logging, retention, human oversight and conformity assessment remain dependent on the particular system and its use.

## Documentation

The repository contains implementation contracts, technical documentation and demonstration instructions.

Primary entrypoints:

- [PP-01 Technical Contract](docs/pp01-contract.md)
- [Article 12 Mapping](docs/article12-mapping.md)
- [Evidence Manifest v1 Schema](schemas/proofpath-evidence-v1.schema.json)
- [Audit Event v1 Schema](schemas/proofpath-audit-event-v1.schema.json)
- [PP-04-B Integrated Demo README](demo/pp04/README.md)
- [PP-04-B Controlled Demo Runbook](docs/pp04-demo-runbook.md)

The demonstration documents define how to execute PP-04-B and interpret its results without overstating assurance.

## Next Steps

The immediate project objective is to complete PP-04-B repository acceptance and prepare one focused pull request.

That review includes:

- Final documentation consistency checks.
- Independent CLI/server typechecking.
- Final automated regression and build confirmation.
- Exact repository-file scope verification.
- Review of the root README changes.
- Explicit authorization before staging, committing, pushing or submitting the PR.

Future work may include PP-04-C live/Testnet evidence integration and broader application packaging.

Those activities require separate technical scope, trusted-source integration, security review and acceptance criteria.

**ProofPath's current milestone is a validated, integrated synthetic evidence-assurance demonstration—not a production deployment or independent certification of real commercial transactions.**
