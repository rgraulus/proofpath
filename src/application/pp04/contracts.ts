/**
 * ProofPath PP-04-B — Integrated Application Contracts.
 *
 * Shared contracts for the deterministic demonstration
 * orchestrator, CLI runner and browser presentation layer.
 *
 * These contracts do not introduce new verification or
 * assurance models.
 *
 * Source authenticity, policy approval and trusted context
 * remain responsibilities of the integrating application.
 *
 * Fixture mode performs no live network, payment, wallet
 * or resource-release operations.
 */

import type {
  RuntimeValidator
} from "../../core/validate.js";

import type {
  FacilitatorReceiptVerificationContext,
  FacilitatorReceiptVerificationResult,
  SettlementVerificationContext,
  SettlementVerificationResult,
  AgentAuthorityVerificationContext,
  AgentAuthorityVerificationResult
} from "../../verification/types.js";

import type {
  PP02SellerBindingInput,
  PP02SellerBindingDecision
} from "../../pp02/types.js";

import type {
  CompositionAssessmentProvenance,
  CompositionArtifactInventory,
  CompositionDeliveryEvidence,
  TrustedTransactionCompositionContext,
  TransactionCompositionInput,
  TransactionCompositionResult
} from "../../composition/types.js";

/**
 * The four approved Gate A demonstration scenarios.
 */
export type PP04ScenarioId =
  | "consistent"
  | "missing-evidence"
  | "binding-conflict"
  | "unsupported-assurance";

/**
 * Gate A supports fixture mode only.
 *
 * Testnet is reserved for the separately gated
 * PP-04-C controlled live demonstration.
 */
export type PP04SourceMode =
  | "fixture"
  | "testnet";

/**
 * Public application request.
 *
 * Requests select approved demonstrations only.
 * They cannot supply verifier policies, trusted
 * transaction expectations or arbitrary transports.
 */
export interface PP04DemoRequest {
  scenarioId: PP04ScenarioId;
  sourceMode: PP04SourceMode;
}

/**
 * Verification results produced by the existing
 * ProofPath APIs.
 *
 * Null means an assessment was unavailable.
 *
 * These results are not independent evidence of
 * their own origin or policy authority.
 */
export interface PP04SourceAssessments {
  receipt: FacilitatorReceiptVerificationResult | null;

  settlement: SettlementVerificationResult | null;

  agentAuthority: AgentAuthorityVerificationResult | null;

  seller: PP02SellerBindingDecision | null;
}

/**
 * Application execution state is separate from
 * M3.5 evidence-composition status.
 *
 * A rejected composition may be an expected,
 * successfully executed demonstration scenario.
 */
export interface PP04ExecutionStatus {
  completed: boolean;

  /**
   * Stable, non-sensitive application error code.
   * Null when execution completed.
   */
  failureCode: string | null;
}

/**
 * Shared result consumed by the CLI and viewer.
 *
 * This is an internal application result, not an
 * automatically authorized public disclosure.
 *
 * A server must apply its disclosure rules before
 * sending evidence or manifest data to clients.
 */
export interface PP04DemoResult {
  scenarioId: PP04ScenarioId;

  sourceMode: PP04SourceMode;

  execution: PP04ExecutionStatus;

  composition: TransactionCompositionResult | null;

  sourceAssessments: PP04SourceAssessments;
}

/**
 * Provenance metadata associated with existing
 * verification results.
 *
 * These fields must originate from the trusted
 * evidence-capture boundary.
 *
 * They are not authenticated by M3.5.
 */
export interface PP04AssessmentProvenance {
  receipt: CompositionAssessmentProvenance;

  settlement: CompositionAssessmentProvenance;

  agentAuthority: CompositionAssessmentProvenance;

  seller: CompositionAssessmentProvenance;
}

/**
 * Prepared verification inputs for one scenario.
 *
 * The fixture provider supplies controlled test
 * transports and deterministic evaluation clocks.
 *
 * A future live provider must establish authenticated
 * transport and independently approved policy authority.
 */
export interface PP04VerificationInputs {
  receipt: FacilitatorReceiptVerificationContext;

  settlement: SettlementVerificationContext;

  agentAuthority: AgentAuthorityVerificationContext;

  seller: PP02SellerBindingInput;
}

/**
 * Application-approved scenario package.
 *
 * Trusted context must be established independently
 * of the source observations under evaluation.
 */
export interface PP04ScenarioData {
  trustedContext: TrustedTransactionCompositionContext;

  verification: PP04VerificationInputs;

  provenance: PP04AssessmentProvenance;

  delivery: CompositionDeliveryEvidence | null;

  evidence: CompositionArtifactInventory;

  /**
   * Optional, controlled scenario transformation.
   *
   * Used exclusively to exercise negative Gate A
   * cases after the existing verifiers have run.
   *
   * Must never be accepted from an HTTP client or
   * untrusted external transaction presenter.
   */
  transformCompositionInput?: (
    input: TransactionCompositionInput
  ) => TransactionCompositionInput;
}

/**
 * Dependencies are supplied by the trusted
 * application bootstrap, not by the viewer.
 *
 * The validator must be constructed using the
 * approved frozen PP-01 schemas.
 */
export interface PP04Dependencies {
  validator: RuntimeValidator;

  loadScenario(
    scenarioId: PP04ScenarioId
  ): Promise<PP04ScenarioData>;
}

/**
 * Shared application entry-point contract.
 *
 * Implementation belongs in orchestrator.ts.
 */
export type PP04DemoRunner = (
  request: PP04DemoRequest,
  dependencies: PP04Dependencies
) => Promise<PP04DemoResult>;
