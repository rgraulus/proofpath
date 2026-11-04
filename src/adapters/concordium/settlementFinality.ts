/**
 * ProofPath PP-03 M3.3 — Concordium settlement transport.
 *
 * Read-only observation of transaction finality, successful
 * execution and protocol-level PLT transfer events.
 *
 * The configured node is a trusted observation source.
 * This adapter does NOT independently verify consensus.
 *
 * Policy authority and endpoint trust are established by
 * the integrating application, not this constructor.
 */

import { createRequire } from "node:module";
import { AccountAddress } from "@concordium/web-sdk";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type {
  ExpectedSettlementPayment,
  ObservedPltTransfer,
  SettlementObservation,
  SettlementTransport,
  TrustedSettlementPolicy
} from "../../verification/types.js";

const require = createRequire(import.meta.url);

const HEX64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{50}$/;

export interface ConcordiumSettlementTransportOptions {
  readonly policy: TrustedSettlementPolicy;
  readonly timeoutMs?: number;
}

function endpoint(value: string): {
  host: string;
  port: number;
  canonical: string;
} {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.href !== value
  ) {
    throw new Error("invalid_settlement_node_endpoint");
  }

  const port = url.port ? Number(url.port) : 443;

  if (
    !Number.isSafeInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("invalid_settlement_node_port");
  }

  return {
    host: url.hostname,
    port,
    canonical: value
  };
}

function hex(value: unknown, converter: (value: any) => string): string {
  const result: unknown = converter(value);

  if (
    typeof result !== "string" ||
    !HEX64.test(result)
  ) {
    throw new Error("invalid_settlement_hash");
  }

  return result;
}

function decimal(value: unknown): string {
  if (
    typeof value !== "string" &&
    typeof value !== "bigint" &&
    typeof value !== "number"
  ) {
    throw new Error("invalid_settlement_block_height");
  }

  if (
    typeof value === "number" &&
    !Number.isSafeInteger(value)
  ) {
    throw new Error("unsafe_settlement_block_height");
  }

  const result = String(value);

  if (!DECIMAL.test(result)) {
    throw new Error("invalid_settlement_block_height");
  }

  return result;
}

function timestamp(value: unknown): string {
  if (
    value instanceof Date &&
    Number.isFinite(value.getTime())
  ) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (Number.isFinite(date.getTime())) {
      return date.toISOString();
    }
  }

  throw new Error("invalid_settlement_block_timestamp");
}

function account(value: unknown): string | null {
  if (value === null) return null;

  if (
    typeof value !== "object" ||
    value === undefined
  ) {
    throw new Error("invalid_plt_holder");
  }

  const holder = value as {
    type?: unknown;
    address?: { toString(): string };
  };

  if (holder.type !== "account") {
    return null;
  }

  if (
    !holder.address ||
    typeof holder.address.toString !== "function"
  ) {
    throw new Error("invalid_plt_holder_address");
  }

  const address = holder.address.toString();

  if (!ADDRESS.test(address)) {
    throw new Error("invalid_plt_holder_address");
  }

  try {
    if (AccountAddress.fromBase58(address).toString() !== address) {
      throw new Error("invalid_plt_holder_address");
    }
  } catch {
    throw new Error("invalid_plt_holder_address");
  }

  return address;
}

function transferEvent(event: any): ObservedPltTransfer {
  if (
    !event ||
    event.tag !== "TokenTransfer"
  ) {
    throw new Error("invalid_plt_transfer_event");
  }

  if (
    !event.tokenId ||
    typeof event.tokenId.value !== "string" ||
    !event.amount ||
    typeof event.amount.value !== "bigint" ||
    !Number.isSafeInteger(event.amount.decimals)
  ) {
    throw new Error("invalid_plt_transfer_encoding");
  }

  const tokenId = event.tokenId.value;
  const amount = event.amount.value;

  if (
    !/^[a-zA-Z0-9.%\-]{1,128}$/.test(tokenId) ||
    amount < 0n ||
    amount > (1n << 64n) - 1n ||
    event.amount.decimals < 0 ||
    event.amount.decimals > 255
  ) {
    throw new Error("invalid_plt_transfer_value");
  }

  return {
    tokenId,
    from: account(event.from),
    to: account(event.to),
    decimals: event.amount.decimals,
    amountRaw: amount.toString()
  };
}

function withTimeout<T>(
  operation: Promise<T>,
  milliseconds: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("settlement_node_timeout"));
    }, milliseconds);
  });

  return Promise.race([operation, expiry]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

/**
 * Read-only Concordium gRPC transport.
 *
 * TLS authenticates the configured node endpoint according
 * to the gRPC trust configuration. It does not independently
 * establish blockchain consensus correctness.
 */
export class ConcordiumSettlementTransport
  implements SettlementTransport {

  private readonly policy: TrustedSettlementPolicy;
  private readonly timeoutMs: number;

  constructor(options: ConcordiumSettlementTransportOptions) {
    if (
      !options ||
      !options.policy ||
      typeof options.policy.trustedNodeEndpoint !== "string"
    ) {
      throw new TypeError("Missing settlement transport policy");
    }

    endpoint(options.policy.trustedNodeEndpoint);

    const timeout = options.timeoutMs ?? 10000;

    if (
      !Number.isSafeInteger(timeout) ||
      timeout < 1 ||
      timeout > 60000
    ) {
      throw new TypeError("Invalid settlement transport timeout");
    }

    this.policy = options.policy;
    this.timeoutMs = timeout;
  }

  async readSettlement(
    expected: ExpectedSettlementPayment
  ): Promise<SettlementObservation> {
    if (
      expected.network !== this.policy.network ||
      !HEX64.test(expected.transactionHash)
    ) {
      throw new Error("settlement_expectation_policy_mismatch");
    }

    const node = endpoint(this.policy.trustedNodeEndpoint);

    return withTimeout(
      this.readFromNode(expected, node),
      this.timeoutMs
    );
  }

  private async readFromNode(
    expected: ExpectedSettlementPayment,
    node: {
      host: string;
      port: number;
      canonical: string;
    }
  ): Promise<SettlementObservation> {

    const packageName = "@concordium/web-sdk";
    const indexPath = require.resolve(packageName);

    const grpcPath = path.join(
      path.dirname(indexPath),
      "nodejs",
      "grpc.js"
    );

    const [sdk, grpc]: [any, any] = await Promise.all([
      import(packageName),
      import(pathToFileURL(grpcPath).href)
    ]);

    const client = new grpc.ConcordiumGRPCNodeClient(
      node.host,
      node.port,
      grpc.credentials.createSsl()
    );

    const transactionHash = sdk.TransactionHash.fromHexString(
      expected.transactionHash
    );

    const consensus = await client.getConsensusStatus();

    if (!consensus?.genesisBlock) {
      throw new Error("settlement_genesis_unavailable");
    }

    const genesisHash = hex(
      consensus.genesisBlock,
      sdk.BlockHash.toHexString
    );

    const transaction = await client.getBlockItemStatus(
      transactionHash
    );

    if (!transaction) {
      throw new Error("settlement_transaction_unavailable");
    }

    const status = transaction.status;

    if (
      status !== sdk.TransactionStatusEnum.Received &&
      status !== sdk.TransactionStatusEnum.Committed &&
      status !== sdk.TransactionStatusEnum.Finalized
    ) {
      throw new Error("unknown_settlement_transaction_status");
    }

    const observation: SettlementObservation = {
      network: this.policy.network,
      genesisHash,
      nodeEndpoint: node.canonical,
      transactionHash: expected.transactionHash,
      transactionStatus:
        status === sdk.TransactionStatusEnum.Finalized
          ? "finalized"
          : status === sdk.TransactionStatusEnum.Committed
            ? "committed"
            : "received",
      executionStatus: "unknown",
      blockHash: null,
      blockHeight: null,
      blockTimestamp: null,
      blockFinalized: null,
      observedAt: new Date().toISOString(),
      executionEvidenceComplete: false,
      transfers: []
    };

    if (status !== sdk.TransactionStatusEnum.Finalized) {
      return observation;
    }

    if (!transaction.outcome?.blockHash) {
      throw new Error("settlement_finalized_outcome_missing");
    }

    const outcome = transaction.outcome;

    const blockHash = hex(
      outcome.blockHash,
      sdk.BlockHash.toHexString
    );

    const block = await client.getBlockInfo(
      outcome.blockHash
    );

    if (!block || !block.blockHash) {
      throw new Error("settlement_block_info_missing");
    }

    const observedBlockHash = hex(
      block.blockHash,
      sdk.BlockHash.toHexString
    );

    if (blockHash !== observedBlockHash) {
      throw new Error("settlement_finalized_block_mismatch");
    }

    observation.blockHash = blockHash;
    observation.blockHeight = decimal(block.blockHeight);
    observation.blockTimestamp = timestamp(
      block.blockSlotTime
    );
    observation.blockFinalized = block.finalized === true;

    if (block.finalized !== true) {
      throw new Error("settlement_block_not_finalized");
    }

    const normalized = normalizeSettlementExecution(
      outcome.summary,
      expected.transactionHash,
      sdk
    );

    observation.executionStatus = normalized.executionStatus;
    observation.executionEvidenceComplete =
      normalized.executionEvidenceComplete;
    observation.transfers = normalized.transfers;
    observation.observedAt = new Date().toISOString();

    return observation;
  }
}


/**
 * Normalize a finalized SDK transaction execution summary.
 *
 * This is the same normalization path used by the production
 * adapter. It does not authenticate the observation source
 * or independently establish consensus finality.
 */
export function normalizeSettlementExecution(
  summary: any,
  expectedTransactionHash: string,
  sdk: any
): Pick<
  SettlementObservation,
  "executionStatus" | "executionEvidenceComplete" | "transfers"
> {
  const unknown: Pick<
    SettlementObservation,
    "executionStatus" | "executionEvidenceComplete" | "transfers"
  > = {
    executionStatus: "unknown",
    executionEvidenceComplete: false,
    transfers: []
  };

  if (!summary) return unknown;

  if (!summary.hash) {
    throw new Error("settlement_summary_hash_missing");
  }

  const summaryHash = hex(
    summary.hash,
    sdk.TransactionHash.toHexString
  );

  if (summaryHash !== expectedTransactionHash) {
    throw new Error("settlement_summary_hash_mismatch");
  }

  if (
    summary.type !==
    sdk.TransactionSummaryType.AccountTransaction
  ) {
    return unknown;
  }

  if (summary.transactionType === "failed") {
    return {
      executionStatus: "rejected",
      executionEvidenceComplete: true,
      transfers: []
    };
  }

  if (summary.transactionType !== "tokenUpdate") {
    return unknown;
  }

  if (!Array.isArray(summary.events)) {
    return unknown;
  }

  if (summary.events.length > 1024) {
    throw new Error("settlement_event_limit_exceeded");
  }

  let complete = true;
  const transfers: ObservedPltTransfer[] = [];

  for (const event of summary.events) {
    if (!event || typeof event !== "object") {
      complete = false;
      continue;
    }

    if (event.tag === "TokenTransfer") {
      const parsed = transferEvent(event);

      if (parsed.from === null || parsed.to === null) {
        complete = false;
      }

      transfers.push(parsed);
      continue;
    }

    if (
      event.tag !== "TokenModuleEvent" &&
      event.tag !== "TokenMint" &&
      event.tag !== "TokenBurn"
    ) {
      complete = false;
    }
  }

  return {
    executionStatus: "success",
    executionEvidenceComplete: complete,
    transfers
  };
}

/**
 * Construct a read-only trusted-node transport.
 * Policy authority remains external.
 */
export function createConcordiumSettlementTransport(
  options: ConcordiumSettlementTransportOptions
): SettlementTransport {
  return new ConcordiumSettlementTransport(options);
}
