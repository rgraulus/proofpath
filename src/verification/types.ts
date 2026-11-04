/**
 * ProofPath PP-03 M3.1
 * Trusted-Node Registry Snapshot Verification Contracts.
 *
 * Platform-neutral interfaces.
 *
 * These types do not themselves authenticate:
 * - blockchain consensus or node observations;
 * - trust policies or their approval authority;
 * - historical contract deployment or upgrades;
 * - agent ownership, human identity, settlement or delivery.
 *
 * A successful verification is limited to the specified
 * registry-module snapshot under the declared trusted-node
 * assurance model.
 *
 * TRUST-01 live provenance disposition:
 * PROVENANCE_NOT_APPROVAL_READY.
 */

export type RegistryVerificationStatus =
  | "verified"
  | "failed"
  | "indeterminate";

export type RegistryAssuranceModel =
  "trusted_node_finalized_snapshot_v1";

/**
 * Chain-neutral registry coordinates.
 *
 * Contract index/subindex are decimal strings to avoid
 * JavaScript integer precision loss.
 */
export interface RegistryCoordinate {
  network: string;
  contractIndex: string;
  contractSubindex: string;
}

/**
 * Policy content approved independently of the observed
 * blockchain state.
 *
 * The policy's digest must be anchored by trusted
 * application configuration.
 *
 * A caller-provided policy and a matching caller-computed
 * digest are not sufficient to establish policy authority.
 */
export interface TrustedRegistryPolicy {
  policyId: string;
  policyVersion: string;

  registry: RegistryCoordinate;

  expectedGenesisHash: string;

  approvedModuleReferences: string[];

  trustedNodeEndpoint: string;

  maxSnapshotAgeSeconds: number;

  requireFinalizedBlock: true;
}

/**
 * Normalized registry observation returned by a chain
 * adapter.
 *
 * All fields are observations until the verification
 * operation authenticates the source, checks the
 * snapshot context and evaluates the trusted policy.
 *
 * The finalized flag is a trusted-node assertion,
 * not independently verified consensus evidence.
 */
export interface FinalizedRegistrySnapshot {
  registry: RegistryCoordinate;

  genesisHash: string;

  blockHash: string;
  blockHeight: string;
  blockTimestamp: string;

  finalized: boolean;

  moduleReference: string;

  observedAt: string;

  nodeEndpoint: string;
}

/**
 * Platform-neutral read boundary.
 *
 * Production implementations must establish the trusted
 * endpoint and transport identity independently of
 * returned snapshot fields.
 *
 * Mock implementations are for deterministic tests only
 * and cannot establish live assurance.
 */
export interface RegistrySnapshotTransport {
  readFinalizedRegistrySnapshot(
    registry: RegistryCoordinate
  ): Promise<FinalizedRegistrySnapshot>;
}

/**
 * Trusted application composition context.
 *
 * This must not be accepted wholesale from an untrusted
 * external request or Evidence Manifest.
 *
 * trustedPolicyDigest must originate from an independently
 * anchored configuration authority.
 *
 * The clock is injectable for deterministic testing.
 */
export interface RegistryVerificationContext {
  policy: TrustedRegistryPolicy;

  trustedPolicyDigest: string;

  transport: RegistrySnapshotTransport;

  now: () => Date;
}

/**
 * Snapshot-specific verification result.
 *
 * "verified" may establish only the narrow claim:
 * the authenticated trusted node reported an approved
 * registry module at the identified finalized snapshot.
 *
 * It must not be interpreted as global TRUST-01
 * completion or historical upgrade authorization.
 */
export interface RegistryVerificationResult {
  gate: "TRUST-01";

  claim: "registry_module_at_finalized_snapshot";

  assuranceModel: RegistryAssuranceModel;

  status: RegistryVerificationStatus;

  reasonCode: string;

  policyId: string;
  policyDigest: string;

  registry: RegistryCoordinate;

  snapshot: FinalizedRegistrySnapshot | null;

  consensusIndependentlyVerified: false;

  historicalUpgradeAuthorityVerified: false;
}
