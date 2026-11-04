
/**
 * ProofPath PP-03 M3.1 — Deterministic Registry verification tests.
 *
 * Offline fixtures only. A synthetic transport is never
 * evidence of an authenticated live Concordium node.
 *
 * Current live Registry module provenance:
 * PROVENANCE_NOT_APPROVAL_READY.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  digestRegistryPolicy,
  verifyRegistrySnapshot
} from "../src/verification/registrySnapshot.js";

import type {
  FinalizedRegistrySnapshot,
  RegistryVerificationContext,
  RegistrySnapshotTransport,
  TrustedRegistryPolicy
} from "../src/verification/types.js";

const GENESIS = "a".repeat(64);
const APPROVED = "b".repeat(64);
const BLOCK = "c".repeat(64);

const UNAPPROVED_LIVE_REFERENCE =
  "142462ff638f53b7bbeae8911d23579ed23e5e3c7e9a0353606019628121a5c6";

const NOW = new Date("2026-11-04T10:00:00.000Z");
const ENDPOINT = "https://synthetic-node.example:20000/";

function policy(): TrustedRegistryPolicy {
  return {
    policyId: "synthetic:pp03-m31-test-policy",
    policyVersion: "1",
    registry: {
      network: "concordium:testnet",
      contractIndex: "12802",
      contractSubindex: "0"
    },
    expectedGenesisHash: GENESIS,
    approvedModuleReferences: [APPROVED],
    trustedNodeEndpoint: ENDPOINT,
    maxSnapshotAgeSeconds: 300,
    requireFinalizedBlock: true
  };
}

function snapshot(): FinalizedRegistrySnapshot {
  return {
    registry: { ...policy().registry },
    genesisHash: GENESIS,
    blockHash: BLOCK,
    blockHeight: "123456",
    blockTimestamp: "2026-11-04T09:59:30.000Z",
    finalized: true,
    moduleReference: APPROVED,
    observedAt: "2026-11-04T09:59:45.000Z",
    nodeEndpoint: ENDPOINT
  };
}

function transport(
  observation: FinalizedRegistrySnapshot
): RegistrySnapshotTransport {
  return {
    async readFinalizedRegistrySnapshot() {
      return observation;
    }
  };
}

function context(
  changes: {
    policy?: TrustedRegistryPolicy;
    observation?: FinalizedRegistrySnapshot;
    digest?: string;
    transport?: RegistrySnapshotTransport;
    now?: Date;
  } = {}
): RegistryVerificationContext {
  const configuredPolicy = changes.policy ?? policy();

  return {
    policy: configuredPolicy,
    trustedPolicyDigest:
      changes.digest ?? digestRegistryPolicy(configuredPolicy),
    transport:
      changes.transport ??
      transport(changes.observation ?? snapshot()),
    now: () => changes.now ?? NOW
  };
}

async function expectDecision(
  input: RegistryVerificationContext,
  status: "verified" | "failed" | "indeterminate",
  reasonCode: string
): Promise<void> {
  const result = await verifyRegistrySnapshot(input);

  assert.equal(result.status, status);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(result.gate, "TRUST-01");
  assert.equal(
    result.claim,
    "registry_module_at_finalized_snapshot"
  );
  assert.equal(
    result.assuranceModel,
    "trusted_node_finalized_snapshot_v1"
  );
  assert.equal(result.consensusIndependentlyVerified, false);
  assert.equal(result.historicalUpgradeAuthorityVerified, false);
}

test("M3.1: canonical policy digest is deterministic", () => {
  assert.equal(digestRegistryPolicy(policy()), digestRegistryPolicy(policy()));
  assert.match(digestRegistryPolicy(policy()), /^[0-9a-f]{64}$/);
});

test("M3.1: matching synthetic snapshot satisfies narrow claim only", async () => {
  const result = await verifyRegistrySnapshot(context());

  assert.equal(result.status, "verified");
  assert.equal(
    result.reasonCode,
    "trusted_node_registry_snapshot_approved"
  );

  assert.equal(result.snapshot?.blockHash, BLOCK);
  assert.equal(result.consensusIndependentlyVerified, false);
  assert.equal(result.historicalUpgradeAuthorityVerified, false);
});

test("M3.1: current unapproved module is rejected", async () => {
  const observation = snapshot();
  observation.moduleReference = UNAPPROVED_LIVE_REFERENCE;

  await expectDecision(
    context({ observation }),
    "failed",
    "module_not_approved_by_policy"
  );
});

test("M3.1: policy content tampering cannot retain anchored digest", async () => {
  const approvedPolicy = policy();
  const anchoredDigest = digestRegistryPolicy(approvedPolicy);

  approvedPolicy.approvedModuleReferences.push(
    UNAPPROVED_LIVE_REFERENCE
  );

  await expectDecision(
    context({
      policy: approvedPolicy,
      digest: anchoredDigest
    }),
    "indeterminate",
    "policy_digest_mismatch"
  );
});

test("M3.1: malformed policy commitment fails closed", async () => {
  await expectDecision(
    context({ digest: "not-a-valid-digest" }),
    "indeterminate",
    "trusted_policy_digest_missing"
  );
});

test("M3.1: incorrect policy commitment fails closed", async () => {
  await expectDecision(
    context({ digest: "f".repeat(64) }),
    "indeterminate",
    "policy_digest_mismatch"
  );
});

test("M3.1: wrong genesis is rejected", async () => {
  const observation = snapshot();
  observation.genesisHash = "d".repeat(64);

  await expectDecision(
    context({ observation }),
    "failed",
    "network_genesis_mismatch"
  );
});

test("M3.1: wrong Registry coordinate is rejected", async () => {
  const observation = snapshot();
  observation.registry.contractIndex = "99999";

  await expectDecision(
    context({ observation }),
    "failed",
    "registry_coordinate_mismatch"
  );
});

test("M3.1: mismatched endpoint label is rejected", async () => {
  const observation = snapshot();
  observation.nodeEndpoint = "https://untrusted.example/";

  await expectDecision(
    context({ observation }),
    "failed",
    "node_endpoint_mismatch"
  );
});

test("M3.1: unfinalized snapshot is rejected", async () => {
  const observation = snapshot();
  observation.finalized = false;

  await expectDecision(
    context({ observation }),
    "failed",
    "snapshot_not_finalized"
  );
});

test("M3.1: stale finalized block remains indeterminate", async () => {
  const observation = snapshot();
  observation.blockTimestamp =
    "2026-11-04T09:00:00.000Z";

  await expectDecision(
    context({ observation }),
    "indeterminate",
    "snapshot_freshness_unestablished"
  );
});

test("M3.1: stale observation remains indeterminate", async () => {
  const observation = snapshot();
  observation.observedAt =
    "2026-11-04T09:00:00.000Z";

  await expectDecision(
    context({ observation }),
    "indeterminate",
    "snapshot_freshness_unestablished"
  );
});

test("M3.1: observation preceding block is indeterminate", async () => {
  const observation = snapshot();

  observation.blockTimestamp =
    "2026-11-04T09:59:55.000Z";

  observation.observedAt =
    "2026-11-04T09:59:50.000Z";

  await expectDecision(
    context({ observation }),
    "indeterminate",
    "snapshot_freshness_unestablished"
  );
});

test("M3.1: future timestamps remain indeterminate", async () => {
  const observation = snapshot();
  observation.blockTimestamp =
    "2026-11-04T10:01:00.000Z";

  await expectDecision(
    context({ observation }),
    "indeterminate",
    "snapshot_freshness_unestablished"
  );
});

test("M3.1: malformed module observation remains indeterminate", async () => {
  const observation = snapshot();
  observation.moduleReference = "invalid-module-reference";

  await expectDecision(
    context({ observation }),
    "indeterminate",
    "registry_observation_invalid"
  );
});

test("M3.1: transport failure remains indeterminate", async () => {
  const unavailable: RegistrySnapshotTransport = {
    async readFinalizedRegistrySnapshot() {
      throw new Error("synthetic_connection_failure");
    }
  };

  await expectDecision(
    context({ transport: unavailable }),
    "indeterminate",
    "registry_transport_unavailable"
  );
});

test("M3.1: invalid verification clock remains indeterminate", async () => {
  await expectDecision(
    context({ now: new Date(Number.NaN) }),
    "indeterminate",
    "verification_clock_invalid"
  );
});

test("M3.1: empty module allowlist is invalid policy", async () => {
  const invalid = policy();
  invalid.approvedModuleReferences = [];

  await expectDecision(
    {
      policy: invalid,
      trustedPolicyDigest: "e".repeat(64),
      transport: transport(snapshot()),
      now: () => NOW
    },
    "indeterminate",
    "invalid_registry_policy"
  );
});

test("M3.1: insecure node endpoint is invalid policy", async () => {
  const invalid = policy();
  invalid.trustedNodeEndpoint =
    "http://synthetic-node.example:20000/";

  await expectDecision(
    {
      policy: invalid,
      trustedPolicyDigest: "e".repeat(64),
      transport: transport(snapshot()),
      now: () => NOW
    },
    "indeterminate",
    "invalid_registry_policy"
  );
});

test("M3.1: invalid policy never invokes transport", async () => {
  let calls = 0;

  const invalid = policy();
  invalid.approvedModuleReferences = [];

  const controlledTransport: RegistrySnapshotTransport = {
    async readFinalizedRegistrySnapshot() {
      calls += 1;
      return snapshot();
    }
  };

  await verifyRegistrySnapshot({
    policy: invalid,
    trustedPolicyDigest: "e".repeat(64),
    transport: controlledTransport,
    now: () => NOW
  });

  assert.equal(calls, 0);
});

test("M3.1: injected mock can fabricate positive result", async () => {
  const attackerControlled = transport(snapshot());

  const result = await verifyRegistrySnapshot(
    context({ transport: attackerControlled })
  );

  // This is intentional: the platform-neutral verifier
  // trusts its application-composed transport.
  assert.equal(result.status, "verified");

  // Hence this result alone is NOT evidence of
  // authenticated live node reads or consensus.
  assert.equal(result.consensusIndependentlyVerified, false);
  assert.equal(result.historicalUpgradeAuthorityVerified, false);
});
