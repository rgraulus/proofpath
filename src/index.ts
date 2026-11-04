/**
 * ProofPath PP-01 — Public API entry point.
 *
 * Evidence schema, provenance, integrity, audit and export
 * primitives with an optional Concordium x402 reference profile.
 *
 * This API does not independently authenticate evidence,
 * establish payment finality, execute transactions, or
 * provide regulatory compliance certification.
 *
 * No network calls or payment operations occur on import.
 */

// Frozen PP-01 evidence and audit data contracts.
export type * from "./core/types.js";

// Deterministic ProofPath JSON serialization.
// This is not a claim of RFC 8785 conformance.
export {
  canonicalJson,
  canonicalJsonBytes
} from "./core/canonical.js";

// Byte-level and domain-separated SHA-256 commitments.
export {
  sha256Bytes,
  sha256Record
} from "./core/hash.js";

// Runtime validation using caller-supplied trusted schemas.
export {
  createRuntimeValidator
} from "./core/validate.js";

export type {
  RuntimeValidator
} from "./core/validate.js";

// Artifact integrity and provenance assessment.
export {
  assessArtifactProvenance
} from "./core/provenance.js";

// Logical hash-linked audit-journal primitives.
export {
  computeAuditEventDigest,
  verifyAuditJournal,
  appendAuditEvent
} from "./core/audit.js";

// Public/restricted portable evidence exports.
export {
  exportEvidence,
  verifyExportDigest
} from "./core/export.js";

export type {
  ExportDisclosure,
  PublicArtifactCommitment,
  PublicEvidenceExport,
  RestrictedEvidenceExport,
  PortableEvidenceExport
} from "./core/export.js";

// Optional Concordium x402 reference-normalization profile.
export {
  CONCORDIUM_X402_PROFILE,
  normalizeConcordiumX402Profile
} from "./profiles/concordium-x402.js";

export type {
  ConcordiumNetwork,
  ConcordiumX402ReferenceKind,
  ConcordiumX402ReferenceInput,
  ConcordiumX402ProfileInput,
  ConcordiumX402ProfileRecord
} from "./profiles/concordium-x402.js";

//
// ProofPath PP-02 — Deterministic trust and binding evaluators.
//
// These APIs assess evidence and policy consistency only.
// They do not independently authenticate blockchain state,
// identity presentations, endpoint control, settlement or delivery.
//

export type * from "./pp02/types.js";

export {
  evaluateRegistryTrust
} from "./pp02/registryTrust.js";

export {
  evaluateOwnerAssurance
} from "./pp02/ownerAssurance.js";

export {
  evaluateSellerBinding
} from "./pp02/sellerBinding.js";
//
// ProofPath PP-03 M3.1 — Trusted-node Registry snapshot verification.
//
// This API verifies a narrowly scoped finalized Registry
// module observation against an independently anchored policy.
//
// A positive result requires trusted application composition.
// Neither injected transports nor caller-calculated policy
// digests independently establish live trust.
//
// This is not historical upgrade-authority verification,
// independent consensus verification, or global TRUST-01 approval.
//

export type * from "./verification/types.js";

export {
  digestRegistryPolicy,
  verifyRegistrySnapshot
} from "./verification/registrySnapshot.js";

export {
  ConcordiumRegistrySnapshotTransport,
  createConcordiumRegistrySnapshotTransport
} from "./adapters/concordium/registrySnapshot.js";

export type {
  ConcordiumRegistryTransportOptions
} from "./adapters/concordium/registrySnapshot.js";
