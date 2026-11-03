
/**
 * ProofPath PP-02 — SELLER-01 Seller Binding Evaluator.
 *
 * Deterministic, offline and fail-closed.
 *
 * Evaluates consistency among:
 * - registered seller agent and receiving wallet;
 * - advertised and authorized service endpoint;
 * - x402 commercial payTo recipient;
 * - finalized settlement recipient;
 * - seller-attributed delivery evidence.
 *
 * This function DOES NOT authenticate Registry observations,
 * endpoint signatures, settlement proofs, or delivery signatures.
 *
 * A consistent set of caller-supplied claims is not proof.
 */

import type {
  PP02Decision,
  PP02EvidenceReference,
  PP02RegistryCoordinate,
  PP02SellerBindingDecision,
  PP02SellerBindingInput
} from "./types.js";

const HEX_64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function sameRegistry(
  a: PP02RegistryCoordinate,
  b: PP02RegistryCoordinate
): boolean {
  return a.network === b.network &&
    a.contractIndex === b.contractIndex &&
    a.contractSubindex === b.contractSubindex;
}

function validBlock(
  block: unknown,
  network: string
): boolean {
  if (!block || typeof block !== "object") {
    return false;
  }

  const value = block as Record<string, unknown>;

  return value.network === network &&
    typeof value.height === "string" &&
    DECIMAL.test(value.height) &&
    typeof value.hash === "string" &&
    HEX_64.test(value.hash) &&
    value.finalized === true;
}

function validEvidence(
  evidence: PP02EvidenceReference[]
): boolean {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of evidence) {
    if (!item ||
        !nonEmpty(item.evidenceId) ||
        !nonEmpty(item.sourceRef) ||
        ![
          "source_claim",
          "authenticated_observation",
          "independent_verification"
        ].includes(item.origin) ||
        (
          item.verifierRef !== null &&
          !nonEmpty(item.verifierRef)
        ) ||
        (
          item.origin === "independent_verification" &&
          !nonEmpty(item.verifierRef)
        ) ||
        ids.has(item.evidenceId)) {
      return false;
    }

    ids.add(item.evidenceId);
  }

  return true;
}

function collectIds(
  ...groups: PP02EvidenceReference[][]
): string[] {
  return [...new Set(
    groups.flat().map(item => item.evidenceId)
  )].sort();
}

function decision(
  input: PP02SellerBindingInput,
  status: PP02Decision["status"],
  reasonCode: string,
  evidenceIds: string[] = []
): PP02SellerBindingDecision {
  return {
    gate: "SELLER-01",
    status,
    reasonCode,
    evidenceIds: [...new Set(evidenceIds)].sort(),
    sellerAgentRef: input.seller?.agentRef ?? null,
    transactionRef: input.terms?.transactionRef ?? null,
    policyId: input.policy.policyId
  };
}

/**
 * Evaluate the supplied seller evidence against a strict
 * transaction-specific binding policy.
 *
 * This function returns:
 * - failed: explicit inconsistency or unsafe policy;
 * - indeterminate: missing or unauthenticated evidence.
 *
 * It never returns verified because no external
 * authentication or cryptographic verification occurs here.
 */
export function evaluateSellerBinding(
  input: PP02SellerBindingInput
): PP02SellerBindingDecision {
  if (!input ||
      !input.policy ||
      !input.registryTrust) {
    throw new TypeError("Malformed seller binding input");
  }

  const {
    policy,
    registryTrust,
    seller,
    endpoint,
    terms,
    settlement,
    delivery
  } = input;

  if (!nonEmpty(policy.policyId) ||
      policy.requireTrustedRegistry !== true ||
      policy.requireAuthenticatedEndpoint !== true ||
      policy.requireFinalizedSettlement !== true ||
      policy.requireAuthenticatedDelivery !== true) {
    return decision(
      input, "failed", "unsafe_or_invalid_seller_policy"
    );
  }

  if (registryTrust.gate !== "TRUST-01" ||
      !registryTrust.registry ||
      ![
        "verified",
        "failed",
        "indeterminate",
        "not_evaluated"
      ].includes(registryTrust.status)) {
    return decision(
      input, "failed", "invalid_registry_trust_decision"
    );
  }

  if (registryTrust.status === "failed") {
    return decision(
      input,
      "failed",
      "registry_trust_failed",
      registryTrust.evidenceIds
    );
  }

  if (seller === null) {
    return decision(
      input, "indeterminate", "seller_registry_evidence_missing"
    );
  }

  if (!nonEmpty(seller.agentRef) ||
      !nonEmpty(seller.ownerAccount) ||
      !seller.registry ||
      !sameRegistry(
        seller.registry,
        registryTrust.registry
      )) {
    return decision(
      input, "failed", "seller_registry_binding_mismatch"
    );
  }

  if (!validBlock(
    seller.block, seller.registry.network
  )) {
    return decision(
      input, "failed", "invalid_seller_registry_snapshot"
    );
  }

  if (!validEvidence(seller.evidence)) {
    return decision(
      input, "failed", "invalid_seller_registry_evidence"
    );
  }

  const sellerIds = collectIds(seller.evidence);

  if (seller.active !== true) {
    return decision(
      input, "failed", "seller_agent_not_active", sellerIds
    );
  }

  if (seller.agentWallet === null) {
    return decision(
      input, "indeterminate", "seller_wallet_missing", sellerIds
    );
  }

  if (!nonEmpty(seller.agentWallet)) {
    return decision(
      input, "failed", "invalid_seller_wallet", sellerIds
    );
  }

  if (terms === null) {
    return decision(
      input, "indeterminate", "commercial_terms_missing", sellerIds
    );
  }

  if (!nonEmpty(terms.transactionRef) ||
      !nonEmpty(terms.merchantRef) ||
      !nonEmpty(terms.endpoint) ||
      !nonEmpty(terms.payTo) ||
      !validEvidence(terms.evidence)) {
    return decision(
      input, "failed", "invalid_commercial_terms", sellerIds
    );
  }

  const termsIds = collectIds(
    seller.evidence, terms.evidence
  );

  if (seller.agentWallet !== terms.payTo) {
    return decision(
      input, "failed", "seller_wallet_payto_mismatch", termsIds
    );
  }

  if (endpoint === null) {
    return decision(
      input, "indeterminate", "seller_endpoint_evidence_missing",
      termsIds
    );
  }

  if (!nonEmpty(endpoint.agentRef) ||
      !nonEmpty(endpoint.endpoint) ||
      !validEvidence(endpoint.evidence)) {
    return decision(
      input, "failed", "invalid_endpoint_evidence", termsIds
    );
  }

  const endpointIds = collectIds(
    seller.evidence,
    terms.evidence,
    endpoint.evidence
  );

  if (endpoint.agentRef !== seller.agentRef ||
      endpoint.endpoint !== terms.endpoint) {
    return decision(
      input, "failed", "seller_endpoint_binding_mismatch",
      endpointIds
    );
  }

  if (endpoint.cardDigestSha256 !== null &&
      !HEX_64.test(endpoint.cardDigestSha256)) {
    return decision(
      input, "failed", "invalid_agent_card_digest",
      endpointIds
    );
  }

  if (!nonEmpty(endpoint.authorizationKeyRef) ||
      !nonEmpty(endpoint.verifierRef)) {
    return decision(
      input, "indeterminate",
      "endpoint_authorization_not_established",
      endpointIds
    );
  }

  if (settlement === null) {
    return decision(
      input, "indeterminate", "settlement_evidence_missing",
      endpointIds
    );
  }

  if (!nonEmpty(settlement.transactionRef) ||
      !nonEmpty(settlement.recipient) ||
      !validEvidence(settlement.evidence) ||
      !validBlock(
        settlement.block, seller.registry.network
      )) {
    return decision(
      input, "failed", "invalid_settlement_evidence",
      endpointIds
    );
  }

  const settlementIds = collectIds(
    seller.evidence,
    terms.evidence,
    endpoint.evidence,
    settlement.evidence
  );

  if (settlement.transactionRef !== terms.transactionRef) {
    return decision(
      input, "failed", "settlement_transaction_mismatch",
      settlementIds
    );
  }

  if (settlement.recipient !== terms.payTo ||
      settlement.recipient !== seller.agentWallet) {
    return decision(
      input, "failed", "settlement_recipient_mismatch",
      settlementIds
    );
  }

  if (!nonEmpty(settlement.verifierRef)) {
    return decision(
      input, "indeterminate",
      "settlement_authentication_not_established",
      settlementIds
    );
  }

  if (delivery === null) {
    return decision(
      input, "indeterminate", "delivery_evidence_missing",
      settlementIds
    );
  }

  if (!nonEmpty(delivery.transactionRef) ||
      !nonEmpty(delivery.agentRef) ||
      !nonEmpty(delivery.signerKeyRef) ||
      !validEvidence(delivery.evidence)) {
    return decision(
      input, "failed", "invalid_delivery_evidence",
      settlementIds
    );
  }

  const allIds = collectIds(
    seller.evidence,
    terms.evidence,
    endpoint.evidence,
    settlement.evidence,
    delivery.evidence
  );

  if (delivery.transactionRef !== terms.transactionRef ||
      delivery.agentRef !== seller.agentRef) {
    return decision(
      input, "failed", "delivery_transaction_or_agent_mismatch",
      allIds
    );
  }

  /*
   * This narrow policy requires the delivery signer key
   * reference to match the endpoint authorization key
   * reference. More flexible delegation relationships
   * would require a separately verified authorization rule.
   */
  if (delivery.signerKeyRef !==
      endpoint.authorizationKeyRef) {
    return decision(
      input, "failed", "delivery_signer_not_endpoint_authorized",
      allIds
    );
  }

  if (!nonEmpty(delivery.verifierRef)) {
    return decision(
      input, "indeterminate",
      "delivery_authentication_not_established",
      allIds
    );
  }

  /*
   * All bindings above compare caller-supplied records.
   *
   * In particular:
   * - Registry membership has not been authenticated;
   * - Agent Card endpoint control has not been proven;
   * - settlement has not been independently validated;
   * - delivery signatures have not been verified;
   * - trusted authorization policy has not been established.
   *
   * Therefore no positive verification claim is permitted.
   */
  return decision(
    input,
    "indeterminate",
    "external_seller_authentication_required",
    allIds
  );
}
