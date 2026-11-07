
/**
 * ProofPath PP-04-B — Canonical Offline Fixture Loader.
 *
 * Synthetic test inputs only. No live node, payment, wallet,
 * key-registration, identity or delivery operations.
 *
 * Policy approval and source authentication are not established
 * by this fixture. Existing verifiers evaluate the narrow
 * synthetic claims under explicitly simulated trust assumptions.
 */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign
} from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AccountAddress } from "@concordium/web-sdk";

import {
  digestFacilitatorReceiptPolicy
} from "../../verification/facilitatorReceipt.js";
import {
  digestSettlementPolicy
} from "../../verification/settlementFinality.js";
import {
  digestAgentAuthorityPolicy
} from "../../verification/agentAuthority.js";

import type {
  FacilitatorExpectedPayment,
  FacilitatorReceiptVerificationContext,
  SettlementVerificationContext,
  SettlementObservation,
  TrustedSettlementPolicy,
  AgentAuthorityVerificationContext,
  AgentAuthorityObservation,
  TrustedAgentAuthorityPolicy
} from "../../verification/types.js";

import type {
  PP02EvidenceReference,
  PP02SellerBindingInput
} from "../../pp02/types.js";

import type {
  CompositionAssessmentProvenance,
  TrustedTransactionCompositionContext
} from "../../composition/types.js";

import type {
  PP04ScenarioData
} from "./contracts.js";

const CANONICAL_PATH =
  "demo/pp04/fixtures/canonical.json";

const CANONICAL_SHA256 =
  "d2e1af29e50dfd22c1bf246b8fb1b5a0aea65b15bf21d7ca5b0575f57cdf304c";

const EVIDENCE_IDS = {
  receipt: "pp04-evidence-receipt",
  settlement: "pp04-evidence-settlement",
  agent: "pp04-evidence-agent",
  seller: "pp04-evidence-seller",
  delivery: "pp04-evidence-delivery"
} as const;

interface CanonicalFixture {
  fixtureId: string;
  fixtureKind: string;
  evaluationTime: string;
  transaction: {
    id: string;
    correlationId: string;
    network: "concordium:testnet";
    transactionHash: string;
    resource: {
      method: "GET";
      path: string;
      endpoint: string;
    };
  };
  payment: {
    settlementProfile: "xcf_crp_plt_v1";
    proofVersion: "ccd-plt-proof@v1";
    nonce: string;
    contractId: string;
    contractVersion: string;
    merchantId: string;
    chainId: string;
    tokenId: string;
    decimals: number;
    amount: string;
    amountRaw: string;
    payerSeed: number;
    recipientSeed: number;
  };
  agent: {
    participantRole: "buyer";
    buyerAgentRef: string;
    sellerAgentRef: string;
    agentTokenIdHex: string;
    ownerSeed: number;
    keyNamespace: string;
    keyType: string;
    publicKeyHex: string;
  };
  registry: {
    genesisHash: string;
    agentRegistryContractIndex: string;
    externalKeyRegistryContractIndex: string;
    contractSubindex: string;
    agentModuleReference: string;
    externalKeyModuleReference: string;
    blockHash: string;
    blockHeight: string;
    blockTimestamp: string;
    observedAt: string;
    nodeEndpoint: string;
  };
  settlement: {
    blockHash: string;
    blockHeight: string;
    blockTimestamp: string;
    observedAt: string;
    transactionStatus: "finalized";
    executionStatus: "success";
    executionEvidenceComplete: true;
  };
  facilitator: {
    facilitatorId: string;
    keyId: string;
    testSeedByte: number;
    receiptSettledOffsetSeconds: number;
    receiptExpiryOffsetSeconds: number;
  };
  seller: {
    merchantRef: string;
    reportedDeliveryStatus: "delivered";
  };
  manifest: {
    disclosureProfile: "restricted";
    auditCompleteness: "unknown";
    auditCoverageScope: string;
    auditProfile: string;
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * The SHA-256 pin protects this exact synthetic fixture.
 * It does not authenticate any real-world transaction.
 *
 * repositoryRoot is trusted bootstrap configuration,
 * never an HTTP request parameter.
 */
function loadCanonical(
  repositoryRoot: string
): CanonicalFixture {
  if (
    typeof repositoryRoot !== "string" ||
    repositoryRoot.trim() === ""
  ) {
    throw new TypeError("Trusted repository root is required");
  }

  const bytes = readFileSync(
    resolve(repositoryRoot, CANONICAL_PATH)
  );

  if (sha256(bytes) !== CANONICAL_SHA256) {
    throw new Error(
      "PP-04 canonical fixture fingerprint mismatch"
    );
  }

  const value: unknown = JSON.parse(
    bytes.toString("utf8")
  );

  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError("Invalid canonical fixture");
  }

  const data = value as CanonicalFixture;

  if (
    data.fixtureId !== "pp04-canonical-synthetic-v1" ||
    data.fixtureKind !== "synthetic_offline_evidence"
  ) {
    throw new Error("Unapproved canonical fixture");
  }

  return data;
}

function syntheticAccount(seed: number): string {
  if (
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 255
  ) {
    throw new TypeError("Invalid synthetic account seed");
  }

  const bytes = new Uint8Array(32);
  bytes[0] = seed;

  return AccountAddress
    .fromBuffer(bytes.buffer)
    .toString();
}

function syntheticPrivateKey(seedByte: number) {
  if (
    !Number.isInteger(seedByte) ||
    seedByte < 0 ||
    seedByte > 255
  ) {
    throw new TypeError("Invalid synthetic signing seed");
  }

  // Fixed PKCS#8 Ed25519 test seed; NEVER a live credential.
  const prefix = Buffer.from(
    "302e020100300506032b657004220420",
    "hex"
  );

  return createPrivateKey({
    key: Buffer.concat([
      prefix,
      Buffer.alloc(32, seedByte)
    ]),
    format: "der",
    type: "pkcs8"
  });
}

function encoded(value: object): string {
  return Buffer
    .from(JSON.stringify(value), "utf8")
    .toString("base64url");
}

function signedReceipt(
  header: object,
  payload: object,
  privateKey: ReturnType<typeof syntheticPrivateKey>
): string {
  const signingInput =
    encoded(header) + "." + encoded(payload);

  const signature = sign(
    null,
    Buffer.from(signingInput, "ascii"),
    privateKey
  ).toString("base64url");

  return signingInput + "." + signature;
}

function evidenceRef(
  evidenceId: string
): PP02EvidenceReference {
  return {
    evidenceId,
    origin: "source_claim",
    sourceRef: "pp04:synthetic-fixture",
    verifierRef: null
  };
}

function provenance(
  evidenceId: string,
  verifierRef: string,
  evaluatedAt: string
): CompositionAssessmentProvenance {
  return {
    verifierRef,
    evaluatedAt,
    evidenceIds: [evidenceId]
  };
}

function artifact(
  id: string,
  record: object,
  observedAt: string
) {
  // Digest the supplied synthetic source record itself,
  // not a fabricated or shared placeholder digest.
  return {
    id,
    kind: "synthetic_evidence",
    mediaType: "application/json",
    digestSha256: sha256(
      Buffer.from(JSON.stringify(record), "utf8")
    ),
    disclosure: "restricted" as const,
    availability: "referenced" as const,
    source: {
      type: "synthetic_test",
      producerRef: "pp04:fixture",
      collectorRef: "pp04:offline-loader",
      collectionMethod: "deterministic_fixture",
      observedAt,
      collectedAt: observedAt,
      historicalContext: null
    }
  };
}

/**
 * Build one independently configured synthetic scenario.
 *
 * No verification results are precomputed or asserted here.
 * The PP-04 orchestrator must call the actual M3.2/M3.3/
 * M3.4 and PP-02 functions.
 */
export function loadPP04CanonicalScenario(
  repositoryRoot: string
): PP04ScenarioData {
  const f = loadCanonical(repositoryRoot);

  const now = new Date(f.evaluationTime);
  const nowSeconds = Math.floor(
    now.getTime() / 1000
  );

  const payer = syntheticAccount(f.payment.payerSeed);
  const recipient = syntheticAccount(
    f.payment.recipientSeed
  );
  const owner = syntheticAccount(f.agent.ownerSeed);

  const privateKey = syntheticPrivateKey(
    f.facilitator.testSeedByte
  );

  const publicJwk = createPublicKey(privateKey)
    .export({ format: "jwk" });

  if (typeof publicJwk.x !== "string") {
    throw new Error("Invalid synthetic Ed25519 JWK");
  }

  // Trusted expectations are established from the
  // pinned fixture configuration, not from observations.
  const paymentContract = {
    contractId: f.payment.contractId,
    contractVersion: f.payment.contractVersion,
    isFrozen: true as const,
    merchantId: f.payment.merchantId,
    resource: {
      method: f.transaction.resource.method,
      path: f.transaction.resource.path
    },
    chain_id: f.payment.chainId,
    network: f.transaction.network,
    asset: {
      type: "PLT" as const,
      tokenId: f.payment.tokenId,
      decimals: f.payment.decimals
    },
    amount: f.payment.amount,
    payTo: recipient
  };

  const expectedReceipt: FacilitatorExpectedPayment = {
    nonce: f.payment.nonce,
    transactionHash: f.transaction.transactionHash,
    contract: paymentContract
  };

  const receiptPayload = {
    proofVersion: f.payment.proofVersion,
    contract: paymentContract,
    nonce: f.payment.nonce,
    settlement: {
      status: "finalized",
      settledAt:
        nowSeconds +
        f.facilitator.receiptSettledOffsetSeconds,
      expiresAt:
        nowSeconds +
        f.facilitator.receiptExpiryOffsetSeconds
    },
    chain: {
      transactionHash: f.transaction.transactionHash,
      blockHash: f.settlement.blockHash,
      blockHeight: Number(f.settlement.blockHeight)
    },
    paymentEvent: {
      kind: "plt.transfer",
      tokenId: f.payment.tokenId,
      amountRaw: f.payment.amountRaw,
      from: payer,
      to: recipient
    }
  };

  const receiptPolicy = {
    policyId: "pp04:synthetic-receipt-policy",
    policyVersion: "1",
    facilitatorId: f.facilitator.facilitatorId,
    authorizedKeys: [{
      kid: f.facilitator.keyId,
      kty: "OKP" as const,
      crv: "Ed25519" as const,
      x: publicJwk.x,
      alg: "EdDSA" as const,
      use: "sig" as const
    }],
    acceptedProofVersions: [
      "ccd-plt-proof@v1" as const
    ],
    maxReceiptAgeSeconds: 300,
    maxFutureSkewSeconds: 10
  };

  const signedJws = signedReceipt(
    {
      alg: "EdDSA",
      kid: f.facilitator.keyId,
      typ: "JWT"
    },
    receiptPayload,
    privateKey
  );

  const receipt: FacilitatorReceiptVerificationContext = {
    jws: signedJws,
    expected: expectedReceipt,
    policy: receiptPolicy,
    trustedPolicyDigest:
      digestFacilitatorReceiptPolicy(receiptPolicy),
    now: () => new Date(now.getTime())
  };

  const settlementPolicy: TrustedSettlementPolicy = {
    policyId: "pp04:synthetic-settlement-policy",
    policyVersion: "1",
    network: f.transaction.network,
    expectedGenesisHash: f.registry.genesisHash,
    trustedNodeEndpoint: f.registry.nodeEndpoint,
    maxObservationAgeSeconds: 300,
    maxFutureSkewSeconds: 10,
    requireFinalizedBlock: true
  };

  const settlementObservation: SettlementObservation = {
    network: f.transaction.network,
    genesisHash: f.registry.genesisHash,
    nodeEndpoint: f.registry.nodeEndpoint,
    transactionHash: f.transaction.transactionHash,
    transactionStatus: f.settlement.transactionStatus,
    executionStatus: f.settlement.executionStatus,
    blockHash: f.settlement.blockHash,
    blockHeight: f.settlement.blockHeight,
    blockTimestamp: f.settlement.blockTimestamp,
    blockFinalized: true,
    observedAt: f.settlement.observedAt,
    executionEvidenceComplete:
      f.settlement.executionEvidenceComplete,
    transfers: [{
      tokenId: f.payment.tokenId,
      from: payer,
      to: recipient,
      decimals: f.payment.decimals,
      amountRaw: f.payment.amountRaw
    }]
  };

  const settlement: SettlementVerificationContext = {
    policy: settlementPolicy,
    trustedPolicyDigest:
      digestSettlementPolicy(settlementPolicy),
    expected: {
      network: f.transaction.network,
      transactionHash: f.transaction.transactionHash,
      tokenId: f.payment.tokenId,
      decimals: f.payment.decimals,
      amountRaw: f.payment.amountRaw,
      payTo: recipient,
      from: payer
    },
    transport: {
      async readSettlement() {
        // Fresh copy avoids mutation across demonstration runs.
        return structuredClone(settlementObservation);
      }
    },
    now: () => new Date(now.getTime())
  };

  const agentRegistry = {
    network: f.transaction.network,
    contractIndex: f.registry.agentRegistryContractIndex,
    contractSubindex: f.registry.contractSubindex
  };

  const externalKeyRegistry = {
    network: f.transaction.network,
    contractIndex:
      f.registry.externalKeyRegistryContractIndex,
    contractSubindex: f.registry.contractSubindex
  };

  const externalKey = {
    namespace: f.agent.keyNamespace,
    keyType: f.agent.keyType,
    publicKeyHex: f.agent.publicKeyHex
  };

  const agentPolicy: TrustedAgentAuthorityPolicy = {
    policyId: "pp04:synthetic-agent-policy",
    policyVersion: "1",
    network: f.transaction.network,
    expectedGenesisHash: f.registry.genesisHash,
    agentRegistry,
    approvedAgentModuleReferences: [
      f.registry.agentModuleReference
    ],
    externalKeyRegistry,
    approvedExternalKeyModuleReferences: [
      f.registry.externalKeyModuleReference
    ],
    trustedNodeEndpoint: f.registry.nodeEndpoint,
    allowedExternalKeyNamespaces: [
      f.agent.keyNamespace
    ],
    allowedExternalKeyTypes: [
      f.agent.keyType
    ],
    maxSnapshotAgeSeconds: 300,
    maxFutureSkewSeconds: 10,
    requireFinalizedBlock: true,
    requireSameBlock: true
  };

  const agentObservation: AgentAuthorityObservation = {
    network: f.transaction.network,
    genesisHash: f.registry.genesisHash,
    nodeEndpoint: f.registry.nodeEndpoint,
    blockHash: f.registry.blockHash,
    blockHeight: f.registry.blockHeight,
    blockTimestamp: f.registry.blockTimestamp,
    observedAt: f.registry.observedAt,
    blockFinalized: true,
    agentRegistry,
    agentModuleReference:
      f.registry.agentModuleReference,
    agentReadBlockHash: f.registry.blockHash,
    agentReadComplete: true,
    agent: {
      agentTokenIdHex: f.agent.agentTokenIdHex,
      ownerAccount: owner,
      status: "active",
      externalReference: {
        contract: externalKeyRegistry,
        kind: "cis8",
        externalKey
      },
      agentUri: null,
      metadataHash: null
    },
    externalKeyRegistry,
    externalKeyModuleReference:
      f.registry.externalKeyModuleReference,
    externalKeyReadBlockHash: f.registry.blockHash,
    externalKeyReadComplete: true,
    externalKeyRegistration: {
      ownerAccount: owner,
      externalKey,
      status: "active",
      proofScheme: "synthetic",
      lastUpdated: f.registry.blockTimestamp
    }
  };

  const agentAuthority: AgentAuthorityVerificationContext = {
    policy: agentPolicy,
    trustedPolicyDigest:
      digestAgentAuthorityPolicy(agentPolicy),
    expected: {
      network: f.transaction.network,
      agentTokenIdHex: f.agent.agentTokenIdHex,
      expectedOwnerAccount: owner,
      expectedExternalKey: externalKey
    },
    transport: {
      async readAgentAuthority() {
        return structuredClone(agentObservation);
      }
    },
    now: () => new Date(now.getTime())
  };

  const sellerPolicy = {
    policyId: "pp04:synthetic-seller-policy",
    requireTrustedRegistry: true,
    requireAuthenticatedEndpoint: true,
    requireFinalizedSettlement: true,
    requireAuthenticatedDelivery: true
  };

  const seller: PP02SellerBindingInput = {
    policy: sellerPolicy,
    registryTrust: {
      gate: "TRUST-01",
      status: "indeterminate",
      reasonCode:
        "external_registry_authentication_required",
      evidenceIds: [EVIDENCE_IDS.seller],
      registry: agentRegistry,
      observedModule: f.registry.agentModuleReference,
      policyId: "pp04:synthetic-registry-policy"
    },
    seller: {
      agentRef: f.agent.sellerAgentRef,
      ownerAccount: owner,
      agentWallet: recipient,
      active: true,
      registry: agentRegistry,
      block: {
        network: f.transaction.network,
        height: f.registry.blockHeight,
        hash: f.registry.blockHash,
        finalized: true
      },
      evidence: [evidenceRef(EVIDENCE_IDS.seller)]
    },
    endpoint: {
      agentRef: f.agent.sellerAgentRef,
      endpoint: f.transaction.resource.endpoint,
      cardDigestSha256: sha256(
        Buffer.from(f.transaction.resource.endpoint)
      ),
      authorizationKeyRef: "pp04:synthetic-seller-key",
      verifierRef: null,
      evidence: [evidenceRef(EVIDENCE_IDS.seller)]
    },
    terms: {
      transactionRef: f.transaction.id,
      merchantRef: f.seller.merchantRef,
      endpoint: f.transaction.resource.endpoint,
      payTo: recipient,
      evidence: [evidenceRef(EVIDENCE_IDS.seller)]
    },
    settlement: {
      transactionRef: f.transaction.id,
      recipient,
      block: {
        network: f.transaction.network,
        height: f.settlement.blockHeight,
        hash: f.settlement.blockHash,
        finalized: true
      },
      verifierRef: "pp04:synthetic-settlement-verifier",
      evidence: [evidenceRef(EVIDENCE_IDS.seller)]
    },
    delivery: {
      transactionRef: f.transaction.id,
      agentRef: f.agent.sellerAgentRef,
      signerKeyRef: "pp04:synthetic-seller-key",
      verifierRef: null,
      evidence: [evidenceRef(EVIDENCE_IDS.delivery)]
    }
  };

  const trustedContext: TrustedTransactionCompositionContext = {
    manifest: {
      transaction: {
        id: f.transaction.id,
        correlationId: f.transaction.correlationId,
        recordedAt: f.evaluationTime,
        status: "evidence_collected"
      },
      participants: {
        buyer: {
          agentRef: f.agent.buyerAgentRef,
          ownerRef: null,
          identityEvidenceIds: []
        },
        seller: {
          agentRef: f.agent.sellerAgentRef,
          ownerRef: null,
          identityEvidenceIds: []
        }
      },
      commercialTerms: {
        method: f.transaction.resource.method,
        resource: f.transaction.resource.path,
        amountAtomic: f.payment.amountRaw,
        asset: f.payment.tokenId,
        recipient
      },
      audit: {
        eventIds: [],
        headDigestSha256: null,
        completeness: f.manifest.auditCompleteness,
        coverageScope: f.manifest.auditCoverageScope
      },
      governance: {
        disclosureProfile:
          f.manifest.disclosureProfile,
        retentionPolicyRef: null,
        retentionResponsibleParty: null,
        retentionUntil: null,
        auditProfile: f.manifest.auditProfile
      }
    },
    expectedPayment: {
      network: f.transaction.network,
      transactionHash: f.transaction.transactionHash,
      tokenId: f.payment.tokenId,
      decimals: f.payment.decimals,
      amountRaw: f.payment.amountRaw,
      payTo: recipient,
      settlementProfile: f.payment.settlementProfile
    },
    expectedAgent: {
      participantRole: f.agent.participantRole,
      agentRef: f.agent.buyerAgentRef,
      agentTokenIdHex: f.agent.agentTokenIdHex,
      network: f.transaction.network
    },
    expectedSeller: {
      sellerAgentRef: f.agent.sellerAgentRef,
      merchantRef: f.seller.merchantRef,
      serviceEndpoint: f.transaction.resource.endpoint,
      payTo: recipient
    },
    expectedDelivery: {
      transactionRef: f.transaction.id,
      sellerAgentRef: f.agent.sellerAgentRef,
      resourceRef: f.transaction.resource.path
    }
  };

  const assessmentProvenance = {
    receipt: provenance(
      EVIDENCE_IDS.receipt,
      "pp04:synthetic-m32-verifier",
      f.evaluationTime
    ),
    settlement: provenance(
      EVIDENCE_IDS.settlement,
      "pp04:synthetic-m33-verifier",
      f.evaluationTime
    ),
    agentAuthority: provenance(
      EVIDENCE_IDS.agent,
      "pp04:synthetic-m34-verifier",
      f.evaluationTime
    ),
    seller: provenance(
      EVIDENCE_IDS.seller,
      "pp04:synthetic-pp02-evaluator",
      f.evaluationTime
    )
  };

  const artifacts = [
    artifact(
      EVIDENCE_IDS.receipt,
      { jws: signedJws },
      f.evaluationTime
    ),
    artifact(
      EVIDENCE_IDS.settlement,
      settlementObservation,
      f.settlement.observedAt
    ),
    artifact(
      EVIDENCE_IDS.agent,
      agentObservation,
      f.registry.observedAt
    ),
    artifact(
      EVIDENCE_IDS.seller,
      {
        seller: seller.seller,
        endpoint: seller.endpoint,
        terms: seller.terms,
        registryTrust: seller.registryTrust
      },
      f.evaluationTime
    ),
    artifact(
      EVIDENCE_IDS.delivery,
      {
        transactionRef: f.transaction.id,
        sellerAgentRef: f.agent.sellerAgentRef,
        resourceRef: f.transaction.resource.path,
        reportedStatus: f.seller.reportedDeliveryStatus
      },
      f.evaluationTime
    )
  ];

  return {
    trustedContext,
    verification: {
      receipt,
      settlement,
      agentAuthority,
      seller
    },
    provenance: assessmentProvenance,
    delivery: {
      transactionRef: f.transaction.id,
      sellerAgentRef: f.agent.sellerAgentRef,
      resourceRef: f.transaction.resource.path,
      reportedStatus: f.seller.reportedDeliveryStatus,
      provenance: provenance(
        EVIDENCE_IDS.delivery,
        "pp04:synthetic-delivery-recorder",
        f.evaluationTime
      )
    },
    evidence: { artifacts }
  };
}
