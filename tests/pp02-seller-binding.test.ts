
/**
 * ProofPath PP-02 — SELLER-01 deterministic acceptance tests.
 *
 * Synthetic, offline fixtures only.
 * No Registry writes, settlement operations or payments.
 *
 * Matching caller-supplied facts never establish
 * independent seller authentication.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateSellerBinding
} from "../src/pp02/sellerBinding.js";

import type {
  PP02EvidenceReference,
  PP02RegistryTrustDecision,
  PP02SellerBindingInput
} from "../src/pp02/types.js";

const BLOCK_HASH = "a".repeat(64);
const CARD_DIGEST = "b".repeat(64);

function evidence(
  id: string,
  origin: PP02EvidenceReference["origin"] = "source_claim"
): PP02EvidenceReference {
  return {
    evidenceId: id,
    origin,
    sourceRef: "synthetic:seller-evidence",
    verifierRef:
      origin === "independent_verification"
        ? "synthetic:verifier"
        : null
  };
}

function registryTrust(): PP02RegistryTrustDecision {
  return {
    gate: "TRUST-01",
    status: "indeterminate",
    reasonCode: "external_registry_authentication_required",
    evidenceIds: ["registry-observation"],
    registry: {
      network: "concordium:testnet",
      contractIndex: "12802",
      contractSubindex: "0"
    },
    observedModule: "c".repeat(64),
    policyId: "synthetic:registry-policy"
  };
}

function fixture(): PP02SellerBindingInput {
  const trust = registryTrust();

  return {
    policy: {
      policyId: "synthetic:seller-policy",
      requireTrustedRegistry: true,
      requireAuthenticatedEndpoint: true,
      requireFinalizedSettlement: true,
      requireAuthenticatedDelivery: true
    },
    registryTrust: trust,
    seller: {
      agentRef: "synthetic:seller-agent",
      ownerAccount: "synthetic:seller-owner",
      agentWallet: "synthetic:seller-wallet",
      active: true,
      registry: {...trust.registry},
      block: {
        network: "concordium:testnet",
        height: "100",
        hash: BLOCK_HASH,
        finalized: true
      },
      evidence: [evidence("seller-registry")]
    },
    endpoint: {
      agentRef: "synthetic:seller-agent",
      endpoint: "https://seller.example.test/resource",
      cardDigestSha256: CARD_DIGEST,
      authorizationKeyRef: "synthetic:seller-key",
      verifierRef: "synthetic:verifier",
      evidence: [evidence("endpoint-authorization")]
    },
    terms: {
      transactionRef: "synthetic:transaction-A",
      merchantRef: "synthetic:merchant-A",
      endpoint: "https://seller.example.test/resource",
      payTo: "synthetic:seller-wallet",
      evidence: [evidence("commercial-terms")]
    },
    settlement: {
      transactionRef: "synthetic:transaction-A",
      recipient: "synthetic:seller-wallet",
      block: {
        network: "concordium:testnet",
        height: "101",
        hash: "d".repeat(64),
        finalized: true
      },
      verifierRef: "synthetic:verifier",
      evidence: [evidence("settlement")]
    },
    delivery: {
      transactionRef: "synthetic:transaction-A",
      agentRef: "synthetic:seller-agent",
      signerKeyRef: "synthetic:seller-key",
      verifierRef: "synthetic:verifier",
      evidence: [evidence("delivery")]
    }
  };
}

test("SELLER-01: consistent evidence remains indeterminate", () => {
  const result = evaluateSellerBinding(fixture());

  assert.equal(result.gate, "SELLER-01");
  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "external_seller_authentication_required"
  );
  assert.equal(result.sellerAgentRef, "synthetic:seller-agent");
  assert.equal(result.transactionRef, "synthetic:transaction-A");
});

test("SELLER-01: verification labels cannot authenticate seller", () => {
  const input = fixture();

  input.seller!.evidence = [
    evidence("seller-registry", "independent_verification")
  ];
  input.endpoint!.evidence = [
    evidence("endpoint-authorization", "independent_verification")
  ];
  input.terms!.evidence = [
    evidence("commercial-terms", "independent_verification")
  ];
  input.settlement!.evidence = [
    evidence("settlement", "independent_verification")
  ];
  input.delivery!.evidence = [
    evidence("delivery", "independent_verification")
  ];

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.notEqual(result.status, "verified");
});

test("SELLER-01: failed Registry trust propagates", () => {
  const input = fixture();
  input.registryTrust.status = "failed";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "registry_trust_failed");
});

test("SELLER-01: missing seller is indeterminate", () => {
  const input = fixture();
  input.seller = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "seller_registry_evidence_missing"
  );
});

test("SELLER-01: substituted Registry contract fails", () => {
  const input = fixture();
  input.seller!.registry.contractIndex = "99999";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "seller_registry_binding_mismatch");
});

test("SELLER-01: unfinalized seller snapshot fails", () => {
  const input = fixture();
  input.seller!.block.finalized = false;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "invalid_seller_registry_snapshot"
  );
});

test("SELLER-01: inactive seller fails", () => {
  const input = fixture();
  input.seller!.active = false;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "seller_agent_not_active");
});

test("SELLER-01: missing seller wallet is indeterminate", () => {
  const input = fixture();
  input.seller!.agentWallet = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "seller_wallet_missing");
});

test("SELLER-01: substituted payTo fails", () => {
  const input = fixture();
  input.terms!.payTo = "synthetic:attacker-wallet";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "seller_wallet_payto_mismatch");
});

test("SELLER-01: missing commercial terms is indeterminate", () => {
  const input = fixture();
  input.terms = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "commercial_terms_missing");
});

test("SELLER-01: missing endpoint evidence is indeterminate", () => {
  const input = fixture();
  input.endpoint = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "seller_endpoint_evidence_missing"
  );
});

test("SELLER-01: substituted endpoint fails", () => {
  const input = fixture();
  input.endpoint!.endpoint =
    "https://attacker.example.test/resource";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "seller_endpoint_binding_mismatch");
});

test("SELLER-01: endpoint attributed to another agent fails", () => {
  const input = fixture();
  input.endpoint!.agentRef = "synthetic:other-agent";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "seller_endpoint_binding_mismatch");
});

test("SELLER-01: invalid Agent Card digest fails", () => {
  const input = fixture();
  input.endpoint!.cardDigestSha256 = "invalid-digest";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_agent_card_digest");
});

test("SELLER-01: Agent Card alone cannot prove endpoint control", () => {
  const input = fixture();
  input.endpoint!.authorizationKeyRef = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "endpoint_authorization_not_established"
  );
});

test("SELLER-01: missing settlement is indeterminate", () => {
  const input = fixture();
  input.settlement = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "settlement_evidence_missing");
});

test("SELLER-01: settlement from another transaction fails", () => {
  const input = fixture();
  input.settlement!.transactionRef = "synthetic:transaction-B";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "settlement_transaction_mismatch");
});

test("SELLER-01: substituted settlement recipient fails", () => {
  const input = fixture();
  input.settlement!.recipient = "synthetic:attacker-wallet";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "settlement_recipient_mismatch");
});

test("SELLER-01: unfinalized settlement fails", () => {
  const input = fixture();
  input.settlement!.block.finalized = false;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_settlement_evidence");
});

test("SELLER-01: unverified settlement stays indeterminate", () => {
  const input = fixture();
  input.settlement!.verifierRef = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "settlement_authentication_not_established"
  );
});

test("SELLER-01: missing delivery is indeterminate", () => {
  const input = fixture();
  input.delivery = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "delivery_evidence_missing");
});

test("SELLER-01: delivery receipt substitution fails", () => {
  const input = fixture();
  input.delivery!.transactionRef = "synthetic:transaction-B";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "delivery_transaction_or_agent_mismatch"
  );
});

test("SELLER-01: delivery by another agent fails", () => {
  const input = fixture();
  input.delivery!.agentRef = "synthetic:other-agent";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "delivery_transaction_or_agent_mismatch"
  );
});

test("SELLER-01: unauthorized delivery signer fails", () => {
  const input = fixture();
  input.delivery!.signerKeyRef = "synthetic:other-key";

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "delivery_signer_not_endpoint_authorized"
  );
});

test("SELLER-01: missing delivery verifier is indeterminate", () => {
  const input = fixture();
  input.delivery!.verifierRef = null;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "delivery_authentication_not_established"
  );
});

test("SELLER-01: relaxed endpoint policy fails closed", () => {
  const input = fixture();
  input.policy.requireAuthenticatedEndpoint = false;

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "unsafe_or_invalid_seller_policy"
  );
});

test("SELLER-01: missing seller evidence fails", () => {
  const input = fixture();
  input.seller!.evidence = [];

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_seller_registry_evidence");
});

test("SELLER-01: duplicate endpoint evidence IDs fail", () => {
  const input = fixture();
  input.endpoint!.evidence.push(evidence("endpoint-authorization"));

  const result = evaluateSellerBinding(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_endpoint_evidence");
});

test("SELLER-01: malformed input throws", () => {
  assert.throws(
    () => evaluateSellerBinding(
      null as unknown as PP02SellerBindingInput
    ),
    TypeError
  );
});

test("SELLER-01: input remains unchanged", () => {
  const input = fixture();
  const original = structuredClone(input);

  evaluateSellerBinding(input);

  assert.deepEqual(input, original);
});
