/**
 * ProofPath PP-04-C / C-08B.
 *
 * Pure, offline mapping of an already-acquired CRP
 * payments/search response.
 *
 * This module performs no HTTP calls and does not establish
 * source authenticity, receipt signature validity,
 * transaction finality, or trust-policy approval.
 *
 * Operational acquisition remains separately prohibited
 * by testnetConfig.ts during C-08B.
 */

export interface C08BExpectedCrpPayment {
  readonly merchantId: string;
  readonly nonce: string;
  readonly network: string;
  readonly asset: {
    readonly type: "PLT";
    readonly tokenId: string;
    readonly decimals: number;
  };
  readonly amount: string;
  readonly payTo: string;
}

export type C08BCrpMappingResult =
  | {
      readonly status: "candidate";
      readonly reasonCode: "unique_receipt_candidate";
      readonly jws: string;
      readonly receiptAuthenticated: false;
      readonly settlementIndependentlyVerified: false;
    }
  | {
      readonly status: "unavailable";
      readonly reasonCode:
        | "challenge_not_found"
        | "receipt_not_available";
    }
  | {
      readonly status: "rejected";
      readonly reasonCode:
        | "invalid_expected_payment"
        | "invalid_search_response"
        | "invalid_challenge_record"
        | "ambiguous_challenge_records"
        | "invalid_receipt_shape";
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

function validExpected(
  value: unknown
): value is C08BExpectedCrpPayment {
  if (!record(value) || !record(value.asset)) {
    return false;
  }

  const asset = value.asset;

  return nonempty(value.merchantId) &&
    nonempty(value.nonce) &&
    value.network === "concordium:testnet" &&
    nonempty(value.amount) &&
    nonempty(value.payTo) &&
    asset.type === "PLT" &&
    nonempty(asset.tokenId) &&
    Number.isSafeInteger(asset.decimals) &&
    asset.decimals === 6;
}

function validChallenge(value: unknown): value is RecordValue {
  if (!record(value) || !record(value.asset)) {
    return false;
  }

  const asset = value.asset;

  return nonempty(value.merchant_id) &&
    nonempty(value.nonce) &&
    nonempty(value.network) &&
    nonempty(value.amount) &&
    nonempty(value.pay_to) &&
    asset.type === "PLT" &&
    nonempty(asset.tokenId) &&
    Number.isSafeInteger(asset.decimals) &&
    (value.status === "pending" ||
      value.status === "fulfilled") &&
    (value.receipt === null ||
      record(value.receipt));
}

function exactMatch(
  candidate: RecordValue,
  expected: C08BExpectedCrpPayment
): boolean {
  const asset = candidate.asset as RecordValue;

  return candidate.merchant_id === expected.merchantId &&
    candidate.nonce === expected.nonce &&
    candidate.network === expected.network &&
    candidate.amount === expected.amount &&
    candidate.pay_to === expected.payTo &&
    asset.type === expected.asset.type &&
    asset.tokenId === expected.asset.tokenId &&
    asset.decimals === expected.asset.decimals;
}

function validCompactJws(value: unknown): value is string {
  if (!nonempty(value)) {
    return false;
  }

  const parts = value.split(".");

  return parts.length === 3 &&
    parts.every(part =>
      part.length > 0 &&
      /^[A-Za-z0-9_-]+$/.test(part)
    );
}

/**
 * Select exactly one candidate from a CRP search response.
 *
 * Expectations must originate from trusted application
 * configuration, not from the response or receipt.
 *
 * This function deliberately does not read JWS payloads,
 * accept transaction hashes, or construct verifier policies.
 *
 * CRP search may return a capped collection; absence here
 * does not prove that a transaction never existed.
 */
export function mapC08BCrpSearchResponse(
  expected: C08BExpectedCrpPayment,
  response: unknown
): C08BCrpMappingResult {
  if (!validExpected(expected)) {
    return {
      status: "rejected",
      reasonCode: "invalid_expected_payment"
    };
  }

  if (!record(response) ||
      response.ok !== true ||
      !Array.isArray(response.matches)) {
    return {
      status: "rejected",
      reasonCode: "invalid_search_response"
    };
  }

  const matches: RecordValue[] = [];

  for (const candidate of response.matches) {
    if (!validChallenge(candidate)) {
      return {
        status: "rejected",
        reasonCode: "invalid_challenge_record"
      };
    }

    if (exactMatch(candidate, expected)) {
      matches.push(candidate);
    }
  }

  if (matches.length === 0) {
    return {
      status: "unavailable",
      reasonCode: "challenge_not_found"
    };
  }

  if (matches.length !== 1 || matches[0] === undefined) {
    return {
      status: "rejected",
      reasonCode: "ambiguous_challenge_records"
    };
  }

  const match = matches[0];

  if (match.status !== "fulfilled" ||
      match.receipt === null) {
    return {
      status: "unavailable",
      reasonCode: "receipt_not_available"
    };
  }

  const receipt = match.receipt as RecordValue;

  if (!validCompactJws(receipt.jws)) {
    return {
      status: "rejected",
      reasonCode: "invalid_receipt_shape"
    };
  }

  return {
    status: "candidate",
    reasonCode: "unique_receipt_candidate",
    jws: receipt.jws,
    receiptAuthenticated: false,
    settlementIndependentlyVerified: false
  };
}
