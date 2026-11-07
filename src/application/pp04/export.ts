
/**
 * ProofPath PP-04-B — Portable evidence export boundary.
 *
 * Reuses PP-01 export and digest-verification APIs.
 * Does not change source evidence or compose new claims.
 *
 * PP-04-B is an offline synthetic fixture demonstration.
 * Restricted disclosure is permitted only through a
 * deliberately acknowledged local CLI operation.
 *
 * A local acknowledgement is NOT user authentication,
 * authorization, encryption or production access control.
 */

import {
  exportEvidence,
  verifyExportDigest
} from "../../core/export.js";

import type {
  ExportDisclosure,
  PortableEvidenceExport
} from "../../core/export.js";

import type {
  RuntimeValidator
} from "../../core/validate.js";

import type {
  PP04DemoResult
} from "./contracts.js";

export interface PP04ExportOptions {
  disclosure: ExportDisclosure;

  /**
   * Restricted disclosure is supported only through
   * the explicitly controlled local CLI interface.
   */
  channel: "local-cli" | "browser";

  /**
   * An explicit disclosure acknowledgement, not an
   * authorization or identity verification mechanism.
   */
  restrictedAcknowledged?: boolean;
}

export interface PP04ExportOutcome {
  disclosure: ExportDisclosure;
  compositionStatus: "incomplete";

  /**
   * The export can preserve incomplete evidence;
   * it does not assert an authenticated transaction.
   */
  transactionVerified: false;

  /**
   * Validating an export digest proves only integrity
   * of this exported representation.
   */
  digestVerified: true;

  portableExport: PortableEvidenceExport;
}

function failClosed(): never {
  // Deliberately omit raw manifest data and internal
  // verification inputs from failure messages.
  throw new Error("PP04_EXPORT_NOT_PERMITTED");
}

/**
 * Generate a portable export from a successfully
 * executed PP-04-B fixture demonstration.
 *
 * Frozen PP-04-B behavior permits exports only for
 * incomplete, schema-valid compositions.
 *
 * Rejected outcomes must never create an export.
 * A future "composed" outcome requires its own
 * explicit acceptance and assurance review.
 */
export function exportPP04DemoEvidence(
  result: PP04DemoResult,
  validator: RuntimeValidator,
  options: PP04ExportOptions
): PP04ExportOutcome {
  if (
    !result ||
    !options ||
    !validator ||
    typeof validator.validateManifest !== "function"
  ) {
    return failClosed();
  }

  if (
    options.channel !== "local-cli" &&
    options.channel !== "browser"
  ) {
    return failClosed();
  }

  if (
    options.disclosure !== "public" &&
    options.disclosure !== "restricted"
  ) {
    return failClosed();
  }

  if (
    options.disclosure === "restricted" &&
    (
      options.channel !== "local-cli" ||
      options.restrictedAcknowledged !== true
    )
  ) {
    return failClosed();
  }

  if (
    result.execution.completed !== true ||
    result.composition === null ||
    result.composition.status !== "incomplete" ||
    result.composition.manifest === null
  ) {
    return failClosed();
  }

  // Revalidate at the export boundary. The PP-01
  // exporter also performs its own manifest validation.
  const validated = validator.validateManifest(
    result.composition.manifest
  );

  if (!validated.valid) {
    return failClosed();
  }

  const portableExport = exportEvidence(
    validated.value,
    validator,
    options.disclosure
  );

  if (
    portableExport.disclosure !== options.disclosure ||
    verifyExportDigest(portableExport) !== true
  ) {
    return failClosed();
  }

  if (options.disclosure === "public") {
    if (
      portableExport.disclosure !== "public" ||
      portableExport.manifest !== null ||
      portableExport.originalManifestDigestSha256 !== null ||
      portableExport.omissions.transactionMetadataOmitted
        !== true ||
      portableExport.omissions.participantMetadataOmitted
        !== true ||
      portableExport.omissions.assuranceClaimsOmitted
        !== true
    ) {
      return failClosed();
    }
  }

  return {
    disclosure: options.disclosure,
    compositionStatus: "incomplete",
    transactionVerified: false,
    digestVerified: true,
    portableExport
  };
}
