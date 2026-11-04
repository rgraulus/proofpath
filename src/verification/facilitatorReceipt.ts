/**
 * ProofPath PP-03 M3.2 — Independent Facilitator Receipt Verification.
 *
 * Narrow assurance:
 * trusted_facilitator_receipt_signature_v1
 *
 * A verified result establishes only:
 * - an authentic Ed25519 compact-JWS signature;
 * - a signing key authorized by externally anchored policy;
 * - an authenticated ccd-plt-proof@v1 payload;
 * - exact expected contract, challenge and payment bindings.
 *
 * It does not establish independent settlement finality,
 * Registry provenance, identity, seller authority or delivery.
 *
 * Policy and expected transaction inputs must be assembled
 * by a trusted application, never copied from untrusted receipts.
 */

import {
  createPublicKey,
  timingSafeEqual,
  verify as verifySignature
} from "node:crypto";

import { TextDecoder } from "node:util";

import { canonicalJsonBytes } from "../core/canonical.js";
import { sha256Bytes } from "../core/hash.js";

import type {
  AuthorizedFacilitatorSigningKey,
  FacilitatorExpectedPaymentContract,
  FacilitatorReceiptVerificationContext,
  FacilitatorReceiptVerificationResult,
  FacilitatorReceiptVerificationStatus,
  TrustedFacilitatorReceiptPolicy
} from "./types.js";

const POLICY_DOMAIN = "proofpath:facilitator-receipt-policy:v1";
const HEX64 = /^[0-9a-fA-F]{64}$/;
const HEX_DIGEST = /^[0-9a-f]{64}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const INTEGER_STRING = /^(0|[1-9][0-9]*)$/;
const DECIMAL_AMOUNT = /^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/;

const TESTNET = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
const MAINNET = "ccd:9dd9ca4d19e9393877d2c44b70f89acb";

const utf8 = new TextDecoder("utf-8", { fatal: true });

type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 2048 &&
    value.trim() === value;
}

function exactKeys(
  value: RecordValue,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);

  return required.every(key =>
    Object.prototype.hasOwnProperty.call(value, key)
  ) && keys.every(key => allowed.has(key));
}

function safeSeconds(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0;
}

function canonicalChain(value: unknown): string | null {
  switch (value) {
    case "concordium:testnet":
    case TESTNET:
      return TESTNET;
    case "concordium:mainnet":
    case MAINNET:
      return MAINNET;
    default:
      return null;
  }
}

function decodeBase64Url(value: string, limit: number): Buffer {
  if (
    value.length === 0 ||
    value.length > limit * 2 ||
    !BASE64URL.test(value) ||
    value.length % 4 === 1
  ) {
    throw new Error("invalid_base64url");
  }

  const decoded = Buffer.from(value, "base64url");

  if (
    decoded.length === 0 ||
    decoded.length > limit ||
    decoded.toString("base64url") !== value
  ) {
    throw new Error("noncanonical_base64url");
  }

  return decoded;
}

/**
 * Reject ambiguous JSON before JSON.parse can overwrite duplicate keys.
 *
 * This is a bounded recursive JSON grammar scan, not a permissive
 * JavaScript object parser. Duplicate keys are compared after JSON
 * string decoding, including escaped spellings of the same key.
 */
function strictJson(bytes: Buffer): RecordValue {
  if (bytes.length > 16384) {
    throw new Error("json_too_large");
  }

  const text = utf8.decode(bytes);
  let position = 0;

  function whitespace(): void {
    while (
      position < text.length &&
      /[\x20\t\r\n]/.test(text[position] ?? "")
    ) {
      position++;
    }
  }

  function stringToken(): string {
    const start = position;

    if (text[position] !== '"') {
      throw new Error("invalid_json_string");
    }

    position++;

    while (position < text.length) {
      const character = text[position++];

      if (character === '"') {
        return JSON.parse(text.slice(start, position)) as string;
      }

      if (character === "\\") {
        const escaped = text[position++];

        if (!escaped || !'"\\/bfnrtu'.includes(escaped)) {
          throw new Error("invalid_json_escape");
        }

        if (escaped === "u") {
          const hex = text.slice(position, position + 4);

          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new Error("invalid_unicode_escape");
          }

          position += 4;
        }
      } else if (
        character === undefined ||
        character.charCodeAt(0) < 0x20
      ) {
        throw new Error("invalid_json_control");
      }
    }

    throw new Error("unterminated_json_string");
  }

  function value(depth: number): void {
    if (depth > 32) {
      throw new Error("json_depth_exceeded");
    }

    whitespace();

    const character = text[position];

    if (character === "{") {
      position++;
      whitespace();

      const seen = new Set<string>();

      if (text[position] === "}") {
        position++;
        return;
      }

      while (true) {
        whitespace();
        const key = stringToken();

        if (seen.has(key)) {
          throw new Error("duplicate_json_key");
        }

        seen.add(key);
        whitespace();

        if (text[position++] !== ":") {
          throw new Error("invalid_json_colon");
        }

        value(depth + 1);
        whitespace();

        const separator = text[position++];

        if (separator === "}") return;
        if (separator !== ",") {
          throw new Error("invalid_json_object");
        }
      }
    }

    if (character === "[") {
      position++;
      whitespace();

      if (text[position] === "]") {
        position++;
        return;
      }

      while (true) {
        value(depth + 1);
        whitespace();

        const separator = text[position++];

        if (separator === "]") return;
        if (separator !== ",") {
          throw new Error("invalid_json_array");
        }
      }
    }

    if (character === '"') {
      stringToken();
      return;
    }

    const remaining = text.slice(position);
    const literal = /^(?:true|false|null)/.exec(remaining);

    if (literal) {
      position += literal[0].length;
      return;
    }

    const number =
      /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/
        .exec(remaining);

    if (number) {
      position += number[0].length;
      return;
    }

    throw new Error("invalid_json_value");
  }

  value(0);
  whitespace();

  if (position !== text.length) {
    throw new Error("json_trailing_content");
  }

  const parsed: unknown = JSON.parse(text);

  if (!record(parsed)) {
    throw new Error("json_root_not_object");
  }

  return parsed;
}

function validSigningKey(
  key: unknown
): key is AuthorizedFacilitatorSigningKey {
  if (!record(key)) return false;

  if (!exactKeys(key, [
    "kid", "kty", "crv", "x", "alg", "use"
  ])) {
    return false;
  }

  if (
    !nonempty(key.kid) ||
    key.kty !== "OKP" ||
    key.crv !== "Ed25519" ||
    key.alg !== "EdDSA" ||
    key.use !== "sig" ||
    typeof key.x !== "string"
  ) {
    return false;
  }

  try {
    return decodeBase64Url(key.x, 32).length === 32;
  } catch {
    return false;
  }
}

function validPolicy(
  policy: unknown
): policy is TrustedFacilitatorReceiptPolicy {
  if (!record(policy)) return false;

  if (!exactKeys(policy, [
    "policyId",
    "policyVersion",
    "facilitatorId",
    "authorizedKeys",
    "acceptedProofVersions",
    "maxReceiptAgeSeconds",
    "maxFutureSkewSeconds"
  ])) {
    return false;
  }

  if (
    !nonempty(policy.policyId) ||
    !nonempty(policy.policyVersion) ||
    !nonempty(policy.facilitatorId) ||
    !Number.isSafeInteger(policy.maxReceiptAgeSeconds) ||
    (policy.maxReceiptAgeSeconds as number) <= 0 ||
    !Number.isSafeInteger(policy.maxFutureSkewSeconds) ||
    (policy.maxFutureSkewSeconds as number) < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(policy.acceptedProofVersions) ||
    policy.acceptedProofVersions.length !== 1 ||
    policy.acceptedProofVersions[0] !== "ccd-plt-proof@v1"
  ) {
    return false;
  }

  if (
    !Array.isArray(policy.authorizedKeys) ||
    policy.authorizedKeys.length === 0 ||
    policy.authorizedKeys.length > 32 ||
    !policy.authorizedKeys.every(validSigningKey)
  ) {
    return false;
  }

  const kids = policy.authorizedKeys.map(key => key.kid);

  return new Set(kids).size === kids.length;
}

/**
 * Deterministic domain-separated policy commitment.
 *
 * This digest is NOT evidence of approval by itself.
 * The trusted digest must be anchored independently.
 */
export function digestFacilitatorReceiptPolicy(
  policy: TrustedFacilitatorReceiptPolicy
): string {
  if (!validPolicy(policy)) {
    throw new TypeError("Invalid Facilitator receipt policy");
  }

  return sha256Bytes(Buffer.concat([
    Buffer.from(POLICY_DOMAIN + "\0", "utf8"),
    canonicalJsonBytes(policy)
  ]));
}

function digestMatches(
  actual: string,
  trusted: unknown
): boolean {
  if (
    !HEX_DIGEST.test(actual) ||
    typeof trusted !== "string" ||
    !HEX_DIGEST.test(trusted)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(trusted, "hex")
  );
}

function validExpectedContract(
  value: unknown
): value is FacilitatorExpectedPaymentContract {
  if (!record(value)) return false;

  if (!exactKeys(value, [
    "contractId", "contractVersion", "isFrozen",
    "merchantId", "resource", "network",
    "asset", "amount", "payTo"
  ], ["chain_id"])) {
    return false;
  }

  if (
    !nonempty(value.contractId) ||
    !nonempty(value.contractVersion) ||
    value.isFrozen !== true ||
    !nonempty(value.merchantId) ||
    !nonempty(value.payTo) ||
    !record(value.resource) ||
    !record(value.asset)
  ) {
    return false;
  }

  if (
    !exactKeys(value.resource, ["method", "path"]) ||
    !["GET", "POST", "PUT", "PATCH", "DELETE"]
      .includes(String(value.resource.method)) ||
    !nonempty(value.resource.path)
  ) {
    return false;
  }

  if (
    !exactKeys(value.asset, ["type", "tokenId", "decimals"]) ||
    value.asset.type !== "PLT" ||
    !nonempty(value.asset.tokenId) ||
    !Number.isInteger(value.asset.decimals) ||
    (value.asset.decimals as number) < 0 ||
    (value.asset.decimals as number) > 18
  ) {
    return false;
  }

  const chain = canonicalChain(value.network);

  if (
    !chain ||
    (value.chain_id !== undefined &&
      value.chain_id !== chain)
  ) {
    return false;
  }

  if (
    typeof value.amount !== "string" ||
    !DECIMAL_AMOUNT.test(value.amount)
  ) {
    return false;
  }

  const fraction = value.amount.split(".")[1] ?? "";

  return fraction.length <= (value.asset.decimals as number);
}

function rawAmount(amount: string, decimals: number): string {
  const [whole = "", fraction = ""] = amount.split(".");

  return (
    whole + fraction.padEnd(decimals, "0")
  ).replace(/^0+/, "") || "0";
}

function matchingContract(
  actual: unknown,
  expected: FacilitatorExpectedPaymentContract
): boolean {
  if (!record(actual)) return false;

  if (!exactKeys(actual, [
    "contractId", "contractVersion", "isFrozen",
    "merchantId", "resource", "network",
    "asset", "amount", "payTo", "chain_id"
  ])) {
    return false;
  }

  if (!record(actual.resource) || !record(actual.asset)) {
    return false;
  }

  if (
    !exactKeys(actual.resource, ["method", "path"]) ||
    !exactKeys(actual.asset, ["type", "tokenId", "decimals"])
  ) {
    return false;
  }

  const chain = canonicalChain(actual.network);
  const expectedChain = canonicalChain(expected.network);

  return chain !== null &&
    expectedChain !== null &&
    chain === expectedChain &&
    actual.chain_id === expectedChain &&
    actual.contractId === expected.contractId &&
    actual.contractVersion === expected.contractVersion &&
    actual.isFrozen === true &&
    actual.merchantId === expected.merchantId &&
    actual.resource.method === expected.resource.method &&
    actual.resource.path === expected.resource.path &&
    actual.network === expected.network &&
    actual.asset.type === "PLT" &&
    actual.asset.tokenId === expected.asset.tokenId &&
    actual.asset.decimals === expected.asset.decimals &&
    actual.amount === expected.amount &&
    actual.payTo === expected.payTo;
}

type Evaluation = {
  status: FacilitatorReceiptVerificationStatus;
  reason: string;
};

function evaluatePayload(
  payload: RecordValue,
  expected: FacilitatorReceiptVerificationContext["expected"],
  policy: TrustedFacilitatorReceiptPolicy,
  nowSeconds: number
): Evaluation {
  const fail = (reason: string): Evaluation => ({
    status: "failed",
    reason
  });

  if (!exactKeys(payload, [
    "proofVersion", "contract", "nonce",
    "settlement", "chain", "paymentEvent"
  ])) {
    return fail("receipt_payload_shape_invalid");
  }

  if (
    payload.proofVersion !== "ccd-plt-proof@v1" ||
    !policy.acceptedProofVersions.includes(
      payload.proofVersion as "ccd-plt-proof@v1"
    )
  ) {
    return fail("unsupported_receipt_profile");
  }

  if (payload.nonce !== expected.nonce) {
    return fail("receipt_nonce_mismatch");
  }

  if (!matchingContract(payload.contract, expected.contract)) {
    return fail("receipt_contract_mismatch");
  }

  if (!record(payload.settlement) ||
      !exactKeys(payload.settlement,
        ["status", "settledAt"], ["expiresAt"])) {
    return fail("receipt_settlement_shape_invalid");
  }

  const settlement = payload.settlement;

  if (
    settlement.status !== "finalized" ||
    !safeSeconds(settlement.settledAt) ||
    (settlement.expiresAt !== undefined &&
      !safeSeconds(settlement.expiresAt))
  ) {
    return fail("receipt_settlement_claim_invalid");
  }

  const settledAt = settlement.settledAt as number;

  if (
    settledAt > nowSeconds + policy.maxFutureSkewSeconds ||
    nowSeconds - settledAt > policy.maxReceiptAgeSeconds
  ) {
    return fail("receipt_time_window_invalid");
  }

  if (
    settlement.expiresAt !== undefined &&
    ((settlement.expiresAt as number) < settledAt ||
      nowSeconds > (settlement.expiresAt as number))
  ) {
    return fail("receipt_expired_or_inconsistent");
  }

  if (!record(payload.chain) ||
      !exactKeys(payload.chain, ["transactionHash"],
        ["blockHash", "blockHeight"])) {
    return fail("receipt_chain_shape_invalid");
  }

  if (
    typeof payload.chain.transactionHash !== "string" ||
    !HEX64.test(payload.chain.transactionHash) ||
    payload.chain.transactionHash.toLowerCase() !==
      expected.transactionHash.toLowerCase()
  ) {
    return fail("receipt_transaction_mismatch");
  }

  if (
    (payload.chain.blockHash !== undefined &&
      (typeof payload.chain.blockHash !== "string" ||
        !HEX64.test(payload.chain.blockHash))) ||
    (payload.chain.blockHeight !== undefined &&
      (!safeSeconds(payload.chain.blockHeight)))
  ) {
    return fail("receipt_block_reference_invalid");
  }

  if (!record(payload.paymentEvent) ||
      !exactKeys(payload.paymentEvent,
        ["kind", "tokenId", "amountRaw", "to"], ["from"])) {
    return fail("receipt_payment_event_shape_invalid");
  }

  const event = payload.paymentEvent;

  if (
    event.kind !== "plt.transfer" ||
    event.tokenId !== expected.contract.asset.tokenId ||
    event.to !== expected.contract.payTo ||
    (event.from !== undefined && !nonempty(event.from)) ||
    typeof event.amountRaw !== "string" ||
    !INTEGER_STRING.test(event.amountRaw) ||
    event.amountRaw !== rawAmount(
      expected.contract.amount,
      expected.contract.asset.decimals
    )
  ) {
    return fail("receipt_payment_tuple_mismatch");
  }

  return {
    status: "verified",
    reason: "facilitator_receipt_signature_and_binding_verified"
  };
}

/**
 * Verify an independently authorized Facilitator receipt.
 *
 * Replay consumption and independently observed settlement
 * must be enforced by separate application/verifier layers.
 */
export function verifyFacilitatorReceipt(
  context: FacilitatorReceiptVerificationContext
): FacilitatorReceiptVerificationResult {
  const candidate = context as unknown as RecordValue;

  const policy = record(candidate)
    ? candidate.policy
    : undefined;

  const policyId = record(policy) && nonempty(policy.policyId)
    ? policy.policyId
    : "";

  const facilitatorId =
    record(policy) && nonempty(policy.facilitatorId)
      ? policy.facilitatorId
      : "";

  let policyDigest = "";
  let signingKeyId: string | null = null;
  let transactionHash: string | null = null;
  let signatureAuthenticated = false;

  function decision(
    status: FacilitatorReceiptVerificationStatus,
    reasonCode: string
  ): FacilitatorReceiptVerificationResult {
    return {
      claim: "facilitator_receipt_signature_and_binding",
      assuranceModel: "trusted_facilitator_receipt_signature_v1",
      status,
      reasonCode,
      policyId,
      policyDigest,
      facilitatorId,
      signingKeyId,
      transactionHash,
      signatureAuthenticated,
      settlementIndependentlyVerified: false
    };
  }

  if (!record(candidate) || !validPolicy(policy)) {
    return decision("indeterminate", "facilitator_policy_invalid");
  }

  try {
    policyDigest = digestFacilitatorReceiptPolicy(policy);
  } catch {
    return decision("indeterminate", "policy_digest_unavailable");
  }

  if (!digestMatches(
    policyDigest,
    candidate.trustedPolicyDigest
  )) {
    return decision("indeterminate", "trusted_policy_digest_mismatch");
  }

  if (
    !record(candidate.expected) ||
    !nonempty(candidate.expected.nonce) ||
    !validExpectedContract(candidate.expected.contract) ||
    typeof candidate.expected.transactionHash !== "string" ||
    !HEX64.test(candidate.expected.transactionHash)
  ) {
    return decision("indeterminate", "expected_payment_invalid");
  }

  if (typeof candidate.now !== "function") {
    return decision("indeterminate", "verification_clock_missing");
  }

  let now: Date;

  try {
    now = (candidate.now as () => Date)();
  } catch {
    return decision("indeterminate", "verification_clock_unavailable");
  }

  if (!(now instanceof Date) ||
      !Number.isFinite(now.getTime())) {
    return decision("indeterminate", "verification_clock_invalid");
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (
    typeof candidate.jws !== "string" ||
    candidate.jws.length > 32768
  ) {
    return decision("failed", "receipt_jws_invalid");
  }

  const segments = candidate.jws.split(".");

  if (segments.length !== 3) {
    return decision("failed", "receipt_jws_invalid");
  }

  const [headerPart, payloadPart, signaturePart] = segments;

  if (!headerPart || !payloadPart || !signaturePart) {
    return decision("failed", "receipt_jws_invalid");
  }

  let header: RecordValue;
  let payloadBytes: Buffer;
  let signature: Buffer;

  try {
    header = strictJson(decodeBase64Url(headerPart, 4096));
    payloadBytes = decodeBase64Url(payloadPart, 16384);
    signature = decodeBase64Url(signaturePart, 64);
  } catch {
    return decision("failed", "receipt_jws_encoding_invalid");
  }

  if (
    !exactKeys(header, ["alg", "kid", "typ"]) ||
    header.alg !== "EdDSA" ||
    header.typ !== "JWT" ||
    !nonempty(header.kid) ||
    signature.length !== 64
  ) {
    return decision("failed", "receipt_jws_header_invalid");
  }

  signingKeyId = header.kid;

  const key = policy.authorizedKeys.find(
    approved => approved.kid === header.kid
  );

  if (!key) {
    return decision("failed", "facilitator_signing_key_not_approved");
  }

  try {
    const publicKey = createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: key.x
      },
      format: "jwk"
    });

    const signingInput = Buffer.from(
      headerPart + "." + payloadPart,
      "ascii"
    );

    const authentic = verifySignature(
      null,
      signingInput,
      publicKey,
      signature
    );

    if (!authentic) {
      return decision("failed", "receipt_signature_invalid");
    }
  } catch {
    return decision("indeterminate", "approved_key_unusable");
  }

  signatureAuthenticated = true;

  let payload: RecordValue;

  try {
    payload = strictJson(payloadBytes);
  } catch {
    return decision("failed", "receipt_payload_json_invalid");
  }

  const evaluation = evaluatePayload(
    payload,
    candidate.expected as unknown as FacilitatorReceiptVerificationContext["expected"],
    policy,
    nowSeconds
  );

  if (
    record(payload.chain) &&
    typeof payload.chain.transactionHash === "string" &&
    HEX64.test(payload.chain.transactionHash)
  ) {
    transactionHash = payload.chain.transactionHash;
  }

  return decision(evaluation.status, evaluation.reason);
}
