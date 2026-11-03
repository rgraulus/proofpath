
/**
 * ProofPath PP-02 — Identity, Seller and Registry Trust Contracts.
 *
 * Platform-neutral contracts for deterministic trust evaluation.
 *
 * These declarations do not:
 * - authenticate blockchain observations;
 * - validate cryptographic signatures or presentations;
 * - establish human identity;
 * - prove endpoint ownership;
 * - verify payment settlement or delivery;
 * - authorize changes to external systems.
 *
 * A caller-supplied assertion is not independently verified evidence.
 */

import type {
  VerificationStatus
} from "../core/types.js";

export type PP02Gate =
  | "TRUST-01"
  | "ID-01"
  | "SELLER-01";

export type PP02VerificationStatus = VerificationStatus;

export type PP02AssuranceLevel =
  | "none"
  | "L1"
  | "L2";

export type PP02EvidenceOrigin =
  | "source_claim"
  | "authenticated_observation"
  | "independent_verification";

export interface PP02EvidenceReference {
  evidenceId: string;
  origin: PP02EvidenceOrigin;
  sourceRef: string;
  verifierRef: string | null;
}

export interface PP02FinalizedBlock {
  network: string;
  height: string;
  hash: string;
  finalized: boolean;
}

export interface PP02Decision {
  gate: PP02Gate;
  status: PP02VerificationStatus;
  reasonCode: string;
  evidenceIds: string[];
}

/**
 * TRUST-01
 *
 * Module observations and historical transitions are distinct
 * from the policy decision to trust a module.
 */

export interface PP02RegistryCoordinate {
  network: string;
  contractIndex: string;
  contractSubindex: string;
}

export interface PP02RegistryObservation {
  registry: PP02RegistryCoordinate;
  moduleReference: string;
  block: PP02FinalizedBlock;
  evidence: PP02EvidenceReference[];
}

export interface PP02ModuleTransition {
  registry: PP02RegistryCoordinate;
  fromModule: string;
  toModule: string;
  block: PP02FinalizedBlock;
  transactionHash: string;
  transactionSender: string;
  recordedContractOwner: string | null;
  successfulUpgradeEvent: boolean;
  evidence: PP02EvidenceReference[];
}

export interface PP02RegistryTrustPolicy {
  policyId: string;
  registry: PP02RegistryCoordinate;
  approvedModuleReferences: string[];
  requireFinalizedBlock: boolean;
  requireAuthenticatedObservation: boolean;
  requireApprovedModule: boolean;
}

export interface PP02RegistryTrustInput {
  observation: PP02RegistryObservation | null;
  policy: PP02RegistryTrustPolicy;
  transitions: PP02ModuleTransition[];
}

export interface PP02RegistryTrustDecision
  extends PP02Decision {
  gate: "TRUST-01";
  registry: PP02RegistryCoordinate;
  observedModule: string | null;
  policyId: string;
}

/**
 * ID-01
 *
 * L1: authenticated Registry ownership.
 *
 * L2: L1 plus independently verified human assurance,
 * cryptographically bound to the registered owner account
 * under an explicitly approved assurance policy.
 */

export interface PP02AgentOwnerObservation {
  agentRef: string;
  ownerAccount: string;
  registry: PP02RegistryCoordinate;
  block: PP02FinalizedBlock;
  evidence: PP02EvidenceReference[];
}

export interface PP02AccountControlEvidence {
  account: string;
  challengeRef: string;
  purpose: string;
  verifierRef: string;
  evidence: PP02EvidenceReference[];
}

export interface PP02HumanAssuranceEvidence {
  assuranceRef: string;
  issuerRef: string;
  subjectBindingRef: string;
  accountBindingRef: string | null;
  challengeRef: string;
  purpose: string;
  verifierRef: string;
  evidence: PP02EvidenceReference[];
}

export interface PP02OwnerAssurancePolicy {
  policyId: string;
  requiredLevel: "L1" | "L2";
  trustedIssuerRefs: string[];
  trustedVerifierRefs: string[];
  expectedChallengeRef: string | null;
  expectedPurpose: string;
}

export interface PP02OwnerAssuranceInput {
  owner: PP02AgentOwnerObservation | null;
  registryTrust: PP02RegistryTrustDecision;
  accountControl: PP02AccountControlEvidence | null;
  humanAssurance: PP02HumanAssuranceEvidence | null;
  policy: PP02OwnerAssurancePolicy;
}

export interface PP02OwnerAssuranceDecision
  extends PP02Decision {
  gate: "ID-01";
  establishedLevel: PP02AssuranceLevel;
  agentRef: string | null;
  ownerAccount: string | null;
  policyId: string;
}

/**
 * SELLER-01
 *
 * Registry wallet, endpoint authorization, commercial payee,
 * settlement recipient and delivery attribution are separate
 * verification obligations.
 */

export interface PP02SellerRegistryObservation {
  agentRef: string;
  ownerAccount: string;
  agentWallet: string | null;
  active: boolean;
  registry: PP02RegistryCoordinate;
  block: PP02FinalizedBlock;
  evidence: PP02EvidenceReference[];
}

export interface PP02EndpointEvidence {
  agentRef: string;
  endpoint: string;
  cardDigestSha256: string | null;
  authorizationKeyRef: string | null;
  verifierRef: string | null;
  evidence: PP02EvidenceReference[];
}

export interface PP02SellerCommercialTerms {
  transactionRef: string;
  merchantRef: string;
  endpoint: string;
  payTo: string;
  evidence: PP02EvidenceReference[];
}

export interface PP02SettlementRecipientEvidence {
  transactionRef: string;
  recipient: string;
  block: PP02FinalizedBlock;
  verifierRef: string | null;
  evidence: PP02EvidenceReference[];
}

export interface PP02SellerDeliveryEvidence {
  transactionRef: string;
  agentRef: string;
  signerKeyRef: string;
  verifierRef: string | null;
  evidence: PP02EvidenceReference[];
}

export interface PP02SellerBindingPolicy {
  policyId: string;
  requireTrustedRegistry: boolean;
  requireAuthenticatedEndpoint: boolean;
  requireFinalizedSettlement: boolean;
  requireAuthenticatedDelivery: boolean;
}

export interface PP02SellerBindingInput {
  seller: PP02SellerRegistryObservation | null;
  registryTrust: PP02RegistryTrustDecision;
  endpoint: PP02EndpointEvidence | null;
  terms: PP02SellerCommercialTerms | null;
  settlement: PP02SettlementRecipientEvidence | null;
  delivery: PP02SellerDeliveryEvidence | null;
  policy: PP02SellerBindingPolicy;
}

export interface PP02SellerBindingDecision
  extends PP02Decision {
  gate: "SELLER-01";
  sellerAgentRef: string | null;
  transactionRef: string | null;
  policyId: string;
}
