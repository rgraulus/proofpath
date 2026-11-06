/**
 * ProofPath PP-03 M3.5-C — Offline Composition Acceptance.
 *
 * Synthetic fixtures only.
 *
 * Tests distinguish:
 * - composition validity from transaction assurance;
 * - verified source assessments from caller authentication;
 * - seller consistency from seller authentication;
 * - reported delivery from authenticated delivery.
 *
 * No network, blockchain, payment or identity operations.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  composeTransactionEvidence as composeWithValidation
} from "../src/composition/transactionEvidence.js";

import { createRuntimeValidator }
  from "../src/core/validate.js";

import type {
  TransactionCompositionInput
} from "../src/composition/types.js";

const TIME = "2026-11-06T10:00:00Z";
const TX_HASH = "a".repeat(64);
const BLOCK_HASH = "b".repeat(64);
const POLICY_DIGEST = "c".repeat(64);
const ARTIFACT_DIGEST = "d".repeat(64);
const AGENT_TOKEN = "0000000000000001";

const NETWORK = "concordium:testnet";
const TRANSACTION = "synthetic-transaction-001";
const BUYER = "synthetic-buyer-agent";
const SELLER = "synthetic-seller-agent";
const PAY_TO = "synthetic-seller-account";

const IDS = {
  receipt: "evidence-receipt",
  settlement: "evidence-settlement",
  agent: "evidence-agent",
  seller: "evidence-seller",
  delivery: "evidence-delivery"
} as const;

const evidenceSchema = JSON.parse(
  readFileSync(
    "schemas/proofpath-evidence-v1.schema.json",
    "utf8"
  )
) as object;

const auditSchema = JSON.parse(
  readFileSync(
    "schemas/proofpath-audit-event-v1.schema.json",
    "utf8"
  )
) as object;

const validator = createRuntimeValidator(
  evidenceSchema,
  auditSchema
);

// All existing acceptance cases use the same independently
// supplied, trusted PP-01 runtime validator.
function composeTransactionEvidence(
  input: TransactionCompositionInput
) {
  return composeWithValidation(input, validator);
}

function artifact(id: string) {
  return {
    id,
    kind: "synthetic_evidence",
    mediaType: "application/json",
    digestSha256: ARTIFACT_DIGEST,
    disclosure: "restricted" as const,
    availability: "referenced" as const,
    source: {
      type: "synthetic_test",
      producerRef: "unverified-source",
      collectorRef: "synthetic-test-collector",
      collectionMethod: "fixture",
      observedAt: TIME,
      collectedAt: TIME,
      historicalContext: null
    }
  };
}

function provenance(id: string) {
  return {
    verifierRef: "synthetic-verifier",
    evaluatedAt: TIME,
    evidenceIds: [id]
  };
}

function fixture(): TransactionCompositionInput {
  return {
    context: {
      manifest: {
        transaction: {
          id: TRANSACTION,
          correlationId: "synthetic-correlation",
          recordedAt: TIME,
          status: "evidence_collected"
        },
        participants: {
          buyer: {
            agentRef: BUYER,
            ownerRef: null,
            identityEvidenceIds: []
          },
          seller: {
            agentRef: SELLER,
            ownerRef: null,
            identityEvidenceIds: []
          }
        },
        commercialTerms: {
          method: "GET",
          resource: "/premium",
          amountAtomic: "50101",
          asset: "EUDemo",
          recipient: PAY_TO
        },
        audit: {
          eventIds: [],
          headDigestSha256: null,
          completeness: "unknown",
          coverageScope: "synthetic-composition-fixture"
        },
        governance: {
          disclosureProfile: "restricted",
          retentionPolicyRef: null,
          retentionResponsibleParty: null,
          retentionUntil: null,
          auditProfile: "synthetic-test"
        }
      },
      expectedPayment: {
        network: NETWORK,
        transactionHash: TX_HASH,
        tokenId: "EUDemo",
        decimals: 6,
        amountRaw: "50101",
        payTo: PAY_TO,
        settlementProfile: "xcf_crp_plt_v1"
      },
      expectedAgent: {
        participantRole: "buyer",
        agentRef: BUYER,
        agentTokenIdHex: AGENT_TOKEN,
        network: NETWORK
      },
      expectedSeller: {
        sellerAgentRef: SELLER,
        merchantRef: "synthetic-merchant",
        serviceEndpoint: "https://example.test/premium",
        payTo: PAY_TO
      },
      expectedDelivery: {
        transactionRef: TRANSACTION,
        sellerAgentRef: SELLER,
        resourceRef: "/premium"
      }
    },

    receipt: {
      result: {
        claim: "facilitator_receipt_signature_and_binding",
        assuranceModel:
          "trusted_facilitator_receipt_signature_v1",
        status: "verified",
        reasonCode: "verified",
        policyId: "receipt-policy",
        policyDigest: POLICY_DIGEST,
        facilitatorId: "synthetic-facilitator",
        signingKeyId: "synthetic-kid",
        transactionHash: TX_HASH,
        signatureAuthenticated: true,
        settlementIndependentlyVerified: false
      },
      provenance: provenance(IDS.receipt)
    },

    settlement: {
      result: {
        claim:
          "finalized_plt_transfer_matches_expected_payment",
        assuranceModel:
          "trusted_node_finalized_plt_transfer_v1",
        status: "verified",
        reasonCode: "verified",
        policyId: "settlement-policy",
        policyDigest: POLICY_DIGEST,
        network: NETWORK,
        transactionHash: TX_HASH,
        blockHash: BLOCK_HASH,
        blockHeight: "100",
        transactionFinalized: true,
        transactionExecutionSucceeded: true,
        expectedPltTransferMatched: true,
        consensusIndependentlyVerified: false
      },
      provenance: provenance(IDS.settlement)
    },

    agentAuthority: {
      result: {
        claim:
          "agent_registry_owner_external_key_binding_at_finalized_snapshot",
        assuranceModel:
          "trusted_node_finalized_agent_key_binding_v1",
        status: "verified",
        reasonCode: "verified",
        policyId: "agent-policy",
        policyDigest: POLICY_DIGEST,
        network: NETWORK,
        agentTokenIdHex: AGENT_TOKEN,
        blockHash: BLOCK_HASH,
        blockHeight: "100",
        registryModulesApprovedByPolicy: true,
        snapshotFinalized: true,
        agentActive: true,
        ownerMatched: true,
        externalReferenceMatched: true,
        externalKeyRegistrationActive: true,
        externalKeyOwnerMatched: true,
        consensusIndependentlyVerified: false,
        historicalUpgradeAuthorityVerified: false,
        humanIdentityVerified: false,
        actionSpecificSigningAuthorityVerified: false
      },
      provenance: provenance(IDS.agent)
    },

    seller: {
      result: {
        gate: "SELLER-01",
        status: "indeterminate",
        reasonCode:
          "external_seller_authentication_required",
        evidenceIds: [IDS.seller],
        sellerAgentRef: SELLER,
        transactionRef: TRANSACTION,
        policyId: "seller-policy"
      },
      provenance: provenance(IDS.seller)
    },

    delivery: {
      transactionRef: TRANSACTION,
      sellerAgentRef: SELLER,
      resourceRef: "/premium",
      reportedStatus: "delivered",
      provenance: provenance(IDS.delivery)
    },

    evidence: {
      artifacts: Object.values(IDS).map(artifact)
    }
  };
}

function clone(): TransactionCompositionInput {
  return structuredClone(fixture());
}

function claimStatuses(input: TransactionCompositionInput) {
  const result = composeTransactionEvidence(input);

  assert.notEqual(result.manifest, null);

  if (result.manifest === null) {
    throw new Error("Expected a manifest");
  }

  return Object.fromEntries(
    result.manifest.assurance.claims.map(item => [
      item.id,
      item.status
    ])
  );
}

function expectRejected(
  input: TransactionCompositionInput,
  code?: string
): void {
  const result = composeTransactionEvidence(input);

  assert.equal(result.status, "rejected");
  assert.equal(result.manifest, null);
  assert.equal(result.diagnostics.status, "rejected");

  if (code !== undefined) {
    assert.ok(
      result.diagnostics.reasons.some(
        reason => reason.code === code
      ),
      `Expected diagnostic: ${code}`
    );
  }
}

function expectIncomplete(
  input: TransactionCompositionInput
) {
  const result = composeTransactionEvidence(input);

  assert.equal(result.status, "incomplete");
  assert.notEqual(result.manifest, null);

  return result;
}

test(
  "M3.5: consistent source results produce incomplete, not fully verified, composition",
  () => {
    const result = expectIncomplete(fixture());

    assert.equal(
      result.diagnostics.assessments.verified,
      3
    );

    assert.equal(
      result.diagnostics.assessments.indeterminate,
      2
    );

    assert.ok(
      result.diagnostics.reasons.some(
        item =>
          item.code ===
          "seller_authentication_not_established"
      )
    );

    assert.ok(
      result.diagnostics.reasons.some(
        item =>
          item.code ===
          "delivery_authentication_not_established"
      )
    );
  }
);

test(
  "M3.5: composed manifest conforms to frozen PP-01 schema",
  () => {
    const result = expectIncomplete(fixture());

    const validation = validator.validateManifest(
      result.manifest
    );

    assert.equal(
      validation.valid,
      true,
      JSON.stringify(validation.issues)
    );
  }
);

test(
  "M3.5: exact narrow verifier claims are preserved",
  () => {
    const result = expectIncomplete(fixture());

    assert.deepEqual(
      claimStatuses(fixture()),
      {
        "pp03.m35.agent-authority": "verified",
        "pp03.m35.delivery": "indeterminate",
        "pp03.m35.receipt": "verified",
        "pp03.m35.seller-binding": "indeterminate",
        "pp03.m35.settlement": "verified"
      }
    );

    assert.equal(
      result.manifest!.assurance.claims.find(
        item =>
          item.id === "pp03.m35.agent-authority"
      )?.type,
      "agent_registry_owner_external_key_binding_at_finalized_snapshot"
    );
  }
);

test(
  "M3.5: repeated identical inputs produce identical results",
  () => {
    assert.deepEqual(
      composeTransactionEvidence(clone()),
      composeTransactionEvidence(clone())
    );
  }
);

test(
  "M3.5: input is not mutated",
  () => {
    const input = clone();
    const before = structuredClone(input);

    composeTransactionEvidence(input);

    assert.deepEqual(input, before);
  }
);

test(
  "M3.5: missing receipt remains incomplete",
  () => {
    const input = clone();
    input.receipt = null;

    const result = expectIncomplete(input);

    assert.ok(
      result.diagnostics.reasons.some(
        item =>
          item.code === "missing_verification_result"
      )
    );

    assert.equal(
      result.manifest!.assurance.claims.some(
        item => item.id === "pp03.m35.receipt"
      ),
      false
    );
  }
);

test(
  "M3.5: missing settlement remains incomplete",
  () => {
    const input = clone();
    input.settlement = null;

    expectIncomplete(input);
  }
);

test(
  "M3.5: missing agent authority remains incomplete",
  () => {
    const input = clone();
    input.agentAuthority = null;

    expectIncomplete(input);
  }
);

test(
  "M3.5: missing delivery does not generate fabricated artifacts",
  () => {
    const input = clone();
    input.delivery = null;

    const result = expectIncomplete(input);

    assert.deepEqual(
      result.manifest!.delivery.evidenceIds,
      []
    );
  }
);

test(
  "M3.5: failed receipt status is not promoted",
  () => {
    const input = clone();
    input.receipt!.result.status = "failed";
    input.receipt!.result.reasonCode =
      "synthetic_signature_failure";
    input.receipt!.result.signatureAuthenticated = false;

    const result = expectIncomplete(input);

    assert.equal(
      result.manifest!.assurance.claims.find(
        item => item.id === "pp03.m35.receipt"
      )?.status,
      "failed"
    );
  }
);

test(
  "M3.5: wrong receipt transaction hash is rejected",
  () => {
    const input = clone();
    input.receipt!.result.transactionHash =
      "e".repeat(64);

    expectRejected(
      input,
      "transaction_binding_mismatch"
    );
  }
);

test(
  "M3.5: wrong settlement transaction hash is rejected",
  () => {
    const input = clone();
    input.settlement!.result.transactionHash =
      "e".repeat(64);

    expectRejected(
      input,
      "transaction_binding_mismatch"
    );
  }
);

test(
  "M3.5: wrong settlement network is rejected",
  () => {
    const input = clone();
    input.settlement!.result.network =
      "concordium:mainnet";

    expectRejected(input, "network_binding_mismatch");
  }
);

test(
  "M3.5: trusted payment recipient mismatch is rejected",
  () => {
    const input = clone();
    input.context.manifest.commercialTerms.recipient =
      "different-recipient";

    expectRejected(input, "invalid_trusted_context");
  }
);

test(
  "M3.5: unsupported sponsored settlement profile is rejected",
  () => {
    const input = clone();

    input.context.expectedPayment.settlementProfile =
      "foundation_sponsored_exact_v1" as
      typeof input.context.expectedPayment.settlementProfile;

    expectRejected(input, "invalid_trusted_context");
  }
);

test(
  "M3.5: agent token mismatch is rejected",
  () => {
    const input = clone();
    input.agentAuthority!.result.agentTokenIdHex =
      "0000000000000002";

    expectRejected(input, "agent_binding_mismatch");
  }
);

test(
  "M3.5: action-specific agent authority cannot be asserted",
  () => {
    const input = clone();

    input.agentAuthority!.result
      .actionSpecificSigningAuthorityVerified =
        true as false;

    expectRejected(
      input,
      "invalid_verification_result"
    );
  }
);

test(
  "M3.5: seller verified status is forbidden",
  () => {
    const input = clone();
    input.seller!.result.status = "verified";

    expectRejected(
      input,
      "unsupported_assurance_promotion"
    );
  }
);

test(
  "M3.5: seller transaction mismatch is rejected",
  () => {
    const input = clone();
    input.seller!.result.transactionRef =
      "unrelated-transaction";

    expectRejected(
      input,
      "transaction_binding_mismatch"
    );
  }
);

test(
  "M3.5: delivery seller mismatch is rejected",
  () => {
    const input = clone();
    input.delivery!.sellerAgentRef =
      "unrelated-seller";

    expectRejected(
      input,
      "delivery_binding_mismatch"
    );
  }
);

test(
  "M3.5: reported delivery remains unauthenticated",
  () => {
    const input = clone();

    for (const outcome of [
      "delivered",
      "failed",
      "unknown"
    ] as const) {
      input.delivery!.reportedStatus = outcome;

      const result = expectIncomplete(input);

      assert.equal(
        result.manifest!.assurance.claims.find(
          item => item.id === "pp03.m35.delivery"
        )?.status,
        "indeterminate"
      );
    }
  }
);

test(
  "M3.5: unknown evidence reference is rejected",
  () => {
    const input = clone();

    input.receipt!.provenance.evidenceIds = [
      "nonexistent-artifact"
    ];

    expectRejected(
      input,
      "unknown_evidence_reference"
    );
  }
);

test(
  "M3.5: duplicate evidence IDs are rejected",
  () => {
    const input = clone();

    input.evidence.artifacts.push(
      artifact(IDS.receipt)
    );

    expectRejected(
      input,
      "duplicate_evidence_id"
    );
  }
);

test(
  "M3.5: missing verified-claim provenance is rejected",
  () => {
    const input = clone();

    input.receipt!.provenance = {
      verifierRef: null,
      evaluatedAt: null,
      evidenceIds: []
    };

    expectRejected(
      input,
      "missing_verification_provenance"
    );
  }
);

test(
  "M3.5: seller evidence references cannot be silently dropped",
  () => {
    const input = clone();

    input.seller!.result.evidenceIds = [
      IDS.seller,
      IDS.receipt
    ];

    expectRejected(
      input,
      "missing_supporting_evidence"
    );
  }
);

test(
  "M3.5: unsupported receipt assurance model is rejected",
  () => {
    const input = clone();

    input.receipt!.result.assuranceModel =
      "unapproved_receipt_model" as
      NonNullable<TransactionCompositionInput["receipt"]>["result"]["assuranceModel"];

    expectRejected(
      input,
      "invalid_verification_result"
    );
  }
);

test(
  "M3.5: verified settlement requires finalized successful execution",
  () => {
    const input = clone();

    input.settlement!.result.transactionFinalized =
      false;

    expectRejected(
      input,
      "invalid_verification_result"
    );
  }
);

test(
  "M3.5: malformed canonical input is rejected",
  () => {
    const input = clone();

    input.context.expectedPayment.decimals =
      Number.NaN;

    expectRejected(input, "invalid_composition_input");
  }
);

test(
  "M3.5: frozen manifest metadata must remain schema-valid",
  () => {
    const input = clone();

    input.context.manifest.transaction.status =
      "unsupported_status" as
      typeof input.context.manifest.transaction.status;

    // A syntactically valid object is not necessarily
    // an Evidence Manifest v1-valid object.
    //
    // The composition contract requires this to be
    // rejected rather than returned as a valid package.
    expectRejected(input);
  }
);
