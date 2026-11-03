/**
 * ProofPath PP-01 — Concordium x402 reference profile.
 *
 * A pure, platform-specific reference adapter.
 *
 * This module does not perform:
 * - x402 protocol execution or payment initiation;
 * - Concordium node queries or settlement verification;
 * - facilitator receipt or JWS verification;
 * - CIS-8 Agent Registry / Agent Card verification;
 * - identity, delegation, authorization or ZKP verification;
 * - ProofPath Evidence Manifest construction; or
 * - public disclosure or external publication.
 *
 * All supplied identifiers and references remain unverified
 * assertions until separate trusted verification is performed.
 */

export const CONCORDIUM_X402_PROFILE =
  "proofpath.concordium.x402.v1" as const;

export type ConcordiumNetwork =
  | "concordium:testnet"
  | "concordium:mainnet";

export type ConcordiumX402ReferenceKind =
  | "x402_payment_required"
  | "x402_payment_submission"
  | "facilitator_receipt"
  | "concordium_transaction"
  | "concordium_finality_evidence"
  | "agent_registry_entry"
  | "agent_card"
  | "agent_acting_key"
  | "authorization_evidence"
  | "zkp_proof"
  | "delivery_evidence";

export interface ConcordiumX402ReferenceInput {
  evidenceId: string;
  kind: ConcordiumX402ReferenceKind;
  reference: string;
}

export interface ConcordiumX402ProfileInput {
  transactionId: string;
  correlationId: string;
  network: ConcordiumNetwork;
  challengeId: string | null;
  asset: {
    kind: "PLT";
    symbol: string;
    decimals: number;
  };
  amount: string;
  references: ConcordiumX402ReferenceInput[];
}

export interface ConcordiumX402ProfileRecord {
  schema: {
    type: "proofpath.concordium-x402-reference";
    version: "1.0.0";
  };
  profile: typeof CONCORDIUM_X402_PROFILE;
  transactionId: string;
  correlationId: string;
  network: ConcordiumNetwork;
  challengeId: string | null;
  asset: {
    kind: "PLT";
    symbol: string;
    decimals: number;
  };
  amount: string;
  references: ConcordiumX402ReferenceInput[];
  assessment: {
    sourceAttribution: "claimed_only";
    evidenceIntegrity: "not_evaluated";
    receiptAuthenticity: "not_evaluated";
    agentIdentity: "not_evaluated";
    agencyAuthorization: "not_evaluated";
    proofValidity: "not_evaluated";
    settlementFinality: "not_evaluated";
    deliveryTruth: "not_evaluated";
  };
}

const REFERENCE_KINDS: ReadonlySet<string> = new Set([
  "x402_payment_required",
  "x402_payment_submission",
  "facilitator_receipt",
  "concordium_transaction",
  "concordium_finality_evidence",
  "agent_registry_entry",
  "agent_card",
  "agent_acting_key",
  "authorization_evidence",
  "zkp_proof",
  "delivery_evidence"
]);

function objectRecord(
  value: unknown,
  label: string
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(label + " must be an object");
  }

  const proto = Object.getPrototypeOf(value);

  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError(label + " must be a plain object");
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);

  for (const descriptor of Object.values(descriptors)) {
    if (!("value" in descriptor)) {
      throw new TypeError(label + " contains accessor properties");
    }
  }

  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new TypeError(label + " contains symbol properties");
  }

  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string
): void {
  const actual = Object.keys(value);

  if (
    actual.length !== allowed.length ||
    actual.some(key => !allowed.includes(key)) ||
    allowed.some(key => !Object.hasOwn(value, key))
  ) {
    throw new TypeError(label + " has missing or unknown fields");
  }
}

function requiredText(
  value: unknown,
  label: string
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048 ||
    value.trim().length === 0 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new TypeError(label + " must be nonempty text");
  }

  return value;
}

/**
 * Converts explicitly supplied Concordium/x402 references into a
 * deterministic, isolated, JSON-compatible reference record.
 *
 * The caller must validate any later Evidence Manifest separately.
 * No source assertion is promoted to independent verification.
 *
 * Opaque references are not dereferenced or published.
 */
export function normalizeConcordiumX402Profile(
  input: unknown
): ConcordiumX402ProfileRecord {
  const data = objectRecord(input, "Profile input");

  exactKeys(
    data,
    [
      "transactionId",
      "correlationId",
      "network",
      "challengeId",
      "asset",
      "amount",
      "references"
    ],
    "Profile input"
  );

  const transactionId = requiredText(
    data.transactionId,
    "transactionId"
  );

  const correlationId = requiredText(
    data.correlationId,
    "correlationId"
  );

  if (
    data.network !== "concordium:testnet" &&
    data.network !== "concordium:mainnet"
  ) {
    throw new TypeError("Unsupported Concordium network");
  }

  const network = data.network;

  const challengeId =
    data.challengeId === null
      ? null
      : requiredText(data.challengeId, "challengeId");

  const assetInput = objectRecord(data.asset, "asset");

  exactKeys(
    assetInput,
    ["kind", "symbol", "decimals"],
    "asset"
  );

  if (assetInput.kind !== "PLT") {
    throw new TypeError("Profile requires a PLT asset");
  }

  const symbol = requiredText(
    assetInput.symbol,
    "asset.symbol"
  );

  const decimals = assetInput.decimals;

  if (
    typeof decimals !== "number" ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 18
  ) {
    throw new TypeError("Invalid PLT decimals");
  }

  const amount = requiredText(data.amount, "amount");

  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(amount)) {
    throw new TypeError("Invalid decimal amount representation");
  }

  const fractional = amount.split(".")[1] ?? "";

  if (fractional.length > decimals) {
    throw new TypeError("Amount exceeds declared PLT precision");
  }

  if (!Array.isArray(data.references)) {
    throw new TypeError("references must be an array");
  }

  const seenIds = new Set<string>();

  const references = data.references.map((item, index) => {
    const referenceInput = objectRecord(
      item,
      "references[" + index + "]"
    );

    exactKeys(
      referenceInput,
      ["evidenceId", "kind", "reference"],
      "references[" + index + "]"
    );

    const evidenceId = requiredText(
      referenceInput.evidenceId,
      "evidenceId"
    );

    const reference = requiredText(
      referenceInput.reference,
      "reference"
    );

    if (
      typeof referenceInput.kind !== "string" ||
      !REFERENCE_KINDS.has(referenceInput.kind)
    ) {
      throw new TypeError("Unsupported evidence reference kind");
    }

    if (seenIds.has(evidenceId)) {
      throw new TypeError("Duplicate evidence identifier");
    }

    seenIds.add(evidenceId);

    return {
      evidenceId,
      kind: referenceInput.kind as
        ConcordiumX402ReferenceKind,
      reference
    };
  });

  return {
    schema: {
      type: "proofpath.concordium-x402-reference",
      version: "1.0.0"
    },
    profile: CONCORDIUM_X402_PROFILE,
    transactionId,
    correlationId,
    network,
    challengeId,
    asset: {
      kind: "PLT",
      symbol,
      decimals
    },
    amount,
    references,
    assessment: {
      sourceAttribution: "claimed_only",
      evidenceIntegrity: "not_evaluated",
      receiptAuthenticity: "not_evaluated",
      agentIdentity: "not_evaluated",
      agencyAuthorization: "not_evaluated",
      proofValidity: "not_evaluated",
      settlementFinality: "not_evaluated",
      deliveryTruth: "not_evaluated"
    }
  };
}
