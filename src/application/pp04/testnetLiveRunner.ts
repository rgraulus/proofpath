/**
 * ProofPath PP-04-C / C-08C.
 *
 * Gate A acquisition-to-mapper runner.
 *
 * This module is not an operational live entry point.
 * It requires a preconstructed response fixture and does not
 * approve source authenticity or settlement evidence.
 *
 * Gate B remains separately unauthorized.
 */

import {
  acquireC08CSearchObservation,
  C08C_SEARCH_ENDPOINT
} from "./testnetLiveSource.js";

import type {
  C08CSourceResult
} from "./testnetLiveSource.js";

import {
  mapC08BCrpSearchResponse
} from "./testnetSource.js";

import type {
  C08BExpectedCrpPayment
} from "./testnetSource.js";

/**
 * The trusted offline harness supplies a constructed Response.
 * No executable transport callback can be injected into the source.
 */
export interface C08COfflineRunnerInput {
  readonly expected: C08BExpectedCrpPayment;
  readonly response: Response;
}

export type C08COfflineRunnerResult =
  | {
      readonly status: "blocked";
      readonly reasonCode: string;
      readonly sourceAuthenticated: false;
      readonly settlementIndependentlyVerified: false;
      readonly receiptAuthenticated: false;
    }
  | {
      readonly status: "unavailable" | "rejected";
      readonly reasonCode: string;
      readonly sourceAuthenticated: false;
      readonly settlementIndependentlyVerified: false;
      readonly receiptAuthenticated: false;
    }
  | {
      readonly status: "candidate";
      readonly reasonCode: "unique_receipt_candidate";
      readonly sourceAuthenticated: false;
      readonly settlementIndependentlyVerified: false;
      readonly receiptAuthenticated: false;
    };

function sourceFailure(
  result: Extract<
    C08CSourceResult,
    { status: "blocked" | "unavailable" }
  >
): C08COfflineRunnerResult {
  return {
    status: result.status,
    reasonCode: result.reasonCode,
    sourceAuthenticated: false,
    settlementIndependentlyVerified: false,
    receiptAuthenticated: false
  };
}

/**
 * One offline CRP search observation, followed by C-08B
 * exact-tuple mapping.
 *
 * No raw response, challenge, or compact JWS is returned.
 * A candidate is not an authenticated receipt.
 *
 * This function does not invoke the PP-04 composition engine,
 * establish approved trust context, or execute a payment.
 */
export async function runC08COfflineObservation(
  input: C08COfflineRunnerInput
): Promise<C08COfflineRunnerResult> {
  if (!input ||
      !input.expected ||
      !(input.response instanceof Response)) {
    return {
      status: "blocked",
      reasonCode: "invalid_offline_dependencies",
      sourceAuthenticated: false,
      settlementIndependentlyVerified: false,
      receiptAuthenticated: false
    };
  }

  const observation = await acquireC08CSearchObservation({
    mode: "offline_mock",
    expected: input.expected,
    endpoint: C08C_SEARCH_ENDPOINT,
    response: input.response
  });

  if (observation.status !== "observed") {
    return sourceFailure(observation);
  }

  const mapping = mapC08BCrpSearchResponse(
    input.expected,
    observation.response
  );

  if (mapping.status !== "candidate") {
    return {
      status: mapping.status,
      reasonCode: mapping.reasonCode,
      sourceAuthenticated: false,
      settlementIndependentlyVerified: false,
      receiptAuthenticated: false
    };
  }

  return {
    status: "candidate",
    reasonCode: "unique_receipt_candidate",
    sourceAuthenticated: false,
    settlementIndependentlyVerified: false,
    receiptAuthenticated: false
  };
}

/**
 * Explicit operational prohibition during Gate A.
 * Do not delegate to an injected transport in live mode.
 */
export function runC08CLiveObservation(): never {
  throw new Error("c08c_gate_b_live_not_authorized");
}
