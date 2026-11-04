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

/**
 * ProofPath PP-03 M3.2
 * Independent Facilitator Receipt Verification Contracts.
 *
 * Assurance: trusted_facilitator_receipt_signature_v1.
 * Authenticated signature and payment binding only.
 * Independent settlement finality remains unverified.
 */

export type FacilitatorReceiptVerificationStatus =
  | "verified"
  | "failed"
  | "indeterminate";

export type FacilitatorReceiptAssuranceModel =
  "trusted_facilitator_receipt_signature_v1";

export type FacilitatorReceiptClaim =
  "facilitator_receipt_signature_and_binding";

/**
 * Independently authorized Ed25519 public signing key.
 * JWS kid selects a key; it does not authorize that key.
 */
export interface AuthorizedFacilitatorSigningKey {
  kid: string;
  kty: "OKP";
  crv: "Ed25519";
  x: string;
  alg: "EdDSA";
  use: "sig";
}

/**
 * Policy approval must be established independently.
 * A matching caller-generated digest is not authority.
 */
export interface TrustedFacilitatorReceiptPolicy {
  policyId: string;
  policyVersion: string;
  facilitatorId: string;
  authorizedKeys: AuthorizedFacilitatorSigningKey[];
  acceptedProofVersions: Array<"ccd-plt-proof@v1">;
  maxReceiptAgeSeconds: number;
  maxFutureSkewSeconds: number;
}

/**
 * Expected immutable payment contract.
 * Must not be derived from the presented receipt.
 */
export interface FacilitatorExpectedPaymentContract {
  contractId: string;
  contractVersion: string;
  isFrozen: true;
  merchantId: string;
  resource: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
  };
  chain_id?: string;
  network: string;
  asset: {
    type: "PLT";
    tokenId: string;
    decimals: number;
  };
  amount: string;
  payTo: string;
}

/**
 * Independently established transaction-specific binding.
 * The expected hash must not be copied from the receipt.
 */
export interface FacilitatorExpectedPayment {
  nonce: string;
  contract: FacilitatorExpectedPaymentContract;
  transactionHash: string;
}

/**
 * Trusted application-composed verification context.
 * Policy digest and expected payment require external authority.
 * The clock is injectable for deterministic testing.
 */
export interface FacilitatorReceiptVerificationContext {
  jws: string;
  expected: FacilitatorExpectedPayment;
  policy: TrustedFacilitatorReceiptPolicy;
  trustedPolicyDigest: string;
  now: () => Date;
}

/**
 * A verified result establishes only signature authenticity
 * and expected payment binding under approved key policy.
 */
export interface FacilitatorReceiptVerificationResult {
  claim: FacilitatorReceiptClaim;
  assuranceModel: FacilitatorReceiptAssuranceModel;
  status: FacilitatorReceiptVerificationStatus;
  reasonCode: string;
  policyId: string;
  policyDigest: string;
  facilitatorId: string;
  signingKeyId: string | null;
  transactionHash: string | null;
  signatureAuthenticated: boolean;
  settlementIndependentlyVerified: false;
}
