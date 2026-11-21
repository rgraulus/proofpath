
/**
 * ProofPath Hackathon — Historical Evidence Adapter
 *
 * Loads an externally supplied historical x402 evidence record.
 *
 * This module performs input validation only.
 * It does NOT establish signature authenticity, settlement finality,
 * commercial correctness, or agent authorization.
 *
 * No database credentials, private keys, or payment execution.
 */

import { readFile } from "node:fs/promises";

export const DEMO_TRANSACTION_HASH =
  "cde858a003bb29d180c352fa3fd7409395829ed156ac9f9166e7f9969f3ad377";

const HEX64 = /^[a-fA-F0-9]{64}$/;

const COMPACT_JWS =
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export interface HistoricalPltEvent {
  transactionHash: string;
  network: string;
  assetId: string;
  amountRaw: string;
  finalized: boolean;
  blockHash: string | null;
  blockHeight: string | null;
  eventIndex: number;
}

export interface HistoricalChallengeReference {
  merchantId: string;
  nonce: string;
  status: string;
}

export interface HistoricalEvidenceRecord {
  schemaVersion: "proofpath.hackathon.historical-evidence.v1";

  source: {
    system: "xcf-concordium-facilitator";
    network: "concordium:testnet";
    acquiredAt: string;
  };

  transactionHash: string;

  challenge: HistoricalChallengeReference;

  facilitatorReceipt: {
    jws: string;
  };

  pltEvent: HistoricalPltEvent;
}

export class HistoricalEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoricalEvidenceError";
  }
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function nonempty(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function validTimestamp(value: unknown): value is string {
  return (
    nonempty(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function fail(message: string): never {
  throw new HistoricalEvidenceError(message);
}

/**
 * Validate basic transport and record structure.
 *
 * A structurally valid record is NOT verified evidence.
 */
export function parseHistoricalEvidence(
  input: unknown
): HistoricalEvidenceRecord {
  if (!isRecord(input)) {
    return fail("historical_evidence_not_object");
  }

  if (
    input.schemaVersion !==
    "proofpath.hackathon.historical-evidence.v1"
  ) {
    return fail("historical_evidence_schema_unsupported");
  }

  if (!isRecord(input.source)) {
    return fail("historical_evidence_source_invalid");
  }

  if (
    input.source.system !== "xcf-concordium-facilitator" ||
    input.source.network !== "concordium:testnet" ||
    !validTimestamp(input.source.acquiredAt)
  ) {
    return fail("historical_evidence_source_invalid");
  }

  if (
    typeof input.transactionHash !== "string" ||
    !HEX64.test(input.transactionHash)
  ) {
    return fail("historical_transaction_hash_invalid");
  }

  if (
    input.transactionHash.toLowerCase() !==
    DEMO_TRANSACTION_HASH
  ) {
    return fail("historical_transaction_not_selected");
  }

  if (!isRecord(input.challenge)) {
    return fail("historical_challenge_invalid");
  }

  if (
    !nonempty(input.challenge.merchantId) ||
    !nonempty(input.challenge.nonce) ||
    !nonempty(input.challenge.status)
  ) {
    return fail("historical_challenge_invalid");
  }

  if (
    !isRecord(input.facilitatorReceipt) ||
    typeof input.facilitatorReceipt.jws !== "string" ||
    !COMPACT_JWS.test(input.facilitatorReceipt.jws)
  ) {
    return fail("historical_receipt_structure_invalid");
  }

  if (!isRecord(input.pltEvent)) {
    return fail("historical_plt_event_invalid");
  }

  const event = input.pltEvent;

  if (
    typeof event.transactionHash !== "string" ||
    !HEX64.test(event.transactionHash) ||
    event.transactionHash.toLowerCase() !==
      input.transactionHash.toLowerCase() ||
    !nonempty(event.network) ||
    !nonempty(event.assetId) ||
    typeof event.amountRaw !== "string" ||
    !/^(0|[1-9][0-9]*)$/.test(event.amountRaw) ||
    typeof event.finalized !== "boolean" ||
    !Number.isSafeInteger(event.eventIndex) ||
    (event.eventIndex as number) < 0
  ) {
    return fail("historical_plt_event_invalid");
  }

  if (
    event.blockHash !== null &&
    (typeof event.blockHash !== "string" ||
      !HEX64.test(event.blockHash))
  ) {
    return fail("historical_block_hash_invalid");
  }

  if (
    event.blockHeight !== null &&
    (typeof event.blockHeight !== "string" ||
      !/^(0|[1-9][0-9]*)$/.test(event.blockHeight))
  ) {
    return fail("historical_block_height_invalid");
  }

  return input as unknown as HistoricalEvidenceRecord;
}

/**
 * Load a caller-selected JSON evidence file.
 *
 * The caller must keep sensitive raw evidence out of Git.
 * This module does not print the loaded contents.
 */
export async function loadHistoricalEvidence(
  absolutePath: string
): Promise<HistoricalEvidenceRecord> {
  if (
    !nonempty(absolutePath) ||
    !/^(?:[A-Za-z]:[\\/]|\/)/.test(absolutePath)
  ) {
    return fail("historical_evidence_path_not_absolute");
  }

  let text: string;

  try {
    text = await readFile(absolutePath, "utf8");
  } catch {
    return fail("historical_evidence_file_unavailable");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("historical_evidence_json_invalid");
  }

  return parseHistoricalEvidence(parsed);
}
