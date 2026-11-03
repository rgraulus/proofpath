/**
 * ProofPath PP-01 — portable evidence data contracts.
 *
 * Types are compile-time declarations, NOT runtime verification.
 * No blockchain-specific dependencies are permitted in this module.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type Sha256Hex = string;
export type IsoTimestamp = string;
export type AtomicAmount = string;

export type VerificationStatus = "not_evaluated" | "verified" | "failed" | "indeterminate" | "not_applicable";

export type DisclosureClass = "public" | "restricted";
export type ArtifactAvailability =
  "included" | "referenced" | "unavailable";

export type JournalCompleteness =
  "complete_for_declared_scope" | "partial" | "unknown";

export interface EvidenceSchemaIdentity {
  type: "proofpath.transaction-evidence";
  version: "1.0.0";
  profile: string;
}

export interface Participant {
  agentRef: string | null;
  ownerRef: string | null;
  identityEvidenceIds: string[];
}

export interface CommercialTerms {
  method?: string;
  resource?: string;
  amountAtomic?: AtomicAmount;
  asset?: string;
  recipient?: string;
  termsEvidenceId?: string;
  termsDigestSha256?: Sha256Hex;
}

export interface EvidenceSource {
  type: string;
  producerRef: string | null;
  collectorRef: string;
  collectionMethod: string;
  observedAt: IsoTimestamp;
  collectedAt: IsoTimestamp;
  historicalContext: JsonObject | null;
}

export interface EvidenceArtifact {
  id: string;
  kind: string;
  mediaType: string;
  digestSha256: Sha256Hex;
  disclosure: DisclosureClass;
  availability: ArtifactAvailability;
  source: EvidenceSource;
}

export interface ClaimAssessment {
  id: string;
  type: string;
  subjectRef: string;
  status: VerificationStatus;
  evidenceIds: string[];
  verifierRef: string | null;
  evaluatedAt: IsoTimestamp | null;
  reasonCode: string | null;
}

export interface EvidenceManifest {
  schema: EvidenceSchemaIdentity;

  transaction: {
    id: string;
    correlationId: string;
    recordedAt: IsoTimestamp;
    status:
      | "attempted"
      | "pending"
      | "failed"
      | "evidence_collected"
      | "disputed";
  };

  participants: {
    buyer: Participant;
    seller: Participant;
  };

  commercialTerms: CommercialTerms;
  authorization: { evidenceIds: string[] };
  payment: { evidenceIds: string[] };
  delivery: { evidenceIds: string[] };
  evidence: EvidenceArtifact[];

  audit: {
    eventIds: string[];
    headDigestSha256: Sha256Hex | null;
    completeness: JournalCompleteness;
    coverageScope: string;
  };

  assurance: {
    claims: ClaimAssessment[];
  };

  governance: {
    disclosureProfile: DisclosureClass;
    retentionPolicyRef: string | null;
    retentionResponsibleParty: string | null;
    retentionUntil: IsoTimestamp | null;
    auditProfile: string;
  };
}

export type AuditEventType = "agent_action_requested" | "agent_action_completed" | "agent_action_failed" | "agent_identity_observed" | "identity_verification_failed" | "delegation_evaluated" | "authorization_denied" | "policy_evaluated" | "conditional_gate_denied" | "terms_presented" | "terms_accepted" | "payment_challenged" | "payment_submitted" | "payment_finalized" | "payment_failed" | "delivery_attested" | "delivery_disputed" | "evidence_collected" | "evidence_unavailable" | "integrity_check_failed" | "claim_verified" | "claim_failed" | "claim_indeterminate" | "oversight_action_recorded" | "audit_export_created" | "retention_action_recorded";

export type AuditOutcome =
  | "succeeded"
  | "failed"
  | "denied"
  | "pending"
  | "unknown"
  | "not_applicable";

export interface AuditEvent {
  schema: {
    type: "proofpath.audit-event";
    version: "1.0.0";
  };

  eventId: string;
  transactionId: string;
  correlationId: string;
  eventType: AuditEventType;
  sequence: number;

  source: {
    sourceType: string;
    producerRef: string | null;
    collectorRef: string;
    authenticationEvidenceIds: string[];
  };

  sourceEventAt: IsoTimestamp | null;
  observedAt: IsoTimestamp;
  outcome: AuditOutcome;
  payloadVersion: string;
  payload: JsonObject;
  evidenceIds: string[];
  previousDigestSha256: Sha256Hex | null;
  eventDigestSha256: Sha256Hex;
  externalAnchorRefs: string[];
}
