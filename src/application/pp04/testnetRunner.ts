/**
 * ProofPath PP-04-C / C-08B.
 *
 * Isolated, offline-only integration runner.
 *
 * This is not a live Testnet runner. It accepts controlled,
 * injected scenario inputs for deterministic regression.
 *
 * Source authentication, policy approval and independent
 * trusted-context establishment are external obligations.
 */

import {
  verifyFacilitatorReceipt
} from "../../verification/facilitatorReceipt.js";

import {
  verifySettlementFinality
} from "../../verification/settlementFinality.js";

import {
  verifyAgentAuthority
} from "../../verification/agentAuthority.js";

import {
  evaluateSellerBinding
} from "../../pp02/sellerBinding.js";

import {
  composeTransactionEvidence
} from "../../composition/transactionEvidence.js";

import {
  assertC08BLiveAcquisitionAuthorized
} from "./testnetConfig.js";

import {
  mapC08BCrpSearchResponse
} from "./testnetSource.js";

import type {
  C08BExpectedCrpPayment,
  C08BCrpMappingResult
} from "./testnetSource.js";

import type {
  PP04ScenarioData
} from "./contracts.js";

import type {
  RuntimeValidator
} from "../../core/validate.js";

import type {
  TransactionCompositionInput
} from "../../composition/types.js";

/**
 * Only the trusted offline harness may supply this package.
 *
 * Inputs are intentionally not accepted from the PP-04
 * public viewer, an HTTP request, or the CRP response.
 */
export interface C08BOfflineRunInput {
  readonly expectedCrpPayment: C08BExpectedCrpPayment;
  readonly crpSearchResponse: unknown;
  readonly scenario: PP04ScenarioData;
  readonly validator: RuntimeValidator;
}

export type C08BOfflineRunResult =
  | {
      readonly status: "blocked";
      readonly reasonCode:
        | "invalid_offline_dependencies"
        | "trusted_receipt_binding_mismatch";
      readonly mapping: null;
      readonly composition: null;
    }
  | {
      readonly status: "unavailable" | "rejected";
      readonly reasonCode: string;
      readonly mapping: C08BCrpMappingResult;
      readonly composition: null;
    }
  | {
      readonly status: "evaluated";
      readonly reasonCode: "offline_evaluation_completed";
      readonly mapping: C08BCrpMappingResult;
      readonly composition: ReturnType<
        typeof composeTransactionEvidence
      >;
      readonly receipt: ReturnType<
        typeof verifyFacilitatorReceipt
      >;
    };

function sameTrustedReceiptTuple(
  expected: C08BExpectedCrpPayment,
  scenario: PP04ScenarioData
): boolean {
  const payment = scenario.verification.receipt.expected;
  const contract = payment.contract;

  return payment.nonce === expected.nonce &&
    contract.isFrozen === true &&
    contract.merchantId === expected.merchantId &&
    contract.network === expected.network &&
    contract.asset.type === expected.asset.type &&
    contract.asset.tokenId === expected.asset.tokenId &&
    contract.asset.decimals === expected.asset.decimals &&
    contract.amount === expected.amount &&
    contract.payTo === expected.payTo;
}

/**
 * Execute controlled offline evidence evaluation.
 *
 * Scenario verification contexts, expected transaction
 * hashes, source provenance and validator are supplied by
 * a trusted offline test harness, not the CRP response.
 *
 * "evaluated" means the verifiers ran. It does NOT mean
 * the receipt, settlement or payment was verified.
 */
export async function runC08BOfflineEvaluation(
  input: C08BOfflineRunInput
): Promise<C08BOfflineRunResult> {
  if (!input ||
      !input.scenario ||
      !input.scenario.verification ||
      !input.scenario.provenance ||
      !input.scenario.trustedContext ||
      !input.scenario.evidence ||
      !input.validator ||
      typeof input.validator.validateManifest !== "function") {
    return {
      status: "blocked",
      reasonCode: "invalid_offline_dependencies",
      mapping: null,
      composition: null
    };
  }

  const mapping = mapC08BCrpSearchResponse(
    input.expectedCrpPayment,
    input.crpSearchResponse
  );

  if (mapping.status !== "candidate") {
    return {
      status: mapping.status,
      reasonCode: mapping.reasonCode,
      mapping,
      composition: null
    };
  }

  if (!sameTrustedReceiptTuple(
    input.expectedCrpPayment,
    input.scenario
  )) {
    return {
      status: "blocked",
      reasonCode: "trusted_receipt_binding_mismatch",
      mapping: null,
      composition: null
    };
  }

  // Only the existing receipt verifier interprets the JWS.
  // Its independent expected transaction hash and signing
  // policy must already exist in trusted scenario context.
  const receipt = verifyFacilitatorReceipt({
    ...input.scenario.verification.receipt,
    jws: mapping.jws
  });

  const settlement = await verifySettlementFinality(
    input.scenario.verification.settlement
  );

  const agentAuthority = await verifyAgentAuthority(
    input.scenario.verification.agentAuthority
  );

  const seller = evaluateSellerBinding(
    input.scenario.verification.seller
  );

  const compositionInput: TransactionCompositionInput = {
    context: input.scenario.trustedContext,

    receipt: {
      result: receipt,
      provenance: input.scenario.provenance.receipt
    },

    settlement: {
      result: settlement,
      provenance: input.scenario.provenance.settlement
    },

    agentAuthority: {
      result: agentAuthority,
      provenance: input.scenario.provenance.agentAuthority
    },

    seller: {
      result: seller,
      provenance: input.scenario.provenance.seller
    },

    delivery: input.scenario.delivery,
    evidence: input.scenario.evidence
  };

  const composition = composeTransactionEvidence(
    compositionInput,
    input.validator
  );

  return {
    status: "evaluated",
    reasonCode: "offline_evaluation_completed",
    mapping,
    composition,
    receipt
  };
}

/**
 * Operational C-08B live entry point.
 *
 * There is deliberately no network-capable implementation.
 * C-08C must separately authorize, design, and review any
 * future operational acquisition.
 */
export function runC08BLiveAcquisition(): never {
  return assertC08BLiveAcquisitionAuthorized();
}
