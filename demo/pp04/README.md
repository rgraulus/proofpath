
# ProofPath PP-04-B — Integrated Application Demo

## Overview

PP-04-B demonstrates the ProofPath evidence-assurance pipeline through a shared application orchestrator, a command-line interface, and a local browser viewer.

The demonstration uses deterministic synthetic fixtures. It does not connect to Concordium Testnet, submit payments, control wallets, release resources, or authenticate a real transaction.

The guiding principle is:

**Evidence tells a story. Assurance has boundaries.**

## Architecture

The PP-04-B application composes existing ProofPath functionality:

| Component | Responsibility |
| --- | --- |
| PP-03 M3.2 | Facilitator receipt verification |
| PP-03 M3.3 | Settlement verification |
| PP-03 M3.4 | Agent Registry and CIS-8 authority verification |
| PP-02 | Seller-binding assessment |
| PP-03 M3.5 | Evidence composition |
| PP-01 | Schema validation and portable evidence export |

The application entry point is:

`src/application/pp04/orchestrator.ts`

Both the CLI and browser server invoke this shared orchestrator. They do not independently reimplement verification.

## Requirements

- Node.js 22 or newer
- Installed project dependencies
- Repository root as the working directory

Install dependencies from the repository root:

```bash
npm ci
```

## CLI Demonstration

Run the four scenarios from the repository root:

```bash
node.exe --import tsx demo/pp04/cli.ts --scenario consistent
node.exe --import tsx demo/pp04/cli.ts --scenario missing-evidence
node.exe --import tsx demo/pp04/cli.ts --scenario binding-conflict
node.exe --import tsx demo/pp04/cli.ts --scenario unsupported-assurance
```

On platforms where `node.exe` is not appropriate, use `node`.

Each command displays source-assessment statuses, composition status, diagnostic codes, manifest presence, and the demonstration acceptance result.

The CLI reports `TRANSACTION_VERIFIED=false` for all scenarios.

## Scenario Expectations

| Scenario | Composition | Manifest | Key behavior |
| --- | --- | --- | --- |
| F01 — Consistent evidence | `incomplete` | Present | Seller and delivery assurance remain unestablished |
| F02 — Missing evidence | `incomplete` | Present | Settlement verification result omitted from composition |
| F03 — Binding conflict | `rejected` | Absent | Transaction binding mismatch |
| F04 — Unsupported assurance | `rejected` | Absent | Unsupported seller assurance promotion |

The original source assessments remain:

- Receipt: `verified`
- Settlement: `verified`
- Agent authority: `verified`
- Seller: `indeterminate`

These results represent verification against synthetic fixtures and configured trust assumptions, not independently authenticated real-world transactions.

F03 and F04 deliberately modify composition inputs after the source verifiers have run. Original source assessments must remain unchanged.

An `incomplete` composition is not a verified transaction. A `rejected` composition cannot produce a manifest or portable evidence export.

## Browser Demonstration

Start the localhost server from the repository root:

```bash
PP04_DEMO_PORT=4174 node.exe --import tsx demo/pp04/server.ts
```

Open:

`http://127.0.0.1:4174`

The server binds to `127.0.0.1` and serves an allowlisted set of static resources and a diagnostic-only scenario API.

Supported local endpoints:

```text
GET /healthz
GET /api/scenario?scenario=consistent
GET /api/scenario?scenario=missing-evidence
GET /api/scenario?scenario=binding-conflict
GET /api/scenario?scenario=unsupported-assurance
```

The API does not expose raw manifests, receipt JWS values, signing materials, source evidence, or restricted portable exports.

The browser is not a production-authenticated application. Loopback binding and diagnostic-only responses reduce exposure but are not a substitute for full security controls.

Stop the local server using Ctrl+C.

## Portable Evidence Export

Portable evidence exports are available only through the local CLI, for F01 and F02.

### Public export

```bash
node.exe --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export public \
  --output <absolute-output-file>
```

### Restricted export

```bash
node.exe --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export restricted \
  --output <absolute-output-file> \
  --acknowledge-restricted
```

Replace `<absolute-output-file>` with a new absolute file path outside the repository. Do not include the angle brackets in the actual command.

The public profile contains approved artifact digest commitments and omission metadata. It excludes the full evidence manifest, original manifest digest, transaction and participant metadata, commercial terms, and assurance claims.

The restricted profile includes the complete validated evidence manifest.

Both profiles contain a digest of the exported representation, which can be checked using PP-01's `verifyExportDigest()`.

A matching export digest establishes representation consistency only. It does not independently authenticate the evidence source or prove transaction validity.

### Export safeguards

- Disclosure profile must be explicitly selected.
- Destination must be an absolute path outside the repository.
- Existing files are not overwritten.
- Restricted exports require `--acknowledge-restricted`.
- Restricted exports are unavailable through the browser.
- Rejected compositions cannot be exported.
- Export contents are not printed to the terminal.
- Export digests are verified before successful completion.

Restricted acknowledgement is a deliberate local safeguard, not identity authentication or disclosure authorization.

The CLI is intended for a trusted local demonstration environment, not as a security sandbox for hostile local users.

## Validation

Run the targeted PP-04-B integration regression:

```bash
node.exe --import tsx --test tests/pp04-integration.test.ts
```

Run the complete repository validation:

```bash
npm test
npm run typecheck
npm run build
```

At the PP-04-B full acceptance checkpoint, the repository recorded:

- Full repository tests: 370 passed, 0 failed
- Targeted PP-04-B integration tests: 10 passed
- TypeScript project typecheck: PASS
- TypeScript project build: PASS
- HTTP-A, HTTP-B and HTTP-C acceptance: PASS
- Browser F01–F04 visual acceptance: PASS

The standard TypeScript project configuration does not include `demo/**/*.ts`. Independent direct CLI and server typechecking is therefore part of the final PR readiness review.

## Trust and Assurance Limitations

PP-04-B is offline and synthetic.

It does not establish:

- Real Concordium transaction finality
- Independent authenticity of real facilitator receipts
- Real Agent Registry ownership or CIS-8 acting authority
- Seller endpoint authentication
- Delivery authentication
- Human identity assurance
- Authorization to distribute restricted evidence
- Production readiness for live evidence collection

The source verifiers exercise real application logic against controlled synthetic evidence and trusted fixture configurations.

Successful demonstration acceptance must never be described as transaction-wide verification.

Live/Testnet integration remains outside PP-04-B and requires separate scope and authorization.

## Related Documentation

See [Controlled Demo Runbook](../../docs/pp04-demo-runbook.md) for the demonstration sequence, assurance statements, expected outcomes, stop conditions, and acceptance record.
