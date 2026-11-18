/**
 * ProofPath PP-04-B — Trusted Configuration Foundation.
 *
 * Loads the approved, frozen PP-01 schemas from the
 * application's trusted repository installation.
 *
 * The schema authority does not originate from a
 * transaction presenter, evidence fixture or HTTP client.
 *
 * This module does not establish policy approval,
 * authenticate evidence sources or perform payments.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  createRuntimeValidator
} from "../../core/validate.js";

import type {
  RuntimeValidator
} from "../../core/validate.js";

/**
 * Baseline fingerprints established before PP-04-B
 * implementation began.
 *
 * These are byte-level SHA-256 commitments.
 */
export const PP04_APPROVED_SCHEMA_DIGESTS = Object.freeze({
  evidence:
    "b5b59658fc9639229e6d84f411581e24c8c8b22c3ceba26882bae35ad87f2d1b",

  audit:
    "382157c158ecfe6084add05e70daa7cbaee7230bf9c0f4b2a0cdac8c1a26894b"
} as const);

/**
 * Approved repository-relative schema locations.
 */
export const PP04_SCHEMA_PATHS = Object.freeze({
  evidence: "schemas/proofpath-evidence-v1.schema.json",
  audit: "schemas/proofpath-audit-event-v1.schema.json"
} as const);

/**
 * Read a frozen schema and enforce its approved digest.
 *
 * The repository root is supplied by the trusted
 * application bootstrap, never by untrusted evidence
 * or by a browser request.
 */
function loadApprovedSchema(
  repositoryRoot: string,
  relativePath: string,
  approvedDigest: string
): object {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.trim() === ""
  ) {
    throw new TypeError(
      "Trusted repository root is required"
    );
  }

  const schemaPath = resolve(
    repositoryRoot,
    relativePath
  );

  const bytes = readFileSync(schemaPath);

  const actualDigest = createHash("sha256")
    .update(bytes)
    .digest("hex");

  if (actualDigest !== approvedDigest) {
    throw new Error(
      "PP-04 trusted schema fingerprint mismatch"
    );
  }

  const parsed: unknown = JSON.parse(
    bytes.toString("utf8")
  );

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new TypeError(
      "Approved PP-01 schema must be an object"
    );
  }

  return parsed;
}

/**
 * Build the approved PP-01 runtime validator.
 *
 * This function does not accept caller-supplied
 * schema objects or caller-provided schema digests.
 *
 * It must be called by trusted application bootstrap
 * code using the approved repository installation.
 */
export function createPP04TrustedValidator(
  repositoryRoot: string
): RuntimeValidator {
  const evidenceSchema = loadApprovedSchema(
    repositoryRoot,
    PP04_SCHEMA_PATHS.evidence,
    PP04_APPROVED_SCHEMA_DIGESTS.evidence
  );

  const auditSchema = loadApprovedSchema(
    repositoryRoot,
    PP04_SCHEMA_PATHS.audit,
    PP04_APPROVED_SCHEMA_DIGESTS.audit
  );

  return createRuntimeValidator(
    evidenceSchema,
    auditSchema
  );
}
