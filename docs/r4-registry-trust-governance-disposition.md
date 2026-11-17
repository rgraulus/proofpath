
# ProofPath R4 — Registry Trust Governance Disposition

**Document ID:** PP-R4-GOV-DISPOSITION-v1  
**Status:** ACCEPTED — Final R4 Governance Disposition  
**Date:** 2026-11-17  
**Project:** ProofPath  
**Repository:** `rgraulus/proofpath`  
**Baseline commit:** `ff07c1e010f5307b3502fb48bfc5453ae35a160e`  
**Normative governance baseline:** `docs/registry-assurance-profile-v1.md`  
**Accepted technical evidence:** `docs/r3-technical-evidence-closeout.md`  
**Decision authority:** ProofPath project owner  
**Decision state:** FORMALLY ACCEPTED — November 17, 2026  

---

## 1. Executive Summary

ProofPath R4 evaluates the Registry trust claims established or left
unresolved by the accepted R3 technical evidence closeout.

R4 is the final governance disposition activity under the accepted
PP-R2-D1 Registry Assurance Profile v1.

It is not an extension of the R3 technical investigation, an
implementation-release activity, or an authorization to expand
runtime trust.

R3 established reproducible evidence concerning:

1. Concordium Testnet network identity.
2. Historical Registry module observations.
3. The specified Module B to Module C upgrade.
4. Historical administrator/sender consistency.
5. Tier 1 binary integrity for Modules B and C.
6. Outstanding implementation and governance assurance limitations.

The accepted R3 disposition was:

**TECHNICAL VALIDATION COMPLETED — WITH EXPLICIT ASSURANCE LIMITATIONS**

R3 was accepted by the project owner on November 17, 2026,
under R3-G9.

That technical acceptance did not approve Module C, establish
implementation-level Registry trust, or authorize runtime policy
changes.

### 1.1 Accepted R4 outcome

The accepted governance dispositions are:

| Claim | Accepted disposition |
| --- | --- |
| C1 — Network identity | CONDITIONALLY ACCEPTED |
| C2 — Historical Registry snapshot | CONDITIONALLY ACCEPTED |
| C3 — Historical upgrade provenance | CONDITIONALLY ACCEPTED |
| C4 — Historical administrator consistency | CONDITIONALLY ACCEPTED |
| C5 — Implementation integrity | DEFERRED / INDETERMINATE |
| C6 — Independent governance approval | DEFERRED / INDETERMINATE |
| TRUST-01 — Overall Registry trust | DEFERRED / INDETERMINATE |

These dispositions were explicitly accepted by the project owner
on November 17, 2026.

They are not approved policy content.

### 1.2 Central distinction

**Conditionally accepting a historical evidence claim does not
constitute approval of the deployed Registry implementation.**

The current evidence does not justify full implementation-level
or operational Registry trust.

Consequently, this accepted record preserves:

- `TRUST-01 = OPEN`
- `Module C = UNAPPROVED`
- `C5 = NOT ESTABLISHED`
- `C6 = NOT ESTABLISHED`
- `PROVENANCE_NOT_APPROVAL_READY`

These are the current governance and assurance boundaries,
not additional SDK statuses.

---

## 2. Governing Framework and Decision Authority

### 2.1 Normative baseline

This record applies the accepted:

**PP-R2-D1 Registry Assurance Profile v1**

Repository document:

`docs/registry-assurance-profile-v1.md`

The relevant provisions include:

- Section 4: Assurance Claim Taxonomy.
- Section 5: Historical Authorization and Temporal Scope.
- Section 6: Source/Build Assurance Tiers.
- Section 7: Governance and Trust-Root Approval.
- Section 8: Existing SDK Result and Assurance Boundaries.
- Section 10: R3 Minimal Technical Validation Contract.
- Section 11: Claim Coverage and Outstanding Dependencies.
- Section 12: R4 Final Registry Trust Disposition.
- Section 16: Formal Governance Decision Record.

R4 does not amend the R2 claim definitions, approval thresholds,
or accepted governance principles.

### 2.2 Accepted technical evidence

R4 relies on the accepted:

**PP-R3-CLOSEOUT-v1 — ProofPath R3 Technical Evidence Closeout**

Repository document:

`docs/r3-technical-evidence-closeout.md`

Accepted R3 Git commit:

`ff07c1e010f5307b3502fb48bfc5453ae35a160e`

Committed R3 document SHA-256:

`39dbee96deb61b641aa31a96fb8e956d10d69f2aa544418df713707626920877`

The R3 record was accepted with its documented limitations.
R4 must not silently strengthen those technical conclusions.

### 2.3 Governance authority

Under R2 Amendment A, the ProofPath project owner may approve
a bounded ProofPath trust policy based on independently reviewable
technical evidence.

Approval must be independently controlled relative to the
Registry observation, transaction presenter, and deployed
contract under assessment.

A project-owner decision is a ProofPath governance decision.

It is **not** certification by an independent external auditor.

The identity and role of technical evidence reviewers, review
methodology, and any material conflicts of interest must be
recorded when relevant to an actual approval.

Project-owner authority does not replace missing implementation
evidence or independently prove external evidence correctness.

### 2.4 Decision versus publication

The following are separate actions:

1. Creating a proposed governance record.
2. Explicitly accepting or revising the governance disposition.
3. Authorizing any operational trust-policy change.
4. Authorizing Git staging and committing.
5. Authorizing GitHub publication.
6. Authorizing deployment or other operational reliance.

Authorization for one action does not imply authorization
for any other action.

The present document has not received a final R4 governance
decision.

---

## 3. Permitted R4 Dispositions

The following disposition meanings are inherited from R2
Section 12.2.

### 3.1 APPROVED — BOUNDED

The required evidence and governance conditions are satisfied
for a precisely identified Registry trust claim.

Approval must state the exact claim and its permitted scope.

A bounded approval does not automatically extend to other
claims, modules, periods, applications, or trust roots.

### 3.2 CONDITIONALLY ACCEPTED

A narrower claim is supported, but broader implementation
or operational trust remains unapproved.

The supported scope and all unresolved dependencies must
remain explicit.

### 3.3 DEFERRED / INDETERMINATE

Evidence or governance requirements remain unresolved.

Deferral is a legitimate final governance disposition
for the present roadmap.

Deferral is not an assertion that the implementation is
incorrect or malicious.

### 3.4 REJECTED

Authenticated evidence contradicts a mandatory trust
requirement.

Missing evidence alone does not establish such a
contradiction.

### 3.5 SDK boundary

These four categories are **governance dispositions**.

They are not new values for SDK verification results.

No existing SDK result contract is amended by R4.

---

## 4. Registry Subject and Evidence Coordinates

### 4.1 Network

**Network:** Concordium Testnet

**Expected genesis hash:**

`4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796`

**Observation source:**

Concordium Testnet node accessed through the configured
TLS-enabled gRPC connection.

**Endpoint used in R3:**

`grpc.testnet.concordium.com:20000`

The observed genesis hash matched the expected Testnet
genesis hash.

This is an authenticated trusted-node observation under
the recorded transport assumptions.

It is not independent consensus verification.

### 4.2 Registry instance

**Registry contract:** CIS-8004

**Contract index:** `12802`

**Contract subindex:** `0`

**Registry coordinate:** `12802/0`

**Observed contract owner:**

`3dt3UMPzRASZndjmKpSWgCP2HhmoxZrgs8FDPtZjNHZzj13hhB`

The contract owner and historical administrator are
different recorded concepts.

Their distinction must be retained.

### 4.3 Historical Module B

**Module B reference:**

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

**Historical pre-upgrade block height:**

`49121730`

**Historical pre-upgrade block hash:**

`4e0fce12309d1ff1500e08a5ecae9353e238e9bb94aa6246f110f231c244892b`

The R3 investigation reproduced Module B as the installed
module at this specified historical block.

### 4.4 Historical Module C

**Module C reference:**

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

**Historical post-upgrade block height:**

`49121731`

**Historical post-upgrade block hash:**

`2b5c556c90c2a3effdd512c7e10c505bb93ef422900168d905d6b49eeadebaf7`

The R3 investigation reproduced Module C as the installed
module at this specified historical block.

This historical observation does not imply that Module C
is currently installed, authorized, or approved.

### 4.5 Historical upgrade transaction

**Transaction hash:**

`c40cd097d516162bb74a57cb16462596057f84c4b5e3ddbf9fe9c021d10f3cb1`

**Transaction sender:**

`3whdieGHx43KKRwQYbC5pAUdmWZ61B7yreNRU9i36MtdCvajR8`

**Entrypoint:**

`CIS-8004.upgrade`

**Reported migration:**

`None`

R3 reproduced a finalized, successful upgrade transaction
and the corresponding Module B to Module C transition.

### 4.6 Historical administrator

The historical pre-upgrade `getAdmin` call returned:

`Some(3whdieGHx43KKRwQYbC5pAUdmWZ61B7yreNRU9i36MtdCvajR8)`

The decoded administrator account matched the historical
upgrade transaction sender.

This supports administrative consistency.

It does not independently establish correctness of
authorization enforcement.

### 4.7 Temporal coverage

The supported Registry evidence concerns the specifically
identified pre-upgrade and post-upgrade blocks and the
associated upgrade transaction.

The record does not establish uninterrupted Registry
trust throughout earlier or later periods.

Other historical module transitions were not exhaustively
reconstructed by R3.

No prospective operational approval is inferred from
these historical observations.

---

## 5. Source/Build Assurance Assessment

### 5.1 Tier 1 — Observed binary

R3 independently retrieved the historical deployed Module B
and Module C binaries using block-pinned module references.

The observed module characteristics were:

| Module | Binary format | Length |
| --- | --- | ---: |
| B | WASM V1 | 159842 bytes |
| C | WASM V1 | 152395 bytes |

R3 reproduced integrity commitments corresponding to the
module references recorded in the evidence.

**Highest established tier for Modules B and C: Tier 1.**

Tier 1 supports binary identification and integrity
commitments within the documented observation context.

Tier 1 does not establish source correspondence,
authorization correctness, or governance approval.

### 5.2 Tier 2 — Reviewed implementation correspondence

**NOT ESTABLISHED.**

R3 did not identify a sufficiently supported combination of:

- Source revision corresponding to the deployed binary.
- Build inputs, configuration, and toolchain.
- Reproducible build or independently defensible
  alternative correspondence methodology.
- Review of relevant `getAdmin`, `transferAdmin`,
  upgrade authorization, and privileged execution logic.
- Documented reviewer findings linked to the actual
  deployed implementation.

Accordingly, a positive C5 conclusion is not supported.

### 5.3 Tier 3 — Governance-approved implementation

**NOT ESTABLISHED.**

R2 requires sufficient Tier 2 evidence and an independent,
explicit governance approval to establish Tier 3.

No qualifying Tier 3 approval for the investigated
Registry implementation or Module C is recorded.

A Tier 1 integrity match cannot be promoted to Tier 3
by a governance declaration alone.

### 5.4 Missing evidence is not evidence of compromise

The absence of sufficient Tier 2 and Tier 3 evidence
requires withholding positive approval.

It does not establish that Module B or Module C is
malicious, defective, or unauthorized.

No such conclusion is made here.

---

## 6. Accepted Claim-by-Claim Governance Disposition

All dispositions in this section were formally accepted
by the project owner on November 17, 2026.

### 6.1 C1 — Network identity

**Accepted disposition: CONDITIONALLY ACCEPTED**

**Supported claim:**

The reproduced historical evidence belongs to
Concordium Testnet under the declared trusted-node
and authenticated transport assumptions.

**Evidence:**

- Independently specified expected genesis hash.
- Node-reported matching genesis hash.
- Recorded Testnet connection context.
- Reproducible R3 observation.

**Limitations:**

- No independent consensus verification was performed.
- A trusted-node model is not equivalent to
  universal network-state authentication.
- No unrestricted reliance on arbitrary node endpoints.

**Permitted interpretation:**

Testnet identity was verified within the declared
R3 observation model.

**Not permitted:**

Claiming independently established consensus authenticity
or approval of a Registry implementation.

### 6.2 C2 — Registry module at finalized snapshot

**Accepted disposition: CONDITIONALLY ACCEPTED**

**Supported claim:**

Registry `12802/0` reported Module B and Module C at
the respective identified historical finalized blocks,
under the declared trusted-node assurance model.

**Evidence:**

- Exact Registry coordinates.
- Pre-upgrade and post-upgrade block hashes.
- Installed module references.
- Reported finality and historical state.
- Reproduced R3 observations.

**Limitations:**

- Point-in-time evidence only.
- No continuous historical trust conclusion.
- No current-state approval.
- No independent approval of Module C.
- No implementation-integrity conclusion.

**Permitted interpretation:**

The specified module references were observed at
the specified historical finalized blocks.

**Not permitted:**

Claiming an independently approved module policy
or operational Registry trust from this observation.

### 6.3 C3 — Historical upgrade provenance

**Accepted disposition: CONDITIONALLY ACCEPTED**

**Supported claim:**

The identified successful upgrade transaction corresponds
to the observed Module B to Module C transition.

**Evidence:**

- Historical pre-upgrade Module B observation.
- Historical post-upgrade Module C observation.
- Identified transaction hash.
- Reported finalized, successful execution.
- Upgrade effect and block ordering.
- Correct Registry coordinates.

**Limitations:**

- The review concerns the specified transition.
- Prior deployment history was not exhaustively verified.
- Sender authorization enforcement was not independently
  established.
- Transaction success does not itself prove governance legitimacy.

**Permitted interpretation:**

The specified transition has reproducible historical
transaction provenance.

**Not permitted:**

Claiming that all Registry upgrades were properly
authorized or continuously trusted.

### 6.4 C4 — Historical administrator consistency

**Accepted disposition: CONDITIONALLY ACCEPTED**

**Supported claim:**

The historical administrator returned by the pre-upgrade
implementation matched the sender of the identified
upgrade transaction.

**Evidence:**

- Pre-upgrade block-pinned `getAdmin` invocation.
- Decoded `Some` administrator return value.
- Independently retrieved upgrade transaction sender.
- Exact address equality.
- Successful upgrade context.

**Limitations:**

- No sufficient review of implementation authorization rules.
- Administrator equality does not prove correct enforcement.
- The historical legitimacy of administrator appointment
  was not independently established.

**Permitted interpretation:**

Historical administrative consistency is supported
for the investigated upgrade.

**Not permitted:**

Claiming that the implementation necessarily enforced
the intended administrator-only authorization rules.

### 6.5 C5 — Implementation integrity

**Accepted disposition: DEFERRED / INDETERMINATE**

**Supported evidence:**

Tier 1 binary integrity was reproduced for both
investigated modules.

**Unresolved requirements:**

- Reviewed source revision.
- Sufficient build correspondence.
- Authorization logic review.
- Evidence of implementation enforcement correctness.

**Governance conclusion:**

C5 is not established.

The evidence supports Tier 1 only and cannot justify
a positive implementation-integrity approval.

**Reconsideration dependency:**

Obtain and review sufficient Tier 2 implementation
evidence under R2 Section 6.

### 6.6 C6 — Independent governance approval

**Accepted disposition: DEFERRED / INDETERMINATE**

**Current evidence:**

There is no qualifying independent approval of the
investigated Registry implementation and Module C
at the required Tier 3 threshold.

**Unresolved requirements:**

- Sufficient Tier 2 evidence.
- Explicitly approved implementation.
- Approved authorization model.
- Exact scope and temporal boundaries.
- Independently controlled approval record.
- Policy identifier, version, digest, and
  review/suspension requirements.

**Governance conclusion:**

C6 is not established.

Accepting bounded historical findings does not
constitute C6 approval.

**Reconsideration dependency:**

Satisfy the accepted R2 Tier 3 and governance
approval requirements.

### 6.7 TRUST-01 — Overall Registry trust

**Accepted disposition: DEFERRED / INDETERMINATE**

The accepted R3 evidence supports bounded historical
observations but does not establish all requirements
for implementation-level Registry trust.

Positive C1–C4 findings cannot substitute for C5
or C6.

**Current status: `TRUST-01 = OPEN`.**

No full operational Registry trust approval is
recommended.

No runtime trust-policy or module-allowlist change
is authorized by this accepted disposition.

---

## 7. Consolidated Decision Matrix

| Claim | Technical evidence | Accepted R4 decision | Operational reliance |
| --- | --- | --- | --- |
| C1 | Supported | CONDITIONALLY ACCEPTED | Not authorized by R4 alone |
| C2 | Supported at specified historical blocks | CONDITIONALLY ACCEPTED | Not authorized by R4 alone |
| C3 | Supported for specified upgrade | CONDITIONALLY ACCEPTED | Not authorized by R4 alone |
| C4 | Supported for administrator/sender equality | CONDITIONALLY ACCEPTED | Not authorized by R4 alone |
| C5 | Tier 1 established; Tier 2 absent | DEFERRED / INDETERMINATE | Not approved |
| C6 | Qualifying Tier 3 approval absent | DEFERRED / INDETERMINATE | Not approved |
| TRUST-01 | Full trust evidence incomplete | DEFERRED / INDETERMINATE | Not approved |

**This matrix was formally accepted on November 17, 2026.**

The dispositions apply to separately defined claims.
They must not be interpreted as a composite
transaction-wide assurance determination.

---

## 8. Outstanding Dependencies and Residual Risks

The following dependencies are inherited from
the accepted R3 closeout.

### D-01 — Source/build correspondence unresolved

No sufficient reviewed source-to-binary correspondence
was established for the deployed modules.

**Impact:** C5 is not established.

**Disposition:** DEFERRED.

**Future trigger:** Qualifying Tier 2 evidence becomes
available for independent review.

### D-02 — Historical authorization enforcement unresolved

Historical administrator/sender equality was established.

Correct implementation enforcement of upgrade and
administrator rules was not independently established.

**Impact:** C4 cannot be promoted into C5.

**Disposition:** DEFERRED for enforcement correctness.

**Future trigger:** Relevant deployed authorization logic
and source/build correspondence are independently reviewed.

### D-03 — Deployment history not exhaustively reconstructed

R3 investigated the specified Module B to Module C
transition, not every historical Registry change.

**Impact:** No uninterrupted historical trust claim.

**Disposition:** Limitation retained.

**Future trigger:** A future claim requires and supports
a specifically bounded continuity assessment.

### D-04 — Module C unapproved

Module C was observed after the historical upgrade
but has not achieved Tier 3 approval.

**Impact:** Module C remains outside newly approved
operational Registry trust assumptions.

**Disposition:** UNAPPROVED.

**Future trigger:** Sufficient Tier 2 evidence and
separate qualifying Tier 3 approval.

### D-05 — Historical adversarial coverage incomplete

Certain historical substitution, contradiction,
and negative-path cases were documented rather
than independently executed.

**Impact:** No claim of complete adversarial coverage.

**Disposition:** Limitation retained.

**Future trigger:** A specific future approval claim
requires additional targeted adversarial evidence.

### D-06 — Original R1 artifact locations unresolved

Original R1 evidence was not located at the specific
directories checked during R3.

R3 reproduced the relevant observations independently.

**Impact:** Original evidence and reproduced evidence
must not be conflated.

**Disposition:** Provenance distinction retained.

**Future trigger:** Original evidence is recovered
and its integrity independently established.

### 8.1 Residual risk position

The accepted disposition records these limitations
as accurately documented conditions of the
current evidence record.

It does **not** accept them as sufficient for
operational implementation approval.

No requirement is waived merely to close the roadmap.

---

## 9. Permitted and Prohibited Claims

### 9.1 Permitted historical evidence statements

Subject to explicit acceptance of this governance
record, ProofPath may describe the R3 findings as:

- Concordium Testnet identity reproduced through the
  declared authenticated trusted-node observation model.
- Registry `12802/0` observed at the specified
  historical finalized blocks.
- Module B and Module C references reproduced at
  their respective historical block snapshots.
- The specified October 6 upgrade transaction
  reproduced as finalized and successful.
- The specified Module B to Module C transition
  shown consistent with the historical transaction.
- The historical pre-upgrade administrator shown
  equal to the upgrade transaction sender.
- Tier 1 binary integrity established for the
  two investigated module references.
- The technical investigation accepted with
  explicit assurance limitations.

Every claim must preserve the relevant observation
assumptions and temporal boundaries.

### 9.2 Permitted controlled-demonstration statements

A controlled technical demonstration may present
the bounded historical observations and describe
the applicable SDK verifier semantics.

It must distinguish:

- A trusted-node Registry snapshot verification.
- Historical upgrade provenance.
- Historical administrative consistency.
- Implementation-level authorization assurance.
- Independent governance approval.

The demonstration must not represent an observed
historical module as approved for unrestricted
operational reliance.

### 9.3 Prohibited or unsupported assurance claims

This record does not support statements that:

- Module C is approved for operational Registry trust.
- Registry `12802/0` has complete TRUST-01 approval.
- The deployed Registry implementation was independently
  reviewed and confirmed correct.
- Historical administrator equality proves authorization
  enforcement correctness.
- Every Registry upgrade was authorized.
- Registry trust was uninterrupted throughout history.
- A successful test or demonstration proves Tier 3 assurance.
- A matching policy digest authenticates its approval authority.
- The Registry has been independently audited or certified.
- A Registry result proves an agent's human identity.
- A Registry result proves seller authorization.
- CIS-8004 approval automatically covers CIS-8.
- A Registry result proves payment settlement,
  resource delivery, or end-to-end transaction assurance.

No such stronger assurance conclusion is authorized.

---

## 10. Runtime Policy and Operational Trust Restrictions

### 10.1 Existing runtime contract

The existing `TrustedRegistryPolicy` and
`verifyRegistrySnapshot()` interfaces remain unchanged.

R4 does not create new SDK statuses or modify
existing verification semantics.

### 10.2 No automatic policy approval

This accepted R4 disposition does not approve:

- A new Registry module allowlist.
- Module C as an approved operational module.
- A new trust-root configuration.
- A broader trusted observation source.
- A modified policy digest.
- A deployment or production rollout.
- Automatic migration of a module pin.

Any policy change requires separate, explicit
authorization and supporting governance evidence.

### 10.3 Policy identifiers and digest

R2 defines the policy commitment as:

`SHA256(UTF8("proofpath:registry-policy:v1") || 0x00 || canonicalJsonBytes(policy))`

This commitment binds policy bytes to an expected digest.

It does not independently authenticate the
policy approval authority.

**R4 operational policy decision: NO NEW POLICY APPROVED.**

**R4 approved policy ID/version/digest: NOT APPLICABLE.**

Any pre-existing runtime policy identifier, version,
or digest remains a separate runtime configuration
fact, not an R4 approval.

No approval digest is invented in this record.

### 10.4 Independent policy anchoring

Future operational reliance requires:

- Independently approved policy content.
- Independently anchored expected policy digest.
- Authenticated application-controlled transport.
- Runtime enforcement of all applicable governance
  restrictions.

Where runtime policy fields cannot directly express a
governance restriction, the integrating application
remains responsible for enforcing it.

A positive runtime verifier result does not override
a narrower governance decision.

### 10.5 No downstream approval inheritance

Any future Registry approval does not automatically
establish approval of:

- CIS-8 external-key Registry contracts.
- Agent Card authenticity.
- Endpoint control.
- Human identity.
- Agent action-specific authority.
- Seller commercial authorization.
- Payment settlement or delivery.
- Transaction-wide assurance.

Each requires its own evidence and policy conditions.

---

## 11. Governance Review, Suspension, and Reconsideration

### 11.1 Present effect

Because no new implementation-level trust policy
is approved, there is no newly authorized operational
Registry reliance to activate or suspend.

Any existing policies remain governed by their
previously applicable approvals and restrictions.

The accepted R4 record must not be interpreted
as expanding those approvals.

### 11.2 Review triggers

The following developments require reconsideration
before any stronger Registry trust claim:

1. A new or unexpected module reference.
2. A material change to the Registry or network.
3. A contradiction of historical evidence.
4. A change in trusted observation assumptions.
5. Recovery of meaningful source/build evidence.
6. A new relevant authorization finding.
7. A material security or governance finding.
8. Recovery of original R1 artifacts that changes
   the evidence interpretation.
9. A proposed operational policy or allowlist change.
10. Evidence supporting a previously deferred claim.

### 11.3 Suspension triggers for a future approval

Any future positive approval must define suspension
conditions including, as applicable:

- Scope violation.
- Module-reference mismatch.
- Policy-digest mismatch.
- Invalidated transport assumptions.
- Contradicted source/build correspondence.
- Invalidated authorization evidence.
- Expiry of approval.
- Relevant security findings.
- Governance decision withdrawal.

Suspension must not erase historical evidence
or retroactively rewrite earlier observations.

### 11.4 Future Tier 2 or Tier 3 consideration

A future implementation-level approval must
satisfy the relevant requirements of R2 Sections
6 and 7.

At minimum, this includes defensible source/build
correspondence and implementation authorization
review before Tier 3 approval is considered.

A future proposal must be separately scoped,
reviewed, and explicitly authorized.

R4 does not itself authorize that work.

---

## 12. R4 Acceptance Conditions and Stopping Rule

### 12.1 Required decision content

Before formal acceptance, the project owner must
confirm that this record accurately states:

1. The governing R2 baseline.
2. The accepted R3 technical findings.
3. The precise Registry and network subject.
4. The historical temporal scope.
5. The C1–C6 claim dispositions.
6. The TRUST-01 disposition.
7. The Tier 1 versus Tier 2/3 distinction.
8. The historical administrative-consistency limit.
9. The outstanding dependencies D-01 through D-06.
10. The permitted historical evidence statements.
11. The prohibited assurance claims.
12. The absence of a new operational policy approval.
13. The reconsideration and review triggers.
14. The distinction between owner approval and
    independent external certification.

### 12.2 Finite stopping rule

R4 may conclude with a documented deferred
implementation-level trust disposition.

A final R4 decision does not require:

- Exhaustive historical deployment reconstruction.
- A speculative source-code recovery effort.
- New SDK features.
- Modified runtime policy structures.
- Additional implementation PRs.
- A positive Module C approval.
- An unrestricted TRUST-01 result.

The objective is an accurate final governance
decision, not an artificially positive result.

### 12.3 Completion boundaries

R4 governance documentation is complete when:

- The decision record is reviewed.
- The project owner explicitly accepts or revises
  the accepted dispositions.
- The approved decision is recorded accurately.
- Any separately authorized repository publication
  is completed and verified.

Repository publication is an administrative step,
not evidence of implementation correctness.

---

## 13. Formal Project-Owner Decision Record

### 13.1 Accepted governance disposition

**ACCEPTED — BOUNDED GOVERNANCE DISPOSITION; NO IMPLEMENTATION APPROVAL**

The accepted final R4 disposition is:

**CONDITIONALLY ACCEPTED historical C1–C4 claims,
with C5, C6, and overall TRUST-01 DEFERRED.**

The project owner thereby acknowledges
the bounded historical evidence and its
documented limitations.

The project owner does **not** approve:

- The deployed Module C implementation.
- Implementation authorization correctness.
- Tier 2 or Tier 3 assurance.
- New operational Registry trust.
- Any new runtime policy or allowlist.
- Deployment or production reliance.

### 13.2 Decision authority

**Decision authority:** ProofPath project owner.

**Governance framework:** PP-R2-D1.

**Technical evidence record:** PP-R3-CLOSEOUT-v1.

**Technical review basis:** Recorded R3 validation
and its disclosed methodology and limitations.

**Independent external auditor certification:**
NOT CLAIMED.

**Material conflicts and independence limitations:**
No external independent audit or certification is
established by this record. Technical observations
and governance approval must remain independently
controlled as required by R2 Amendment A.

This section does not claim a technical review
or independence level beyond the R3 record.

### 13.3 Project-owner acceptance

**Decision:** FORMALLY ACCEPTED — Final R4 governance disposition.

**Accepted C1 disposition:** CONDITIONALLY ACCEPTED.

**Accepted C2 disposition:** CONDITIONALLY ACCEPTED.

**Accepted C3 disposition:** CONDITIONALLY ACCEPTED.

**Accepted C4 disposition:** CONDITIONALLY ACCEPTED.

**Accepted C5 disposition:** DEFERRED / INDETERMINATE.

**Accepted C6 disposition:** DEFERRED / INDETERMINATE.

**Accepted TRUST-01 disposition:** DEFERRED / INDETERMINATE.

**Accepted limitations:** All documented historical,
trusted-node, temporal, adversarial-coverage, source/build,
authorization-enforcement, and governance-assurance
limitations, including dependencies D-01 through D-06.

**Decision date:** November 17, 2026.

**Accepted by:** ProofPath project owner, through explicit
acceptance in the project conversation.

**Operational policy approval:** NONE — No new policy approved.

**Module C approval:** UNAPPROVED.

**Implementation assurance:** C5 NOT ESTABLISHED;
Tier 1 only for the investigated Module B and Module C binaries.

**Independent governance approval:** C6 NOT ESTABLISHED
for implementation-level or operational reliance.

**TRUST-01 status:** OPEN.

**Decision interpretation:** The project owner formally accepts
the bounded C1–C4 historical findings and defers C5, C6,
and overall TRUST-01. This does not establish Tier 2 or
Tier 3, authorize operational Registry trust, approve
Module C, modify a module allowlist, or permit deployment.

This governance decision is distinct from authorization
to stage, commit, push, or publish this document.

### 13.4 Decision interpretation

The accepted disposition is explicitly limited to
the documented
historical assurance claims and the deferral of
unestablished implementation and governance claims.

Acceptance will not automatically close TRUST-01
as an approved trust requirement.

The deferred disposition and `TRUST-01 = OPEN`
may coexist: one records the governance outcome,
while the other records the unresolved trust objective.

This distinction must remain explicit in
future project reporting.

---

## 14. Accepted R4 Final Conclusion

The accepted R3 investigation established reproducible,
bounded historical observations concerning Concordium
Testnet Registry `12802/0` and the specified Module B
to Module C transition.

It established historical administrator/sender
consistency and Tier 1 binary integrity.

It did not establish reviewed implementation
correspondence, independently verified authorization
enforcement, or qualifying Tier 3 governance approval.

The evidence therefore supports conditional acceptance
of the bounded C1–C4 historical claims and deferral
of C5, C6, and overall TRUST-01.

**Accepted final governance disposition:**

**HISTORICAL CLAIMS CONDITIONALLY ACCEPTED —
IMPLEMENTATION AND OPERATIONAL REGISTRY TRUST DEFERRED.**

This is the evidence-bounded governance disposition
formally accepted on November 17, 2026.

The standing restrictions remain:

- `TRUST-01 = OPEN`
- `Module C = UNAPPROVED`
- `C5 = NOT ESTABLISHED`
- `C6 = NOT ESTABLISHED`
- `PROVENANCE_NOT_APPROVAL_READY`

No operational trust-policy change is authorized.

**Evidence tells a story. Assurance has boundaries.**

---

**End of PP-R4-GOV-DISPOSITION-v1 — Governance Disposition Accepted November 17, 2026**
