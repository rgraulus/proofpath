
/**
 * ProofPath IOT-08 — XDC Apothem payment assurance contracts.
 *
 * Implements the bounded architecture accepted under IOT-07.
 *
 * Profile:
 * trusted_node_finalized_xdc_token_transfer_v1
 *
 * This initial implementation supports deterministic simulation.
 * Production source authentication, historical token semantics,
 * and independent trust-policy approval are not established here.
 *
 * No independent XDPoS consensus verification is performed.
 */

export const XDC_ASSURANCE_PROFILE =
  "trusted_node_finalized_xdc_token_transfer_v1" as const;

export const XDC_APOTHEM_NETWORK = "eip155:51" as const;

export type XdcAssuranceStatus =
  | "verified"
  | "failed"
  | "indeterminate";

export type XdcAssuranceEnvironment =
  | "simulated_test_only"
  | "unapproved_live";

/**
 * A trust policy must originate from an independent authority.
 *
 * Merely calculating its digest does not establish approval.
 * The initial verifier must never treat this object alone
 * as sufficient authorization for live positive assurance.
 */
export interface XdcTrustedPaymentPolicy {
  policyId: string;
  policyVersion: string;

  network: typeof XDC_APOTHEM_NETWORK;

  approvedTokenContract: string;
  approvedTokenDecimals: number;

  trustedNodeEndpoint: string;

  requireSuccessfulExecution: true;
  requireExactTransfer: true;
  requireFinalizedBlock: true;
  requireCanonicalAncestry: true;

  maxObservationAgeSeconds: number;
  maxFutureSkewSeconds: number;
}

/**
 * Expected payment terms must be independently established.
 *
 * They must not be reconstructed from the transaction,
 * receipt, Transfer event, or self-reported token metadata.
 *
 * amountAtomic is a positive decimal integer string.
 */
export interface XdcExpectedTransfer {
  network: typeof XDC_APOTHEM_NETWORK;

  transactionHash: string;
  tokenContract: string;

  from?: string;
  to: string;

  amountAtomic: string;
  decimals: number;
}

/**
 * Normalized Transfer event.
 *
 * All event coordinates remain bound to the originating
 * transaction, receipt, and block.
 */
export interface XdcObservedTransfer {
  tokenContract: string;

  transactionHash: string;
  blockHash: string;

  logIndex: string;

  from: string;
  to: string;

  amountAtomic: string;

  /**
   * Whether the event was removed from the canonical chain,
   * as reported by the source.
   */
  removed: boolean;
}

/**
 * Transaction, receipt, and block observations.
 *
 * These are source-reported facts, not independently
 * authenticated consensus evidence.
 */
export interface XdcTransactionObservation {
  transactionHash: string;

  from: string;
  to: string;

  input: string;

  blockHash: string;
  blockNumber: string;

  receiptTransactionHash: string;
  receiptBlockHash: string;
  receiptBlockNumber: string;

  receiptStatus: string;

  blockContainsTransaction: boolean;

  /**
   * True only when all relevant transfer effects have been
   * captured and can be interpreted under the token policy.
   */
  transferEvidenceComplete: boolean;

  transfers: XdcObservedTransfer[];
}

/**
 * Canonical-chain and finality observations.
 *
 * Height coverage alone does not prove ancestry.
 */
export interface XdcFinalityObservation {
  canonicalBlockHash: string;
  canonicalBlockNumber: string;

  finalizedBlockHash: string | null;
  finalizedBlockNumber: string | null;

  /**
   * Indicates that the trusted source reported a valid
   * canonical ancestry relationship.
   *
   * This field alone does not authenticate the source.
   */
  canonicalAncestryReported: boolean;
}

/**
 * Historical token implementation interpretation.
 *
 * A self-reported name, symbol, decimals, or event is not
 * enough to independently establish token semantics.
 */
export interface XdcTokenSemanticsObservation {
  contractCodePresentAtBlock: boolean;

  historicalImplementationReference: string | null;

  /**
   * External trust-policy approval is required before this
   * assertion may support a live positive assurance result.
   */
  supportedTransferSemanticsReported: boolean;
}

/**
 * Complete source observation.
 *
 * Source identity and acquisition timestamps are preserved
 * for assessment and future portable evidence capture.
 */
export interface XdcPaymentObservation {
  network: string;

  nodeEndpoint: string;
  observedAt: string;

  transaction: XdcTransactionObservation;
  finality: XdcFinalityObservation;
  tokenSemantics: XdcTokenSemanticsObservation;
}

/**
 * Explicit simulation boundary.
 *
 * This field does not establish trusted source authentication
 * or independent policy approval.
 *
 * Callers can supply simulation inputs. Consequently, an
 * assessment in this environment cannot be represented as
 * live payment assurance.
 */
export interface XdcSimulationContext {
  environment: "simulated_test_only";

  policy: XdcTrustedPaymentPolicy;
  expected: XdcExpectedTransfer;
  observation: XdcPaymentObservation;

  /**
   * Separately supplied expected policy commitment.
   *
   * Matching digests provide consistency, not authority.
   */
  trustedPolicyDigest: string;

  now: () => Date;
}

/**
 * Unapproved live observations must fail closed.
 *
 * A future implementation may introduce a separate,
 * independently authenticated production trust boundary.
 */
export interface XdcUnapprovedLiveContext {
  environment: "unapproved_live";

  policy: XdcTrustedPaymentPolicy;
  expected: XdcExpectedTransfer;
  observation: XdcPaymentObservation;

  trustedPolicyDigest: string;

  now: () => Date;
}

export type XdcVerificationContext =
  | XdcSimulationContext
  | XdcUnapprovedLiveContext;

/**
 * Separate obligation assessments prevent a single status
 * from concealing which verification requirements passed.
 */
export type XdcObligationStatus =
  | "satisfied"
  | "failed"
  | "indeterminate";

export interface XdcAssuranceObligations {
  network: XdcObligationStatus;
  policy: XdcObligationStatus;
  sourceTrust: XdcObligationStatus;
  execution: XdcObligationStatus;
  transfer: XdcObligationStatus;
  tokenSemantics: XdcObligationStatus;
  finality: XdcObligationStatus;
}

/**
 * Bounded verification result.
 *
 * A simulated "verified" result is a deterministic test
 * outcome, never a production settlement assurance claim.
 *
 * consensusIndependentlyVerified and
 * liveAssuranceEstablished are always false in IOT-08B.
 */
export interface XdcPaymentVerificationResult {
  profileId: typeof XDC_ASSURANCE_PROFILE;

  claim:
    "finalized_xdc_token_transfer_matches_expected_payment";

  assuranceModel: typeof XDC_ASSURANCE_PROFILE;

  environment: XdcAssuranceEnvironment;

  status: XdcAssuranceStatus;
  reasonCode: string;

  policyId: string;
  policyVersion: string;
  policyDigest: string;

  network: string;
  transactionHash: string;

  blockHash: string | null;
  blockNumber: string | null;

  obligations: XdcAssuranceObligations;

  observedTransfer: XdcObservedTransfer | null;

  limitations: string[];

  consensusIndependentlyVerified: false;
  liveAssuranceEstablished: false;
}
