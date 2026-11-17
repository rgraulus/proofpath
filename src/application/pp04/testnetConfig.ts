/**
 * ProofPath PP-04-C / C-08B
 * Controlled Testnet integration configuration boundary.
 *
 * C-08B permits implementation and deterministic offline
 * testing only. It does not authorize live Testnet access.
 *
 * This module does not authenticate policy authority,
 * approve trust anchors, or authorize transactions.
 */

/**
 * Operational live acquisition is deliberately disabled.
 *
 * No environment variable, incoming HTTP request, caller
 * argument or fixture can override this decision.
 *
 * Any future activation requires a separately authorized
 * C-08C change and corresponding acceptance review.
 */
const LIVE_TESTNET_ACQUISITION_ENABLED = false;

export type C08BActivationDecision =
  | {
      allowed: false;
      reason: "c08b_live_acquisition_not_authorized";
    };

/**
 * Return the operational activation decision.
 *
 * This function is intentionally independent of caller
 * input and process environment.
 */
export function getC08BActivationDecision():
  C08BActivationDecision {
  if (LIVE_TESTNET_ACQUISITION_ENABLED) {
    // The C-08B type contract cannot express approval.
    // Authorization is reserved for a future milestone.
    throw new Error(
      "c08b_activation_contract_requires_review"
    );
  }

  return {
    allowed: false,
    reason: "c08b_live_acquisition_not_authorized"
  };
}

/**
 * Fail closed before any operational live-source access.
 *
 * The separate C-08B offline tests may exercise pure
 * mapping logic and injected mock data without invoking
 * this operational acquisition boundary.
 */
export function assertC08BLiveAcquisitionAuthorized():
  never {
  const decision = getC08BActivationDecision();

  throw new Error(decision.reason);
}
