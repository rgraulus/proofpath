/**
 * ProofPath PP-03 M3.4 — Read-only Concordium adapter.
 *
 * Reads CIS-8004 agentOf and CIS-8 ownerOfKey at one finalized
 * block. It does not approve Registry policy, verify consensus
 * independently, sign, submit transactions or mutate contracts.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type {
  AgentAuthorityExternalKey,
  AgentAuthorityObservation,
  AgentAuthorityRegistryCoordinate,
  AgentAuthorityTransport,
  ExpectedAgentAuthority,
  ObservedAgentAuthorityRecord,
  ObservedExternalKeyRegistration,
  TrustedAgentAuthorityPolicy
} from "../../verification/types.js";

export interface ConcordiumAgentAuthorityTransportOptions {
  policy: TrustedAgentAuthorityPolicy;
  timeoutMs?: number;
}

const require = createRequire(import.meta.url);

const HEX16 = /^[0-9a-f]{16}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const MAX_U64 = (1n << 64n) - 1n;

type Data = Record<string, unknown>;

function object(value: unknown): Data {
  if (!value || typeof value !== "object" ||
      Array.isArray(value)) {
    throw new Error("invalid_contract_record");
  }
  return value as Data;
}

function string(value: unknown): string {
  if (typeof value !== "string" ||
      value.length === 0 ||
      value.length > 4096 ||
      value.trim() !== value) {
    throw new Error("invalid_contract_string");
  }
  return value;
}

function decimal(value: unknown): string {
  const s =
    typeof value === "bigint" ||
    typeof value === "number" ||
    typeof value === "string"
      ? String(value)
      : "";

  if (!DECIMAL.test(s) || BigInt(s) > MAX_U64) {
    throw new Error("invalid_contract_decimal");
  }
  return s;
}

function hex64(value: unknown): string {
  if (typeof value !== "string" || !HEX64.test(value)) {
    throw new Error("invalid_contract_hash");
  }
  return value;
}

function iso(value: unknown): string {
  const date = value instanceof Date
    ? value
    : new Date(value as string);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("invalid_contract_timestamp");
  }
  return date.toISOString();
}

function option(value: unknown): unknown | null {
  const data = object(value);
  const keys = Object.keys(data);

  if (keys.length !== 1) {
    throw new Error("invalid_contract_option");
  }

  if (keys[0] === "None" &&
      Array.isArray(data.None) &&
      data.None.length === 0) {
    return null;
  }

  if (keys[0] === "Some" &&
      Array.isArray(data.Some) &&
      data.Some.length === 1) {
    return data.Some[0];
  }

  throw new Error("invalid_contract_option");
}

function bytes(value: unknown): string {
  if (!Array.isArray(value) ||
      value.length === 0 ||
      value.length > 128) {
    throw new Error("invalid_public_key_bytes");
  }

  return Buffer.from(value.map(item => {
    const n = typeof item === "bigint"
      ? Number(item)
      : typeof item === "string" && DECIMAL.test(item)
        ? Number(item)
        : item;

    if (typeof n !== "number" ||
        !Number.isInteger(n) ||
        n < 0 || n > 255) {
      throw new Error("invalid_public_key_byte");
    }
    return n;
  })).toString("hex");
}

function key(value: unknown): AgentAuthorityExternalKey {
  const data = object(value);

  return {
    namespace: string(data.namespace),
    keyType: string(data.key_type),
    publicKeyHex: bytes(data.public_key)
  };
}

function coordinate(
  network: AgentAuthorityRegistryCoordinate["network"],
  value: unknown
): AgentAuthorityRegistryCoordinate {
  const data = object(value);
  return {
    network,
    contractIndex: decimal(data.index),
    contractSubindex: decimal(data.subindex)
  };
}

function status(value: unknown): "active" | "revoked" | "unknown" {
  const data = object(value);
  const keys = Object.keys(data);

  if (keys.length !== 1 ||
      !Array.isArray(data[keys[0] ?? ""]) ||
      (data[keys[0] ?? ""] as unknown[]).length !== 0) {
    throw new Error("invalid_registration_status");
  }

  if (keys[0] === "Active") return "active";
  if (keys[0] === "Revoked") return "revoked";

  throw new Error("unsupported_registration_status");
}

function metadataHash(value: unknown): string | null {
  const decoded = option(value);
  if (decoded === null) return null;

  const result = bytes(decoded);
  return hex64(result);
}

function agent(
  value: unknown,
  network: AgentAuthorityRegistryCoordinate["network"]
): ObservedAgentAuthorityRecord | null {
  const decoded = option(value);
  if (decoded === null) return null;

  const data = object(decoded);

  if (typeof data.token_id !== "string" ||
      !HEX16.test(data.token_id)) {
    throw new Error("invalid_agent_token_id");
  }

  const external = option(data.external_reference);
  let externalReference:
    ObservedAgentAuthorityRecord["externalReference"] = null;

  if (external !== null) {
    const ref = object(external);
    const kind = object(ref.kind);

    if (Object.keys(kind).length !== 1 ||
        !Array.isArray(kind.Cis8) ||
        kind.Cis8.length !== 1) {
      throw new Error("unsupported_external_reference");
    }

    externalReference = {
      contract: coordinate(network, ref.contract_address),
      kind: "cis8",
      externalKey: key(kind.Cis8[0])
    };
  }

  const uri = option(data.agent_uri);

  // Fail closed on contradictory revocation evidence.
  const registrationStatus = status(data.status);
  const revokedAt = option(data.revoked_at);
  const revocationReason = option(data.revocation_reason);

  if (revokedAt !== null) {
    iso(revokedAt);
  }

  if (revocationReason !== null) {
    string(revocationReason);
  }

  if (
    registrationStatus === "active" &&
    (revokedAt !== null || revocationReason !== null)
  ) {
    throw new Error("contradictory_active_agent_record");
  }

  if (
    registrationStatus === "revoked" &&
    revokedAt === null
  ) {
    throw new Error("contradictory_revoked_agent_record");
  }

  return {
    agentTokenIdHex: data.token_id,
    ownerAccount: string(data.owner_account),
    status: registrationStatus,
    externalReference,
    agentUri: uri === null ? null : string(uri),
    metadataHash: metadataHash(data.metadata_hash)
  };
}

function registration(
  value: unknown
): ObservedExternalKeyRegistration | null {
  const decoded = option(value);
  if (decoded === null) return null;

  const data = object(decoded);

  if (!Array.isArray(data.metadata)) {
    throw new Error("invalid_cis8_metadata");
  }

  for (const entry of data.metadata) {
    const pair = object(entry);
    string(pair.key);
    string(pair.value);
  }

  return {
    ownerAccount: string(data.owner),
    externalKey: key(data.external_key),
    status: status(data.status),
    proofScheme: string(data.proof_scheme),
    lastUpdated: iso(data.last_updated)
  };
}

function endpoint(value: string): {
  host: string;
  port: number;
  canonical: string;
} {
  const url = new URL(value);

  if (url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.href !== value) {
    throw new Error("invalid_trusted_node_endpoint");
  }

  const port = url.port ? Number(url.port) : 443;

  if (!Number.isInteger(port) ||
      port < 1 || port > 65535) {
    throw new Error("invalid_trusted_node_port");
  }

  return { host: url.hostname, port, canonical: value };
}

function address(sdk: any, value: AgentAuthorityRegistryCoordinate) {
  return sdk.ContractAddress.create(
    BigInt(value.contractIndex),
    BigInt(value.contractSubindex)
  );
}

function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error("concordium_node_timeout")),
      timeoutMs
    );
  });

  return Promise.race([work, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

export class ConcordiumAgentAuthorityTransport
  implements AgentAuthorityTransport {

  private readonly policy: TrustedAgentAuthorityPolicy;
  private readonly timeoutMs: number;

  constructor(options: ConcordiumAgentAuthorityTransportOptions) {
    if (!options || !options.policy) {
      throw new TypeError("Missing agent authority transport policy");
    }

    endpoint(options.policy.trustedNodeEndpoint);

    const timeout = options.timeoutMs ?? 10000;

    if (!Number.isSafeInteger(timeout) ||
        timeout < 1 || timeout > 60000) {
      throw new TypeError("Invalid transport timeout");
    }

    this.policy = options.policy;
    this.timeoutMs = timeout;
  }

  async readAgentAuthority(
    expected: ExpectedAgentAuthority
  ): Promise<AgentAuthorityObservation> {
    if (expected.network !== this.policy.network ||
        typeof expected.agentTokenIdHex !== "string" ||
        !HEX16.test(expected.agentTokenIdHex)) {
      throw new Error("invalid_agent_authority_request");
    }

    return withTimeout(
      this.readFromNode(expected),
      this.timeoutMs
    );
  }

  private async readFromNode(
    expected: ExpectedAgentAuthority
  ): Promise<AgentAuthorityObservation> {
    const sdkPackage = "@concordium/web-sdk";
    const sdkIndex = require.resolve(sdkPackage);
    const grpcPath = path.join(
      path.dirname(sdkIndex), "nodejs", "grpc.js"
    );

    const [sdk, grpc]: [any, any] = await Promise.all([
      import(sdkPackage),
      import(pathToFileURL(grpcPath).href)
    ]);

    const configured = endpoint(this.policy.trustedNodeEndpoint);
    const client = new grpc.ConcordiumGRPCNodeClient(
      configured.host,
      configured.port,
      grpc.credentials.createSsl()
    );

    const consensus = await client.getConsensusStatus();

    if (!consensus?.lastFinalizedBlock) {
      throw new Error("finalized_block_unavailable");
    }

    const block = consensus.lastFinalizedBlock;
    const blockHash = hex64(
      sdk.BlockHash.toHexString(block)
    );
    const genesisHash = hex64(
      sdk.BlockHash.toHexString(consensus.genesisBlock)
    );

    const blockInfo = await client.getBlockInfo(block);

    if (!blockInfo || blockInfo.finalized !== true ||
        sdk.BlockHash.toHexString(blockInfo.blockHash) !== blockHash) {
      throw new Error("finalized_block_identity_mismatch");
    }

    const blockHeight = decimal(blockInfo.blockHeight);
    const blockTimestamp = iso(blockInfo.blockSlotTime);

    const readContract = async (
      registry: AgentAuthorityRegistryCoordinate,
      contractNameText: string,
      entrypointText: string,
      parameters: unknown
    ) => {
      const contract = address(sdk, registry);
      const info = await client.getInstanceInfo(contract, block);

      if (!info?.sourceModule) {
        throw new Error("contract_instance_unavailable");
      }

      const moduleReference = hex64(
        sdk.ModuleReference.toHexString(info.sourceModule)
      );

      const schema = await client.getEmbeddedSchema(
        info.sourceModule, block
      );

      if (!schema?.buffer) {
        throw new Error("contract_schema_unavailable");
      }

      const contractName =
        sdk.ContractName.fromStringUnchecked(contractNameText);
      const entrypoint =
        sdk.EntrypointName.fromString(entrypointText);

      const parameter = sdk.serializeUpdateContractParameters(
        contractName,
        entrypoint,
        parameters,
        schema.buffer
      );

      const invoked = await client.invokeContract({
        method: sdk.ReceiveName.fromString(
          `${contractNameText}.${entrypointText}`
        ),
        contract,
        parameter
      }, block);

      if (invoked?.tag !== "success" ||
          invoked.returnValue === null ||
          invoked.returnValue === undefined) {
        throw new Error("contract_invocation_failed");
      }

      const returned = sdk.unwrap(invoked.returnValue);
      const decoded = sdk.deserializeReceiveReturnValue(
        sdk.ReturnValue.toBuffer(returned),
        schema.buffer,
        contractName,
        entrypoint
      );

      return { moduleReference, decoded };
    };

    // The frozen input is already the CIS-8004 eight-byte,
    // little-endian TokenIdU64 schema-rendered hexadecimal.
    const agentRead = await readContract(
      this.policy.agentRegistry,
      "CIS-8004",
      "agentOf",
      expected.agentTokenIdHex
    );

    const agentRecord = agent(
      agentRead.decoded,
      this.policy.network
    );

    // The independently expected key identifies the requested
    // CIS-8 lookup. The verifier separately checks that the
    // agent's actual external reference agrees with that key.
    const expectedKey = expected.expectedExternalKey;

    if (!/^(?:[0-9a-f]{2}){1,128}$/.test(
      expectedKey.publicKeyHex
    )) {
      throw new Error("unsupported_external_key_encoding");
    }

    if (!this.policy.allowedExternalKeyNamespaces.includes(
      expectedKey.namespace
    ) || !this.policy.allowedExternalKeyTypes.includes(
      expectedKey.keyType
    )) {
      throw new Error("unsupported_external_key_policy");
    }

    const cis8Read = await readContract(
      this.policy.externalKeyRegistry,
      "CIS-8",
      "ownerOfKey",
      {
        external_key: {
          namespace: expectedKey.namespace,
          key_type: expectedKey.keyType,
          public_key: Array.from(
            Buffer.from(expectedKey.publicKeyHex, "hex"),
            byte => BigInt(byte)
          )
        }
      }
    );

    const keyRegistration = registration(cis8Read.decoded);

    return {
      network: this.policy.network,
      genesisHash,
      nodeEndpoint: configured.canonical,

      blockHash,
      blockHeight,
      blockTimestamp,
      observedAt: new Date().toISOString(),
      blockFinalized: true,

      agentRegistry: { ...this.policy.agentRegistry },
      agentModuleReference: agentRead.moduleReference,
      agentReadBlockHash: blockHash,
      agentReadComplete: true,
      agent: agentRecord,

      externalKeyRegistry: { ...this.policy.externalKeyRegistry },
      externalKeyModuleReference: cis8Read.moduleReference,
      externalKeyReadBlockHash: blockHash,
      externalKeyReadComplete: true,
      externalKeyRegistration: keyRegistration
    };
  }
}

export function createConcordiumAgentAuthorityTransport(
  options: ConcordiumAgentAuthorityTransportOptions
): AgentAuthorityTransport {
  return new ConcordiumAgentAuthorityTransport(options);
}
