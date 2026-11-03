
/**
 * ProofPath PP-02 — TRUST-01 deterministic acceptance tests.
 *
 * All fixtures are synthetic and offline.
 * No blockchain, network or payment operations.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateRegistryTrust } from "../src/pp02/registryTrust.js";
import type {
  PP02RegistryTrustInput,
  PP02EvidenceReference
} from "../src/pp02/types.js";

const ORIGINAL = "a".repeat(64);
const APPROVED = "b".repeat(64);
const UNAPPROVED = "c".repeat(64);
const BLOCK_HASH = "d".repeat(64);
const TX_HASH = "e".repeat(64);

function evidence(
  id: string,
  origin: PP02EvidenceReference["origin"] = "source_claim"
): PP02EvidenceReference {
  return {
    evidenceId: id,
    origin,
    sourceRef: "synthetic:registry",
    verifierRef:
      origin === "independent_verification"
        ? "synthetic:verifier"
        : null
  };
}

function fixture(): PP02RegistryTrustInput {
  const registry = {
    network: "concordium:testnet",
    contractIndex: "12802",
    contractSubindex: "0"
  };

  return {
    policy: {
      policyId: "synthetic:registry-policy",
      registry,
      approvedModuleReferences: [APPROVED],
      requireFinalizedBlock: true,
      requireAuthenticatedObservation: true,
      requireApprovedModule: true
    },
    observation: {
      registry: {...registry},
      moduleReference: APPROVED,
      block: {
        network: registry.network,
        height: "100",
        hash: BLOCK_HASH,
        finalized: true
      },
      evidence: [evidence("registry-observation")]
    },
    transitions: [
      {
        registry: {...registry},
        fromModule: ORIGINAL,
        toModule: APPROVED,
        block: {
          network: registry.network,
          height: "100",
          hash: BLOCK_HASH,
          finalized: true
        },
        transactionHash: TX_HASH,
        transactionSender: "synthetic:upgrade-sender",
        recordedContractOwner: "synthetic:contract-owner",
        successfulUpgradeEvent: true,
        evidence: [evidence("upgrade-event")]
      }
    ]
  };
}

test("TRUST-01: matching module remains indeterminate", () => {
  const result = evaluateRegistryTrust(fixture());

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "external_registry_authentication_required"
  );
  assert.equal(result.gate, "TRUST-01");
  assert.deepEqual(result.evidenceIds, ["registry-observation"]);
});

test("TRUST-01: approved-looking verifier labels do not authenticate", () => {
  const input = fixture();

  input.observation!.evidence = [
    evidence("registry-observation", "independent_verification")
  ];
  input.transitions[0]!.evidence = [
    evidence("upgrade-event", "independent_verification")
  ];

  const result = evaluateRegistryTrust(input);
  assert.notEqual(result.status, "verified");
  assert.equal(result.status, "indeterminate");
});

test("TRUST-01: unapproved module fails", () => {
  const input = fixture();
  input.observation!.moduleReference = UNAPPROVED;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "module_not_approved_by_policy");
});

test("TRUST-01: wrong contract fails", () => {
  const input = fixture();
  input.observation!.registry.contractIndex = "99999";

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "registry_coordinate_mismatch");
});

test("TRUST-01: unfinalized Registry block fails", () => {
  const input = fixture();
  input.observation!.block.finalized = false;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_or_unfinalized_snapshot");
});

test("TRUST-01: malformed module reference fails", () => {
  const input = fixture();
  input.observation!.moduleReference = "not-a-module";

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_module_reference");
});

test("TRUST-01: missing observation is indeterminate", () => {
  const input = fixture();
  input.observation = null;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "registry_observation_missing");
});

test("TRUST-01: unsafe policy fails closed", () => {
  const input = fixture();
  input.policy.requireApprovedModule = false;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "unsafe_or_invalid_trust_policy");
});

test("TRUST-01: empty module allowlist fails", () => {
  const input = fixture();
  input.policy.approvedModuleReferences = [];

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "unsafe_or_invalid_trust_policy");
});

test("TRUST-01: duplicate evidence IDs fail", () => {
  const input = fixture();
  input.observation!.evidence.push(
    evidence("registry-observation")
  );

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_observation_evidence");
});

test("TRUST-01: malformed upgrade transition fails", () => {
  const input = fixture();
  input.transitions[0]!.transactionHash = "invalid";

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_module_transition");
});

test("TRUST-01: signer-owner equality is not proof of authority", () => {
  const input = fixture();
  input.transitions[0]!.recordedContractOwner =
    input.transitions[0]!.transactionSender;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "indeterminate");
  assert.notEqual(result.status, "verified");
});

test("TRUST-01: successful upgrade flag is not independent proof", () => {
  const input = fixture();
  input.transitions[0]!.successfulUpgradeEvent = true;

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "indeterminate");
});

test("TRUST-01: missing transition evidence fails", () => {
  const input = fixture();
  input.transitions[0]!.evidence = [];

  const result = evaluateRegistryTrust(input);
  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_module_transition");
});

test("TRUST-01: malformed top-level input throws", () => {
  assert.throws(
    () => evaluateRegistryTrust(null as unknown as PP02RegistryTrustInput),
    TypeError
  );
});

test("TRUST-01: evaluation does not mutate its input", () => {
  const input = fixture();
  const original = structuredClone(input);

  evaluateRegistryTrust(input);

  assert.deepEqual(input, original);
});
