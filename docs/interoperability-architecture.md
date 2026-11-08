# ProofPath — Interoperability Architecture & Cross-Platform Evidence Assurance

- **Technical Paper v1.0 (initial release)**
- **Assessment date:** 2026-11-08
- **Repository baseline:** `rgraulus/proofpath`, `main`, merge commit `e731994f156583ffbcd2b29bce45d13741547170` (PP-04-B)
**Status:** Current architecture and proposed integration model are distinguished explicitly. No claim of validated external-partner integration.

## Executive summary

ProofPath's vision is to become an **open, reusable, platform-independent evidence and accountability infrastructure layer for agent commerce**. It aims to let independent applications exchange and evaluate transaction evidence across payment protocols, facilitators, blockchain networks, identity and authority frameworks, and commercial service providers without losing the meaning or provenance of their claims.

Interoperability must go beyond exchanging syntactically compatible data. A consumer must know **which claim was assessed, against which expected transaction, under whose approved policy, by which verifier, from which authenticated observations, and with what limitations**. Portability must not convert recorded statements into verified facts.

The merged PP-01 through PP-04-B software establishes platform-neutral evidence contracts and selected specialized verification capabilities, with an offline integrated demonstration. **Live cross-facilitator, cross-chain and production interoperability are objectives, not completed ProofPath capabilities.** This paper proposes a validation-first integration architecture, not a published interoperability specification.

**Guiding principle:** *Evidence tells a story. Assurance has boundaries.*

## 1. Purpose and strategic design principles

This paper is for ecosystem integrators, independent payment facilitators, blockchain/identity infrastructure teams, assurance engineers and prospective contributors. It builds on ProofPath's public README and the separately agreed product strategy.

1. **Platform independence.** Keep generic evidence representation, provenance and export logic separate from protocol-specific adapters and verification policies.
2. **Verifiable interoperability.** Treat source authenticity, evidence integrity, policy authority and claim verification as distinct preconditions.
3. **Open ecosystem collaboration.** Validate with independent implementations; document genuine differences before building universal abstractions.
4. **Assurance-boundary preservation.** An imported `verified` result is never automatically sufficient for transaction-wide assurance.
5. **Minimal reusable middleware.** Add the smallest stable interfaces supported by demonstrated use cases; avoid speculative multi-chain coverage claims.
6. **Privacy and disclosure by design.** Evidence-sharing agreements must support minimization and controlled access, not indiscriminate data export.

## 2. Interoperability domains

| Domain | Potential evidence | Key verification question | Present ProofPath status |
| --- | --- | --- | --- |
| Payment protocol and facilitator | Negotiated payment requirements, challenge, signed receipt, proof key | Is this authentic receipt bound to the expected transaction and authorized signer? | Narrow Concordium/x402 facilitator-receipt verifier implemented; no generic facilitator adapter |
| Blockchain/settlement | Transfer event, block, finalized status, recipient, asset, amount | Does a trusted independently approved observation support the *exact* settlement claim? | Narrow Concordium PLT trusted-node verifier implemented; no generic cross-chain verifier |
| Agent identity and authority | Registry coordinate, registered key, delegation, Agent Card | Does authenticated registry evidence support the specific claimed authority at the relevant time? | Narrow Concordium agent/key authority verifier; no universal delegation/identity layer |
| Seller and delivery | Endpoint, seller account/wallet, delivery acknowledgment | Are seller and delivery claims actually authenticated and correctly bound? | PP-02 consistency evaluation; authentication gaps remain |
| Policy and privacy | Eligibility decision, credential/proof, policy identifier | Was a valid policy applied by an authorized verifier to the intended subject/context? | Evidence model accommodates claims; no generic live VC/ZKP verifier in PP-04-B |
| Cross-system audit | Event journal, evidence manifest, assurance result, export | Can a consumer reconstruct bounded claims with verifiable integrity and provenance? | PP-01 audit/export and PP-03 composition implemented under documented limits |

No row implies that all evidence types are presently ingested from external live systems.

## 3. Implemented architecture (PP-01 to PP-04-B)

### PP-01 — Platform-neutral evidence foundation

`src/core/types.ts`, `src/core/validate.ts`, `src/core/canonical.ts`, `src/core/hash.ts`, `src/core/provenance.ts`, `src/core/audit.ts` and `src/core/export.ts` implement the current representation, validation, hashing, logical journal and disclosure/export foundations. Evidence Manifest v1 and Audit Event v1 schemas reside in `schemas/`.

- Type declarations are not sufficient runtime validation; the trusted application selects and pins approved schemas.
- Matching artifact bytes or export digests establishes representation consistency, **not evidence source authenticity**.
- Provenance attribution in PP-01 may be a claimed producer/collector identity.
- Journal verification requires independently trusted expected head and count; it does not provide permanent storage, authentic timestamps or universal event coverage.
- Public export is a deliberately minimized representation, not a complete externally verified manifest; restricted export retains more context and requires separately enforced disclosure governance.

### PP-02 — Seller-binding consistency

`src/pp02/sellerBinding.ts` checks consistency across seller registry, endpoint, wallet, commercial `payTo`, settlement recipient and delivery evidence. It does **not** itself authenticate source records or establish delivery truth.

### PP-03 — Narrow specialized verification and composition

- `src/verification/facilitatorReceipt.ts`: Ed25519 compact-JWS receipt verification, authorized-key policy and expected contract/challenge/payment binding for the supported Concordium/x402 profile.
- `src/verification/settlementFinality.ts`: trusted-node observation of a finalized successful Concordium transaction with an expected PLT transfer; consensus and transport are not independently authenticated by this module.
- `src/verification/agentAuthority.ts`: Concordium Registry/key authority assessment against trusted expectations and observation context; no general proof of legal personhood or unconstrained delegation.
- `src/composition/transactionEvidence.ts`: deterministic fail-closed composition and conflict/unsupported-claim detection. The current composition profile is Concordium/x402-specific (`proofpath.concordium.x402.v1`).

A platform-neutral **evidence core** is not the same as a platform-neutral **implementation of every verifier**. Protocol- and network-specific verification must remain explicit.

### PP-04-B — Shared offline demonstration

`src/application/pp04/orchestrator.ts` combines the existing verifiers, seller evaluator and composer; `src/application/pp04/trustedConfig.ts` pins schemas; `src/application/pp04/export.ts` wraps portable exports. The CLI and localhost viewer share this orchestrator. `testnet` mode is rejected in PP-04-B. All four approved synthetic scenarios return transaction-verified `false`; no full transaction assurance is established.

| Scenario | Composition | Manifest | Key lesson |
| --- | --- | --- | --- |
| F01 consistent source evidence | `incomplete` | Present | Seller/delivery assurance remains unestablished |
| F02 missing settlement result at composition | `incomplete` | Present | Absence must not be inferred away |
| F03 binding conflict | `rejected` | Absent | Cross-source transaction binding must agree |
| F04 unsupported assurance | `rejected` | Absent | Unapproved assurance promotion fails closed |

## 4. Proposed interoperability architecture (not yet implemented)

The following is a **candidate design**, subject to independent integration trials:

```text
 Independent payment, chain, identity and service systems
                         |
            Authenticated collection adapters
                         |
     Source envelopes and evidence/artifact references
                         |
          Trusted policy and context assembly
                         |
      Protocol-/network-specific claim verifiers
                         |
         Bounded source assessment envelopes
                         |
       PP-03 composition / declared trust profile
                         |
        PP-01 validated manifest and audit journal
                         |
       Public/restricted portable evidence exports
                         |
  Consuming agents, operators, auditors and applications
```

Adapters would be responsible for source authentication and normalized representation **without asserting claim truth**. Verifiers would remain responsible for narrow, explicitly named assertions. A trusted host application would assemble policy, expected transaction context and authorized transports separately from untrusted source data. Composers would apply profile-specific compatibility and assurance rules.

This diagram shows intended integration boundaries, not present modules or stable published APIs. No generic `adapter` API, registry of network verifiers or cross-chain composer is claimed to exist today.

## 5. Candidate interoperability contract

The following information may be necessary for reliable evidence exchange. It is a **design checklist**, not an implemented new schema:

| Contract element | Purpose / rule |
| --- | --- |
| Versioned profile and schema | Identify what evidence and verification semantics a producer claims to use; consumer pins supported versions |
| Transaction identity and correlation | Bind all observations to independently approved transaction expectations |
| Claim kind and subject | Identify exactly what was evaluated, not a vague `payment_valid=true` |
| Original artifact and digest | Verify byte consistency without pretending a hash authenticates the origin |
| Source producer/collector and collection mechanism | Separate claimed attribution from authenticated identity |
| Source event time vs observation time | Preserve clock provenance and unknown timestamps |
| Method / verifier version | Explain how an assessment was computed |
| Trusted policy reference and approval | Identify the policy and demonstrate independently controlled authority for its use |
| Proof/observation and failure diagnostics | Permit independent re-evaluation where feasible; distinguish missing from invalid inputs |
| Verification status and assurance scope | Preserve `verified`, `failed`, `indeterminate`, `not_evaluated` and `not_applicable` where appropriate |
| Freshness, replay and network identity | Prevent proof reuse or cross-environment confusion under the relevant method |
| Disclosure class and retention reference | Avoid uncontrolled sharing of restricted evidence |
| Export commitment and verification notice | Make portable representation verifiable while stating its limits |

Ingestion of a foreign verifier result alone must **not** create an authenticated ProofPath claim. The integration must establish trust in the verifier, its policy, input evidence and claim semantics, or re-run an appropriate supported verifier.

## 6. Verification assurance invariants

These conditions should hold across all future profiles:

1. **Exact binding:** network, asset, amount, payee, relevant challenge and resource/contract expectations must not be silently translated or weakened.
2. **Policy independence:** trusted expectations and approved keys must not be taken at face value from the evidence presenter.
3. **No unsupported promotion:** `verified` for a receipt must not imply settlement, seller identity, authorized delivery or full transaction verification.
4. **Explicit incompleteness:** missing evidence is represented as missing/indeterminate/incomplete, not guessed as success.
5. **Fail-closed conflicts:** contradictory critical bindings reject composition under the selected profile.
6. **Source preservation:** reclassification or simulated adversarial inputs must not overwrite original verifier assessments.
7. **Digest humility:** valid hashes attest to checked representation consistency, not necessarily true origins or events.
8. **Retention and privacy boundaries:** portable exports must obey independent governance, access controls and legal restrictions.
9. **No universal verifier assumption:** chain-finality, JWS, registry authority, delivery and eligibility require different approved assurance methods.

## 7. Cross-platform validation program (proposed)

Before asserting compatibility for an external implementation, a bounded test should:

1. Agree on a narrow scenario, a named independent source system and the intended claim to verify.
2. Document actual artifact formats, trust roots, network and transaction semantics, redaction and handling arrangements.
3. Define **approved** expected transaction fields and verification policy outside the presented evidence.
4. Acquire representative, appropriately authorized evidence and verify its source integrity and origin as applicable.
5. Map source fields into existing ProofPath contracts *without altering their meaning*; log unmappable/unsupported claims.
6. Execute the relevant verifier or identify the exact additional narrow verifier required.
7. Run composition with honest absent/conflicting/unsupported evidence cases.
8. Validate public/restricted export and digest behavior under defined operator disclosure controls.
9. Publish a reproducible conformance report: schema/profile versions, source/test boundaries, passed and failed cases, trust assumptions and unsupported areas.
10. Claim only the demonstrated interoperability level; do not infer production status from fixture or local test success.

### Suggested maturity vocabulary

| Status | Evidence required |
| --- | --- |
| Design exploration | Scenario and potential evidence mapping documented |
| Adapter prototype | Deterministic parsing/normalization and negative tests, no independent authenticity claim |
| Controlled integration | Named external system and bounded end-to-end acceptance under declared conditions |
| Independently validated interoperability | Reproducible tests of source trust, claim semantics and negative conditions with published acceptance boundaries |
| Production supported | Operational security, key/policy governance, monitoring, custody, retention and support commitments independently accepted |

These are **proposed internal communication categories**, not certifications or an automatic partner classification.

## 8. Open middleware direction

The long-term architecture should favor modular integration points and reusable evidence contracts. Potential building blocks include source collectors, format translators, trust-policy registration, narrowly scoped verifier plugins, composition profiles, export/custody services and audit tooling.

They should be introduced only after empirical interoperability requirements justify them. In particular, multi-chain adapters cannot reuse Concordium-specific settlement assumptions without a new chain-specific finality and trust analysis; payment-protocol support cannot be declared just because payload fields can be mapped.

A first external integration should be chosen for its ability to test **independent producer/consumer evidence interoperability**, not for how many networks or protocols it appears to cover.

## 9. Ecosystem collaboration and public claims

ProofPath encourages collaboration with independent payment facilitators, x402 implementers, blockchain ecosystems, identity providers, agent framework developers and researchers. Public partner listings may name a partner and publicly described capabilities, **subject to approval for public recognition**.

This architecture paper intentionally does **not** describe, imply or prejudge the scope, status, deliverables or validation outcomes of any specific bilateral collaboration. Partner listings alone do not establish an implemented integration, endorsement, interoperability certification or production support.

## 10. Current limitations and future decision gates

**Implemented:** foundational event/evidence contracts; narrow Concordium-oriented verifiers; seller-binding consistency; bounded composition; public/restricted exports; one shared synthetic CLI/browser demonstrator; automated regression coverage.

**Not demonstrated in PP-04-B:** live/Testnet end-to-end evidence ingestion; production-authenticated trust and collection; independent consensus; generalized payment/chain/identity adapters; production records custody; real-world partner validation; production-grade identity and access management.

**Decision gates before coding:** choose one independently operated use case; identify its source artifacts and verifiable claim; explicitly approve trust roots and exclusions; define reproducible positive/negative tests; scope the smallest integration component; publish outcomes and boundaries before broadening claims. Avoid a speculative sequence of adapter PRs.

## 11. References and document lineage

- [`../README.md`](../README.md) — public mission, current capabilities, limitations and ecosystem overview.
- [`../demo/pp04/README.md`](../demo/pp04/README.md) — runnable integrated synthetic demonstration.
- [`pp04-demo-runbook.md`](pp04-demo-runbook.md) — acceptance scenarios and operator guidance.
- [`article12-mapping.md`](article12-mapping.md) — historical EU AI Act/recordkeeping mapping.
- `schemas/proofpath-evidence-v1.schema.json` and `schemas/proofpath-audit-event-v1.schema.json` — approved foundational data models.
- [`https://github.com/rgraulus/proofpath`](https://github.com/rgraulus/proofpath) — source repository.

**Maintenance rule:** any new supported evidence source, verifier, composition profile or disclosure mechanism should be accompanied by an explicit claim/assurance contract, regression tests, documentation and a versioned revision of this paper.

**Vision:** *Agent commerce should not only work across platforms — its evidence and assurances should travel across them too.*
