/**
 * ProofPath PP-01 — Portable evidence export v1.
 *
 * Public export uses an explicit disclosure allowlist.
 * Restricted export preserves the validated full manifest.
 *
 * Neither profile authenticates evidence or verifies commercial
 * claims. The caller supplies a validator configured with trusted
 * versioned schemas and handles all external access controls.
 *
 * Export digests cover the exported representation, excluding
 * the exportDigestSha256 field itself.
 */

import type { EvidenceManifest } from "./types.js";
import type { RuntimeValidator } from "./validate.js";

import {
  canonicalJson,
  canonicalJsonBytes
} from "./canonical.js";

import {
  sha256Bytes,
  sha256Record
} from "./hash.js";

export type ExportDisclosure = "public" | "restricted";

export interface PublicArtifactCommitment {
  digestSha256: string;
}

export interface PublicEvidenceExport {
  schema: {
    type: "proofpath.portable-export";
    version: "1.0.0";
  };

  disclosure: "public";
  originalManifestDigestSha256: null;
  manifest: null;

  publicArtifactCommitments: PublicArtifactCommitment[];

  omissions: {
    restrictedArtifactCount: number;
    transactionMetadataOmitted: true;
    participantMetadataOmitted: true;
    commercialTermsOmitted: true;
    sourceMetadataOmitted: true;
    auditDetailsOmitted: true;
    assuranceClaimsOmitted: true;
  };

  verificationNotice: string;
  exportDigestSha256: string;
}

export interface RestrictedEvidenceExport {
  schema: {
    type: "proofpath.portable-export";
    version: "1.0.0";
  };

  disclosure: "restricted";
  originalManifestDigestSha256: string;
  manifest: EvidenceManifest;

  verificationNotice: string;
  exportDigestSha256: string;
}

export type PortableEvidenceExport =
  | PublicEvidenceExport
  | RestrictedEvidenceExport;

const NOTICE =
  "Schema validity and digest consistency do not establish " +
  "source authenticity, transaction truth, or independent " +
  "verification of claims.";

function exportDigest(
  value: unknown
): string {
  return sha256Bytes(canonicalJsonBytes(value));
}

/**
 * Export a validated evidence manifest.
 *
 * Public disclosure is conservative: it omits transaction,
 * participant, source, claim and commercial metadata, and
 * exposes only digest commitments for public artifacts.
 *
 * Artifact identifiers are intentionally excluded from the
 * public profile to reduce correlation and disclosure risk.
 *
 * The public export does not expose the original manifest
 * digest, because even a hash can act as a correlation handle.
 *
 * A public export is a derived summary, not a substitute
 * for the original manifest or its complete verification.
 *
 * This function does not read artifact bytes or publish data.
 */
export function exportEvidence(
  input: unknown,
  validator: RuntimeValidator,
  disclosure: ExportDisclosure
): PortableEvidenceExport {
  if (
    disclosure !== "public" &&
    disclosure !== "restricted"
  ) {
    throw new TypeError("Unsupported disclosure profile");
  }

  if (
    !validator ||
    typeof validator.validateManifest !== "function"
  ) {
    throw new TypeError("Trusted runtime validator required");
  }

  const result = validator.validateManifest(input);

  if (!result.valid) {
    throw new TypeError(
      "Evidence manifest failed runtime validation"
    );
  }

  /*
   * Canonical round-trip creates an isolated JSON snapshot.
   * Unsupported values fail closed before any export.
   */
  const manifest = JSON.parse(
    canonicalJson(result.value)
  ) as EvidenceManifest;

  const schema = {
    type: "proofpath.portable-export" as const,
    version: "1.0.0" as const
  };

  if (disclosure === "restricted") {
    const payload = {
      schema,
      disclosure: "restricted" as const,
      originalManifestDigestSha256:
        sha256Record("manifest", manifest),
      manifest,
      verificationNotice: NOTICE
    };

    return {
      ...payload,
      exportDigestSha256: exportDigest(payload)
    };
  }

  /*
   * No field is copied from an artifact other than its
   * digest, and only if disclosure is explicitly public.
   *
   * No hidden source/participant metadata is serialized.
   */
  const publicArtifactCommitments =
    manifest.evidence
      .filter(artifact => artifact.disclosure === "public")
      .map(artifact => ({
        digestSha256: artifact.digestSha256
      }));

  const restrictedArtifactCount =
    manifest.evidence.length -
    publicArtifactCommitments.length;

  const payload = {
    schema,
    disclosure: "public" as const,
    originalManifestDigestSha256: null,
    manifest: null,
    publicArtifactCommitments,
    omissions: {
      restrictedArtifactCount,
      transactionMetadataOmitted: true as const,
      participantMetadataOmitted: true as const,
      commercialTermsOmitted: true as const,
      sourceMetadataOmitted: true as const,
      auditDetailsOmitted: true as const,
      assuranceClaimsOmitted: true as const
    },
    verificationNotice: NOTICE
  };

  return {
    ...payload,
    exportDigestSha256: exportDigest(payload)
  };
}

/**
 * Recompute the exported-representation commitment.
 *
 * This verifies consistency of the supplied export object.
 * It does not establish authorization to disclose the data
 * or authenticity of the original evidence manifest.
 */
export function verifyExportDigest(
  input: PortableEvidenceExport
): boolean {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError("Invalid evidence export");
  }

  const { exportDigestSha256, ...payload } = input;

  if (
    typeof exportDigestSha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(exportDigestSha256)
  ) {
    throw new TypeError("Invalid export digest");
  }

  return exportDigest(payload) === exportDigestSha256;
}
