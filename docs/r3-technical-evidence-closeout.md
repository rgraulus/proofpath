# ProofPath R3 — Technical Evidence Closeout

**Document ID:** PP-R3-CLOSEOUT-v1  
**Status:** ACCEPTED — Technical Closeout  
**Date:** 2026-11-17  
**Project:** ProofPath  
**Baseline:** PP-R2-D1 Registry Assurance Profile v1  
**Repository:** `rgraulus/proofpath`  
**Baseline commit:** `275603170edf7ddc7a15d54a2422b216b8a19475`  
**Normative project document:** `docs/registry-assurance-profile-v1.md`

---

## 1. Executive Summary

ProofPath R3 conducted bounded technical validation of the historical
Concordium Testnet Agent Registry upgrade from Module B to Module C,
together with existing SDK regression tests, deployed-module binary
integrity verification, and source/build assurance assessment.

The principal technical results were:

1. The expected Concordium Testnet genesis was reproduced.
2. The historical Registry instance `12802/0` was observed at the
   specified pre-upgrade and post-upgrade blocks.
3. Module B was confirmed immediately before the October 6, 2026
   upgrade.
4. The historical upgrade transaction was confirmed as finalized
   and successfully executed.
5. The transaction's recorded module transition matched the historical
   Registry state observations.
6. Module C was confirmed immediately after the upgrade.
7. The historical `CIS-8004.getAdmin` return value was reproduced
   at the pre-upgrade block.
8. The reported historical administrator matched the upgrade
   transaction sender.
9. All 91 existing relevant SDK tests passed.
10. The TypeScript typecheck passed.
11. Module B and Module C binaries were retrieved and SHA-256
    integrity-committed without writing binary artifacts.
12. The highest demonstrated source/build assurance was Tier 1
    for both modules.

The investigation did not establish reviewed source-to-binary
correspondence, independently verified authorization enforcement,
or independent governance approval.

Accordingly, the accepted R3 technical disposition is:

**TECHNICAL VALIDATION COMPLETED — WITH EXPLICIT ASSURANCE LIMITATIONS**

This disposition concerns the completion of bounded technical
validation only. It is not an approval of Module C, the Registry
implementation, or the Registry as an operational trust anchor.

The following governance conditions remain in force:

- `TRUST-01 = OPEN`
- `Module C = UNAPPROVED`
- `C5 = NOT ESTABLISHED`
- `C6 = NOT ESTABLISHED`
- `PROVENANCE_NOT_APPROVAL_READY`
- No production trust-policy or module-allowlist changes are authorized.

The project owner formally accepted this technical closeout on
November 17, 2026, including its documented assurance limitations.

---

## 2. Governing Framework and Scope

### 2.1 Applicable governance baseline

This assessment follows:

**PP-R2-D1 Registry Assurance Profile v1**

including its accepted amendments:

- **Amendment A:** Governance approval must be independently controlled
  by the project owner, rather than inferred from Registry observations
  or the Registry presenter.
- **Amendment B:** Point-in-time historical evidence does not prove
  uninterrupted trust across an entire deployment history.
- **Amendment C:** R3 may close technically with explicitly documented
  source/build limitations, without achieving Tier 2 or Tier 3
  implementation assurance.

The governing principle remains:

> Evidence tells a story. Assurance has boundaries.

### 2.2 Authorized activities

R3 execution was authorized for:

- R3-A historical Concordium Testnet evidence reproduction.
- R3-B execution of existing verification and regression tests.
- R3-C bounded, read-only source/build evidence assessment.
- R3-D technical acceptance-gate inspection and closeout preparation.

The project owner separately authorized creation of this single
closeout document.

### 2.3 Excluded activities

R3 did not authorize or perform:

- Registry deployments or upgrades.
- Blockchain transactions or wallet signing.
- New verification engines or production Registry verifiers.
- New validation harnesses.
- Modifications to frozen SDK result contracts.
- Changes to Registry module allowlists.
- Changes to production trust policy.
- Automatic approval of Module C.
- Changes to XCF repositories.
- Production deployment or package publication.
- An unrestricted source-code investigation.

No such activities are implied by this closeout.

### 2.4 Evidence model

The historical blockchain evidence was obtained from an authenticated
Concordium Testnet gRPC endpoint using TLS.

This establishes observations reported by a trusted node.

It does not establish that ProofPath independently verified
Concordium consensus or cryptographically reconstructed blockchain
finality from independent validator evidence.

The assessment distinguishes:

1. Trusted-node observations.
2. Reproduced historical state and transaction representations.
3. Local integrity calculations.
4. SDK unit and regression test results.
5. Implementation review, where actually performed.
6. Governance approval, where explicitly granted.

These assurance categories must not be conflated.

---

## 3. R3-A — Historical Testnet Evidence Reproduction

### 3.1 Environment

**Execution date:** November 17, 2026

**Client:**

`concordium-client 10.0.0`

**Executable:**

`/d/Tools/Concordium/concordium-client-10.0.0/concordium-client.exe`

**Testnet endpoint:**

`grpc.testnet.concordium.com:20000`

**Transport:**

TLS-enabled gRPC.

Client 10.0.0 was selected after verifying that the five relevant
historical-read command interfaces were available with identical
help text in versions 9.1.4 and 10.0.0.

The historical queries were performed using client 10.0.0.

### 3.2 Network identity

**Expected and observed Testnet genesis:**

`4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796`

The consensus-status query succeeded and returned an exact genesis
match.

At the time of the observation, the node reported:

- Current protocol: P10.
- Current genesis index: 7.
- Last finalized block height: 50,921,979.
- Best block height: 50,921,980.

These values describe the node's reported state during the query;
they are not permanent chain-state assertions.

**R3-P01: PASS — Trusted-node Testnet identity observation.**

### 3.3 Registry coordinates

**Registry contract:**

`12802/0`

**Contract name:**

`CIS-8004`

**Recorded contract-instance owner:**

`3dt3UMPzRASZndjmKpSWgCP2HhmoxZrgs8FDPtZjNHZzj13hhB`

The same Registry coordinates and instance owner were observed at
the two specified historical blocks.

This identifies the Registry being assessed. It does not establish
the implementation's correctness or governance legitimacy.

**R3-P02: PASS — Historical Registry instance identified.**

### 3.4 Historical block resolution

The following block heights were resolved through live Testnet
historical queries.

| Historical state | Height | Block hash |
| --- | ---: | --- |
| Pre-upgrade | 49,121,730 | `4e0fce12309d1ff1500e08a5ecae9353e238e9bb94aa6246f110f231c244892b` |
| Upgrade/post-upgrade | 49,121,731 | `2b5c556c90c2a3effdd512c7e10c505bb93ef422900168d905d6b49eeadebaf7` |

Both block resolutions succeeded.

The returned hashes matched the historical R1 findings.

### 3.5 Pre-upgrade Module B

The historical Registry state at block 49,121,730 reported:

**Module B:**

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

The query returned the expected contract and instance owner.

**R3-P03: PASS — Module B historical state reproduced.**

### 3.6 October 6 upgrade transaction

**Transaction hash:**

`c40cd097d516162bb74a57cb16462596057f84c4b5e3ddbf9fe9c021d10f3cb1`

The Concordium Testnet transaction-status query reported:

- Transaction finalized.
- Execution status: success.
- Finalized into block 49,121,731.
- Target: Registry `12802/0`.
- Entrypoint: `CIS-8004.upgrade`.
- Migration parameter: `None`.
- Previous module: Module B.
- Replacement module: Module C.
- Contract resumed successfully after interruption.

**Recorded sender:**

`3whdieGHx43KKRwQYbC5pAUdmWZ61B7yreNRU9i36MtdCvajR8`

**R3-P04: PASS — Correct historical transaction reproduced.**

### 3.7 Upgrade effect

The transaction report explicitly identified the transition:

**From Module B:**

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

**To Module C:**

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

The historical Registry state at the post-upgrade block separately
reported the replacement module.

The transaction result and historical state observations therefore
agreed on the module transition.

**R3-P05: PASS — Successful upgrade effect reproduced.**

**R3-P06: PASS — Module C post-upgrade state reproduced.**

These observations establish historical consistency within the
trusted-node evidence model.

They do not independently prove the correctness of the upgrade
authorization mechanism.

### 3.8 Historical administrator

A block-pinned, read-only invocation was performed against:

`CIS-8004.getAdmin`

at the pre-upgrade block:

`4e0fce12309d1ff1500e08a5ecae9353e238e9bb94aa6246f110f231c244892b`

The invocation succeeded.

The decoded result was:

```json
{
  "Some": [
    "3whdieGHx43KKRwQYbC5pAUdmWZ61B7yreNRU9i36MtdCvajR8"
  ]
}
```

The returned account was identical to the recorded upgrade
transaction sender.

The historical administrator differed from the contract-instance
owner:

`3dt3UMPzRASZndjmKpSWgCP2HhmoxZrgs8FDPtZjNHZzj13hhB`

Accordingly:

- `ADMIN_MATCHES_UPGRADE_SENDER = true`
- `ADMIN_MATCHES_INSTANCE_OWNER = false`

**R3-P07: PASS — Historical administrator result reproduced.**

**R3-P08: PASS — Administrator/sender equality reproduced.**

### 3.9 Administrative assurance boundary

The historical administrator result demonstrates consistency between
the contract's reported pre-upgrade administrator and the account
recorded as submitting the upgrade transaction.

It does not independently establish:

- That the deployed Module B implementation enforced the intended
  administrator restriction.
- That the administrator was legitimately appointed.
- That the contract-instance owner was required to submit the upgrade.
- That upgrade authorization was continuously correct throughout
  prior historical transitions.
- That the resulting Module C implementation is trustworthy or approved.

Those questions require implementation and governance evidence
beyond the reproduced historical observations.

---

## 4. R3-B — Existing SDK Regression Tests

### 4.1 Executed test suites

R3-B executed the existing ProofPath tests without modifying
source code or creating a new test harness.

| Test suite | Tests | Result |
| --- | ---: | --- |
| `tests/pp02-registry-trust.test.ts` | 16 | PASS |
| `tests/pp03-registry-snapshot.test.ts` | 21 | PASS |
| `tests/pp03-agent-authority.test.ts` | 54 | PASS |
| **Total** | **91** | **PASS** |

The Node.js test runner reported:

- Tests: 91.
- Passed: 91.
- Failed: 0.
- Cancelled: 0.
- Skipped: 0.
- Todo: 0.

The process exited successfully.

### 4.2 Existing verification behavior

The existing test inventory includes cases concerning:

- Correct and incorrect Registry identity.
- Wrong Testnet genesis.
- Approved and unapproved module references.
- Finalized and unfinalized snapshots.
- Historical-observation and timestamp inconsistencies.
- Malformed module references.
- Invalid or unsafe policies.
- Tampered policy commitments.
- Transport failures.
- Injected mock observations.
- Missing transition evidence.
- Malformed upgrade transitions.
- Unsupported or mismatched CIS-8 and agent-authority data.
- Incorrect Registry and external-reference coordinates.
- Inconsistent agent and CIS-8 states.
- Block-hash substitution in the existing agent-authority adapter.

The test suite also demonstrates that a synthetic positive
snapshot must remain narrowly interpreted and that injected
mock data can fabricate a positive-looking observation.

These cases are valuable evidence of existing SDK behavior.

### 4.3 Limits of regression evidence

The 91 tests are not equivalent to a historical upgrade-provenance
verification engine.

Passing them does not establish:

- Independent blockchain consensus verification.
- Successful source-to-binary correspondence.
- Correct historical upgrade-rule enforcement.
- Complete historical deployment provenance.
- Independent governance approval.

Historical positive evidence was obtained separately in R3-A.

---

## 5. R3-C — Source/Build Assurance Assessment

### 5.1 Assurance framework

PP-R2-D1 defines three evidence and governance assurance tiers.

**Tier 1 — Observed binary**

The retrieved deployed binary is associated with its declared
module reference, historical context, byte length, extraction
procedure, and integrity commitment.

**Tier 2 — Reviewed implementation correspondence**

A specific source revision, toolchain, build configuration,
defensible binary correspondence, and relevant implementation
review are established.

**Tier 3 — Governance-approved implementation**

Sufficient Tier 2 evidence is combined with explicit,
independently controlled governance approval for an exact
Registry, network, module reference, temporal scope,
policy, and accepted residual risk.

These tiers are not SDK result statuses.

### 5.2 Binary retrieval methodology

The Concordium client supports:

`module show MODULE-REFERENCE --out - --block BLOCK-HASH`

The `--out -` option streams module bytes to standard output.

During R3-C, the binary output was passed directly to Python
for SHA-256 calculation.

The procedure:

1. Selected the exact historical module reference.
2. Pinned the query to the corresponding historical block.
3. Retrieved the module binary through the Testnet endpoint.
4. Read the binary stream without saving it to disk.
5. Counted the retrieved bytes.
6. Computed SHA-256 over the retrieved byte stream.
7. Compared the resulting hash with the module reference.
8. Verified successful CLI and hashing process exits.

The Python hashing process used binary standard-input mode
on Windows.

No module binary was written to the ProofPath repository.

### 5.3 Module B integrity evidence

**Historical block:**

`4e0fce12309d1ff1500e08a5ecae9353e238e9bb94aa6246f110f231c244892b`

**Module reference:**

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

**WASM version:** V1

**Retrieved byte length:** 159,842

**Computed SHA-256:**

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

**Integrity comparison:** Exact match.

**CLI read exit:** 0.

**Hash process exit:** 0.

**Tier 1:** Established.

### 5.4 Module C integrity evidence

**Historical block:**

`2b5c556c90c2a3effdd512c7e10c505bb93ef422900168d905d6b49eeadebaf7`

**Module reference:**

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

**WASM version:** V1

**Retrieved byte length:** 152,395

**Computed SHA-256:**

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

**Integrity comparison:** Exact match.

**CLI read exit:** 0.

**Hash process exit:** 0.

**Tier 1:** Established.

### 5.5 Source/build correspondence investigation

A bounded, read-only inventory covered:

- ProofPath source and documentation.
- Existing Registry assurance and historical-evidence references.
- Tracked source/build candidates.
- Existing local evidence locations.
- Concordium client module-inspection interfaces.
- Available source/build pointers within the accepted investigation
  scope.

The inventory did not identify:

- A specific Registry implementation source revision for Module B.
- A specific Registry implementation source revision for Module C.
- A reproducible build manifest or toolchain configuration for
  either deployed module.
- Source-to-binary correspondence evidence meeting Tier 2.
- A review of the deployed upgrade-authorization implementation.
- An independent governance approval record meeting Tier 3.

The absence of these items in the bounded assessment does not
prove that no such evidence exists elsewhere.

It means the required evidence was not established by R3.

### 5.6 R3-C disposition

| Evidence | Module B | Module C |
| --- | --- | --- |
| Historical module identity | Verified | Verified |
| Binary retrieval | Verified | Verified |
| Byte length | Verified | Verified |
| SHA-256 integrity | Verified | Verified |
| Identified source revision | Not established | Not established |
| Reproduced source build | Not established | Not established |
| Defensible alternative correspondence | Not established | Not established |
| Authorization implementation review | Not established | Not established |
| Independent governance approval | Not established | Not established |
| **Highest demonstrated tier** | **Tier 1** | **Tier 1** |

**R3-P09: SATISFIED WITH EXPLICIT LIMITATION.**

Tier 2 and Tier 3 are not established.

Under PP-R2-D1 Amendment C, this limitation does not prevent
technical closeout.

It prevents a positive implementation-trust conclusion.

---

## 6. R3-D — Adversarial Coverage Assessment

### 6.1 Assessment method

The adversarial matrix was reviewed against:

- Executed existing SDK tests.
- Reproduced historical Testnet evidence.
- Retrieved module integrity evidence.
- Accepted R2 evidence and assurance boundaries.

A distinction is maintained between:

1. Explicitly tested negative behavior.
2. Positive historical observations.
3. An untested historical substitution or contradiction.
4. Missing evidence.
5. Unsupported implementation or governance claims.

A missing test is not automatically a failed implementation.

A passing positive test is not evidence that every associated
negative scenario has been tested.

### 6.2 Adversarial matrix

| R2 adversarial case | R3 observation | Disposition |
| --- | --- | --- |
| Wrong genesis | Existing SDK negative tests reject mismatched genesis | Covered by existing tests |
| Wrong Registry | Existing SDK negative tests reject mismatched Registry coordinates | Covered by existing tests |
| Unfinalized block | Existing tests reject unfinalized snapshot claims | Covered by existing tests |
| Wrong module | Existing tests reject unapproved or unexpected modules | Covered by existing tests |
| Wrong transaction | No dedicated historical transaction-substitution test established | Gap recorded |
| Wrong sender | Historical positive equality reproduced; no dedicated historical sender-substitution test established | Gap recorded |
| Wrong administrator block | Correct pre-upgrade block tested; incorrect historical-block substitution not separately tested | Gap recorded |
| Inconsistent module transition | Existing malformed-transition checks; no dedicated contradictory historical transition reproduction | Partial coverage |
| Tampered binary or digest | Policy digest tampering tested; retrieved binary hashes verified; binary-tampering negative test not established | Partial coverage |
| Unapproved policy | Unsafe and unapproved policy/module conditions rejected by existing tests | Covered by existing tests |
| Missing source/build evidence | C5 limitation expressly recorded | Assessed |
| Unsupported CIS-8 or Agent Card claims | Existing agent-authority tests constrain relevant claims; no global downstream assurance promotion established | Bounded coverage |

### 6.3 Interpretation of gaps

The identified historical negative-case gaps do not invalidate
the positive observations reproduced during R3-A.

However, they prevent claiming that R3 exercised a complete
historical adversarial verification suite.

No new harness was created because R3 was authorized as
code-free-first and the remaining coverage limits can be
documented without representing them as satisfied tests.

Any future implementation work addressing these gaps would
require separate scope and authorization.

### 6.4 TypeScript verification

The final R3-D typecheck was executed using:

`npm.cmd run typecheck`

The package script invokes:

`tsc -p tsconfig.json --noEmit`

**Result:** PASS.

**Exit code:** 0.

The ProofPath working tree remained clean during the final check.

---

## 7. Positive Validation Matrix

| Gate | Required assessment | R3 finding |
| --- | --- | --- |
| R3-P01 | Correct Testnet genesis | PASS |
| R3-P02 | Correct Registry instance `12802/0` | PASS |
| R3-P03 | Module B at pre-upgrade block | PASS |
| R3-P04 | Correct October 6 transaction | PASS |
| R3-P05 | Successful upgrade effect | PASS |
| R3-P06 | Module C at post-upgrade block | PASS |
| R3-P07 | Historical `getAdmin` reproduced | PASS |
| R3-P08 | Administrator/sender equality reproduced | PASS |
| R3-P09 | Source/build assurance tier assessed | SATISFIED — Tier 1; Tier 2/3 not established |
| R3-P10 | Governance status and gaps recorded | SATISFIED — Governance status and gaps recorded; technical closeout accepted |

A PASS in R3-P01 through R3-P08 denotes a successful finding
within the specified evidence methodology.

It does not confer an implementation-trust or governance
approval status.

---

## 8. C1–C6 Assurance Disposition

### C1 — Network identity

**Finding:** Supported.

The expected Concordium Testnet genesis hash was observed through
the configured TLS-enabled node endpoint.

**Boundary:** Authenticated trusted-node observation, not
independent consensus verification.

### C2 — Registry snapshot

**Finding:** Supported for the investigated historical blocks.

Registry `12802/0` was inspected at the exact historical
pre-upgrade and post-upgrade block hashes.

The corresponding Module B and Module C references were reproduced.

**Boundary:** Historical point-in-time observations. This does
not prove continuous Registry trust across all blocks or eras.

### C3 — Upgrade provenance

**Finding:** Supported within the investigated transition.

The historical transaction was reported as finalized and
successful, and its recorded module transition matched the
historical Registry state observations.

**Boundary:** This does not establish exhaustive upgrade history
or independently verified implementation authorization.

### C4 — Administrator consistency

**Finding:** Supported within the investigated transition.

The historical `getAdmin` return value at the pre-upgrade block
matched the upgrade transaction sender.

**Boundary:** The comparison does not establish that the deployed
implementation correctly enforced authorization rules or that
administrator appointment was legitimate.

### C5 — Implementation integrity

**Finding:** NOT ESTABLISHED.

Tier 1 binary integrity was reproduced for Modules B and C.

No Tier 2 source/build correspondence or sufficient review
of the deployed authorization mechanism was established.

**Boundary:** Binary identity does not prove implementation
correctness.

### C6 — Independent governance approval

**Finding:** NOT ESTABLISHED.

No qualifying independent approval of Module C or the
Registry implementation has been granted.

**Boundary:** Technical evidence, policy digests, and matching
historical observations cannot substitute for a governance
decision.

### 8.1 Consolidated claim matrix

| Claim | R3 conclusion | Assurance boundary |
| --- | --- | --- |
| C1 — Network | Supported | Trusted-node identity observation |
| C2 — Registry snapshot | Supported | Exact historical block states |
| C3 — Upgrade provenance | Supported | Finalized transaction and transition report |
| C4 — Administrator consistency | Supported | Block-pinned historical return and sender equality |
| C5 — Implementation integrity | Not established | Tier 2 evidence absent |
| C6 — Governance approval | Not established | Independent approval absent |

C1–C4 remain independently assessable.

Their positive findings must not be promoted into C5 or C6.

---

## 9. R3 Acceptance Gates

### R3-G1 — Accepted R2 baseline preserved

**SATISFIED.**

PP-R2-D1 remained the governing specification.

No changes to the accepted R2 baseline were made during R3.

### R3-G2 — R1 historical evidence inventory reconciled

**SATISFIED WITH LIMITATION.**

The principal historical observations were reproduced through
new Testnet queries and integrity calculations.

Previously expected R1 evidence directories were not found
at the checked locations.

The absence of those directories is not proof that the original
R1 artifacts were lost or never preserved.

The distinction between original R1 material and newly reproduced
R3 observations must be retained.

### R3-G3 — Historical B → C transition assessed reproducibly

**SATISFIED.**

The historical block hashes, module references, and successful
upgrade transaction were reproduced.

### R3-G4 — Historical administrator/sender consistency assessed

**SATISFIED.**

The block-pinned historical administrator result matched the
recorded transaction sender.

### R3-G5 — Source/build assurance tier assessed

**SATISFIED WITH LIMITATION.**

Tier 1 was established for both investigated modules.

Tier 2/3 were not established.

### R3-G6 — Relevant adversarial behavior validated

**PARTIALLY SATISFIED — EXPLICIT GAPS RECORDED.**

The existing tests provide material negative-case coverage.

Dedicated historical transaction, sender, administrator-block,
transition-contradiction, and binary-tampering negative scenarios
were not all separately exercised.

No claim of complete historical adversarial coverage is made.

### R3-G7 — Applicable tests and regressions pass

**SATISFIED.**

All 91 relevant tests passed.

The final TypeScript typecheck passed.

### R3-G8 — C1–C6 outcomes and limitations documented

**SATISFIED.**

This document states each claim's supported finding,
limitations, and outstanding dependencies.

Formal project-owner acceptance was recorded on November 17, 2026.

### R3-G9 — Technical disposition accepted by project owner

**SATISFIED — ACCEPTED ON NOVEMBER 17, 2026.**

The project owner has authorized the R3 work and creation
of this closeout document.

The project owner subsequently and explicitly accepted the final
technical disposition on November 17, 2026.

G9 is satisfied. This acceptance does not approve Module C,
implementation integrity, or operational Registry trust.

---

## 10. Outstanding Risks and Dependencies

### D-01 — Source/build correspondence unresolved

No reviewed source revision and independently defensible
correspondence to the deployed Module B or C binary was established.

**Impact:** C5 remains unestablished.

### D-02 — Historical authorization-rule enforcement unresolved

The reported historical administrator matched the upgrade
transaction sender.

The deployed implementation's authorization logic was not
independently reviewed.

**Impact:** Administrative consistency cannot be promoted
into an enforcement-correctness claim.

### D-03 — Deployment history not exhaustively reconstructed

R1 recorded multiple historical module transitions.

R3 reproduced the October 6 B → C transition.

It did not independently reconstruct and verify every prior
Registry deployment or administrative event.

**Impact:** No uninterrupted historical trust claim.

### D-04 — Module C unapproved

Module C is the observed replacement module.

It has not achieved Tier 3 approval.

**Impact:** Module C remains outside newly approved
operational trust assumptions.

### D-05 — Historical adversarial coverage incomplete

Several substitution and contradiction cases remain
documented rather than independently exercised.

**Impact:** No claim of complete historical adversarial
test coverage.

### D-06 — Original R1 artifact locations unresolved

The original R1 evidence was not located in the specific
expected directories checked during R3.

**Impact:** The R3 reproduction records must remain
distinguishable from preserved original evidence.

No open-ended filesystem investigation is required
for this technical closeout.

---

## 11. R3 Stopping Rule Assessment

PP-R2-D1 permits R3 technical closure when:

1. Each required claim has an evidence-supported finding or
   an explicitly documented limitation.
2. The accepted validation scope is complete.
3. Missing evidence is not silently treated as positive assurance.
4. Technical completion is not confused with Registry governance
   approval.

R3-A through R3-D have produced the findings required to
evaluate those conditions.

The remaining gaps are expressly recorded.

The absence of Tier 2 or Tier 3 evidence does not require
an indefinite R3 investigation under Amendment C.

The technically supported outcome, subsequently accepted by the project owner, is:

**TECHNICAL VALIDATION COMPLETED — WITH EXPLICIT ASSURANCE LIMITATIONS**

The technical closeout was formally accepted by the project owner
on November 17, 2026.

It is not a claim that the Registry is approved for
production reliance.

---

## 12. R4 Governance Handoff

R4 must evaluate the R3 record under the accepted R2
governance framework.

The possible R4 dispositions remain:

1. APPROVED BOUNDED.
2. CONDITIONALLY ACCEPTED.
3. DEFERRED.
4. REJECTED.

No R4 disposition is predetermined by R3.

### 12.1 Mandatory handoff conditions

R4 must preserve the following:

- Network identity must be tied to the exact approved network.
- Registry coordinates must remain explicit.
- Approved module references, if any, must be exact.
- Applicable block or time scope must be stated.
- Tier 1 must not be represented as Tier 2 or Tier 3.
- Source/build and authorization-review limitations must remain visible.
- Policy content, digest, and approval authority must be explicit.
- Approval must be independently controlled.
- Accepted residual risks must be documented.
- Review, suspension, and revocation conditions must be defined.
- Technical verification results must not be represented as
  independent consensus or implementation assurance unless the
  corresponding methods were actually performed.

### 12.2 Current operational constraints

Until an authorized R4 decision changes the applicable governance
position:

**`TRUST-01 = OPEN`**

**`Module C = UNAPPROVED`**

**`C5 = NOT ESTABLISHED`**

**`C6 = NOT ESTABLISHED`**

**`PROVENANCE_NOT_APPROVAL_READY`**

No new trust-policy or module-allowlist approval is implied.

### 12.3 Deferred evidence

Any future attempt to establish Tier 2 or Tier 3 would require,
as applicable:

- Identified Registry implementation source revisions.
- Build inputs, configuration, and toolchain.
- Reproducible binary correspondence or independently accepted
  alternative methodology.
- Review of upgrade and administrator authorization logic.
- Independent approval of the exact implementation and reliance scope.

These are external dependencies for a future governance decision,
not unfinished mandatory R3 implementation tasks.

---

## 13. Repository and Execution Integrity

R3 was conducted against:

`275603170edf7ddc7a15d54a2422b216b8a19475`

The following were confirmed during the executed validation
command blocks:

- Branch: `main`.
- Expected baseline commit.
- No tracked repository modifications.
- No unauthorized source-code changes.
- No test-harness additions.
- No trust-policy changes.
- No module-allowlist changes.
- No blockchain write operations.
- No wallet signing or payment execution.
- No Registry deployment or upgrade.

The authorized closeout Markdown document was created only
after the R3 technical validation commands had completed.

Creation and eventual population of this document do not
constitute authorization to stage, commit, push, merge, or publish.

Those actions require separate approval.

---

## 14. Technical Disposition and Acceptance Record

### 14.1 Accepted technical disposition

**TECHNICAL VALIDATION COMPLETED — WITH EXPLICIT ASSURANCE LIMITATIONS**

Basis:

- R3-A historical reproduction succeeded.
- R3-B completed with 91/91 tests passing.
- R3-C established Tier 1 integrity for Modules B and C.
- Tier 2/3 evidence was not established.
- R3-D assessed the positive and adversarial matrices.
- Remaining gaps are explicitly documented.
- TypeScript typecheck passed.
- Repository integrity was preserved.

### 14.2 Required interpretation

Acceptance of this record means:

The project owner accepts that R3 has completed its bounded
technical investigation and accurately documented the
resulting evidence, conclusions, and limitations.

It would **not** mean:

- Approval of Module C.
- Approval of the deployed Registry authorization model.
- Tier 2 or Tier 3 assurance.
- Acceptance of a complete deployment-history proof.
- Independent consensus verification.
- Permission to modify production Registry trust policy.
- Permission to expand the Gateway allowlist.
- Authorization for deployment or publication.

### 14.3 Project-owner acceptance

**Decision:** ACCEPTED — Technical closeout only.

**Accepted disposition:** TECHNICAL VALIDATION COMPLETED — WITH EXPLICIT ASSURANCE LIMITATIONS.

**Acceptance date:** November 17, 2026.

**Accepted by:** Project owner, through explicit acceptance in the project conversation.

**R3-G9:** SATISFIED.

The acceptance includes the documented adversarial-coverage gaps,
unresolved implementation assurance, and outstanding governance
dependencies. It does not authorize Module C approval, policy
changes, deployment, or publication.

---

## 15. Final Conclusion

ProofPath R3 has reproduced the principal historical Concordium
Testnet Registry evidence and validated the existing relevant
SDK tests without introducing new production code or changing
operational trust assumptions.

The B → C module transition is historically consistent with
the reproduced finalized transaction and block-pinned Registry
observations.

The historical administrator result matches the upgrade
transaction sender.

The deployed Module B and Module C binaries have reproducible
integrity commitments.

These findings support bounded technical conclusions.

They do not establish that the implementation was independently
reviewed, correctly enforced upgrade authorization, or received
independent governance approval.

Accordingly, R3 technical closeout is accepted with explicit
assurance limitations and is ready for R4 governance handoff.

**Evidence tells a story. Assurance has boundaries.**

---

**End of PP-R3-CLOSEOUT-v1 — Technical Closeout Accepted November 17, 2026**
