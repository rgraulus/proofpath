
/**
 * ProofPath PP-03 M3.1 — Registry Snapshot Verification.
 *
 * Platform-neutral verification orchestration.
 *
 * Assurance: trusted_node_finalized_snapshot_v1.
 *
 * The caller must be trusted application composition.
 * In particular, this module cannot authenticate the
 * origin of an injected transport or policy digest.
 *
 * Historical upgrade authorization and independent
 * consensus verification are outside this milestone.
 */

import { timingSafeEqual } from "node:crypto";

import { canonicalJsonBytes } from "../core/canonical.js";
import { sha256Bytes } from "../core/hash.js";

import type {
  FinalizedRegistrySnapshot,
  RegistryCoordinate,
  RegistryVerificationContext,
  RegistryVerificationResult,
  RegistryVerificationStatus,
  TrustedRegistryPolicy
} from "./types.js";

const HEX64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const POLICY_DOMAIN = "proofpath:registry-policy:v1";

type PolicyCheck =
  | { ok: true; digest: string }
  | { ok: false; reason: string };

function record(value: unknown): value is Record<string, unknown> {
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

function coordinate(value: unknown): value is RegistryCoordinate {
  if (!record(value)) return false;

  return text(value.network) &&
    DECIMAL.test(String(value.contractIndex)) &&
    typeof value.contractIndex === "string" &&
    DECIMAL.test(String(value.contractSubindex)) &&
    typeof value.contractSubindex === "string";
}

function sameCoordinate(
  left: RegistryCoordinate,
  right: RegistryCoordinate
): boolean {
  return left.network === right.network &&
    left.contractIndex === right.contractIndex &&
    left.contractSubindex === right.contractSubindex;
}

function validTimestamp(value: unknown): value is string {
  if (!text(value)) return false;

  // Require an explicit UTC timestamp in canonical ISO form.
  const date = new Date(value);

  return Number.isFinite(date.getTime()) &&
    date.toISOString() === value;
}

function validPolicy(policy: unknown): policy is TrustedRegistryPolicy {
  if (!record(policy)) return false;

  const expected = [
    "policyId",
    "policyVersion",
    "registry",
    "expectedGenesisHash",
    "approvedModuleReferences",
    "trustedNodeEndpoint",
    "maxSnapshotAgeSeconds",
    "requireFinalizedBlock"
  ];

  if (
    Object.keys(policy).length !== expected.length ||
    !expected.every(key =>
      Object.prototype.hasOwnProperty.call(policy, key)
    )
  ) {
    return false;
  }

  if (
    !text(policy.policyId) ||
    !text(policy.policyVersion) ||
    !coordinate(policy.registry) ||
    !HEX64.test(String(policy.expectedGenesisHash)) ||
    policy.requireFinalizedBlock !== true ||
    !Number.isSafeInteger(policy.maxSnapshotAgeSeconds) ||
    (policy.maxSnapshotAgeSeconds as number) <= 0
  ) {
    return false;
  }

  if (
    !Array.isArray(policy.approvedModuleReferences) ||
    policy.approvedModuleReferences.length === 0 ||
    !policy.approvedModuleReferences.every(
      value => typeof value === "string" && HEX64.test(value)
    ) ||
    new Set(policy.approvedModuleReferences).size !==
      policy.approvedModuleReferences.length
  ) {
    return false;
  }

  if (!text(policy.trustedNodeEndpoint)) return false;

  try {
    const endpoint = new URL(policy.trustedNodeEndpoint);

    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash ||
      endpoint.pathname !== "/"
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Domain-separated commitment to complete policy content.
 *
 * The returned digest is not proof of policy approval.
 * Approval requires an independently anchored digest.
 */
export function digestRegistryPolicy(
  policy: TrustedRegistryPolicy
): string {
  if (!validPolicy(policy)) {
    throw new TypeError("Invalid Registry trust policy");
  }

  const prefix = Buffer.from(
    POLICY_DOMAIN + "\0",
    "utf8"
  );

  const payload = canonicalJsonBytes(policy);

  return sha256Bytes(
    Buffer.concat([prefix, payload])
  );
}

function constantTimeDigestMatch(
  actual: string,
  expected: string
): boolean {
  if (!HEX64.test(actual) || !HEX64.test(expected)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expected, "hex")
  );
}

function checkPolicy(
  policy: unknown,
  trustedDigest: unknown
): PolicyCheck {
  if (!validPolicy(policy)) {
    return {
      ok: false,
      reason: "invalid_registry_policy"
    };
  }

  if (
    typeof trustedDigest !== "string" ||
    !HEX64.test(trustedDigest)
  ) {
    return {
      ok: false,
      reason: "trusted_policy_digest_missing"
    };
  }

  let digest: string;

  try {
    digest = digestRegistryPolicy(policy);
  } catch {
    return {
      ok: false,
      reason: "policy_digest_unavailable"
    };
  }

  if (!constantTimeDigestMatch(digest, trustedDigest)) {
    return {
      ok: false,
      reason: "policy_digest_mismatch"
    };
  }

  return { ok: true, digest };
}

function makeDecision(
  policy: TrustedRegistryPolicy,
  digest: string,
  status: RegistryVerificationStatus,
  reasonCode: string,
  snapshot: FinalizedRegistrySnapshot | null
): RegistryVerificationResult {
  return {
    gate: "TRUST-01",
    claim: "registry_module_at_finalized_snapshot",
    assuranceModel: "trusted_node_finalized_snapshot_v1",
    status,
    reasonCode,
    policyId: policy.policyId,
    policyDigest: digest,
    registry: { ...policy.registry },
    snapshot: snapshot === null
      ? null
      : {
          ...snapshot,
          registry: { ...snapshot.registry }
        },
    consensusIndependentlyVerified: false,
    historicalUpgradeAuthorityVerified: false
  };
}

function snapshotShape(
  value: unknown
): value is FinalizedRegistrySnapshot {
  if (!record(value)) return false;

  return coordinate(value.registry) &&
    typeof value.genesisHash === "string" &&
    HEX64.test(value.genesisHash) &&
    typeof value.blockHash === "string" &&
    HEX64.test(value.blockHash) &&
    typeof value.blockHeight === "string" &&
    DECIMAL.test(value.blockHeight) &&
    validTimestamp(value.blockTimestamp) &&
    typeof value.finalized === "boolean" &&
    typeof value.moduleReference === "string" &&
    HEX64.test(value.moduleReference) &&
    validTimestamp(value.observedAt) &&
    text(value.nodeEndpoint);
}

function validateSnapshot(
  snapshot: FinalizedRegistrySnapshot,
  policy: TrustedRegistryPolicy,
  now: Date
): {
  status: RegistryVerificationStatus;
  reason: string;
} {
  if (!sameCoordinate(snapshot.registry, policy.registry)) {
    return {
      status: "failed",
      reason: "registry_coordinate_mismatch"
    };
  }

  if (snapshot.genesisHash !== policy.expectedGenesisHash) {
    return {
      status: "failed",
      reason: "network_genesis_mismatch"
    };
  }

  if (snapshot.nodeEndpoint !== policy.trustedNodeEndpoint) {
    return {
      status: "failed",
      reason: "node_endpoint_mismatch"
    };
  }

  if (!snapshot.finalized) {
    return {
      status: "failed",
      reason: "snapshot_not_finalized"
    };
  }

  const ageMs =
    now.getTime() - Date.parse(snapshot.blockTimestamp);

  const observationAgeMs =
    now.getTime() - Date.parse(snapshot.observedAt);

  if (
    ageMs < 0 ||
    observationAgeMs < 0 ||
    ageMs > policy.maxSnapshotAgeSeconds * 1000 ||
    observationAgeMs > policy.maxSnapshotAgeSeconds * 1000 ||
    observationAgeMs > ageMs
  ) {
    return {
      status: "indeterminate",
      reason: "snapshot_freshness_unestablished"
    };
  }

  if (
    !policy.approvedModuleReferences.includes(
      snapshot.moduleReference
    )
  ) {
    return {
      status: "failed",
      reason: "module_not_approved_by_policy"
    };
  }

  return {
    status: "verified",
    reason: "trusted_node_registry_snapshot_approved"
  };
}

/**
 * Execute a Registry snapshot verification against a trusted
 * application-composed transport and independently anchored
 * trust policy.
 *
 * A mock or attacker-supplied transport can fabricate a
 * structurally matching snapshot. Production callers MUST
 * construct and authenticate the Concordium transport
 * independently of untrusted requests.
 */
export async function verifyRegistrySnapshot(
  context: RegistryVerificationContext
): Promise<RegistryVerificationResult> {
  if (
    !context ||
    !context.policy ||
    !context.transport ||
    typeof context.transport.readFinalizedRegistrySnapshot !==
      "function" ||
    typeof context.now !== "function"
  ) {
    throw new TypeError("Malformed Registry verification context");
  }

  const policy = context.policy;
  const policyCheck = checkPolicy(
    policy,
    context.trustedPolicyDigest
  );

  if (!policyCheck.ok) {
    return makeDecision(
      policy,
      "",
      "indeterminate",
      policyCheck.reason,
      null
    );
  }

  const now = context.now();

  if (
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    return makeDecision(
      policy,
      policyCheck.digest,
      "indeterminate",
      "verification_clock_invalid",
      null
    );
  }

  let observation: unknown;

  try {
    observation =
      await context.transport.readFinalizedRegistrySnapshot(
        { ...policy.registry }
      );
  } catch {
    return makeDecision(
      policy,
      policyCheck.digest,
      "indeterminate",
      "registry_transport_unavailable",
      null
    );
  }

  if (!snapshotShape(observation)) {
    return makeDecision(
      policy,
      policyCheck.digest,
      "indeterminate",
      "registry_observation_invalid",
      null
    );
  }

  const evaluation = validateSnapshot(
    observation,
    policy,
    now
  );

  return makeDecision(
    policy,
    policyCheck.digest,
    evaluation.status,
    evaluation.reason,
    observation
  );
}
