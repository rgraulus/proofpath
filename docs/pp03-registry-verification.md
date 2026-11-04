# ProofPath PP-03 M3.1 — Trusted-Node Registry Snapshot Verification

**Status:** Engineering-accepted for PR review; Registry provenance approval pending
**Milestone:** PP-03 M3.1
**Assurance model:** `trusted_node_finalized_snapshot_v1`
**Claim:** `registry_module_at_finalized_snapshot`
**Gate:** `TRUST-01`
**Registry provenance disposition:** `PROVENANCE_NOT_APPROVAL_READY`

## 1. Purpose

PP-03 M3.1 implements a narrowly scoped verification capability for a
Registry contract's module reference at an identified finalized blockchain
snapshot.

The implementation provides:

- A platform-neutral Registry verification interface.
- Deterministic, domain-separated trust-policy commitments.
- Verification of a Registry observation against independently anchored
  policy content.
- A Concordium read-only gRPC adapter.
- Structured `verified`, `failed`, and `indeterminate` results.
- Deterministic and adversarial regression tests.
- A public API exposed through the ProofPath package entry point.

M3.1 does not introduce payments, transaction submission, signing,
contract mutation, or changes to existing XCF services.

## 2. Assurance Boundary

The assurance model is:

`trusted_node_finalized_snapshot_v1`

Under this model, ProofPath relies upon an authenticated connection
to an application-approved Concordium node.

A successful verification establishes only that the trusted node
reported a finalized Registry snapshot whose module reference matched
the independently approved policy.

It does not establish:

- Independent verification of Concordium consensus.
- Historical contract deployment or upgrade authorization.
- Authenticity or approval of a module merely because it is deployed.
- Complete historical Registry integrity.
- Agent identity or human identity.
- Ownership or control of an agent wallet.
- Seller authorization.
- Payment settlement or resource delivery.
- Global TRUST-01 conformance.

Both result fields remain false:

- `consensusIndependentlyVerified`
- `historicalUpgradeAuthorityVerified`

An M3.1 result must not be interpreted as overriding the existing
PP-02 TRUST-01 evaluator's assurance limitations.

## 3. Implementation Components

### 3.1 Platform-Neutral Types

File: `src/verification/types.ts`

Defines:

- `RegistryVerificationStatus`
- `RegistryAssuranceModel`
- `RegistryCoordinate`
- `TrustedRegistryPolicy`
- `FinalizedRegistrySnapshot`
- `RegistrySnapshotTransport`
- `RegistryVerificationContext`
- `RegistryVerificationResult`

Registry contract indexes and subindexes use decimal strings,
avoiding JavaScript safe-integer precision limitations.

The transport interface supports deterministic tests, but transport
injection by itself does not establish authenticity.

### 3.2 Registry Verification Core

File: `src/verification/registrySnapshot.ts`

Public functions:

- `digestRegistryPolicy`
- `verifyRegistrySnapshot`

The policy digest uses SHA-256 over:

`UTF8("proofpath:registry-policy:v1") || 0x00 || canonicalJsonBytes(policy)`

The canonical JSON encoding and SHA-256 implementation reuse
existing PP-01 primitives.

The digest establishes integrity relative to a reference commitment.
It does not authenticate the authority that approved the policy.

Production application composition must supply the approved policy
and an independently anchored expected digest.

The verifier checks:

1. Policy structure and safety constraints.
2. Expected policy digest.
3. Valid verification clock.
4. Transport availability.
5. Observation structure.
6. Registry coordinates.
7. Network genesis hash.
8. Configured node endpoint.
9. Finality assertion.
10. Block and observation freshness.
11. Module-reference membership in the approved policy.

The policy must not be derived from the Registry observation.

### 3.3 Concordium Read-Only Adapter

File: `src/adapters/concordium/registrySnapshot.ts`

Public interfaces:

- `ConcordiumRegistrySnapshotTransport`
- `createConcordiumRegistrySnapshotTransport`
- `ConcordiumRegistryTransportOptions`

Dependency:

`@concordium/web-sdk@12.0.2`

The adapter:

1. Constructs a TLS-enabled Concordium gRPC client.
2. Obtains consensus status from the configured node.
3. Captures the node-reported latest finalized block.
4. Reads block information at that block.
5. Checks the reported finalized status and block identity.
6. Reads the Registry contract instance at the same block.
7. Extracts its module reference.
8. Returns a normalized, timestamped observation.

The adapter performs no transaction submission, signing, contract
update, payment or persistent state mutation.

TLS authenticates the configured network endpoint subject to the
runtime's certificate validation and trust configuration.

The adapter relies upon the node's reporting of consensus and
finality. It does not independently validate consensus proofs.

The transport timeout rejects an overdue operation but does not
guarantee cancellation of the underlying gRPC call.

### 3.4 Public API

File: `src/index.ts`

M3.1 exports the verification types, policy digest function,
verification function, Concordium transport class and transport factory.

Existing PP-01 and PP-02 exports remain unchanged.

## 4. Trust Policy Requirements

A production policy contains:

- Policy identifier.
- Policy version.
- Registry network and contract coordinates.
- Expected network genesis hash.
- Explicitly approved module references.
- Trusted HTTPS node endpoint.
- Maximum snapshot age in seconds.
- Mandatory finalized-block requirement.

The policy digest must be approved and anchored independently
of the blockchain observation.

The following are insufficient to establish policy authority:

- A digest calculated by the same untrusted caller supplying the policy.
- A module reference returned by a Registry node.
- A value copied from an Evidence Manifest.
- An arbitrary mock or injected transport.
- Successful SDK connectivity alone.

Changes to approved modules require a deliberate, independently reviewed
policy update. No automatic module pin migration is permitted.

The verifier's transport is injectable for platform neutrality and
testability. Consequently, the production application's trusted
composition boundary is a mandatory security assumption.

A caller controlling the policy, its expected digest, and the transport can fabricate a synthetic positive verification result. The low-level API does not independently establish policy authority or transport authenticity. Production integrations must independently anchor policy approval and control the authenticated node transport. A caller-self-anchored result must not be treated as independent Registry trust approval.

A caller that controls the policy, its expected digest, and the
transport can construct a synthetic positive verification result.
Therefore, `verified` is conditional on an independently established
policy authority and an authenticated, application-controlled node
transport. The low-level API does not independently enforce these
composition requirements. Consumers must not interpret a caller-
self-anchored result as independent Registry trust approval.

## 5. Result Semantics

### 5.1 Verified

`status = "verified"`

Reason:

`trusted_node_registry_snapshot_approved`

Meaning:

The supplied trusted application configuration and authenticated
transport are assumed valid, and the node-reported finalized Registry
module matched the independently anchored approved policy.

This result is restricted to the identified snapshot.

A synthetic test can also generate this result using an injected mock.
Such a test does not establish authenticated live assurance.

### 5.2 Failed

`status = "failed"`

Used for contradictions in a structurally valid node observation,
including:

- Registry coordinate mismatch.
- Genesis hash mismatch.
- Configured node endpoint mismatch.
- Snapshot reported as not finalized.
- Module not approved by policy.

A failed result does not by itself establish malicious activity.

### 5.3 Indeterminate

`status = "indeterminate"`

Used when the required assurance cannot be established, including:

- Invalid policy.
- Missing or mismatched trusted policy digest.
- Invalid verification clock.
- Unavailable transport.
- Invalid observation.
- Stale or future-dated snapshot.

Indeterminate must not be promoted to verified by downstream systems.

## 6. Concordium Testnet Observation

A read-only live observation was performed on November 4, 2026.

Registry:

`concordium:testnet / 12802 / 0`

Configured endpoint:

`https://grpc.testnet.concordium.com:20000/`

Node-reported finalized block height:

`50360249`

Node-reported block timestamp:

`2026-11-04T07:54:48.765Z`

Node-reported genesis hash:

`4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796`

Observed Registry module reference:

`142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6`

The real Concordium SDK adapter successfully retrieved the
node-reported finalized Registry snapshot.

This was an observation-only execution. The test did not approve
the module, establish its upgrade authorization or generate a
positive production TRUST-01 verification.

The observed module reference is not included in an approved
ProofPath production trust policy by this milestone.

## 7. Verification and Test Evidence

### 7.1 Deterministic Tests

Twenty-one M3.1 tests passed.

Covered cases include:

- Deterministic policy commitments.
- Synthetic matching snapshot.
- Unapproved module rejection.
- Policy tampering and digest mismatch.
- Invalid digest.
- Wrong genesis.
- Wrong Registry coordinates.
- Wrong endpoint label.
- Unfinalized snapshot.
- Stale and future-dated observations.
- Invalid module-reference format.
- Transport failure.
- Invalid clock.
- Unsafe policy configurations.
- Rejection before transport invocation for invalid policy.
- Demonstration that injected mocks can fabricate positive results.

The mock-positive test is intentional and documents the trusted
application-composition requirement.

### 7.2 Full Regression Suite

All 189 tests passed:

- 168 existing PP-01 and PP-02 tests.
- 21 new M3.1 tests.

Strict TypeScript checking and package build passed.

### 7.3 SDK Runtime Compatibility

The installed `@concordium/web-sdk@12.0.2` exposed the required
SDK primitives and Node.js gRPC client.

A successful real Testnet observation established execution of
the adapter's read-only path against the configured endpoint.

The package installation reported a transitive `uuid@8.3.2`
deprecation warning. This was non-blocking for the observed
installation and regression tests.

### 7.4 File Scope

The implementation is limited to eight files:

1. `src/verification/types.ts`
2. `src/verification/registrySnapshot.ts`
3. `src/adapters/concordium/registrySnapshot.ts`
4. `tests/pp03-registry-snapshot.test.ts`
5. `docs/pp03-registry-verification.md`
6. `src/index.ts`
7. `package.json`
8. `package-lock.json`

No Gateway, Facilitator or Orchestrator files are modified.

## 8. Registry Provenance Disposition

Formal disposition:

`PROVENANCE_NOT_APPROVAL_READY`

The currently observed Registry module has not been established
as an independently approved ProofPath Registry trust anchor.

Unresolved evidence includes:

- Complete deployment and module-transition history.
- Finalized transaction references for relevant upgrades.
- Applicable administrator authority at each transition.
- Source/build correspondence for the installed module.
- Explicit independent policy approval.

An observed module mismatch does not establish that an upgrade
was unauthorized or malicious.

Nevertheless, lacking positive authorization evidence, ProofPath
must not silently approve the module.

Positive live TRUST-01 acceptance remains blocked.

## 9. Remaining Acceptance Requirements

Before final M3.1 implementation acceptance, review:

1. Production trust-policy and transport composition boundaries.
2. Adapter authentication, finalized-block identity and network
   context handling.
3. Failure and timeout semantics.
4. Synthetic-versus-live result distinctions.
5. Adequacy of tests for adverse transport and node behavior.
6. Public API and documentation consistency.
7. The exact eight-file scope and complete regression results.

Positive live module-policy acceptance is separate and remains
blocked by the outstanding provenance disposition.

A maintainer-approved module policy must not be issued merely
to make the live test pass.

## 10. Security and Scope Invariants

M3.1 must not:

- Authorize unknown Registry modules automatically.
- Treat the Registry itself as its policy authority.
- Substitute source-provided verification labels for evidence.
- Accept arbitrary request-supplied transport objects as
  authenticated production transport.
- Claim historical upgrade authorization.
- Claim independently verified consensus.
- Promote PP-02 TRUST-01, ID-01 or SELLER-01 to global verified status.
- Sign transactions or move funds.
- Mutate any Concordium contract.
- Change Gateway, Facilitator or Orchestrator behavior.

The milestone implements a narrow verified-snapshot capability
under explicit trusted-node and independently approved-policy
assumptions.

Its live positive acceptance remains subject to separate
Registry module-provenance approval.
