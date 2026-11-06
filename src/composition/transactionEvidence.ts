/**
 * ProofPath PP-03 M3.5 — Offline Evidence Composition.
 *
 * Pure, deterministic, fail-closed composition of existing
 * verifier results into Evidence Manifest v1.
 *
 * Composition is not independent evidence authentication.
 * No settlement execution, network access, signatures,
 * identity verification or trust-policy approval occurs.
 */

import { canonicalJson } from "../core/canonical.js";
import type { RuntimeValidator } from "../core/validate.js";

import type {
  ClaimAssessment,
  EvidenceArtifact,
  EvidenceManifest,
  VerificationStatus
} from "../core/types.js";

import type {
  CompositionAssessmentProvenance,
  CompositionAssessmentSummary,
  CompositionClaimKind,
  CompositionDiagnostic,
  CompositionDiagnosticCode,
  CompositionDiagnostics,
  TransactionCompositionInput,
  TransactionCompositionResult
} from "./types.js";

const HEX64 = /^[0-9a-f]{64}$/;
const HEX16 = /^[0-9a-f]{16}$/;
const ATOMIC = /^(0|[1-9][0-9]*)$/;

const PROFILE = "proofpath.concordium.x402.v1";

const CLAIM_IDS: Record<CompositionClaimKind, string> = {
  facilitator_receipt: "pp03.m35.receipt",
  settlement_finality: "pp03.m35.settlement",
  agent_authority: "pp03.m35.agent-authority",
  seller_binding: "pp03.m35.seller-binding",
  delivery_record: "pp03.m35.delivery"
};

type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function timestamp(value: unknown): value is string {
  return nonempty(value) &&
    Number.isFinite(Date.parse(value));
}

function status(value: unknown): value is VerificationStatus {
  return value === "verified" ||
    value === "failed" ||
    value === "indeterminate" ||
    value === "not_evaluated" ||
    value === "not_applicable";
}

function uniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.every(nonempty) &&
    new Set(value).size === value.length;
}

/**
 * Canonical serialization provides an isolated,
 * deterministic JSON copy.
 *
 * Unsupported values, cycles and ambiguous structures
 * are rejected rather than silently normalized.
 */
function isolated<T>(value: T): T {
  return JSON.parse(canonicalJson(value)) as T;
}

function emptySummary(): CompositionAssessmentSummary {
  return {
    verified: 0,
    failed: 0,
    indeterminate: 0,
    notEvaluated: 0,
    notApplicable: 0
  };
}

function summarize(
  claims: ClaimAssessment[]
): CompositionAssessmentSummary {
  const result = emptySummary();

  for (const claim of claims) {
    switch (claim.status) {
      case "verified":
        result.verified++;
        break;
      case "failed":
        result.failed++;
        break;
      case "indeterminate":
        result.indeterminate++;
        break;
      case "not_evaluated":
        result.notEvaluated++;
        break;
      case "not_applicable":
        result.notApplicable++;
        break;
    }
  }

  return result;
}

function sortedDiagnostics(
  values: CompositionDiagnostic[]
): CompositionDiagnostic[] {
  const keys = new Set<string>();

  return values
    .filter(item => {
      const key = JSON.stringify([
        item.code,
        item.path,
        item.subjectRef
      ]);

      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    })
    .sort((a, b) =>
      a.path.localeCompare(b.path, "en") ||
      a.code.localeCompare(b.code, "en") ||
      (a.subjectRef ?? "").localeCompare(
        b.subjectRef ?? "", "en"
      )
    );
}

function diagnostics<
  S extends "composed" | "incomplete" | "rejected"
>(
  state: S,
  reasons: CompositionDiagnostic[],
  claims: ClaimAssessment[]
): CompositionDiagnostics & { status: S } {
  return {
    status: state,
    reasons: sortedDiagnostics(reasons),
    assessments: summarize(claims)
  };
}

function rejected(
  reasons: CompositionDiagnostic[],
  claims: ClaimAssessment[] = []
): TransactionCompositionResult {
  const output = diagnostics("rejected", reasons, claims);

  return {
    status: "rejected",
    manifest: null,
    diagnostics: output
  };
}

function validContext(
  input: TransactionCompositionInput
): boolean {
  if (!record(input) ||
      !record(input.context) ||
      !record(input.context.manifest) ||
      !record(input.context.expectedPayment) ||
      !record(input.context.expectedAgent) ||
      !record(input.context.expectedSeller) ||
      !record(input.context.expectedDelivery)) {
    return false;
  }

  const context = input.context;
  const manifest = context.manifest;
  const payment = context.expectedPayment;
  const agent = context.expectedAgent;
  const seller = context.expectedSeller;
  const delivery = context.expectedDelivery;

  if (!record(manifest.transaction) ||
      !record(manifest.participants) ||
      !record(manifest.commercialTerms) ||
      !record(manifest.audit) ||
      !record(manifest.governance)) {
    return false;
  }

  const terms = manifest.commercialTerms;

  return (
    nonempty(manifest.transaction.id) &&
    nonempty(manifest.transaction.correlationId) &&
    timestamp(manifest.transaction.recordedAt) &&

    (
      payment.network === "concordium:testnet" ||
      payment.network === "concordium:mainnet"
    ) &&

    payment.settlementProfile === "xcf_crp_plt_v1" &&
    typeof payment.transactionHash === "string" &&
    HEX64.test(payment.transactionHash) &&
    nonempty(payment.tokenId) &&
    Number.isSafeInteger(payment.decimals) &&
    payment.decimals >= 0 &&
    payment.decimals <= 255 &&
    typeof payment.amountRaw === "string" &&
    ATOMIC.test(payment.amountRaw) &&
    nonempty(payment.payTo) &&

    agent.network === payment.network &&
    (agent.participantRole === "buyer" ||
      agent.participantRole === "seller") &&
    nonempty(agent.agentRef) &&
    typeof agent.agentTokenIdHex === "string" &&
    HEX16.test(agent.agentTokenIdHex) &&

    nonempty(seller.sellerAgentRef) &&
    nonempty(seller.merchantRef) &&
    nonempty(seller.serviceEndpoint) &&
    seller.payTo === payment.payTo &&

    delivery.transactionRef === manifest.transaction.id &&
    delivery.sellerAgentRef === seller.sellerAgentRef &&
    nonempty(delivery.resourceRef) &&

    terms.amountAtomic === payment.amountRaw &&
    terms.asset === payment.tokenId &&
    terms.recipient === payment.payTo &&
    terms.resource === delivery.resourceRef
  );
}

function validArtifacts(
  artifacts: unknown,
  reasons: CompositionDiagnostic[]
): artifacts is EvidenceArtifact[] {
  if (!Array.isArray(artifacts)) {
    return false;
  }

  const ids = new Set<string>();
  let valid = true;

  for (let i = 0; i < artifacts.length; i++) {
    const value: unknown = artifacts[i];

    if (!record(value) ||
        !nonempty(value.id) ||
        !nonempty(value.kind) ||
        !nonempty(value.mediaType) ||
        typeof value.digestSha256 !== "string" ||
        !HEX64.test(value.digestSha256) ||
        !["included", "referenced", "unavailable"]
          .includes(String(value.availability)) ||
        !["public", "restricted"]
          .includes(String(value.disclosure)) ||
        !record(value.source) ||
        !nonempty(value.source.type) ||
        !nonempty(value.source.collectorRef) ||
        !nonempty(value.source.collectionMethod) ||
        !timestamp(value.source.observedAt) ||
        !timestamp(value.source.collectedAt) ||
        (
          value.source.producerRef !== null &&
          !nonempty(value.source.producerRef)
        ) ||
        (
          value.source.historicalContext !== null &&
          !record(value.source.historicalContext)
        )) {
      reasons.push({
        code: "invalid_composition_input",
        path: `/evidence/artifacts/${i}`,
        subjectRef: null
      });

      valid = false;
      continue;
    }

    if (ids.has(value.id)) {
      reasons.push({
        code: "duplicate_evidence_id",
        path: `/evidence/artifacts/${i}/id`,
        subjectRef: value.id
      });

      valid = false;
    }

    ids.add(value.id);
  }

  return valid;
}

function validateReferences(
  ids: unknown,
  available: Set<string>,
  path: string,
  reasons: CompositionDiagnostic[]
): boolean {
  if (!uniqueStrings(ids)) {
    reasons.push({
      code: "invalid_composition_input",
      path,
      subjectRef: null
    });

    return false;
  }

  let valid = true;

  for (const id of ids) {
    if (!available.has(id)) {
      reasons.push({
        code: "unknown_evidence_reference",
        path,
        subjectRef: id
      });

      valid = false;
    }
  }

  return valid;
}

function validProvenance(
  provenance: unknown,
  available: Set<string>,
  path: string,
  reasons: CompositionDiagnostic[]
): provenance is CompositionAssessmentProvenance {
  if (!record(provenance) ||
      (
        provenance.verifierRef !== null &&
        !nonempty(provenance.verifierRef)
      ) ||
      (
        provenance.evaluatedAt !== null &&
        !timestamp(provenance.evaluatedAt)
      )) {
    reasons.push({
      code: "invalid_composition_input",
      path,
      subjectRef: null
    });

    return false;
  }

  return validateReferences(
    provenance.evidenceIds,
    available,
    `${path}/evidenceIds`,
    reasons
  );
}

function verifiedProvenance(
  provenance: CompositionAssessmentProvenance
): boolean {
  return nonempty(provenance.verifierRef) &&
    timestamp(provenance.evaluatedAt) &&
    provenance.evidenceIds.length > 0;
}

function addClaim(
  claims: ClaimAssessment[],
  kind: CompositionClaimKind,
  claimType: string,
  subjectRef: string,
  sourceStatus: VerificationStatus,
  reasonCode: string,
  provenance: CompositionAssessmentProvenance
): void {
  claims.push({
    id: CLAIM_IDS[kind],
    type: claimType,
    subjectRef,
    status: sourceStatus,
    evidenceIds: [...provenance.evidenceIds].sort(),
    verifierRef: provenance.verifierRef,
    evaluatedAt: provenance.evaluatedAt,
    reasonCode
  });
}

function validResult(
  value: unknown,
  claim: string,
  assuranceModel: string
): value is RecordValue {
  return record(value) &&
    value.claim === claim &&
    value.assuranceModel === assuranceModel &&
    (
      value.status === "verified" ||
      value.status === "failed" ||
      value.status === "indeterminate"
    ) &&
    nonempty(value.reasonCode) &&
    nonempty(value.policyId) &&
    typeof value.policyDigest === "string" &&
    HEX64.test(value.policyDigest);
}

/**
 * Compose existing assessments without rerunning
 * their underlying verification operations.
 *
 * Input authenticity and independently approved policy
 * authority remain responsibilities of the caller.
 *
 * No result produced here constitutes a blanket
 * transaction-verification assertion.
 */
export function composeTransactionEvidence(
  input: TransactionCompositionInput,
  validator: Pick<RuntimeValidator, "validateManifest">
): TransactionCompositionResult {
  const reasons: CompositionDiagnostic[] = [];
  const claims: ClaimAssessment[] = [];
  let invalid = false;
  let incomplete = false;

  function add(
    code: CompositionDiagnosticCode,
    path: string,
    subjectRef: string | null = null,
    reject = false
  ): void {
    reasons.push({ code, path, subjectRef });

    if (reject) invalid = true;
    else incomplete = true;
  }

  let source: TransactionCompositionInput;

  try {
    source = isolated(input);
  } catch {
    return rejected([{
      code: "invalid_composition_input",
      path: "/",
      subjectRef: null
    }]);
  }

  if (!validator ||
      typeof validator.validateManifest !== "function") {
    return rejected([{
      code: "invalid_composition_input",
      path: "/validator",
      subjectRef: null
    }]);
  }

  if (!validContext(source)) {
    return rejected([{
      code: "invalid_trusted_context",
      path: "/context",
      subjectRef: null
    }]);
  }

  const context = source.context;
  const expected = context.expectedPayment;
  const transactionId = context.manifest.transaction.id;

  if (!record(source.evidence) ||
      !validArtifacts(source.evidence.artifacts, reasons)) {
    return rejected(reasons.length > 0 ? reasons : [{
      code: "invalid_composition_input",
      path: "/evidence",
      subjectRef: null
    }]);
  }

  const artifacts = [...source.evidence.artifacts]
    .sort((a, b) => a.id.localeCompare(b.id, "en"));

  const available = new Set(artifacts.map(item => item.id));

  const paymentIds = new Set<string>();
  const authorizationIds = new Set<string>();
  const deliveryIds = new Set<string>();

  function consume(
    provenance: CompositionAssessmentProvenance,
    target: Set<string>
  ): void {
    for (const id of provenance.evidenceIds) {
      target.add(id);
    }
  }

  function checkAssessment(
    provenance: unknown,
    resultStatus: VerificationStatus,
    path: string
  ): provenance is CompositionAssessmentProvenance {
    if (!validProvenance(
      provenance, available, `${path}/provenance`, reasons
    )) {
      invalid = true;
      return false;
    }

    if (resultStatus === "verified" &&
        !verifiedProvenance(provenance)) {
      add(
        "missing_verification_provenance",
        path,
        null,
        true
      );

      return false;
    }

    return true;
  }

  // M3.2: facilitator receipt signature and payment binding.

  if (source.receipt === null) {
    add("missing_verification_result", "/receipt");
  } else if (!record(source.receipt) ||
             !validResult(
               source.receipt.result,
               "facilitator_receipt_signature_and_binding",
               "trusted_facilitator_receipt_signature_v1"
             )) {
    add("invalid_verification_result", "/receipt", null, true);
  } else {
    const result = source.receipt.result;

    if (result.transactionHash !== null &&
        result.transactionHash !== expected.transactionHash) {
      add(
        "transaction_binding_mismatch",
        "/receipt/result/transactionHash",
        transactionId,
        true
      );
    }

    if (result.settlementIndependentlyVerified !== false ||
        typeof result.signatureAuthenticated !== "boolean" ||
        (
          result.status === "verified" &&
          (
            result.transactionHash !== expected.transactionHash ||
            result.signatureAuthenticated !== true ||
            !nonempty(result.signingKeyId)
          )
        )) {
      add(
        "invalid_verification_result",
        "/receipt/result",
        transactionId,
        true
      );
    }

    if (checkAssessment(
      source.receipt.provenance,
      result.status,
      "/receipt"
    )) {
      consume(source.receipt.provenance, paymentIds);

      addClaim(
        claims,
        "facilitator_receipt",
        result.claim,
        transactionId,
        result.status,
        result.reasonCode,
        source.receipt.provenance
      );

      if (result.status !== "verified") {
        add(
          result.status === "failed"
            ? "verification_failed"
            : "verification_indeterminate",
          "/receipt/result/status",
          transactionId
        );
      }
    }
  }

  // M3.3: finalized PLT transfer under trusted-node assumptions.

  if (source.settlement === null) {
    add("missing_verification_result", "/settlement");
  } else if (!record(source.settlement) ||
             !validResult(
               source.settlement.result,
               "finalized_plt_transfer_matches_expected_payment",
               "trusted_node_finalized_plt_transfer_v1"
             )) {
    add("invalid_verification_result", "/settlement", null, true);
  } else {
    const result = source.settlement.result;

    if (result.transactionHash !== expected.transactionHash) {
      add(
        "transaction_binding_mismatch",
        "/settlement/result/transactionHash",
        transactionId,
        true
      );
    }

    if (result.network !== expected.network) {
      add(
        "network_binding_mismatch",
        "/settlement/result/network",
        transactionId,
        true
      );
    }

    if (result.consensusIndependentlyVerified !== false ||
        (
          result.status === "verified" &&
          (
            result.transactionFinalized !== true ||
            result.transactionExecutionSucceeded !== true ||
            result.expectedPltTransferMatched !== true ||
            typeof result.blockHash !== "string" ||
            !HEX64.test(result.blockHash)
          )
        )) {
      add(
        "invalid_verification_result",
        "/settlement/result",
        transactionId,
        true
      );
    }

    if (checkAssessment(
      source.settlement.provenance,
      result.status,
      "/settlement"
    )) {
      consume(source.settlement.provenance, paymentIds);

      addClaim(
        claims,
        "settlement_finality",
        result.claim,
        transactionId,
        result.status,
        result.reasonCode,
        source.settlement.provenance
      );

      if (result.status !== "verified") {
        add(
          result.status === "failed"
            ? "verification_failed"
            : "verification_indeterminate",
          "/settlement/result/status",
          transactionId
        );
      }
    }
  }

  // M3.4: Registry ownership and CIS-8 external-key binding.
  // This is NOT an action-specific seller authorization claim.

  if (source.agentAuthority === null) {
    add("missing_verification_result", "/agentAuthority");
  } else if (!record(source.agentAuthority) ||
             !validResult(
               source.agentAuthority.result,
               "agent_registry_owner_external_key_binding_at_finalized_snapshot",
               "trusted_node_finalized_agent_key_binding_v1"
             )) {
    add(
      "invalid_verification_result",
      "/agentAuthority",
      null,
      true
    );
  } else {
    const result = source.agentAuthority.result;
    const agent = context.expectedAgent;

    if (result.network !== agent.network) {
      add(
        "network_binding_mismatch",
        "/agentAuthority/result/network",
        agent.agentRef,
        true
      );
    }

    if (result.agentTokenIdHex !== agent.agentTokenIdHex) {
      add(
        "agent_binding_mismatch",
        "/agentAuthority/result/agentTokenIdHex",
        agent.agentRef,
        true
      );
    }

    if (
      result.consensusIndependentlyVerified !== false ||
      result.historicalUpgradeAuthorityVerified !== false ||
      result.humanIdentityVerified !== false ||
      result.actionSpecificSigningAuthorityVerified !== false ||
      (
        result.status === "verified" &&
        (
          result.registryModulesApprovedByPolicy !== true ||
          result.snapshotFinalized !== true ||
          result.agentActive !== true ||
          result.ownerMatched !== true ||
          result.externalReferenceMatched !== true ||
          result.externalKeyRegistrationActive !== true ||
          result.externalKeyOwnerMatched !== true
        )
      )
    ) {
      add(
        "invalid_verification_result",
        "/agentAuthority/result",
        agent.agentRef,
        true
      );
    }

    if (checkAssessment(
      source.agentAuthority.provenance,
      result.status,
      "/agentAuthority"
    )) {
      consume(
        source.agentAuthority.provenance,
        authorizationIds
      );

      addClaim(
        claims,
        "agent_authority",
        result.claim,
        agent.agentRef,
        result.status,
        result.reasonCode,
        source.agentAuthority.provenance
      );

      if (result.status !== "verified") {
        add(
          result.status === "failed"
            ? "verification_failed"
            : "verification_indeterminate",
          "/agentAuthority/result/status",
          agent.agentRef
        );
      }
    }
  }

  // PP-02 SELLER-01: consistency assessment only.
  // Its existing implementation never authenticates the
  // external seller facts required for a positive claim.

  if (source.seller === null) {
    add("missing_verification_result", "/seller");
  } else if (!record(source.seller) ||
             !record(source.seller.result) ||
             source.seller.result.gate !== "SELLER-01" ||
             !nonempty(source.seller.result.reasonCode) ||
             !nonempty(source.seller.result.policyId) ||
             !uniqueStrings(source.seller.result.evidenceIds) ||
             !status(source.seller.result.status)) {
    add("invalid_verification_result", "/seller", null, true);
  } else {
    const result = source.seller.result;
    const seller = context.expectedSeller;

    if (result.status === "verified") {
      add(
        "unsupported_assurance_promotion",
        "/seller/result/status",
        seller.sellerAgentRef,
        true
      );
    }

    if (result.sellerAgentRef !== null &&
        result.sellerAgentRef !== seller.sellerAgentRef) {
      add(
        "seller_binding_mismatch",
        "/seller/result/sellerAgentRef",
        seller.sellerAgentRef,
        true
      );
    }

    if (result.transactionRef !== null &&
        result.transactionRef !== transactionId) {
      add(
        "transaction_binding_mismatch",
        "/seller/result/transactionRef",
        transactionId,
        true
      );
    }

    if (checkAssessment(
      source.seller.provenance,
      result.status,
      "/seller"
    )) {
      // Existing SELLER-01 evidence references must be
      // represented, not silently dropped.
      const supplied = new Set(
        source.seller.provenance.evidenceIds
      );

      for (const id of result.evidenceIds) {
        if (!supplied.has(id)) {
          add(
            "missing_supporting_evidence",
            "/seller/result/evidenceIds",
            id,
            true
          );
        }
      }

      consume(source.seller.provenance, authorizationIds);

      addClaim(
        claims,
        "seller_binding",
        "seller_binding_consistency",
        seller.sellerAgentRef,
        result.status,
        result.reasonCode,
        source.seller.provenance
      );

      if (result.status === "indeterminate") {
        add(
          "seller_authentication_not_established",
          "/seller/result/status",
          seller.sellerAgentRef
        );
      } else if (result.status === "failed") {
        add(
          "verification_failed",
          "/seller/result/status",
          seller.sellerAgentRef
        );
      }
    }
  }

  // Delivery: a recorded assertion, never independently
  // authenticated by M3.5 Option A.

  if (source.delivery === null) {
    add("missing_supporting_evidence", "/delivery");
  } else if (!record(source.delivery) ||
             !["delivered", "failed", "unknown"]
               .includes(String(source.delivery.reportedStatus))) {
    add("invalid_composition_input", "/delivery", null, true);
  } else {
    const delivery = source.delivery;
    const expectedDelivery = context.expectedDelivery;

    if (delivery.transactionRef !== expectedDelivery.transactionRef) {
      add(
        "delivery_binding_mismatch",
        "/delivery/transactionRef",
        transactionId,
        true
      );
    }

    if (delivery.sellerAgentRef !== expectedDelivery.sellerAgentRef) {
      add(
        "delivery_binding_mismatch",
        "/delivery/sellerAgentRef",
        expectedDelivery.sellerAgentRef,
        true
      );
    }

    if (delivery.resourceRef !== expectedDelivery.resourceRef) {
      add(
        "delivery_binding_mismatch",
        "/delivery/resourceRef",
        expectedDelivery.resourceRef,
        true
      );
    }

    if (checkAssessment(
      delivery.provenance,
      "indeterminate",
      "/delivery"
    )) {
      consume(delivery.provenance, deliveryIds);

      addClaim(
        claims,
        "delivery_record",
        "delivery_reported_not_authenticated",
        transactionId,
        "indeterminate",
        `delivery_reported_${delivery.reportedStatus}_unverified`,
        delivery.provenance
      );

      add(
        "delivery_authentication_not_established",
        "/delivery/reportedStatus",
        transactionId
      );
    }
  }

  // Preserve participant identity and commercial references
  // from trusted manifest context without inventing artifacts.

  const participants = context.manifest.participants;

  if (!record(participants.buyer) ||
      !record(participants.seller)) {
    add(
      "invalid_trusted_context",
      "/context/manifest/participants",
      null,
      true
    );
  } else {
    const selected = participants[
      context.expectedAgent.participantRole
    ];

    if (selected.agentRef !== context.expectedAgent.agentRef) {
      add(
        "agent_binding_mismatch",
        `/context/manifest/participants/${context.expectedAgent.participantRole}/agentRef`,
        context.expectedAgent.agentRef,
        true
      );
    }

    if (participants.seller.agentRef !==
        context.expectedSeller.sellerAgentRef) {
      add(
        "seller_binding_mismatch",
        "/context/manifest/participants/seller/agentRef",
        context.expectedSeller.sellerAgentRef,
        true
      );
    }
  }

  if (invalid) {
    return rejected(reasons, claims);
  }

  const manifest: EvidenceManifest = {
    schema: {
      type: "proofpath.transaction-evidence",
      version: "1.0.0",
      profile: PROFILE
    },

    transaction: context.manifest.transaction,
    participants: context.manifest.participants,
    commercialTerms: context.manifest.commercialTerms,

    authorization: {
      evidenceIds: [...authorizationIds].sort()
    },

    payment: {
      evidenceIds: [...paymentIds].sort()
    },

    delivery: {
      evidenceIds: [...deliveryIds].sort()
    },

    evidence: artifacts,

    audit: context.manifest.audit,

    assurance: {
      claims: claims.sort((a, b) =>
        a.id.localeCompare(b.id, "en")
      )
    },

    governance: context.manifest.governance
  };

  // Validate all references that may originate from
  // trusted context as well as composed assessments.

  const referenceGroups: Array<[string, unknown]> = [
    [
      "/participants/buyer/identityEvidenceIds",
      manifest.participants.buyer.identityEvidenceIds
    ],
    [
      "/participants/seller/identityEvidenceIds",
      manifest.participants.seller.identityEvidenceIds
    ],
    [
      "/authorization/evidenceIds",
      manifest.authorization.evidenceIds
    ],
    [
      "/payment/evidenceIds",
      manifest.payment.evidenceIds
    ],
    [
      "/delivery/evidenceIds",
      manifest.delivery.evidenceIds
    ]
  ];

  if (manifest.commercialTerms.termsEvidenceId !== undefined) {
    referenceGroups.push([
      "/commercialTerms/termsEvidenceId",
      [manifest.commercialTerms.termsEvidenceId]
    ]);
  }

  for (const [path, ids] of referenceGroups) {
    if (!validateReferences(ids, available, path, reasons)) {
      invalid = true;
    }
  }

  if (
    (manifest.commercialTerms.termsEvidenceId === undefined) !==
    (manifest.commercialTerms.termsDigestSha256 === undefined)
  ) {
    add(
      "invalid_trusted_context",
      "/context/manifest/commercialTerms",
      null,
      true
    );
  }

  if (invalid) {
    return rejected(reasons, claims);
  }

  // PP-01 runtime schema validation remains a separate,
  // explicit application responsibility. It must use the
  // independently trusted frozen schema, not a schema
  // supplied by the transaction presenter.
  //
  // No outcome below asserts transaction-wide assurance.

  // The caller supplies an independently trusted PP-01
  // schema validator. Validation is mandatory before
  // returning a manifest, including incomplete packages.
  //
  // Schema validity is not source authentication.

  try {
    const validation = validator.validateManifest(manifest);

    if (!validation.valid) {
      for (const issue of validation.issues) {
        add(
          "manifest_construction_failed",
          issue.path,
          null,
          true
        );
      }

      if (validation.issues.length === 0) {
        add(
          "manifest_construction_failed",
          "/",
          null,
          true
        );
      }
    }
  } catch {
    add(
      "manifest_construction_failed",
      "/",
      null,
      true
    );
  }

  if (invalid) {
    return rejected(reasons, claims);
  }

  const finalStatus = incomplete ? "incomplete" : "composed";

  return {
    status: finalStatus,
    manifest,
    diagnostics: diagnostics(finalStatus, reasons, claims)
  };
}
