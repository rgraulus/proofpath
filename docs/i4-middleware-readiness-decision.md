# I4-D1 — Middleware Readiness Architecture Decision Record

- **Decision ID:** I4-D1
- **Status:** Accepted — I4 closed
- **Decision date:** 2026-11-15
- **Repository:** `rgraulus/proofpath`
- **Evidence/code baseline:** `main` at `f851a85a417bcc81a5d186ed0d368ca6c23871cd`
- **Decision authority:** Project owner approval in the I4-D0 through I4-D1 review
- **Implementation decision:** **Conditional GO** for one controlled SDK-packaging effort
- **External publication / production deployment:** **Not authorized**

## 1. Decision summary

ProofPath will pursue **one embedded Node.js 22+ TypeScript/ESM SDK package** with explicitly supported subpath entry points as its first candidate middleware distribution model. The SDK will expose existing, bounded evidence-assurance capabilities; it will not execute payments, become a universal transaction verifier, or weaken trust and provenance boundaries.

I4 is **decision-complete and formally closed**. The next proposed milestone is I5, a controlled packaging and independent-consumer acceptance effort. This ADR approves its architectural basis and planning scope, **not unrestricted implementation, package publication, production support, or new verification claims**.

Guiding principle: **Evidence tells a story. Assurance has boundaries.**

## 2. Context and evidence baseline

The decision builds upon the implemented PP-01–PP-04-B architecture and independent I2/I3 interoperability validation:

| Component / checkpoint | Established result | Important limitation |
| --- | --- | --- |
| PP-01 | Versioned evidence and audit schemas, runtime validation, canonicalization, commitments, provenance assessment, audit journal, public/restricted exports | Hash/digest matching alone does not authenticate an origin or prove transaction truth |
| PP-02 | Registry trust, owner assurance and seller-binding consistency evaluators | Consistency assessments are not universal identity, source or endpoint authentication |
| PP-03 | Narrow Concordium Registry, facilitator JWS receipt, PLT settlement and agent/key verifiers; deterministic transaction composition | Trusted transport/policy assumptions; `proofpath.concordium.x402.v1` composition and `xcf_crp_plt_v1` settlement profile are not cross-chain |
| PP-04-B | Shared offline orchestrator, CLI/browser demonstration and disclosure-controlled exports | Synthetic fixture mode only; not live/Testnet integration or a production service |
| I2, merged PR #10 | Pure offline Base Mainnet x402 v2 challenge-evidence mapper with negative tests | Challenge parsing/binding only; no collection, source authentication or settlement |
| I3-A1/A2 | Independently captured live Fizzl unpaid HTTP 402 challenge mapped to `mapped_unverified` | Claimed source attribution; source and payment verification `not_evaluated` |
| I3-A3 | Four payment-binding, four HTTP/resource-context and six malformed/ambiguous-evidence adversarial cases passed (14/14) | Tests demonstrate bounded rejection behavior, not production certification |

The accepted I2 baseline recorded **388 passing automated tests** and passing typecheck; I4 was a read-only assessment and did not rerun the suite.

**I3 evidence retained outside the repository:** `~/Downloads/proofpath-i3-evidence/i3-a1-4yaSjOnm/`

| Evidence | SHA-256 |
| --- | --- |
| HTTP response headers | `640639bf8fef61cd06cdf8d7379da96fba07464e128f654a053881ea34a81caf` |
| HTTP response body | `661f6260f331cace4e7140c49bb744eb796bf8a382862e749b65a20a49fc0376` |
| Decoded PAYMENT-REQUIRED challenge | `bf63cf4fd8e6b9c93389b89682715fef17174a69476b9c37b9b59e9b68930504` |
| Mapped commercial-terms record | `26556fb1889e64918a53707588b32ca3968bf62b7260f1c9c6387c3561ec04d1` |

These digests preserve evidence consistency relative to the captured bytes; they do **not** independently authenticate Fizzl, payment, settlement, or delivery. No payment was executed and no Fizzl engagement is required for the accepted I3 scope.

## 3. Accepted architecture

**Distribution candidate:** one package, provisionally `@proofpath/core`, with four **proposed, not yet published** entry points:

| Entry point | Intended supported surface |
| --- | --- |
| `@proofpath/core` | PP-01 portable evidence contracts, validation, integrity, provenance, audit, exports |
| `@proofpath/core/x402` | Existing Base Mainnet x402 v2 challenge mapper and its types |
| `@proofpath/core/assessment` | Existing PP-02 trust/consistency evaluators |
| `@proofpath/core/concordium` | Existing specialized Concordium verification, transports, and composition profile |

Supported APIs will be explicitly enumerated, typed, versioned, and exported through documented package entry points. Internal helper modules, PP-04 synthetic fixture loaders, and demonstration scenario transformations are **not** supported SDK APIs.

The existing package is `private: true`, version `0.1.0`, uses Node.js `>=22`, ESM/NodeNext, and has a direct `@concordium/web-sdk` dependency. An explicit `exports` map and externally consumable package artifact are not yet established. Subpath isolation may prevent unwanted runtime imports but **does not by itself remove install-time dependencies**. I5 must inspect and test this honestly before making distribution claims.

The current TypeScript build includes both `src/**/*.ts` and `tests/**/*.ts` under `rootDir: "."`; I5 must ensure package contents exclude test output, unrelated files, and all restricted evidence while preserving the existing development/test workflow.

## 4. Non-negotiable trust boundaries

1. **Trusted expectations are independent.** The integrating application controls expected network, asset, amount, recipient, resource/request context, approved policies, keys and source/trust assumptions. Untrusted presented data cannot authorize itself.
2. **Integrity is not authentication.** A matching digest establishes byte/representation consistency against a supplied commitment, not independent source identity or historical truth.
3. **Narrow verification stays narrow.** A structurally mapped x402 challenge (`mapped_unverified`) does not establish a payment; an authenticated receipt does not establish settlement, seller control, delivery or transaction-wide assurance.
4. **Profile distinctions are preserved.** Concordium PLT finality logic cannot be reused as a Base settlement verifier; different x402 settlement models are not interchangeable merely because their fields resemble each other.
5. **No unsupported promotion.** Missing/indeterminate/not-evaluated claims remain explicit; critical conflicting bindings and unsupported claims fail closed.
6. **No implicit effects.** Generic evidence and challenge-mapping APIs must not independently execute payments, contact networks, persist restricted evidence, or deliver resources.
7. **The integrator owns governance.** Source collection/authentication, trust-root and policy approval, transport configuration, disclosure authorization, custody, retention, and deployment security remain independently governed by the host application unless an explicitly supported future capability says otherwise.

The SDK contract must distinguish parsing, integrity checking, source authentication, narrow claim verification, transaction composition and operational approval.

## 5. Alternatives and rationale

| Option | Disposition | Rationale |
| --- | --- | --- |
| **A. Embedded TypeScript SDK, single package with subpaths** | **Selected** | Smallest credible use of the validated core; integrator controls collection, policy and custody; low operational expansion |
| B. Independently published modular packages | Deferred | Potentially cleaner installation dependency isolation but premature package/version maintenance |
| C. Self-hosted or hosted assurance service | Deferred | Adds service auth, tenant isolation, evidence custody, retention, monitoring and operational security requirements beyond the validated baseline |

This selection does not imply that one SDK can verify every protocol, network, identity or transaction.

## 6. Minimum viable SDK contract (I4-A3)

**Inputs:** typed evidence/observation; independently governed expected transaction context; approved verifier/trust policy where needed; raw bytes/provenance when applicable.

**Outputs:** typed bounded result, stable rejection/diagnostic semantics, integrity commitments when supported, explicit claim/assurance status, and stated unverified/unsupported dimensions.

**Behavior:** deterministic given the same supported inputs and approved evaluation context; no silent field substitution; fail closed on unsupported profiles or conflicting critical bindings; no implicit payment execution, network access, unauthorized persistence or mutation of caller-owned evidence.

A supported API declaration is a contract to be verified by an **independent external consumer**; existence of an internal TypeScript export alone is insufficient.

## 7. Required I5 acceptance gates

| Gate | Acceptance criterion |
| --- | --- |
| SDK-01 | Pack only intended runtime/type/documentation artifacts, excluding secrets, restricted evidence and tests |
| SDK-02 | Install the packed SDK in a separate temporary Node.js project |
| SDK-03 | Import every approved ESM entry point without internal source-path access or unintended initialization |
| SDK-04 | Compile a strict external TypeScript consumer against generated declarations |
| SDK-05 | Reproduce the accepted I3 live challenge result through the supported public SDK API |
| SDK-06 | Reproduce binding, malformed-input and ambiguity rejections without assurance promotion |
| SDK-07 | Verify evidence commitments and preservation of claimed-only / not-evaluated provenance boundaries |
| SDK-08 | Confirm import isolation, dependency behavior, and absence of unintended runtime network/payment effects |
| SDK-09 | Pass full existing repository tests, typecheck and build with no regression |
| SDK-10 | Verify focused diff, clean worktree, and approved change scope |

The preserved live I3 artifact is a **restricted local acceptance input**; it must not be embedded in the published SDK tarball. I5 must establish an appropriate external consumer fixture/handling method.

## 8. I5 scope and change control

**Conditional GO:** prepare and, upon separate file-level implementation authorization, execute **one focused SDK-packaging PR**. Candidate work includes package metadata/exports, production build layout, explicit entry-point modules, independent consumer smoke/negative tests, and accurate developer-facing documentation.

**Excluded without a new decision:** changes to frozen PP-01 schemas, PP-01–PP-03 verification semantics, new blockchain/facilitator verifiers, generalized multi-network composition, production hosting, wallet/payment execution, authenticated evidence custody, regulatory/security certification and public npm publication.

Do not expand a failed packaging acceptance gate into an open-ended chain of implementation PRs. Investigate, document the blocker, and seek a new scope decision when material architectural change is required.

## 9. Final disposition and review triggers

- **I4-D0:** working assessment scope accepted.
- **I4-A1:** read-only repository inventory completed.
- **I4-A2:** embedded SDK option selected over premature modular/service alternatives.
- **I4-A3:** minimum viable SDK surface, test contract and implementation limits specified.
- **I4-D1:** **architecture GO; controlled implementation CONDITIONAL GO; publication/production NO-GO. I4 closed.**

Revisit this ADR only when an acceptance gate uncovers a material incompatibility, independently sourced evidence demands an additional verification profile, or the product's deployment/custody model materially changes.

This ADR is a governance record for I5; it is **not** an assertion that SDK-01 through SDK-10 have already passed or that external distribution is approved.

## 10. References

- [ProofPath Interoperability Architecture & Cross-Platform Evidence Assurance](interoperability-architecture.md)
- [ProofPath PP-04-B demonstration runbook](pp04-demo-runbook.md)
- [ProofPath repository README](../README.md)
- [I2 challenge mapper](../src/adapters/x402/challengeEvidence.ts)
- [PP-03 composition contract](../src/composition/types.ts)
- [Public API entry point](../src/index.ts)
- [Package metadata](../package.json)
