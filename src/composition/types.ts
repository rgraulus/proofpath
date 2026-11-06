/**
 * ProofPath PP-03 M3.5
 * Offline Transaction Evidence Composition — Contracts.
 *
 * Assurance boundary:
 *
 * Composition correlates existing verification assessments
 * with independently supplied transaction context.
 *
 * It DOES NOT:
 * - authenticate the producer of a verification result;
 * - independently verify blockchain consensus;
 * - execute or verify new settlement operations;
 * - authenticate seller endpoint control;
 * - verify delivery signatures or resource consumption;
 * - verify identity credentials or ZKP presentations;
 * - approve Registry provenance or trust policies;
 * - promote recorded or indeterminate evidence to verified;
 * - call external services or mutate external state.
 *
 * XCF CRP settlement and Foundation-sponsored Concordium
 * exact settlement are distinct integration profiles.
 * Neither may be substituted for the other without
 * separately established compatibility and verification.
 *
 * M3.5 Option A:
 * Pure deterministic offline composition only.
 */

import type {
  ClaimAssessment,
  EvidenceArtifact,
  EvidenceManifest
} from "../core/types.js";

import type {
  FacilitatorReceiptVerificationResult,
  SettlementVerificationResult,
  AgentAuthorityVerificationResult
} from "../verification/types.js";

import type {
  PP02SellerBindingDecision
} from "../pp02/types.js";

/**
 * The composer does not perform independent verification.
 *
 * "composed" means the supplied records were successfully
 * correlated and represented.
 *
 * "incomplete" means the available records can be represented
 * without contradiction, but required assurance or evidence
 * remains unavailable or indeterminate.
 *
 * "rejected" means the supplied records contain invalid,
 * contradictory or unsafe composition inputs.
 *
 * None of these values means "transaction verified".
 */
export type CompositionStatus =
  | "composed"
  | "incomplete"
  | "rejected";

/**
 * Machine-readable diagnostic categories.
 *
 * Diagnostics distinguish missing evidence from conflicting
 * evidence. An unresolved claim must not be silently
 * interpreted as a successful verification.
 */
export type CompositionDiagnosticCode =
  | "invalid_trusted_context"
  | "invalid_composition_input"
  | "invalid_verification_result"
  | "transaction_binding_mismatch"
  | "network_binding_mismatch"
  | "agent_binding_mismatch"
  | "seller_binding_mismatch"
  | "delivery_binding_mismatch"
  | "duplicate_evidence_id"
  | "duplicate_claim_id"
  | "unknown_evidence_reference"
  | "missing_verification_result"
  | "missing_supporting_evidence"
  | "missing_verification_provenance"
  | "verification_failed"
  | "verification_indeterminate"
  | "seller_authentication_not_established"
  | "delivery_authentication_not_established"
  | "unsupported_assurance_promotion"
  | "unsupported_settlement_profile"
  | "manifest_construction_failed";

/**
 * Diagnostic paths refer to fields in the composition
 * input or resulting Evidence Manifest.
 *
 * They must not contain secret evidence payloads,
 * raw credentials, private keys or ZKP presentations.
 */
export interface CompositionDiagnostic {
  code: CompositionDiagnosticCode;

  path: string;

  /**
   * Relevant claim or transaction reference.
   * Null when no safe reference is available.
   */
  subjectRef: string | null;
}

/**
 * Explicit settlement interpretation.
 *
 * The currently supported M3.3 result is a trusted-node
 * finalized PLT transfer assessment.
 *
 * A Foundation-sponsored Concordium exact payment must
 * not be represented as independently verified by this
 * profile merely because its payment fields appear similar.
 *
 * A future adapter requires separate scope and review.
 */
export type CompositionSettlementProfile =
  "xcf_crp_plt_v1";

/**
 * Expected transaction-specific values established outside
 * the presented receipt, settlement result and delivery
 * record.
 *
 * These values must come from trusted application context.
 */
export interface TrustedCompositionPayment {
  network: "concordium:testnet" | "concordium:mainnet";

  transactionHash: string;

  tokenId: string;

  decimals: number;

  /**
   * Unsigned atomic amount as a decimal string.
   * The implementation must not use floating-point
   * arithmetic for payment equality.
   */
  amountRaw: string;

  payTo: string;

  settlementProfile: CompositionSettlementProfile;
}

/**
 * Trusted relationship between an M3.4 Registry agent
 * identity and the transaction's participants.
 *
 * An M3.4 owner/key result does not independently prove
 * seller endpoint control, human identity, delegation,
 * or action-specific signing authority.
 */
export interface TrustedCompositionAgentBinding {
  participantRole: "buyer" | "seller";

  agentRef: string;

  agentTokenIdHex: string;

  network: "concordium:testnet" | "concordium:mainnet";
}

/**
 * Transaction-scoped seller and delivery expectations.
 *
 * These are independent expectations, not facts inferred
 * from the seller or delivery evidence being assessed.
 */
export interface TrustedCompositionSellerBinding {
  sellerAgentRef: string;

  merchantRef: string;

  serviceEndpoint: string;

  payTo: string;
}

export interface TrustedCompositionDeliveryBinding {
  transactionRef: string;

  sellerAgentRef: string;

  resourceRef: string;
}

/**
 * Manifest metadata supplied by the integrating application.
 *
 * The composer must not invent:
 * - transaction or correlation identifiers;
 * - timestamps;
 * - audit journal commitments;
 * - governance or retention policy decisions.
 *
 * Frozen PP-01 types are reused directly.
 */
export type CompositionManifestContext = Pick<
  EvidenceManifest,
  | "transaction"
  | "participants"
  | "commercialTerms"
  | "audit"
  | "governance"
>;

/**
 * Independently supplied transaction and participant
 * expectations.
 *
 * The expected payment transaction hash must not be
 * copied from the Facilitator receipt or a settlement
 * observation.
 */
export interface TrustedTransactionCompositionContext {
  manifest: CompositionManifestContext;

  expectedPayment: TrustedCompositionPayment;

  expectedAgent: TrustedCompositionAgentBinding;

  expectedSeller: TrustedCompositionSellerBinding;

  expectedDelivery: TrustedCompositionDeliveryBinding;
}

/**
 * Provenance metadata for a pre-existing assessment.
 *
 * The composer does not authenticate these fields.
 *
 * The integrating application must establish that the
 * result originates from the expected verifier and that
 * its policy and evaluation context are trustworthy.
 *
 * A verified PP-01 ClaimAssessment requires:
 * - at least one supporting evidence artifact;
 * - a non-null verifierRef;
 * - a non-null evaluatedAt timestamp.
 */
export interface CompositionAssessmentProvenance {
  verifierRef: string | null;

  evaluatedAt: string | null;

  /**
   * References to actual supplied EvidenceArtifact records.
   *
   * Every ID must resolve to a supplied artifact.
   * IDs are not proof of source authenticity.
   */
  evidenceIds: string[];
}

/**
 * Existing verifier results are consumed as results.
 *
 * The composer must not recreate their underlying
 * verification operations or strengthen their claims.
 */
export interface CompositionReceiptEvidence {
  result: FacilitatorReceiptVerificationResult;

  provenance: CompositionAssessmentProvenance;
}

export interface CompositionSettlementEvidence {
  result: SettlementVerificationResult;

  provenance: CompositionAssessmentProvenance;
}

export interface CompositionAgentAuthorityEvidence {
  result: AgentAuthorityVerificationResult;

  provenance: CompositionAssessmentProvenance;
}

export interface CompositionSellerEvidence {
  result: PP02SellerBindingDecision;

  provenance: CompositionAssessmentProvenance;
}

/**
 * Delivery evidence within the Option A boundary.
 *
 * This is a recorded delivery assertion and its associated
 * artifacts. It is not a new signature-verification result.
 *
 * Even if the external source reports successful delivery,
 * the composer must not independently mark delivery
 * authenticity as verified.
 */
export interface CompositionDeliveryEvidence {
  transactionRef: string;

  sellerAgentRef: string;

  resourceRef: string;

  /**
   * Source-reported delivery outcome.
   * This is an assertion, not verified delivery.
   */
  reportedStatus:
    | "delivered"
    | "failed"
    | "unknown";

  provenance: CompositionAssessmentProvenance;
}

/**
 * Caller-supplied evidence artifact inventory.
 *
 * The composer must not invent digests, source metadata
 * or artifact identifiers.
 *
 * The existing PP-01 EvidenceArtifact contract governs
 * availability, disclosure and provenance representation.
 */
export interface CompositionArtifactInventory {
  artifacts: EvidenceArtifact[];
}

/**
 * Optional assessments are represented explicitly by null.
 *
 * Null means the assessment or evidence is unavailable,
 * not that the underlying transaction failed.
 *
 * Unsupported claims must not be synthesized to make the
 * evidence package appear complete.
 */
export interface TransactionCompositionInput {
  context: TrustedTransactionCompositionContext;

  receipt: CompositionReceiptEvidence | null;

  settlement: CompositionSettlementEvidence | null;

  agentAuthority: CompositionAgentAuthorityEvidence | null;

  seller: CompositionSellerEvidence | null;

  delivery: CompositionDeliveryEvidence | null;

  evidence: CompositionArtifactInventory;
}

/**
 * Diagnostic summary is separate from individual claims.
 *
 * A validly composed manifest may contain failed,
 * indeterminate or not-evaluated assessments.
 *
 * Structural validity must never be presented as
 * complete transaction assurance.
 */
export interface CompositionAssessmentSummary {
  verified: number;

  failed: number;

  indeterminate: number;

  notEvaluated: number;

  notApplicable: number;
}

/**
 * Deterministic composition diagnostics.
 *
 * "composed" does not mean transaction verified.
 *
 * Incomplete assurance is represented explicitly.
 */
export interface CompositionDiagnostics {
  status: CompositionStatus;

  reasons: CompositionDiagnostic[];

  assessments: CompositionAssessmentSummary;
}

/**
 * Separate the Evidence Manifest from the evaluation
 * of whether composition was possible.
 *
 * Rejected inputs produce no manifest.
 *
 * Incomplete inputs may produce a valid manifest if all
 * included artifact references and claim assessments can
 * be represented without fabrication or contradiction.
 */
export type TransactionCompositionResult =
  | {
      status: "rejected";

      manifest: null;

      diagnostics: CompositionDiagnostics & {
        status: "rejected";
      };
    }
  | {
      status: "composed" | "incomplete";

      manifest: EvidenceManifest;

      diagnostics: CompositionDiagnostics & {
        status: "composed" | "incomplete";
      };
    };

/**
 * Logical claim categories recognized by M3.5.
 *
 * These identify the source assessment being recorded;
 * they do not introduce new cryptographic assurance
 * models or new independent verification claims.
 */
export type CompositionClaimKind =
  | "facilitator_receipt"
  | "settlement_finality"
  | "agent_authority"
  | "seller_binding"
  | "delivery_record";

/**
 * Internal mapping identity for individual PP-01 claims.
 *
 * The composer may derive deterministic claim IDs from
 * fixed category identifiers, but must never derive
 * evidence authenticity from an identifier alone.
 */
export interface CompositionClaimMapping {
  kind: CompositionClaimKind;

  claim: ClaimAssessment;
}
