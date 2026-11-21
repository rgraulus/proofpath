
/**
 * ProofPath Hackathon — Historical Commercial Binding
 *
 * Compares independently retained Gateway commercial terms
 * with a historical Facilitator evidence record.
 *
 * This is source-record corroboration, NOT cryptographic
 * receipt authentication or independent settlement finality.
 *
 * Read-only. No network access, payment execution or writes.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import {
  loadHistoricalEvidence,
  DEMO_TRANSACTION_HASH
} from "./historicalEvidence.js";

import type {
  HistoricalEvidenceRecord
} from "./historicalEvidence.js";

export const HISTORICAL_GATEWAY_COMMIT =
  "1861711b1483eeb09a2c66fa84152da69585b604";

export const HISTORICAL_CONTRACT_ID =
  "cid_e7fb8ef3933f5b45c7a246267858baf5b84ba60a7c178d0b84cc4e90fc564d98";

interface GatewayContract {
  contractId: string;
  contractVersion: string;
  isFrozen: boolean;
  merchantId: string;
  resource: {
    method: string;
    path: string;
  };
  network: string;
  asset: {
    type: string;
    tokenId: string;
    decimals: number;
  };
  amount: string;
  payTo: string;
}

export interface HistoricalBindingCheck {
  name: string;
  matched: boolean;
}

export interface HistoricalCommercialAssessment {
  schemaVersion:
    "proofpath.hackathon.commercial-assessment.v1";

  transactionHash: string;
  contractId: string;

  status: "matched" | "mismatched";

  checks: HistoricalBindingCheck[];

  recordedFinality: boolean;

  provenance: {
    gatewayCommit: string;
    gatewayContractSha256: string;
    historicalEvidenceSha256: string;
    sourceClass: "historical_gateway_and_facilitator_records";
  };

  assurance: {
    receiptSignatureAuthenticated: false;
    settlementIndependentlyVerified: false;
    agentAuthorityVerified: false;
    sellerBindingVerified: false;
    deliveryAuthenticated: false;
    transactionWideVerified: false;
  };
}

function sha256(bytes: Buffer): string {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function atomicAmount(
  value: string,
  decimals: number
): string | null {
  if (
    !Number.isSafeInteger(decimals) ||
    decimals < 0 ||
    decimals > 18
  ) {
    return null;
  }

  const match = /^([0-9]+)(?:\.([0-9]+))?$/.exec(value);

  if (!match) return null;

  const fraction = match[2] ?? "";

  if (fraction.length > decimals) return null;

  const combined =
    match[1] + fraction.padEnd(decimals, "0");

  return BigInt(combined).toString();
}

export function compareHistoricalCommercialBinding(
  contract: GatewayContract,
  evidence: HistoricalEvidenceRecord,
  contractDigest: string,
  evidenceDigest: string
): HistoricalCommercialAssessment {
  const check = (
    name: string,
    matched: boolean
  ): HistoricalBindingCheck => ({
    name,
    matched
  });

  const checks = [
    check(
      "historical_contract_identity",
      contract.contractId === HISTORICAL_CONTRACT_ID &&
      contract.isFrozen === true
    ),
    check(
      "resource_binding",
      contract.resource?.method === "GET" &&
      contract.resource?.path === "/paid-gated"
    ),
    check(
      "transaction_binding",
      evidence.transactionHash === DEMO_TRANSACTION_HASH &&
      evidence.pltEvent.transactionHash === DEMO_TRANSACTION_HASH
    ),
    check(
      "merchant_binding",
      contract.merchantId === evidence.challenge.merchantId
    ),
    check(
      "network_binding",
      contract.network === evidence.pltEvent.network &&
      contract.network === "concordium:testnet"
    ),
    check(
      "asset_binding",
      contract.asset?.type === "PLT" &&
      contract.asset.tokenId === evidence.pltEvent.assetId &&
      contract.asset.tokenId === "EUDemo" &&
      contract.asset.decimals === 6
    ),
    check(
      "amount_binding",
      atomicAmount(
        contract.amount,
        contract.asset?.decimals
      ) === evidence.pltEvent.amountRaw
    ),
    check(
      "recipient_present_in_contract",
      typeof contract.payTo === "string" &&
      contract.payTo.length > 0
    )
  ];

  const matched = checks.every(item => item.matched);

  return {
    schemaVersion:
      "proofpath.hackathon.commercial-assessment.v1",

    transactionHash: DEMO_TRANSACTION_HASH,
    contractId: contract.contractId,

    status: matched ? "matched" : "mismatched",

    checks,

    recordedFinality:
      evidence.pltEvent.finalized === true,

    provenance: {
      gatewayCommit: HISTORICAL_GATEWAY_COMMIT,
      gatewayContractSha256: contractDigest,
      historicalEvidenceSha256: evidenceDigest,
      sourceClass:
        "historical_gateway_and_facilitator_records"
    },

    assurance: {
      receiptSignatureAuthenticated: false,
      settlementIndependentlyVerified: false,
      agentAuthorityVerified: false,
      sellerBindingVerified: false,
      deliveryAuthenticated: false,
      transactionWideVerified: false
    }
  };
}

export async function loadHistoricalCommercialAssessment(
  evidencePath: string,
  gatewayRepository: string
): Promise<{
  assessment: HistoricalCommercialAssessment;
  contract: GatewayContract;
  evidence: HistoricalEvidenceRecord;
}> {
  const evidence = await loadHistoricalEvidence(evidencePath);
  const evidenceBytes = await readFile(evidencePath);

  const contractBytes = execFileSync(
    "git",
    [
      "-C",
      gatewayRepository,
      "show",
      HISTORICAL_GATEWAY_COMMIT + ":config/contracts.json"
    ],
    {
      encoding: "buffer",
      maxBuffer: 1024 * 1024
    }
  );

  const parsed: unknown = JSON.parse(
    contractBytes.toString("utf8")
  );

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("contracts" in parsed) ||
    !Array.isArray(parsed.contracts)
  ) {
    throw new Error("historical_contract_structure_invalid");
  }

  const matches = parsed.contracts.filter(
    (item: unknown): item is GatewayContract => {
      if (!item || typeof item !== "object") return false;

      const contract = item as Partial<GatewayContract>;

      return (
        contract.resource?.method === "GET" &&
        contract.resource?.path === "/paid-gated"
      );
    }
  );

  if (matches.length !== 1) {
    throw new Error("historical_contract_not_unique");
  }

  const contract = matches[0];

  const assessment = compareHistoricalCommercialBinding(
    contract,
    evidence,
    sha256(contractBytes),
    sha256(evidenceBytes)
  );

  return {
    assessment,
    contract,
    evidence
  };
}
