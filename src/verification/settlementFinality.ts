/**
 * ProofPath PP-03 M3.3 — Trusted-node settlement verification.
 *
 * Establishes a narrow claim about a finalized, successful
 * Concordium transaction containing an expected PLT transfer.
 *
 * An independently anchored policy and trusted application
 * composition are prerequisites.
 *
 * This module does not authenticate injected transports,
 * independently verify consensus, or authenticate receipts,
 * identity, seller authority, or delivery.
 */

import { timingSafeEqual } from "node:crypto";
import { AccountAddress } from "@concordium/web-sdk";

import { canonicalJsonBytes } from "../core/canonical.js";
import { sha256Bytes } from "../core/hash.js";

import type {
  ExpectedSettlementPayment,
  ObservedPltTransfer,
  SettlementObservation,
  SettlementVerificationContext,
  SettlementVerificationResult,
  SettlementVerificationStatus,
  TrustedSettlementPolicy
} from "./types.js";

const POLICY_DOMAIN = "proofpath:settlement-policy:v1";
const HEX64 = /^[0-9a-f]{64}$/;
const INTEGER = /^(0|[1-9][0-9]*)$/;
const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{50}$/;
const MAX_U64 = (1n << 64n) - 1n;

function validAddress(value: unknown): value is string {
  if (typeof value !== "string" || !ADDRESS.test(value)) {
    return false;
  }

  try {
    return AccountAddress.fromBase58(value).toString() === value;
  } catch {
    return false;
  }
}

type ObjectValue = Record<string, unknown>;

function record(value: unknown): value is ObjectValue {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 2048 &&
    value.trim() === value;
}

function exactKeys(
  value: ObjectValue,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const allowed = new Set([...required, ...optional]);

  return required.every(key =>
    Object.prototype.hasOwnProperty.call(value, key)
  ) && Object.keys(value).every(key => allowed.has(key));
}

function timestamp(value: unknown): value is string {
  if (!text(value)) return false;

  const parsed = new Date(value);

  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString() === value;
}

function endpoint(value: unknown): value is string {
  if (!text(value)) return false;

  try {
    const url = new URL(value);

    return url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      url.href === value;
  } catch {
    return false;
  }
}

function validPolicy(
  value: unknown
): value is TrustedSettlementPolicy {
  if (!record(value)) return false;

  if (!exactKeys(value, [
    "policyId",
    "policyVersion",
    "network",
    "expectedGenesisHash",
    "trustedNodeEndpoint",
    "maxObservationAgeSeconds",
    "maxFutureSkewSeconds",
    "requireFinalizedBlock"
  ])) {
    return false;
  }

  return text(value.policyId) &&
    text(value.policyVersion) &&
    (
      value.network === "concordium:testnet" ||
      value.network === "concordium:mainnet"
    ) &&
    typeof value.expectedGenesisHash === "string" &&
    HEX64.test(value.expectedGenesisHash) &&
    endpoint(value.trustedNodeEndpoint) &&
    Number.isSafeInteger(value.maxObservationAgeSeconds) &&
    (value.maxObservationAgeSeconds as number) > 0 &&
    Number.isSafeInteger(value.maxFutureSkewSeconds) &&
    (value.maxFutureSkewSeconds as number) >= 0 &&
    value.requireFinalizedBlock === true;
}

/**
 * Deterministic, domain-separated policy commitment.
 * A computed digest alone is not evidence of approval.
 */
export function digestSettlementPolicy(
  policy: TrustedSettlementPolicy
): string {
  if (!validPolicy(policy)) {
    throw new TypeError("Invalid settlement verification policy");
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
    !HEX64.test(actual) ||
    typeof trusted !== "string" ||
    !HEX64.test(trusted)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(trusted, "hex")
  );
}

function validAmount(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 20 ||
    !INTEGER.test(value)
  ) {
    return false;
  }

  try {
    const amount = BigInt(value);
    return amount > 0n && amount <= MAX_U64;
  } catch {
    return false;
  }
}

function validExpected(
  value: unknown
): value is ExpectedSettlementPayment {
  if (!record(value)) return false;

  if (!exactKeys(value, [
    "network",
    "transactionHash",
    "tokenId",
    "decimals",
    "amountRaw",
    "payTo"
  ], ["from"])) {
    return false;
  }

  return (
    value.network === "concordium:testnet" ||
    value.network === "concordium:mainnet"
  ) &&
    typeof value.transactionHash === "string" &&
    HEX64.test(value.transactionHash) &&
    typeof value.tokenId === "string" &&
    /^[a-zA-Z0-9.%\-]{1,128}$/.test(value.tokenId) &&
    Number.isSafeInteger(value.decimals) &&
    (value.decimals as number) >= 0 &&
    (value.decimals as number) <= 18 &&
    validAmount(value.amountRaw) &&
    validAddress(value.payTo) &&
    (
      value.from === undefined ||
      (
        validAddress(value.from)
      )
    );
}

function validTransfer(
  value: unknown
): value is ObservedPltTransfer {
  if (!record(value)) return false;

  if (!exactKeys(value, [
    "tokenId", "from", "to", "decimals", "amountRaw"
  ])) {
    return false;
  }

  return (
    value.tokenId === null ||
    (
      typeof value.tokenId === "string" &&
      /^[a-zA-Z0-9.%\-]{1,128}$/.test(value.tokenId)
    )
  ) &&
    (
      value.from === null ||
      validAddress(value.from)
    ) &&
    (
      value.to === null ||
      validAddress(value.to)
    ) &&
    (
      value.decimals === null ||
      (
        Number.isSafeInteger(value.decimals) &&
        (value.decimals as number) >= 0 &&
        (value.decimals as number) <= 255
      )
    ) &&
    (
      value.amountRaw === null ||
      (
        typeof value.amountRaw === "string" &&
        INTEGER.test(value.amountRaw) &&
        value.amountRaw.length <= 20 &&
        BigInt(value.amountRaw) <= MAX_U64
      )
    );
}

function validObservation(
  value: unknown
): value is SettlementObservation {
  if (!record(value)) return false;

  if (!exactKeys(value, [
    "network",
    "genesisHash",
    "nodeEndpoint",
    "transactionHash",
    "transactionStatus",
    "executionStatus",
    "blockHash",
    "blockHeight",
    "blockTimestamp",
    "blockFinalized",
    "observedAt",
    "executionEvidenceComplete",
    "transfers"
  ])) {
    return false;
  }

  if (
    !text(value.network) ||
    typeof value.genesisHash !== "string" ||
    !HEX64.test(value.genesisHash) ||
    !endpoint(value.nodeEndpoint) ||
    typeof value.transactionHash !== "string" ||
    !HEX64.test(value.transactionHash) ||
    !["received", "committed", "finalized"]
      .includes(String(value.transactionStatus)) ||
    !["success", "rejected", "unknown"]
      .includes(String(value.executionStatus)) ||
    !timestamp(value.observedAt) ||
    typeof value.executionEvidenceComplete !== "boolean" ||
    !Array.isArray(value.transfers) ||
    value.transfers.length > 1024 ||
    !value.transfers.every(validTransfer)
  ) {
    return false;
  }

  return (
    value.blockHash === null ||
    (
      typeof value.blockHash === "string" &&
      HEX64.test(value.blockHash)
    )
  ) &&
    (
      value.blockHeight === null ||
      (
        typeof value.blockHeight === "string" &&
        INTEGER.test(value.blockHeight)
      )
    ) &&
    (
      value.blockTimestamp === null ||
      timestamp(value.blockTimestamp)
    ) &&
    (
      value.blockFinalized === null ||
      typeof value.blockFinalized === "boolean"
    );
}

function evaluateTransfer(
  transfer: ObservedPltTransfer,
  expected: ExpectedSettlementPayment
): "match" | "mismatch" | "unknown" {
  if (
    transfer.tokenId === null ||
    transfer.from === null ||
    transfer.to === null ||
    transfer.decimals === null ||
    transfer.amountRaw === null
  ) {
    return "unknown";
  }

  if (
    transfer.tokenId !== expected.tokenId ||
    transfer.to !== expected.payTo ||
    transfer.decimals !== expected.decimals ||
    transfer.amountRaw !== expected.amountRaw ||
    (
      expected.from !== undefined &&
      transfer.from !== expected.from
    )
  ) {
    return "mismatch";
  }

  return "match";
}

/**
 * Verify trusted-node-reported finalized settlement.
 *
 * Only complete, unambiguous transfer evidence can produce
 * the narrow positive settlement claim.
 */
export async function verifySettlementFinality(
  context: SettlementVerificationContext
): Promise<SettlementVerificationResult> {
  const candidate = context as unknown;

  const raw = record(candidate) ? candidate : {};
  const rawPolicy = raw.policy;

  const policyId =
    record(rawPolicy) && text(rawPolicy.policyId)
      ? rawPolicy.policyId
      : "";

  const rawExpected = raw.expected;

  const network =
    record(rawExpected) && text(rawExpected.network)
      ? rawExpected.network
      : "";

  const transactionHash =
    record(rawExpected) &&
    typeof rawExpected.transactionHash === "string"
      ? rawExpected.transactionHash
      : "";

  let policyDigest = "";
  let blockHash: string | null = null;
  let blockHeight: string | null = null;

  let transactionFinalized = false;
  let transactionExecutionSucceeded = false;
  let expectedPltTransferMatched = false;

  function decision(
    status: SettlementVerificationStatus,
    reasonCode: string
  ): SettlementVerificationResult {
    return {
      claim: "finalized_plt_transfer_matches_expected_payment",
      assuranceModel: "trusted_node_finalized_plt_transfer_v1",
      status,
      reasonCode,
      policyId,
      policyDigest,
      network,
      transactionHash,
      blockHash,
      blockHeight,
      transactionFinalized,
      transactionExecutionSucceeded,
      expectedPltTransferMatched,
      consensusIndependentlyVerified: false
    };
  }

  if (!validPolicy(rawPolicy)) {
    return decision("indeterminate", "settlement_policy_invalid");
  }

  try {
    policyDigest = digestSettlementPolicy(rawPolicy);
  } catch {
    return decision("indeterminate", "policy_digest_unavailable");
  }

  if (!digestMatches(policyDigest, raw.trustedPolicyDigest)) {
    return decision("indeterminate", "trusted_policy_digest_mismatch");
  }

  if (!validExpected(rawExpected)) {
    return decision("indeterminate", "expected_settlement_invalid");
  }

  if (rawExpected.network !== rawPolicy.network) {
    return decision("failed", "settlement_network_mismatch");
  }

  if (
    !record(raw.transport) ||
    typeof raw.transport.readSettlement !== "function"
  ) {
    return decision("indeterminate", "settlement_transport_missing");
  }

  if (typeof raw.now !== "function") {
    return decision("indeterminate", "verification_clock_missing");
  }

  let now: Date;

  try {
    now = (raw.now as () => Date)();
  } catch {
    return decision("indeterminate", "verification_clock_unavailable");
  }

  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    return decision("indeterminate", "verification_clock_invalid");
  }

  let observation: unknown;

  try {
    const transport = raw.transport as unknown as {
      readSettlement(
        expected: ExpectedSettlementPayment
      ): Promise<SettlementObservation>;
    };

    observation = await transport.readSettlement({
      ...rawExpected
    });
  } catch {
    return decision("indeterminate", "settlement_transport_unavailable");
  }

  if (!validObservation(observation)) {
    return decision("indeterminate", "settlement_observation_invalid");
  }

  if (observation.nodeEndpoint !== rawPolicy.trustedNodeEndpoint) {
    return decision("failed", "settlement_node_endpoint_mismatch");
  }

  if (observation.network !== rawPolicy.network) {
    return decision("failed", "settlement_observed_network_mismatch");
  }

  if (
    observation.genesisHash !== rawPolicy.expectedGenesisHash
  ) {
    return decision("failed", "settlement_genesis_mismatch");
  }

  if (observation.transactionHash !== rawExpected.transactionHash) {
    return decision("failed", "settlement_transaction_hash_mismatch");
  }

  const observationMs = Date.parse(observation.observedAt);
  const nowMs = now.getTime();

  if (
    observationMs > nowMs + rawPolicy.maxFutureSkewSeconds * 1000 ||
    nowMs - observationMs >
      rawPolicy.maxObservationAgeSeconds * 1000
  ) {
    return decision("indeterminate", "settlement_observation_stale");
  }

  if (observation.transactionStatus !== "finalized") {
    return decision("indeterminate", "transaction_not_finalized");
  }

  transactionFinalized = true;

  if (
    observation.blockHash === null ||
    observation.blockHeight === null ||
    observation.blockTimestamp === null ||
    observation.blockFinalized === null
  ) {
    return decision("indeterminate", "finalized_block_evidence_missing");
  }

  blockHash = observation.blockHash;
  blockHeight = observation.blockHeight;

  if (!observation.blockFinalized) {
    return decision("failed", "finalized_block_not_confirmed");
  }

  const blockMs = Date.parse(observation.blockTimestamp);

  if (
    blockMs > observationMs ||
    blockMs > nowMs + rawPolicy.maxFutureSkewSeconds * 1000
  ) {
    return decision("indeterminate", "settlement_block_time_inconsistent");
  }

  if (observation.executionStatus === "rejected") {
    return decision("failed", "settlement_execution_rejected");
  }

  if (observation.executionStatus !== "success") {
    return decision("indeterminate", "settlement_execution_unknown");
  }

  transactionExecutionSucceeded = true;

  if (!observation.executionEvidenceComplete) {
    return decision("indeterminate", "settlement_events_incomplete");
  }

  const evaluations = observation.transfers.map(
    transfer => evaluateTransfer(transfer, rawExpected)
  );

  const matches = evaluations.filter(
    result => result === "match"
  ).length;

  const unknowns = evaluations.filter(
    result => result === "unknown"
  ).length;

  if (matches > 1) {
    return decision("indeterminate", "settlement_transfer_ambiguous");
  }

  if (unknowns > 0) {
    return decision("indeterminate", "settlement_transfer_undecodable");
  }

  if (matches === 0) {
    return decision("failed", "expected_plt_transfer_not_found");
  }

  expectedPltTransferMatched = true;

  return decision(
    "verified",
    "trusted_node_finalized_plt_transfer_verified"
  );
}
