
# ProofPath PP-02 — Identity, Seller Binding & Registry Trust

**Milestone:** M2 — PP-02 Identity & Seller Binding
**Implementation branch:** `feat/pp02-identity-seller-trust-v1`
**Document date:** 2026-11-03
**Status:** Implementation and deterministic tests validated; final repository acceptance pending
**Scope:** One ProofPath feature branch, one planned PR, nine-file ceiling

## 1. Purpose

PP-02 adds deterministic, fail-closed assessment of three
trust-related obligations for agent-mediated transactions:

- TRUST-01 — Registry and module trust.
- ID-01 — Agent ownership and human-owner assurance.
- SELLER-01 — Seller identity, wallet, endpoint, payment
  recipient and delivery binding.

PP-02 builds upon the PP-01 evidence, provenance and audit
foundation without modifying its frozen v1 schemas.

ProofPath remains platform-neutral. The Concordium x402
integration profile remains an optional reference normalizer.

## 2. Implementation boundaries

The PP-02 evaluators are offline, deterministic policy and
consistency evaluators.

They do not independently:

- Query or authenticate blockchain state.
- Verify Registry contract deployment or upgrade authority.
- Validate account-control signatures.
- Verify identity credentials, ZK proofs or presentations.
- Establish a verified natural-person identity.
- Prove control of an advertised HTTPS endpoint.
- Verify facilitator JWS receipts.
- Confirm PLT settlement or transaction finality.
- Verify seller delivery signatures.
- Execute payments or blockchain transactions.

Input evidence references, verification-origin labels,
verifier identifiers, issuer identifiers and finalized flags
remain caller-supplied claims.

An input's apparent completeness does not establish its
authenticity or truth.

The current evaluators never emit a positive `verified`
decision. They distinguish explicit inconsistency (`failed`)
from missing or externally unauthenticated evidence
(`indeterminate`).

Malformed top-level inputs may raise `TypeError`.

## 3. Frozen file scope

### New source files

- `src/pp02/types.ts`
- `src/pp02/registryTrust.ts`
- `src/pp02/ownerAssurance.ts`
- `src/pp02/sellerBinding.ts`

### New test files

- `tests/pp02-registry-trust.test.ts`
- `tests/pp02-owner-assurance.test.ts`
- `tests/pp02-seller-binding.test.ts`

### New documentation

- `docs/pp02-identity-seller-trust.md`

### Modified existing file

- `src/index.ts`

No changes are authorized to the frozen PP-01 schemas,
PP-01 implementation modules, Gateway, Facilitator,
Orchestrator or deployed Concordium contracts.

## 4. Shared data contract

`src/pp02/types.ts` defines:

- Gate identifiers and decision structures.
- Evidence references and asserted evidence origins.
- Finalized-block and Registry coordinates.
- Registry observations and module transitions.
- Trust policies and their evaluation inputs.
- Agent-owner, account-control and human-assurance inputs.
- Seller Registry, endpoint, commercial-terms, settlement
  and delivery evidence inputs.

The types are compile-time contracts, not runtime
authentication guarantees.

The shared decision vocabulary is based on the existing
PP-01 `VerificationStatus` type.

## 5. TRUST-01 — Registry trust

### Implementation

`evaluateRegistryTrust()` is provided by:

`src/pp02/registryTrust.ts`

The evaluator checks:

1. Required trust-policy settings.
2. Registry network and contract coordinates.
3. Module-reference format and policy allowlist.
4. Finalized-block field consistency.
5. Required evidence-reference structure.
6. Supplied historical module-transition structure.

An unapproved module, mismatched Registry coordinate,
invalid snapshot or malformed transition produces a
failure decision.

An absent observation remains indeterminate.

A structurally valid observation of an allowlisted module
remains indeterminate until independent Registry
authentication and policy authority are established.

The evaluator does not authenticate or reconstruct a
complete upgrade history, prove transaction inclusion,
or verify whether an upgrade sender was authorized.

### Observed Concordium evidence boundary

The prior read-only investigation of the deployed
Concordium Testnet Registry at contract `12802/0`
identified historical module changes.

The observed current module reference was:

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

The Gateway's previously pinned reference was:

`4195e865dc2e4d0da10fc4b2315efedc068b932d050c60f2947dbb5c886f33ac`

A historical upgrade transaction had a sender different
from the recorded contract owner.

That difference does not itself prove an unauthorized
upgrade. It requires assessment of the applicable
contract authorization mechanism and trust policy.

Neither module reference is automatically admitted as
trusted by ProofPath.

**TRUST-01 live conformance: OPEN.**

## 6. ID-01 — Agent owner and L2 human assurance

### Implementation

`evaluateOwnerAssurance()` is provided by:

`src/pp02/ownerAssurance.ts`

The evaluator distinguishes:

**L1 — Registered ownership**

The agent-to-owner account relationship must be grounded
in authenticated Registry state under an accepted
Registry trust policy.

**L2 — Verified human ownership**

L2 additionally requires:

- Authentic account-control evidence.
- Approved purpose and challenge binding.
- Trusted identity issuer and verifier.
- A verified identity presentation.
- A cryptographically established relationship between
  the identity subject and registered owner account.
- An approved assurance policy.

The current implementation checks the supplied records
for consistency but cannot independently establish
these cryptographic relationships.

Even a complete and internally consistent L2 evidence
package returns `indeterminate`, with established
assurance level `none`.

Account ownership alone is not verified human identity.

A valid buyer eligibility proof is not necessarily
cryptographically bound to the registered owner's
account.

A common challenge identifier or an account-binding
reference is not, by itself, proof of subject identity.

**ID-01 live L2 conformance: OPEN.**

## 7. SELLER-01 — Seller identity and binding

### Implementation

`evaluateSellerBinding()` is provided by:

`src/pp02/sellerBinding.ts`

The evaluator checks consistency among:

1. Seller agent, Registry coordinates and active state.
2. Registered seller receiving wallet.
3. x402 merchant `payTo`.
4. Seller service endpoint and agent attribution.
5. Endpoint authorization key reference.
6. Transaction-specific settlement recipient.
7. Finalized settlement snapshot fields.
8. Seller delivery attribution and signer key reference.

A seller wallet that differs from `payTo` fails.

A settlement recipient that differs from the required
transaction recipient fails.

Endpoint substitution and delivery transaction
substitution fail.

Under the current narrow policy, the delivery signer
key reference must match the endpoint authorization
key reference. Independently authenticated delegation
would require an explicitly reviewed extension.

The evaluator does not cryptographically verify any
of those supplied observations.

Agent Card content integrity does not alone prove
endpoint control.

Matching seller wallet, `payTo` and settlement
recipient strings does not establish real payment
settlement or authorization.

The prior evidence investigation did not establish a
separately registered seller with complete live
transaction and endpoint-control evidence.

**SELLER-01 live conformance: OPEN.**

## 8. Evidence and verification semantics

PP-02 deliberately separates:

- **Recorded observation:** Data supplied by a source.
- **Policy consistency:** Whether supplied values meet
  the local policy's structural and equality checks.
- **Independent authentication:** Whether a trusted
  mechanism proves source authenticity and authority.
- **Verified claim:** A claim supported by the required
  independent checks.

The current PP-02 APIs implement the first two layers
of assessment only.

Evidence origin labels such as
`independent_verification` are not themselves proof.

The `verified` value may exist in the shared status
vocabulary, but these three evaluators do not produce it.

Missing evidence should not be converted into success.

An `indeterminate` decision must never be interpreted
as authorization to release a resource or settle
a payment.

## 9. Public API

The PP-02 public API is exported from `src/index.ts`:

- `evaluateRegistryTrust`
- `evaluateOwnerAssurance`
- `evaluateSellerBinding`
- PP-02 TypeScript data contracts

The API does not introduce a network connection,
blockchain transaction or payment side effect.

PP-01 exports remain unchanged.

## 10. Deterministic acceptance tests

The initial PP-02 test suite comprises:

| Gate | Test file | Tests |
| --- | --- | ---: |
| TRUST-01 | `pp02-registry-trust.test.ts` | 16 |
| ID-01 | `pp02-owner-assurance.test.ts` | 24 |
| SELLER-01 | `pp02-seller-binding.test.ts` | 30 |
| **Total** | | **70** |

Acceptance coverage includes:

- Unsafe or inconsistent trust policy.
- Unapproved Registry module.
- Registry coordinate substitution.
- Invalid or unfinalized snapshot fields.
- Untrusted verification labels.
- Owner account substitution.
- Identity challenge and purpose mismatch.
- Untrusted identity issuer or verifier.
- Missing human-to-account binding.
- Seller wallet or `payTo` substitution.
- Endpoint substitution.
- Settlement transaction or recipient mismatch.
- Delivery transaction, agent or signer mismatch.
- Missing evidence and duplicate identifiers.
- Non-mutation of evaluator inputs.

All tests use synthetic, offline fixtures.

Passing these tests is not a live Concordium
conformance certificate.

## 11. Validation evidence

The M2.8 validation reported:

- Strict TypeScript typecheck: PASS.
- TypeScript build: PASS.
- PP-01 regression tests: 98/98 PASS.
- PP-02 deterministic tests: 70/70 PASS.
- Combined test suite: 168/168 PASS.
- Existing tracked-file change scope: `src/index.ts`.
- Eight approved new files: confirmed.
- No staging, commits or pushes.
- No blockchain transactions or payments.

These are implementation-validation results.

Final repository acceptance, commit and PR publication
are separate workflow steps.

## 12. Explicit non-goals

PP-02 does not:

- Modify x402 payment execution.
- Change Gateway resource-release conditions.
- Change a deployed Registry or its pinned module.
- Register new seller or buyer agents.
- Issue human identity credentials.
- Replace the existing identity/ZKP infrastructure.
- Implement an independent facilitator receipt verifier.
- Implement full Concordium settlement verification.
- Introduce a generalized delegation framework.
- Certify regulatory compliance.
- Claim production readiness.

Those capabilities require separate authorization
and implementation boundaries.

## 13. Remaining live conformance conditions

### TRUST-01

Establish authorized deployment and upgrade provenance,
historical Registry state, and an independently approved
module trust policy.

### ID-01

Establish authenticated owner-account control and
cryptographically verified human-subject binding
under an approved identity assurance policy.

### SELLER-01

Establish a distinct seller agent, authenticated
Registry ownership and wallet, independently
authenticated endpoint control, transaction-specific
`payTo` and finalized recipient consistency,
and seller-authorized delivery attestation.

### PP-03 boundary

Independent cryptographic verification of actual
payment receipts, transaction settlement and finality
remains outside PP-02 and must not be inferred from
these deterministic policy evaluators.

## 14. PP-02 acceptance decision

PP-02 software acceptance requires:

1. All nine approved files within scope.
2. No unapproved repository modifications.
3. Successful strict TypeScript typecheck.
4. Successful TypeScript build.
5. All PP-01 and PP-02 tests passing.
6. Public API exporting the approved evaluators.
7. Accurate documentation of verification limits.
8. Explicit preservation of unresolved live gates.

Passing those criteria permits an implementation-level
PP-02 acceptance decision.

It does not close TRUST-01, ID-01 L2 or SELLER-01
live conformance.

**Final principle:**

> Evidence recorded is not necessarily evidence
> authenticated, independently verified or proven true.
