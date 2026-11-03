/**
 * ProofPath PP-01 — Evidence provenance assessment.
 *
 * A digest match proves byte consistency with a supplied commitment,
 * not authenticity of that commitment, its producer, or its claims.
 *
 * Runtime schema validation remains the responsibility of validate.ts.
 */

import type { EvidenceArtifact } from "./types.js";
import { verifyArtifactBytes } from "./hash.js";

export type IntegrityStatus =
  | "matches"
  | "mismatch"
  | "not_evaluated";

export type HistoricalContextStatus =
  | "recorded_unverified"
  | "missing";

export interface ProvenanceAssessment {
  artifactId: string;

  integrity: {
    status: IntegrityStatus;
    reasonCode: string | null;
  };

  attribution: {
    status: "claimed_only";
    producerClaimPresent: boolean;
    collectorClaimPresent: boolean;
  };

  authentication: {
    status: "not_evaluated";
  };

  historicalContext: {
    status: HistoricalContextStatus;
  };

  claimVerification: {
    status: "not_evaluated";
  };

  issues: string[];
}

/**
 * Evaluate only those properties PP-01 can establish locally.
 *
 * This function does NOT authenticate evidence sources, validate
 * chain state, infer authority, or verify commercial claims.
 */
export function assessArtifactProvenance(
  artifact: EvidenceArtifact,
  bytes?: Uint8Array
): ProvenanceAssessment {
  if (
    !artifact ||
    typeof artifact.id !== "string" ||
    artifact.id.length === 0 ||
    !artifact.source ||
    typeof artifact.source.collectorRef !== "string" ||
    typeof artifact.digestSha256 !== "string"
  ) {
    throw new TypeError("Malformed evidence artifact");
  }

  if (bytes !== undefined && !(bytes instanceof Uint8Array)) {
    throw new TypeError("Artifact bytes must be Uint8Array");
  }

  const issues: string[] = [];

  let integrityStatus: IntegrityStatus = "not_evaluated";
  let integrityReason: string | null = "bytes_not_supplied";

  if (bytes !== undefined) {
    const matches = verifyArtifactBytes(
      bytes,
      artifact.digestSha256
    );

    integrityStatus = matches ? "matches" : "mismatch";
    integrityReason = matches ? null : "artifact_digest_mismatch";

    if (!matches) {
      issues.push("artifact_digest_mismatch");
    }
  } else if (artifact.availability === "included") {
    issues.push("included_artifact_bytes_missing");
  }

  const producerClaimPresent =
    typeof artifact.source.producerRef === "string" &&
    artifact.source.producerRef.length > 0;

  const collectorClaimPresent =
    artifact.source.collectorRef.length > 0;

  if (!producerClaimPresent) {
    issues.push("producer_not_identified");
  }

  if (!collectorClaimPresent) {
    issues.push("collector_not_identified");
  }

  const context = artifact.source.historicalContext;

  const historicalContextPresent =
    context !== null &&
    typeof context === "object" &&
    !Array.isArray(context) &&
    Object.keys(context).length > 0;

  if (!historicalContextPresent) {
    issues.push("historical_context_missing");
  }

  return {
    artifactId: artifact.id,

    integrity: {
      status: integrityStatus,
      reasonCode: integrityReason
    },

    attribution: {
      status: "claimed_only",
      producerClaimPresent,
      collectorClaimPresent
    },

    authentication: {
      status: "not_evaluated"
    },

    historicalContext: {
      status: historicalContextPresent
        ? "recorded_unverified"
        : "missing"
    },

    claimVerification: {
      status: "not_evaluated"
    },

    issues
  };
}
