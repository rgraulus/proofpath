
/**
 * ProofPath PP-03 M3.1 — Concordium Registry snapshot adapter.
 *
 * Read-only, trusted-node-reported finalized state.
 * This adapter does not verify consensus independently.
 *
 * Production callers must supply an independently approved
 * policy and trusted node endpoint. Neither node observations
 * nor request-supplied values establish policy approval.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type {
  FinalizedRegistrySnapshot,
  RegistryCoordinate,
  RegistrySnapshotTransport,
  TrustedRegistryPolicy
} from "../../verification/types.js";

const require = createRequire(import.meta.url);
const HEX64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;

export interface ConcordiumRegistryTransportOptions {
  readonly policy: TrustedRegistryPolicy;
  readonly timeoutMs?: number;
}

function hex(value: unknown, converter?: (v: any) => string): string {
  let rendered: unknown;

  try {
    rendered = converter ? converter(value) : value;
  } catch {
    rendered = value;
  }

  if (typeof rendered !== "string" || !HEX64.test(rendered)) {
    throw new Error("invalid_concordium_hash");
  }

  return rendered;
}

function decimal(value: unknown): string {
  const rendered =
    typeof value === "bigint" ||
    typeof value === "number" ||
    typeof value === "string"
      ? String(value)
      : "";

  if (!DECIMAL.test(rendered)) {
    throw new Error("invalid_concordium_decimal");
  }

  return rendered;
}

function timestamp(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (Number.isFinite(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  throw new Error("invalid_concordium_timestamp");
}

function validateEndpoint(value: string): {
  readonly host: string;
  readonly port: number;
  readonly canonical: string;
} {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("invalid_trusted_node_endpoint");
  }

  const port = url.port === "" ? 443 : Number(url.port);

  if (
    !Number.isSafeInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("invalid_trusted_node_port");
  }

  if (url.href !== value) {
    throw new Error("noncanonical_trusted_node_endpoint");
  }

  return {
    host: url.hostname,
    port,
    canonical: value
  };
}

function sameRegistry(
  left: RegistryCoordinate,
  right: RegistryCoordinate
): boolean {
  return left.network === right.network &&
    left.contractIndex === right.contractIndex &&
    left.contractSubindex === right.contractSubindex;
}

function withTimeout<T>(
  operation: Promise<T>,
  milliseconds: number
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(
      () => reject(new Error("concordium_node_timeout")),
      milliseconds
    );
  });

  return Promise.race([operation, expiry]).finally(() => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  });
}

/**
 * Production transport for a configured Concordium gRPC node.
 *
 * TLS validates the node's server certificate using the
 * default gRPC trust configuration. This is authenticated
 * transport to an approved endpoint, not independent
 * blockchain consensus verification.
 *
 * It must not be constructed from an untrusted request's
 * supplied policy without trusted application composition.
 */
export class ConcordiumRegistrySnapshotTransport
  implements RegistrySnapshotTransport {

  private readonly policy: TrustedRegistryPolicy;
  private readonly timeoutMs: number;

  constructor(options: ConcordiumRegistryTransportOptions) {
    if (
      !options ||
      !options.policy ||
      typeof options.policy.trustedNodeEndpoint !== "string"
    ) {
      throw new TypeError("Missing trusted Registry transport policy");
    }

    validateEndpoint(options.policy.trustedNodeEndpoint);

    const timeout = options.timeoutMs ?? 10000;

    if (
      !Number.isSafeInteger(timeout) ||
      timeout < 1 ||
      timeout > 60000
    ) {
      throw new TypeError("Invalid Registry transport timeout");
    }

    this.policy = options.policy;
    this.timeoutMs = timeout;
  }

  async readFinalizedRegistrySnapshot(
    registry: RegistryCoordinate
  ): Promise<FinalizedRegistrySnapshot> {
    if (!sameRegistry(registry, this.policy.registry)) {
      throw new Error("registry_policy_coordinate_mismatch");
    }

    const endpoint = validateEndpoint(
      this.policy.trustedNodeEndpoint
    );

    return withTimeout(
      this.readFromNode(registry, endpoint),
      this.timeoutMs
    );
  }

  private async readFromNode(
    registry: RegistryCoordinate,
    endpoint: {
      readonly host: string;
      readonly port: number;
      readonly canonical: string;
    }
  ): Promise<FinalizedRegistrySnapshot> {
    /*
     * Resolve the SDK at runtime. The package is pinned in
     * package.json, but is not yet installed during K2.6.
     *
     * Only the SDK's Node.js gRPC client is used.
     */
    const sdkPackage = "@concordium/web-sdk";
    const sdkIndexPath = require.resolve(sdkPackage);

    const grpcPath = path.join(
      path.dirname(sdkIndexPath),
      "nodejs",
      "grpc.js"
    );

    const [sdk, grpc]: [any, any] = await Promise.all([
      import(sdkPackage),
      import(pathToFileURL(grpcPath).href)
    ]);

    const credentials = grpc.credentials.createSsl();

    const client = new grpc.ConcordiumGRPCNodeClient(
      endpoint.host,
      endpoint.port,
      credentials
    );

    const consensus = await client.getConsensusStatus();

    if (!consensus || !consensus.lastFinalizedBlock) {
      throw new Error("finalized_block_unavailable");
    }

    const genesisHash = hex(
      consensus.genesisBlock,
      sdk.BlockHash.toHexString
    );

    const finalizedBlock = consensus.lastFinalizedBlock;

    const blockHash = hex(
      finalizedBlock,
      sdk.BlockHash.toHexString
    );

    const block = await client.getBlockInfo(finalizedBlock);

    if (!block || block.finalized !== true) {
      throw new Error("finalized_block_not_confirmed");
    }

    const returnedBlockHash = hex(
      block.blockHash,
      sdk.BlockHash.toHexString
    );

    if (returnedBlockHash !== blockHash) {
      throw new Error("finalized_block_hash_mismatch");
    }

    const blockHeight = decimal(block.blockHeight);
    const blockTimestamp = timestamp(block.blockSlotTime);

    const address = sdk.ContractAddress.create(
      BigInt(decimal(registry.contractIndex)),
      BigInt(decimal(registry.contractSubindex))
    );

    const instance = await client.getInstanceInfo(
      address,
      finalizedBlock
    );

    if (!instance || !instance.sourceModule) {
      throw new Error("registry_instance_unavailable");
    }

    const moduleReference = hex(
      instance.sourceModule,
      sdk.ModuleReference.toHexString
    );

    return {
      registry: {
        network: registry.network,
        contractIndex: registry.contractIndex,
        contractSubindex: registry.contractSubindex
      },
      genesisHash,
      blockHash,
      blockHeight,
      blockTimestamp,
      finalized: true,
      moduleReference,
      observedAt: new Date().toISOString(),
      nodeEndpoint: endpoint.canonical
    };
  }
}

/**
 * Creates a read-only Concordium transport.
 *
 * This factory does not establish policy authority.
 * Its caller must independently authenticate the policy
 * and its approved digest before using positive results.
 */
export function createConcordiumRegistrySnapshotTransport(
  options: ConcordiumRegistryTransportOptions
): RegistrySnapshotTransport {
  return new ConcordiumRegistrySnapshotTransport(options);
}
