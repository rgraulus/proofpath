/**
 * ProofPath PP-03 M3.4 — Registry Agent/Key Authority.
 *
 * Trusted-node assurance, not independent consensus verification.
 * The application must independently approve the policy digest
 * and authenticate its production observation transport.
 */

import { timingSafeEqual } from "node:crypto";
import { AccountAddress } from "@concordium/web-sdk";

import { canonicalJsonBytes } from "../core/canonical.js";
import { sha256Bytes } from "../core/hash.js";

import type {
  AgentAuthorityExternalKey,
  AgentAuthorityObservation,
  AgentAuthorityRegistryCoordinate,
  AgentAuthorityVerificationContext,
  AgentAuthorityVerificationResult,
  AgentAuthorityVerificationStatus,
  ExpectedAgentAuthority,
  ObservedAgentAuthorityRecord,
  ObservedExternalKeyRegistration,
  TrustedAgentAuthorityPolicy
} from "./types.js";

const POLICY_DOMAIN = "proofpath:agent-authority-policy:v1";
const HEX64 = /^[0-9a-f]{64}$/;
const HEX16 = /^[0-9a-f]{16}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const HEX_BYTES = /^(?:[0-9a-f]{2}){1,128}$/;
const MAX_U64 = (1n << 64n) - 1n;

type ObjectRecord = Record<string, unknown>;

function record(value: unknown): value is ObjectRecord {
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

function keys(
  value: ObjectRecord,
  required: readonly string[]
): boolean {
  return Object.keys(value).length === required.length &&
    required.every(key =>
      Object.prototype.hasOwnProperty.call(value, key)
    );
}

function network(value: unknown): boolean {
  return value === "concordium:testnet" ||
    value === "concordium:mainnet";
}

function decimal64(value: unknown): value is string {
  return typeof value === "string" &&
    DECIMAL.test(value) &&
    value.length <= 20 &&
    BigInt(value) <= MAX_U64;
}

function address(value: unknown): value is string {
  if (!text(value)) return false;

  try {
    return AccountAddress.fromBase58(value).toString() === value;
  } catch {
    return false;
  }
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

function coordinate(
  value: unknown
): value is AgentAuthorityRegistryCoordinate {
  if (!record(value) || !keys(value, [
    "network", "contractIndex", "contractSubindex"
  ])) return false;

  return network(value.network) &&
    decimal64(value.contractIndex) &&
    decimal64(value.contractSubindex);
}

function sameCoordinate(
  a: AgentAuthorityRegistryCoordinate,
  b: AgentAuthorityRegistryCoordinate
): boolean {
  return a.network === b.network &&
    a.contractIndex === b.contractIndex &&
    a.contractSubindex === b.contractSubindex;
}

function externalKey(
  value: unknown
): value is AgentAuthorityExternalKey {
  if (!record(value) || !keys(value, [
    "namespace", "keyType", "publicKeyHex"
  ])) return false;

  return text(value.namespace) &&
    text(value.keyType) &&
    typeof value.publicKeyHex === "string" &&
    HEX_BYTES.test(value.publicKeyHex);
}

function sameKey(
  a: AgentAuthorityExternalKey,
  b: AgentAuthorityExternalKey
): boolean {
  return a.namespace === b.namespace &&
    a.keyType === b.keyType &&
    a.publicKeyHex === b.publicKeyHex;
}

function sortedUnique(values: unknown): values is string[] {
  return Array.isArray(values) &&
    values.length > 0 &&
    values.length <= 128 &&
    values.every(text) &&
    values.every((value, index) => {
      if (index === 0) return true;

      const previous = values[index - 1];

      return previous !== undefined &&
        previous < value;
    });
}

function modules(values: unknown): values is string[] {
  return sortedUnique(values) &&
    values.every(value => HEX64.test(value));
}

function validPolicy(
  value: unknown
): value is TrustedAgentAuthorityPolicy {
  if (!record(value) || !keys(value, [
    "policyId",
    "policyVersion",
    "network",
    "expectedGenesisHash",
    "agentRegistry",
    "approvedAgentModuleReferences",
    "externalKeyRegistry",
    "approvedExternalKeyModuleReferences",
    "trustedNodeEndpoint",
    "allowedExternalKeyNamespaces",
    "allowedExternalKeyTypes",
    "maxSnapshotAgeSeconds",
    "maxFutureSkewSeconds",
    "requireFinalizedBlock",
    "requireSameBlock"
  ])) return false;

  return text(value.policyId) &&
    text(value.policyVersion) &&
    network(value.network) &&
    typeof value.expectedGenesisHash === "string" &&
    HEX64.test(value.expectedGenesisHash) &&
    coordinate(value.agentRegistry) &&
    coordinate(value.externalKeyRegistry) &&
    value.agentRegistry.network === value.network &&
    value.externalKeyRegistry.network === value.network &&
    !sameCoordinate(value.agentRegistry, value.externalKeyRegistry) &&
    modules(value.approvedAgentModuleReferences) &&
    modules(value.approvedExternalKeyModuleReferences) &&
    endpoint(value.trustedNodeEndpoint) &&
    sortedUnique(value.allowedExternalKeyNamespaces) &&
    sortedUnique(value.allowedExternalKeyTypes) &&
    Number.isSafeInteger(value.maxSnapshotAgeSeconds) &&
    (value.maxSnapshotAgeSeconds as number) > 0 &&
    Number.isSafeInteger(value.maxFutureSkewSeconds) &&
    (value.maxFutureSkewSeconds as number) >= 0 &&
    value.requireFinalizedBlock === true &&
    value.requireSameBlock === true;
}

/**
 * Domain-separated commitment to complete validated policy.
 * Computing a digest is not itself policy approval.
 */
export function digestAgentAuthorityPolicy(
  policy: TrustedAgentAuthorityPolicy
): string {
  if (!validPolicy(policy)) {
    throw new TypeError("Invalid agent authority policy");
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
  if (typeof trusted !== "string" ||
      !HEX64.test(actual) ||
      !HEX64.test(trusted)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(trusted, "hex")
  );
}

function validExpected(
  value: unknown
): value is ExpectedAgentAuthority {
  if (!record(value) || !keys(value, [
    "network",
    "agentTokenIdHex",
    "expectedOwnerAccount",
    "expectedExternalKey"
  ])) return false;

  return network(value.network) &&
    typeof value.agentTokenIdHex === "string" &&
    HEX16.test(value.agentTokenIdHex) &&
    address(value.expectedOwnerAccount) &&
    externalKey(value.expectedExternalKey);
}

function validAgent(
  value: unknown
): value is ObservedAgentAuthorityRecord {
  if (!record(value) || !keys(value, [
    "agentTokenIdHex",
    "ownerAccount",
    "status",
    "externalReference",
    "agentUri",
    "metadataHash"
  ])) return false;

  const ref = value.externalReference;

  return typeof value.agentTokenIdHex === "string" &&
    HEX16.test(value.agentTokenIdHex) &&
    address(value.ownerAccount) &&
    ["active", "revoked", "unknown"].includes(
      String(value.status)
    ) &&
    (
      ref === null ||
      (
        record(ref) &&
        keys(ref, ["contract", "kind", "externalKey"]) &&
        coordinate(ref.contract) &&
        ref.kind === "cis8" &&
        externalKey(ref.externalKey)
      )
    ) &&
    (value.agentUri === null || text(value.agentUri)) &&
    (
      value.metadataHash === null ||
      (
        typeof value.metadataHash === "string" &&
        HEX64.test(value.metadataHash)
      )
    );
}

function validRegistration(
  value: unknown
): value is ObservedExternalKeyRegistration {
  if (!record(value) || !keys(value, [
    "ownerAccount",
    "externalKey",
    "status",
    "proofScheme",
    "lastUpdated"
  ])) return false;

  return address(value.ownerAccount) &&
    externalKey(value.externalKey) &&
    ["active", "revoked", "unknown"].includes(
      String(value.status)
    ) &&
    text(value.proofScheme) &&
    timestamp(value.lastUpdated);
}

function validObservation(
  value: unknown
): value is AgentAuthorityObservation {
  if (!record(value) || !keys(value, [
    "network",
    "genesisHash",
    "nodeEndpoint",
    "blockHash",
    "blockHeight",
    "blockTimestamp",
    "observedAt",
    "blockFinalized",
    "agentRegistry",
    "agentModuleReference",
    "agentReadBlockHash",
    "agentReadComplete",
    "agent",
    "externalKeyRegistry",
    "externalKeyModuleReference",
    "externalKeyReadBlockHash",
    "externalKeyReadComplete",
    "externalKeyRegistration"
  ])) return false;

  return network(value.network) &&
    typeof value.genesisHash === "string" &&
    HEX64.test(value.genesisHash) &&
    endpoint(value.nodeEndpoint) &&
    typeof value.blockHash === "string" &&
    HEX64.test(value.blockHash) &&
    decimal64(value.blockHeight) &&
    timestamp(value.blockTimestamp) &&
    timestamp(value.observedAt) &&
    typeof value.blockFinalized === "boolean" &&
    coordinate(value.agentRegistry) &&
    typeof value.agentModuleReference === "string" &&
    HEX64.test(value.agentModuleReference) &&
    typeof value.agentReadBlockHash === "string" &&
    HEX64.test(value.agentReadBlockHash) &&
    typeof value.agentReadComplete === "boolean" &&
    (value.agent === null || validAgent(value.agent)) &&
    coordinate(value.externalKeyRegistry) &&
    typeof value.externalKeyModuleReference === "string" &&
    HEX64.test(value.externalKeyModuleReference) &&
    typeof value.externalKeyReadBlockHash === "string" &&
    HEX64.test(value.externalKeyReadBlockHash) &&
    typeof value.externalKeyReadComplete === "boolean" &&
    (
      value.externalKeyRegistration === null ||
      validRegistration(value.externalKeyRegistration)
    );
}

/**
 * Verify a narrow trusted-node-reported agent/key relationship.
 *
 * Injected observations can be synthetic. A verified result
 * requires separately approved policy and authenticated
 * production transport before it has live assurance value.
 */
export async function verifyAgentAuthority(
  context: AgentAuthorityVerificationContext
): Promise<AgentAuthorityVerificationResult> {
  const raw: ObjectRecord =
    record(context as unknown) ? context as unknown as ObjectRecord : {};

  const rawPolicy = raw.policy;
  const rawExpected = raw.expected;

  const policyId =
    record(rawPolicy) && text(rawPolicy.policyId)
      ? rawPolicy.policyId : "";

  const networkId =
    record(rawExpected) && text(rawExpected.network)
      ? rawExpected.network : "";

  const agentTokenIdHex =
    record(rawExpected) &&
    typeof rawExpected.agentTokenIdHex === "string"
      ? rawExpected.agentTokenIdHex : "";

  let policyDigest = "";
  let blockHash: string | null = null;
  let blockHeight: string | null = null;

  let registryModulesApprovedByPolicy = false;
  let snapshotFinalized = false;
  let agentActive = false;
  let ownerMatched = false;
  let externalReferenceMatched = false;
  let externalKeyRegistrationActive = false;
  let externalKeyOwnerMatched = false;

  function decision(
    status: AgentAuthorityVerificationStatus,
    reasonCode: string
  ): AgentAuthorityVerificationResult {
    return {
      claim:
        "agent_registry_owner_external_key_binding_at_finalized_snapshot",
      assuranceModel:
        "trusted_node_finalized_agent_key_binding_v1",
      status,
      reasonCode,
      policyId,
      policyDigest,
      network: networkId,
      agentTokenIdHex,
      blockHash,
      blockHeight,
      registryModulesApprovedByPolicy,
      snapshotFinalized,
      agentActive,
      ownerMatched,
      externalReferenceMatched,
      externalKeyRegistrationActive,
      externalKeyOwnerMatched,
      consensusIndependentlyVerified: false,
      historicalUpgradeAuthorityVerified: false,
      humanIdentityVerified: false,
      actionSpecificSigningAuthorityVerified: false
    };
  }

  if (!validPolicy(rawPolicy)) {
    return decision("indeterminate",
      "invalid_agent_authority_policy");
  }

  try {
    policyDigest = digestAgentAuthorityPolicy(rawPolicy);
  } catch {
    return decision("indeterminate", "policy_digest_unavailable");
  }

  if (!digestMatches(policyDigest, raw.trustedPolicyDigest)) {
    return decision("indeterminate",
      "trusted_policy_digest_mismatch");
  }

  if (!validExpected(rawExpected)) {
    return decision("indeterminate",
      "invalid_expected_agent_authority");
  }

  if (rawExpected.network !== rawPolicy.network) {
    return decision("failed", "network_mismatch");
  }

  if (
    !rawPolicy.allowedExternalKeyNamespaces.includes(
      rawExpected.expectedExternalKey.namespace
    ) ||
    !rawPolicy.allowedExternalKeyTypes.includes(
      rawExpected.expectedExternalKey.keyType
    )
  ) {
    return decision("indeterminate", "unsupported_key_type");
  }

  if (
    !record(raw.transport) ||
    typeof raw.transport.readAgentAuthority !== "function"
  ) {
    return decision("indeterminate", "transport_unavailable");
  }

  if (typeof raw.now !== "function") {
    return decision("indeterminate",
      "invalid_verification_clock");
  }

  let now: Date;

  try {
    now = (raw.now as () => Date)();
  } catch {
    return decision("indeterminate",
      "invalid_verification_clock");
  }

  if (!(now instanceof Date) ||
      !Number.isFinite(now.getTime())) {
    return decision("indeterminate",
      "invalid_verification_clock");
  }

  let observed: unknown;

  try {
    const transport = raw.transport as unknown as {
      readAgentAuthority(
        expected: ExpectedAgentAuthority
      ): Promise<AgentAuthorityObservation>;
    };

    observed = await transport.readAgentAuthority({
      ...rawExpected,
      expectedExternalKey: { ...rawExpected.expectedExternalKey }
    });
  } catch {
    return decision("indeterminate", "transport_error");
  }

  if (!validObservation(observed)) {
    return decision("indeterminate", "observation_invalid");
  }

  if (
    observed.agentReadBlockHash !== observed.blockHash ||
    observed.externalKeyReadBlockHash !== observed.blockHash
  ) {
    return decision("indeterminate",
      "snapshot_block_mismatch");
  }

  if (observed.network !== rawPolicy.network) {
    return decision("failed", "network_mismatch");
  }

  if (observed.genesisHash !== rawPolicy.expectedGenesisHash) {
    return decision("failed", "genesis_hash_mismatch");
  }

  if (observed.nodeEndpoint !== rawPolicy.trustedNodeEndpoint) {
    return decision("failed", "node_endpoint_mismatch");
  }

  if (!sameCoordinate(
    observed.agentRegistry, rawPolicy.agentRegistry
  )) {
    return decision("failed",
      "agent_registry_coordinate_mismatch");
  }

  if (!sameCoordinate(
    observed.externalKeyRegistry,
    rawPolicy.externalKeyRegistry
  )) {
    return decision("failed",
      "external_key_registry_coordinate_mismatch");
  }

  if (
    !rawPolicy.approvedAgentModuleReferences.includes(
      observed.agentModuleReference
    )
  ) {
    return decision("failed", "agent_module_not_approved");
  }

  if (
    !rawPolicy.approvedExternalKeyModuleReferences.includes(
      observed.externalKeyModuleReference
    )
  ) {
    return decision("failed",
      "external_key_module_not_approved");
  }

  registryModulesApprovedByPolicy = true;

  blockHash = observed.blockHash;
  blockHeight = observed.blockHeight;

  if (!observed.blockFinalized) {
    return decision("failed", "block_explicitly_unfinalized");
  }

  snapshotFinalized = true;

  const nowMs = now.getTime();
  const observedMs = Date.parse(observed.observedAt);
  const blockMs = Date.parse(observed.blockTimestamp);

  if (
    blockMs > observedMs ||
    blockMs > nowMs + rawPolicy.maxFutureSkewSeconds * 1000
  ) {
    return decision("indeterminate",
      "snapshot_timestamp_inconsistent");
  }

  if (
    observedMs > nowMs + rawPolicy.maxFutureSkewSeconds * 1000
  ) {
    return decision("indeterminate", "snapshot_future_dated");
  }

  if (
    nowMs - observedMs > rawPolicy.maxSnapshotAgeSeconds * 1000 ||
    nowMs - blockMs > rawPolicy.maxSnapshotAgeSeconds * 1000
  ) {
    return decision("indeterminate", "snapshot_stale");
  }

  if (!observed.agentReadComplete) {
    return decision("indeterminate", "agent_read_incomplete");
  }

  if (!observed.externalKeyReadComplete) {
    return decision("indeterminate",
      "external_key_read_incomplete");
  }

  const agent = observed.agent;

  if (agent === null) {
    return decision("failed", "agent_not_found");
  }

  if (agent.agentTokenIdHex !== rawExpected.agentTokenIdHex) {
    return decision("failed", "agent_token_mismatch");
  }

  if (agent.status === "unknown") {
    return decision("indeterminate", "observation_invalid");
  }

  if (agent.status === "revoked") {
    return decision("failed", "agent_revoked");
  }

  agentActive = true;

  if (agent.ownerAccount !== rawExpected.expectedOwnerAccount) {
    return decision("failed", "agent_owner_mismatch");
  }

  ownerMatched = true;

  if (agent.externalReference === null) {
    return decision("failed", "external_reference_missing");
  }

  const ref = agent.externalReference;

  if (
    !sameCoordinate(ref.contract, rawPolicy.externalKeyRegistry) ||
    !sameKey(ref.externalKey, rawExpected.expectedExternalKey)
  ) {
    return decision("failed", "external_reference_mismatch");
  }

  externalReferenceMatched = true;

  const registration = observed.externalKeyRegistration;

  if (registration === null) {
    return decision("failed",
      "external_key_registration_missing");
  }

  if (registration.status === "unknown") {
    return decision("indeterminate", "observation_invalid");
  }

  if (registration.status === "revoked") {
    return decision("failed",
      "external_key_registration_revoked");
  }

  if (!sameKey(
    registration.externalKey, rawExpected.expectedExternalKey
  )) {
    return decision("failed", "external_key_mismatch");
  }

  externalKeyRegistrationActive = true;

  if (registration.ownerAccount !== agent.ownerAccount) {
    return decision("failed", "external_key_owner_mismatch");
  }

  externalKeyOwnerMatched = true;

  if (Date.parse(registration.lastUpdated) > blockMs) {
    return decision("indeterminate",
      "snapshot_timestamp_inconsistent");
  }

  return decision(
    "verified",
    "trusted_node_agent_key_binding_verified"
  );
}
