
/**
 * ProofPath IOT-08B — XDC Apothem token-transfer verifier.
 *
 * Deterministic assessment under the IOT-07 architecture.
 * All positive outcomes are simulated and test-only.
 *
 * This implementation does not authenticate a live RPC source,
 * authorize a production policy, prove historical token
 * semantics, or independently verify XDPoS consensus.
 */

import { timingSafeEqual } from "node:crypto";

import { canonicalJsonBytes } from "../core/canonical.js";
import { sha256Bytes } from "../core/hash.js";

import {
  XDC_APOTHEM_NETWORK,
  XDC_ASSURANCE_PROFILE
} from "./xdcTypes.js";

import type {
  XdcAssuranceObligations,
  XdcAssuranceStatus,
  XdcExpectedTransfer,
  XdcObligationStatus,
  XdcObservedTransfer,
  XdcPaymentVerificationResult,
  XdcTrustedPaymentPolicy,
  XdcVerificationContext
} from "./xdcTypes.js";

const POLICY_DOMAIN = "proofpath:xdc-payment-policy:v1";

const APOTHEM_USDC =
  "0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const UINT = /^(0|[1-9][0-9]*)$/;
const HEX_QUANTITY = /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/;
const MAX_UINT256 = (1n << 256n) - 1n;

const LIMITATIONS = [
  "simulation_only",
  "live_assurance_not_established",
  "rpc_source_not_independently_authenticated",
  "historical_token_semantics_not_independently_approved",
  "consensus_not_independently_verified",
  "commercial_payment_purpose_not_established",
  "x402_payment_satisfaction_not_established"
];

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

function address(value: unknown): value is string {
  return typeof value === "string" && ADDRESS.test(value);
}

function hash(value: unknown): value is string {
  return typeof value === "string" && HASH.test(value);
}

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function sameHash(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function quantity(value: unknown): value is string {
  return typeof value === "string" &&
    HEX_QUANTITY.test(value) &&
    value.length <= 66;
}

function amount(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 78 ||
    !UINT.test(value)
  ) return false;

  try {
    const n = BigInt(value);
    return n > 0n && n <= MAX_UINT256;
  } catch {
    return false;
  }
}

function endpoint(value: unknown): value is string {
  if (!nonempty(value)) return false;

  try {
    const url = new URL(value);

    return url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      url.href === value;
  } catch {
    return false;
  }
}

function validPolicy(
  value: unknown
): value is XdcTrustedPaymentPolicy {
  if (!record(value)) return false;

  return nonempty(value.policyId) &&
    nonempty(value.policyVersion) &&
    value.network === XDC_APOTHEM_NETWORK &&
    address(value.approvedTokenContract) &&
    sameAddress(value.approvedTokenContract, APOTHEM_USDC) &&
    value.approvedTokenDecimals === 6 &&
    endpoint(value.trustedNodeEndpoint) &&
    value.requireSuccessfulExecution === true &&
    value.requireExactTransfer === true &&
    value.requireFinalizedBlock === true &&
    value.requireCanonicalAncestry === true &&
    Number.isSafeInteger(value.maxObservationAgeSeconds) &&
    (value.maxObservationAgeSeconds as number) > 0 &&
    Number.isSafeInteger(value.maxFutureSkewSeconds) &&
    (value.maxFutureSkewSeconds as number) >= 0;
}

function validExpected(
  value: unknown
): value is XdcExpectedTransfer {
  if (!record(value)) return false;

  return value.network === XDC_APOTHEM_NETWORK &&
    hash(value.transactionHash) &&
    address(value.tokenContract) &&
    sameAddress(value.tokenContract, APOTHEM_USDC) &&
    address(value.to) &&
    (value.from === undefined || address(value.from)) &&
    amount(value.amountAtomic) &&
    value.decimals === 6;
}

/**
 * Digest computation establishes policy-content integrity,
 * not policy approval by an independent authority.
 */
export function digestXdcPaymentPolicy(
  policy: XdcTrustedPaymentPolicy
): string {
  if (!validPolicy(policy)) {
    throw new TypeError("Invalid XDC payment policy");
  }

  return sha256Bytes(Buffer.concat([
    Buffer.from(POLICY_DOMAIN + "\0", "utf8"),
    canonicalJsonBytes(policy)
  ]));
}

function trustedDigestMatches(
  actual: string,
  trusted: unknown
): boolean {
  if (
    !DIGEST.test(actual) ||
    typeof trusted !== "string" ||
    !DIGEST.test(trusted)
  ) return false;

  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(trusted, "hex")
  );
}

function initialObligations(): XdcAssuranceObligations {
  return {
    network: "indeterminate",
    policy: "indeterminate",
    sourceTrust: "indeterminate",
    execution: "indeterminate",
    transfer: "indeterminate",
    tokenSemantics: "indeterminate",
    finality: "indeterminate"
  };
}

function setObligation(
  obligations: XdcAssuranceObligations,
  key: keyof XdcAssuranceObligations,
  value: XdcObligationStatus
): void {
  obligations[key] = value;
}

function parseCalldata(value: unknown): {
  to: string;
  amountAtomic: string;
} | null {
  if (
    typeof value !== "string" ||
    !/^0xa9059cbb[0-9a-fA-F]{128}$/.test(value)
  ) return null;

  const recipientWord = value.slice(10, 74);

  if (!/^0{24}[0-9a-fA-F]{40}$/.test(recipientWord)) {
    return null;
  }

  return {
    to: "0x" + recipientWord.slice(24).toLowerCase(),
    amountAtomic: BigInt("0x" + value.slice(74)).toString()
  };
}

function validTransfer(value: unknown): value is XdcObservedTransfer {
  if (!record(value)) return false;

  return address(value.tokenContract) &&
    hash(value.transactionHash) &&
    hash(value.blockHash) &&
    quantity(value.logIndex) &&
    address(value.from) &&
    address(value.to) &&
    amount(value.amountAtomic) &&
    value.removed === false;
}

function validTime(value: unknown): value is string {
  if (!nonempty(value)) return false;

  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    date.toISOString() === value;
}

/**
 * This is a deterministic test boundary only.
 *
 * A caller can fabricate the observation and trusted digest.
 * Consequently, this function cannot produce live assurance.
 */
export function verifyXdcTokenTransfer(
  context: XdcVerificationContext
): XdcPaymentVerificationResult {
  const raw: unknown = context;
  const input = record(raw) ? raw : {};

  const rawPolicy = input.policy;
  const rawExpected = input.expected;

  const environment = input.environment === "simulated_test_only"
    ? "simulated_test_only"
    : "unapproved_live";

  const obligations = initialObligations();

  let policyDigest = "";
  let blockHash: string | null = null;
  let blockNumber: string | null = null;

  let observedTransfer:
    XdcPaymentVerificationResult["observedTransfer"] = null;

  const policyId = record(rawPolicy) &&
    nonempty(rawPolicy.policyId)
      ? rawPolicy.policyId : "";

  const policyVersion = record(rawPolicy) &&
    nonempty(rawPolicy.policyVersion)
      ? rawPolicy.policyVersion : "";

  const network = record(rawExpected) &&
    nonempty(rawExpected.network)
      ? rawExpected.network : "";

  const transactionHash = record(rawExpected) &&
    typeof rawExpected.transactionHash === "string"
      ? rawExpected.transactionHash : "";

  function decision(
    status: XdcAssuranceStatus,
    reasonCode: string
  ): XdcPaymentVerificationResult {
    return {
      profileId: XDC_ASSURANCE_PROFILE,
      claim:
        "finalized_xdc_token_transfer_matches_expected_payment",
      assuranceModel: XDC_ASSURANCE_PROFILE,
      environment,
      status,
      reasonCode,
      policyId,
      policyVersion,
      policyDigest,
      network,
      transactionHash,
      blockHash,
      blockNumber,
      obligations: { ...obligations },
      observedTransfer,
      limitations: [...LIMITATIONS],
      consensusIndependentlyVerified: false,
      liveAssuranceEstablished: false
    };
  }

  // Never permit positive live assurance through this API.
  if (environment !== "simulated_test_only") {
    return decision("indeterminate", "live_trust_gates_not_approved");
  }

  if (!validPolicy(rawPolicy)) {
    return decision("indeterminate", "xdc_policy_invalid");
  }

  try {
    policyDigest = digestXdcPaymentPolicy(rawPolicy);
  } catch {
    return decision("indeterminate", "policy_digest_unavailable");
  }

  if (!trustedDigestMatches(
    policyDigest, input.trustedPolicyDigest
  )) {
    return decision("indeterminate", "policy_digest_mismatch");
  }

  setObligation(obligations, "policy", "satisfied");

  if (!validExpected(rawExpected)) {
    return decision("indeterminate", "expected_transfer_invalid");
  }

  if (rawExpected.network !== rawPolicy.network) {
    setObligation(obligations, "network", "failed");
    return decision("failed", "network_mismatch");
  }

  setObligation(obligations, "network", "satisfied");

  const observation = input.observation;

  if (!record(observation)) {
    return decision("indeterminate", "observation_missing");
  }

  if (
    observation.network !== XDC_APOTHEM_NETWORK ||
    !endpoint(observation.nodeEndpoint) ||
    observation.nodeEndpoint !== rawPolicy.trustedNodeEndpoint
  ) {
    return decision("indeterminate", "source_context_unresolved");
  }

  if (!validTime(observation.observedAt)) {
    return decision("indeterminate", "observation_time_invalid");
  }

  if (typeof input.now !== "function") {
    return decision("indeterminate", "verification_clock_missing");
  }

  let now: Date;

  try {
    now = (input.now as () => Date)();
  } catch {
    return decision("indeterminate", "verification_clock_unavailable");
  }

  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    return decision("indeterminate", "verification_clock_invalid");
  }

  const ageSeconds =
    (now.getTime() - Date.parse(observation.observedAt)) / 1000;

  if (
    ageSeconds > rawPolicy.maxObservationAgeSeconds ||
    ageSeconds < -rawPolicy.maxFutureSkewSeconds
  ) {
    return decision("indeterminate", "observation_time_out_of_policy");
  }

  // A simulated source assertion is not real authentication.
  setObligation(obligations, "sourceTrust", "indeterminate");

  const tx = observation.transaction;

  if (!record(tx)) {
    return decision("indeterminate", "transaction_observation_missing");
  }

  if (
    !hash(tx.transactionHash) ||
    !hash(tx.receiptTransactionHash) ||
    !hash(tx.blockHash) ||
    !hash(tx.receiptBlockHash) ||
    !quantity(tx.blockNumber) ||
    !quantity(tx.receiptBlockNumber) ||
    !address(tx.from) ||
    !address(tx.to) ||
    !Array.isArray(tx.transfers) ||
    tx.transfers.length > 1024
  ) {
    return decision("indeterminate", "transaction_observation_invalid");
  }

  blockHash = tx.blockHash;
  blockNumber = tx.blockNumber;

  if (
    !sameHash(tx.transactionHash, rawExpected.transactionHash) ||
    !sameHash(tx.receiptTransactionHash, tx.transactionHash) ||
    !sameHash(tx.receiptBlockHash, tx.blockHash) ||
    BigInt(tx.receiptBlockNumber) !== BigInt(tx.blockNumber) ||
    tx.blockContainsTransaction !== true
  ) {
    setObligation(obligations, "execution", "failed");
    return decision("failed", "transaction_binding_mismatch");
  }

  if (tx.receiptStatus !== "0x1") {
    if (tx.receiptStatus === "0x0") {
      setObligation(obligations, "execution", "failed");
      return decision("failed", "transaction_reverted");
    }
    return decision("indeterminate", "execution_status_unknown");
  }

  setObligation(obligations, "execution", "satisfied");

  if (!sameAddress(tx.to, rawExpected.tokenContract)) {
    setObligation(obligations, "transfer", "failed");
    return decision("failed", "token_contract_mismatch");
  }

  const calldata = parseCalldata(tx.input);

  if (!calldata) {
    return decision("indeterminate", "unsupported_transfer_calldata");
  }

  if (
    !sameAddress(calldata.to, rawExpected.to) ||
    calldata.amountAtomic !== rawExpected.amountAtomic ||
    (
      rawExpected.from !== undefined &&
      !sameAddress(tx.from, rawExpected.from)
    )
  ) {
    setObligation(obligations, "transfer", "failed");
    return decision("failed", "calldata_transfer_mismatch");
  }

  if (
    tx.transferEvidenceComplete !== true ||
    tx.transfers.length !== 1
  ) {
    return decision("indeterminate", "transfer_evidence_incomplete");
  }

  const transfer = tx.transfers[0];

  if (!validTransfer(transfer) || !record(transfer)) {
    return decision("indeterminate", "transfer_log_invalid");
  }

  if (
    !sameHash(transfer.transactionHash, tx.transactionHash) ||
    !sameHash(transfer.blockHash, tx.blockHash) ||
    !sameAddress(transfer.tokenContract, rawExpected.tokenContract) ||
    !sameAddress(transfer.from, tx.from) ||
    !sameAddress(transfer.to, rawExpected.to) ||
    transfer.amountAtomic !== rawExpected.amountAtomic
  ) {
    setObligation(obligations, "transfer", "failed");
    return decision("failed", "transfer_log_mismatch");
  }

  // Runtime shape was checked above.
  observedTransfer =
    transfer as unknown as NonNullable<typeof observedTransfer>;

  setObligation(obligations, "transfer", "satisfied");

  const semantics = observation.tokenSemantics;

  if (
    !record(semantics) ||
    semantics.contractCodePresentAtBlock !== true ||
    !nonempty(semantics.historicalImplementationReference) ||
    semantics.supportedTransferSemanticsReported !== true
  ) {
    return decision("indeterminate", "token_semantics_unresolved");
  }

  // Satisfied only as a simulated test assertion.
  setObligation(obligations, "tokenSemantics", "satisfied");

  const finality = observation.finality;

  if (
    !record(finality) ||
    !hash(finality.canonicalBlockHash) ||
    !quantity(finality.canonicalBlockNumber) ||
    !hash(finality.finalizedBlockHash) ||
    !quantity(finality.finalizedBlockNumber)
  ) {
    return decision("indeterminate", "finality_evidence_missing");
  }

  if (
    !sameHash(finality.canonicalBlockHash, tx.blockHash) ||
    BigInt(finality.canonicalBlockNumber) !==
      BigInt(tx.blockNumber)
  ) {
    return decision("indeterminate", "canonical_block_unresolved");
  }

  if (
    BigInt(finality.finalizedBlockNumber) <
      BigInt(tx.blockNumber) ||
    finality.canonicalAncestryReported !== true
  ) {
    return decision("indeterminate", "finalized_ancestry_unresolved");
  }

  // Satisfied only as a simulated finality assertion.
  setObligation(obligations, "finality", "satisfied");

  return decision("indeterminate", "simulated_checks_passed_trust_unestablished");
}
