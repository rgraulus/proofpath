
# ProofPath PP-04-B — Controlled Demonstration Runbook

## 1. Purpose

Demonstrate the integrated ProofPath evidence-assurance pipeline using deterministic synthetic fixtures and a shared application orchestrator.

The demonstration illustrates how independent source-level assessments are composed into a transaction evidence manifest, and how ProofPath prevents incomplete or contradictory evidence from being promoted into unsupported assurance.

The guiding principle is:

**Evidence tells a story. Assurance has boundaries.**

PP-04-B is an offline synthetic demonstration. It is not a live Concordium Testnet exercise, payment execution, production deployment, independent security audit, or transaction-wide authentication service.

## 2. Preconditions

- Repository: `proofpath`
- Branch: `feat/pp04-b-integrated-application-demo-v1`
- Node.js 22 or newer
- Project dependencies installed
- Working directory: repository root
- Local port 4174 available for the browser demonstration
- No live blockchain or payment execution enabled

Run the repository acceptance commands:

```bash
npm test
npm run typecheck
npm run build
```

The PP-04-B full acceptance checkpoint recorded 370 passing tests, no failures, successful typechecking, and a successful TypeScript build.

Independent CLI and server typechecking is included in the final PR readiness review.

## 3. Application Architecture

| Component | Implementation |
| --- | --- |
| Shared orchestrator | `src/application/pp04/orchestrator.ts` |
| Scenario construction | `src/application/pp04/fixtures.ts` |
| Application contracts | `src/application/pp04/contracts.ts` |
| Trusted validation configuration | `src/application/pp04/trustedConfig.ts` |
| Portable export boundary | `src/application/pp04/export.ts` |
| Canonical synthetic fixture | `demo/pp04/fixtures/canonical.json` |
| CLI | `demo/pp04/cli.ts` |
| Local HTTP server | `demo/pp04/server.ts` |
| Browser viewer | `demo/pp04/viewer/` |
| Integration regression suite | `tests/pp04-integration.test.ts` |

The orchestrator integrates:

- PP-03 M3.2 facilitator receipt verification
- PP-03 M3.3 settlement verification
- PP-03 M3.4 agent-authority verification
- PP-02 seller-binding assessment
- PP-03 M3.5 evidence composition
- PP-01 manifest validation and portable export

The CLI and browser share the orchestrator rather than implement separate verification pipelines.

PP-01 through PP-03 core modules remain unchanged.

## 4. Start the Browser Demonstration

From the repository root, in Terminal A:

```bash
PP04_DEMO_PORT=4174 node.exe --import tsx demo/pp04/server.ts
```

Expected startup indicators:

```text
PP04_SERVER_READY=true
PP04_SERVER_URL=http://127.0.0.1:4174
PP04_FIXTURE_ONLY=true
PP04_TESTNET_EXECUTION_ENABLED=false
PP04_RESTRICTED_EXPORT_ENABLED=false
```

Open:

`http://127.0.0.1:4174`

The HTTP server binds to `127.0.0.1`.

Its intended public-facing functionality is limited to local static assets, health reporting, and a diagnostic-only scenario API.

It does not expose raw evidence manifests, receipt JWS material, signing keys, restricted exports, or arbitrary repository files.

Loopback binding does not constitute production authentication or comprehensive browser-origin protection.

## 5. Demonstration Sequence

### F01 — Consistent Evidence

Select **Consistent evidence**.

Expected results:

- Composition: `incomplete`
- Evidence manifest: present
- Receipt assessment: `verified`
- Settlement assessment: `verified`
- Agent-authority assessment: `verified`
- Seller assessment: `indeterminate`
- No adversarial-input warning
- Diagnostic `delivery_authentication_not_established`
- Diagnostic `seller_authentication_not_established`

Presenter explanation:

All supplied source-verification results are consistent, but the transaction still lacks sufficient seller and delivery assurance.

The composer preserves that limitation rather than declaring the entire transaction verified.

### F02 — Missing Evidence

Select **Missing evidence**.

Expected results:

- Composition: `incomplete`
- Evidence manifest: present
- Receipt assessment: `verified`
- Settlement assessment: `verified`
- Agent-authority assessment: `verified`
- Seller assessment: `indeterminate`
- No adversarial-input warning
- Diagnostic `missing_verification_result`

Presenter explanation:

The settlement verifier produces a verified source result, but the demonstration deliberately omits that result from the composition input.

The original verifier assessment remains unchanged.

The composer recognizes the missing evidence and refuses to infer the absent verification result.

### F03 — Binding Conflict

Select **Binding conflict**.

Expected results:

- Composition: `rejected`
- Evidence manifest: absent
- Original source assessments unchanged
- Adversarial-input warning visible
- Diagnostic `transaction_binding_mismatch`

Presenter explanation:

The demonstration introduces a conflicting transaction hash into the composition input.

ProofPath rejects the inconsistent transaction binding and produces no evidence manifest.

This illustrates fail-closed behavior at the evidence-composition boundary.

### F04 — Unsupported Assurance

Select **Unsupported assurance**.

Expected results:

- Composition: `rejected`
- Evidence manifest: absent
- Original seller assessment remains `indeterminate`
- Other original source assessments remain unchanged
- Adversarial-input warning visible
- Diagnostic `unsupported_assurance_promotion`

Presenter explanation:

The demonstration attempts to promote seller assurance to `verified` without the necessary supporting evidence.

ProofPath rejects the unsupported promotion.

The original seller assessment remains indeterminate, demonstrating separation between verifier outputs and adversarial composition inputs.

## 6. Expected Scenario Matrix

| Scenario | Composition | Manifest | Adversarial warning |
| --- | --- | --- | --- |
| F01 — Consistent | `incomplete` | Present | Hidden |
| F02 — Missing evidence | `incomplete` | Present | Hidden |
| F03 — Binding conflict | `rejected` | Absent | Visible |
| F04 — Unsupported assurance | `rejected` | Absent | Visible |

For all four scenarios, the original source-assessment statuses remain:

| Source | Status |
| --- | --- |
| Facilitator receipt | `verified` |
| Settlement | `verified` |
| Agent authority | `verified` |
| Seller binding | `indeterminate` |

These are results obtained under synthetic fixture assumptions.

They must not be represented as independent authentication of a real transaction.

## 7. CLI Demonstration

From the repository root:

```bash
node.exe --import tsx demo/pp04/cli.ts --scenario consistent
node.exe --import tsx demo/pp04/cli.ts --scenario missing-evidence
node.exe --import tsx demo/pp04/cli.ts --scenario binding-conflict
node.exe --import tsx demo/pp04/cli.ts --scenario unsupported-assurance
```

All four scenarios should report:

```text
EXECUTION_COMPLETED=true
DEMO_ACCEPTANCE_PASS=true
TRANSACTION_VERIFIED=false
SYNTHETIC_SOURCE_AUTHENTICATION=false
```

A successful demonstration acceptance result means the scenario behaved according to its expected contract.

It does not establish transaction-wide verification.

## 8. Portable Evidence Export Demonstration

Only F01 and F02 support portable exports.

Exports use the existing PP-01 public/restricted disclosure profiles.

Use new absolute destination paths outside the repository.

### Public Export

```bash
node.exe --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export public \
  --output <new-absolute-file-path>
```

The placeholder must be replaced with an actual absolute file path before execution.

Expected properties:

- Portable export generated
- Full evidence manifest excluded
- Original manifest digest excluded
- Transaction and participant metadata omitted
- Approved public artifact digest commitments only
- Export digest verified
- No transaction-wide assurance claimed

### Restricted Export

```bash
node.exe --import tsx demo/pp04/cli.ts \
  --scenario consistent \
  --export restricted \
  --output <new-absolute-file-path> \
  --acknowledge-restricted
```

Expected properties:

- Explicit restricted acknowledgement required
- Validated evidence manifest preserved
- Export digest verified
- Existing output files not overwritten
- Restricted export unavailable through the browser

The acknowledgement does not establish user identity or disclosure authorization.

Restricted exports must be handled as potentially sensitive information.

Do not display restricted export contents during a public demonstration.

### Rejected Export Cases

Both public and restricted export attempts must fail for:

- F03 — Binding conflict
- F04 — Unsupported assurance

No output file may be created.

### Export Integrity

PP-01's `verifyExportDigest()` checks whether the exported representation matches its recorded digest.

Tampering with the exported representation must invalidate the digest.

Digest verification alone does not establish evidence authenticity, external source trust, or authorization to disclose data.

## 9. Local HTTP Acceptance

The validated HTTP acceptance checks cover:

| Test group | Scope |
| --- | --- |
| HTTP-A | Scenario response contracts for F01–F04 |
| HTTP-B | Static assets, security headers and disclosure allowlist |
| HTTP-C | Invalid requests, unsupported methods and blocked routes |

The server must not expose arbitrary fixture files, raw manifests, unrestricted repository paths or restricted portable exports.

Browser acceptance must confirm the four scenario outcomes and the absence of unintended assurance promotion.

These tests are limited acceptance checks, not a comprehensive penetration test.

## 10. Assurance Statement

Use this statement during a technical demonstration:

> ProofPath evaluates specific evidence claims under explicitly defined trust assumptions. It composes those assessments without promoting incomplete or contradictory evidence into stronger assurance. This demonstration uses synthetic evidence and trusted fixture configurations. It does not establish real payment, seller, delivery, or transaction-wide authentication.

Avoid describing F01 or F02 as fully verified transactions.

Avoid treating F03 or F04 rejection as proof that an actual transaction failed; these are deliberately constructed inconsistent composition inputs.

## 11. Stop Conditions

Stop the demonstration if any of the following occurs:

- A scenario produces an unexpected composition status
- F03 or F04 produces an evidence manifest
- F03 or F04 produces a portable export
- Unsupported seller assurance is promoted to `verified`
- Original source assessments change unexpectedly
- Restricted exports become accessible through HTTP
- Raw evidence or sensitive credentials appear in HTTP responses
- The application attempts live wallet or Testnet execution
- The HTTP server is not bound exclusively to the intended loopback interface
- The required repository guards or acceptance tests fail
- Unexpected files or tracked modifications appear in the repository

Do not bypass failed safeguards to continue the demonstration.

## 12. Shutdown and Cleanup

Stop the local HTTP server using Ctrl+C.

Remove temporary demonstration exports when no longer needed, following their disclosure classification.

Do not commit exported evidence files.

Do not store restricted exports in the repository.

## 13. PP-04-B Acceptance Record

Completed engineering acceptance:

| Acceptance checkpoint | Result |
| --- | --- |
| Shared application orchestration | PASS |
| CLI four-scenario execution | PASS |
| Browser HTTP-A scenario checks | PASS |
| Browser HTTP-B static and disclosure checks | PASS |
| Browser HTTP-C negative security checks | PASS |
| Browser F01–F04 visual acceptance | PASS |
| Public/restricted export boundary | PASS |
| CLI export safeguards | PASS |
| Targeted PP-04-B regression | 10/10 PASS |
| Full repository regression | 370/370 PASS |
| TypeScript project typecheck | PASS |
| TypeScript project build | PASS |

Direct server/CLI typechecking and final repository-scope acceptance remain part of the final PR readiness review.

## 14. Out of Scope

PP-04-B does not include:

- Live Concordium Testnet integration
- Live payment execution or resource release
- Production wallet integration
- Production-grade authorization for evidence disclosure
- Real-world evidence collection
- Public deployment of the browser server
- Independent production security certification
- Changes to frozen PP-01–PP-03 core contracts
- PP-04-C live integration

## 15. PR Readiness Criteria

PP-04-B is ready for its focused pull request when:

1. All four scenarios satisfy their expected contracts.
2. Public and restricted exports enforce their disclosure rules.
3. Rejected scenarios fail closed.
4. Integration and full repository tests pass.
5. CLI and server entrypoints pass independent typechecking.
6. Browser/HTTP acceptance results are recorded.
7. Demonstration documentation matches the implementation.
8. The root README accurately describes the completed milestones and limitations.
9. The final file diff is restricted to reviewed PP-04-B scope.
10. Git staging, commit, push and PR publication are explicitly authorized.

The intended deliverable is one focused PP-04-B PR.

No additional implementation milestone or PR ladder is required for this demonstration.
