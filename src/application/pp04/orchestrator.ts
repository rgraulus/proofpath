/**
 * ProofPath PP-04-B — Shared Offline Demo Orchestrator.
 *
 * Gate A: deterministic, fixture-only execution.
 * PP-04-C Testnet execution remains disabled.
 *
 * This module invokes existing verifiers and the existing
 * M3.5 composer. It does not strengthen their assurances.
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

import type {
  TransactionCompositionInput
} from "../../composition/types.js";

import type {
  PP04DemoRequest,
  PP04DemoResult,
  PP04Dependencies,
  PP04ScenarioId
} from "./contracts.js";

const SCENARIOS: readonly PP04ScenarioId[] = [
  "consistent",
  "missing-evidence",
  "binding-conflict",
  "unsupported-assurance"
];

function validScenario(
  value: unknown
): value is PP04ScenarioId {
  return typeof value === "string" &&
    SCENARIOS.some(item => item === value);
}

function failure(
  request: PP04DemoRequest,
  code: string
): PP04DemoResult {
  return {
    scenarioId: request.scenarioId,
    sourceMode: request.sourceMode,
    execution: {
      completed: false,
      failureCode: code
    },
    composition: null,
    sourceAssessments: {
      receipt: null,
      settlement: null,
      agentAuthority: null,
      seller: null
    }
  };
}

/**
 * Only the four hard-coded PP-04 negative/positive
 * demonstrations are supported.
 *
 * Never accept transformation functions from an HTTP
 * request, browser client or untrusted evidence source.
 */
function applyScenario(
  scenarioId: PP04ScenarioId,
  input: TransactionCompositionInput
): TransactionCompositionInput {
  switch (scenarioId) {
    case "consistent":
      return input;

    case "missing-evidence":
      // F02: verified settlement assessment deliberately
      // unavailable at the composition boundary.
      input.settlement = null;
      return input;

    case "binding-conflict":
      // F03: tamper with an otherwise correctly verified
      // settlement result after verifier execution.
      //
      // This is deliberately NOT a genuine verifier output.
      if (input.settlement === null) {
        throw new Error("missing_scenario_settlement");
      }

      input.settlement.result.transactionHash =
        "f".repeat(64);

      return input;

    case "unsupported-assurance":
      // F04: synthesize an unauthorized positive SELLER-01
      // status to test the M3.5 anti-promotion guard.
      //
      // The real PP-02 evaluator never returns verified.
      if (input.seller === null) {
        throw new Error("missing_scenario_seller");
      }

      input.seller.result.status = "verified";

      return input;
  }
}

/**
 * Run the shared PP-04 application pipeline.
 *
 * Execution success is independent of composition status.
 * A deliberate M3.5 rejection is a successful negative test.
 *
 * Application consumers must enforce disclosure controls
 * before exposing this result outside the trusted boundary.
 */
export async function runProofPathDemo(
  request: PP04DemoRequest,
  dependencies: PP04Dependencies
): Promise<PP04DemoResult> {
  if (
    !request ||
    !validScenario(request.scenarioId) ||
    (
      request.sourceMode !== "fixture" &&
      request.sourceMode !== "testnet"
    )
  ) {
    return failure(
      {
        scenarioId: "consistent",
        sourceMode: "fixture"
      },
      "invalid_demo_request"
    );
  }

  if (request.sourceMode !== "fixture") {
    return failure(
      request,
      "testnet_mode_not_enabled"
    );
  }

  if (
    !dependencies ||
    !dependencies.validator ||
    typeof dependencies.validator.validateManifest !==
      "function" ||
    typeof dependencies.loadScenario !== "function"
  ) {
    return failure(
      request,
      "invalid_demo_dependencies"
    );
  }

  try {
    const scenario = await dependencies.loadScenario(
      request.scenarioId
    );

    // The application controls negative scenarios.
    // Do not execute optional caller-supplied transforms.
    //
    // Trusted expectations and fixture observations are
    // prepared by the pinned synthetic fixture loader.

    const receipt = verifyFacilitatorReceipt(
      scenario.verification.receipt
    );

    const settlement = await verifySettlementFinality(
      scenario.verification.settlement
    );

    const agentAuthority = await verifyAgentAuthority(
      scenario.verification.agentAuthority
    );

    const seller = evaluateSellerBinding(
      scenario.verification.seller
    );

    const sourceAssessments = {
      receipt,
      settlement,
      agentAuthority,
      seller
    };

    const input: TransactionCompositionInput = {
      context: scenario.trustedContext,

      receipt: {
        result: receipt,
        provenance: scenario.provenance.receipt
      },

      settlement: {
        result: settlement,
        provenance: scenario.provenance.settlement
      },

      agentAuthority: {
        result: agentAuthority,
        provenance: scenario.provenance.agentAuthority
      },

      seller: {
        result: seller,
        provenance: scenario.provenance.seller
      },

      delivery: scenario.delivery,

      evidence: scenario.evidence
    };

    const transformed = applyScenario(
      request.scenarioId,
      structuredClone(input)
    );

    const composition = composeTransactionEvidence(
      transformed,
      dependencies.validator
    );

    return {
      scenarioId: request.scenarioId,
      sourceMode: request.sourceMode,
      execution: {
        completed: true,
        failureCode: null
      },
      composition,
      sourceAssessments
    };
  } catch {
    // Do not leak raw source material, private fixture
    // records, exception stacks or credential-like data.
    return failure(
      request,
      "demo_execution_failed"
    );
  }
}
