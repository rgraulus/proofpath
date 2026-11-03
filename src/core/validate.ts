/**
 * ProofPath PP-01 — Runtime evidence validation.
 *
 * Enforces structural and reference consistency.
 * Does not authenticate sources, verify signatures,
 * confirm settlement, or establish claim truth.
 *
 * Schema arguments must come from trusted application
 * configuration, never from untrusted evidence packages.
 */

import { createRequire } from "node:module";

import type { ValidateFunction } from "ajv";
import type {
  AuditEvent,
  EvidenceManifest
} from "./types.js";

const requireModule = createRequire(import.meta.url);
const Ajv2020: typeof import("ajv/dist/2020.js").Ajv2020 =
  requireModule("ajv/dist/2020.js").default;
const addFormats: typeof import("ajv-formats").default =
  requireModule("ajv-formats").default;

export interface ValidationIssue {
  code: string;
  path: string;
}

export type ValidationResult<T> =
  | { valid: true; value: T; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

export interface RuntimeValidator {
  validateManifest(value: unknown): ValidationResult<EvidenceManifest>;
  validateEvent(
    value: unknown,
    manifest?: EvidenceManifest
  ): ValidationResult<AuditEvent>;
}

function issue(code: string, path: string): ValidationIssue {
  return { code, path };
}

function schemaIssues(
  validate: ValidateFunction
): ValidationIssue[] {
  return (validate.errors ?? []).map((error) => ({
    code: "schema_" + error.keyword,
    path: error.instancePath || "/"
  }));
}

function validateReferences(
  refs: string[],
  ids: Set<string>,
  path: string,
  issues: ValidationIssue[]
): void {
  for (let i = 0; i < refs.length; i++) {
    if (!ids.has(refs[i]!)) {
      issues.push(
        issue("unknown_evidence_reference", `${path}/${i}`)
      );
    }
  }
}

function semanticManifestIssues(
  manifest: EvidenceManifest
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (let i = 0; i < manifest.evidence.length; i++) {
    const id = manifest.evidence[i]!.id;

    if (ids.has(id)) {
      issues.push(issue("duplicate_artifact_id", `/evidence/${i}/id`));
    }

    ids.add(id);
  }

  const refs: Array<[string, string[]]> = [
    [
      "/participants/buyer/identityEvidenceIds",
      manifest.participants.buyer.identityEvidenceIds
    ],
    [
      "/participants/seller/identityEvidenceIds",
      manifest.participants.seller.identityEvidenceIds
    ],
    ["/authorization/evidenceIds", manifest.authorization.evidenceIds],
    ["/payment/evidenceIds", manifest.payment.evidenceIds],
    ["/delivery/evidenceIds", manifest.delivery.evidenceIds]
  ];

  for (const [path, values] of refs) {
    validateReferences(values, ids, path, issues);
  }

  const terms = manifest.commercialTerms;

  if (terms.termsEvidenceId !== undefined) {
    validateReferences(
      [terms.termsEvidenceId],
      ids,
      "/commercialTerms/termsEvidenceId",
      issues
    );
  }

  if (
    (terms.termsEvidenceId === undefined) !==
    (terms.termsDigestSha256 === undefined)
  ) {
    issues.push(
      issue("incomplete_terms_commitment", "/commercialTerms")
    );
  }

  const claimIds = new Set<string>();

  for (let i = 0; i < manifest.assurance.claims.length; i++) {
    const claim = manifest.assurance.claims[i]!;

    if (claimIds.has(claim.id)) {
      issues.push(
        issue("duplicate_claim_id", `/assurance/claims/${i}/id`)
      );
    }

    claimIds.add(claim.id);

    validateReferences(
      claim.evidenceIds,
      ids,
      `/assurance/claims/${i}/evidenceIds`,
      issues
    );

    if (
      claim.status === "verified" &&
      (
        claim.evidenceIds.length === 0 ||
        !claim.verifierRef ||
        !claim.evaluatedAt
      )
    ) {
      issues.push(
        issue(
          "verified_claim_metadata_incomplete",
          `/assurance/claims/${i}`
        )
      );
    }
  }

  if (
    manifest.audit.eventIds.length === 0 &&
    manifest.audit.headDigestSha256 !== null
  ) {
    issues.push(
      issue("unexpected_journal_head", "/audit/headDigestSha256")
    );
  }

  if (
    manifest.audit.eventIds.length > 0 &&
    manifest.audit.headDigestSha256 === null
  ) {
    issues.push(
      issue("missing_journal_head", "/audit/headDigestSha256")
    );
  }

  return issues;
}

function semanticEventIssues(
  event: AuditEvent,
  manifest?: EvidenceManifest
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (event.sequence === 1 && event.previousDigestSha256 !== null) {
    issues.push(
      issue("unexpected_previous_digest", "/previousDigestSha256")
    );
  }

  if (event.sequence > 1 && event.previousDigestSha256 === null) {
    issues.push(
      issue("missing_previous_digest", "/previousDigestSha256")
    );
  }

  if (!manifest) return issues;

  if (event.transactionId !== manifest.transaction.id) {
    issues.push(
      issue("transaction_id_mismatch", "/transactionId")
    );
  }

  if (event.correlationId !== manifest.transaction.correlationId) {
    issues.push(
      issue("correlation_id_mismatch", "/correlationId")
    );
  }

  if (!manifest.audit.eventIds.includes(event.eventId)) {
    issues.push(
      issue("event_not_declared", "/eventId")
    );
  }

  const ids = new Set(manifest.evidence.map((item) => item.id));

  validateReferences(
    event.evidenceIds,
    ids,
    "/evidenceIds",
    issues
  );

  validateReferences(
    event.source.authenticationEvidenceIds,
    ids,
    "/source/authenticationEvidenceIds",
    issues
  );

  return issues;
}

/**
 * Create a strict validator using trusted ProofPath schemas.
 *
 * The schema objects must be supplied by the host application.
 * Successful validation indicates structural consistency only.
 */
export function createRuntimeValidator(
  evidenceSchema: object,
  auditSchema: object
): RuntimeValidator {
  const ajv = new Ajv2020({
    strict: true,
    allErrors: true,
    validateFormats: true,
    coerceTypes: false,
    removeAdditional: false,
    useDefaults: false
  });

  addFormats(ajv);

  const checkManifest = ajv.compile(evidenceSchema);
  const checkEvent = ajv.compile(auditSchema);

  function validateManifest(
    value: unknown
  ): ValidationResult<EvidenceManifest> {
    if (!checkManifest(value)) {
      return {
        valid: false,
        issues: schemaIssues(checkManifest)
      };
    }

    const manifest = value as EvidenceManifest;
    const issues = semanticManifestIssues(manifest);

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    return { valid: true, value: manifest, issues: [] };
  }

  function validateEvent(
    value: unknown,
    manifest?: EvidenceManifest
  ): ValidationResult<AuditEvent> {
    if (!checkEvent(value)) {
      return {
        valid: false,
        issues: schemaIssues(checkEvent)
      };
    }

    const event = value as AuditEvent;
    const issues = semanticEventIssues(event, manifest);

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    return { valid: true, value: event, issues: [] };
  }

  return {
    validateManifest,
    validateEvent
  };
}
