/**
 * ProofPath SDK — bounded Base Mainnet x402 v2 challenge mapping.
 * Mapping does not authenticate the source or establish payment.
 */
export {
  mapX402ChallengeEvidence
} from "../adapters/x402/challengeEvidence.js";

export type {
  ExpectedBaseChallenge,
  ChallengeObservation,
  ChallengeEvidenceInput,
  ChallengeEvidenceResult
} from "../adapters/x402/challengeEvidence.js";
