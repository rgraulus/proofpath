
/**
 * ProofPath PP-02 — ID-01 deterministic acceptance tests.
 *
 * All fixtures are synthetic and offline.
 * No real identity credentials, blockchain calls or signatures.
 *
 * A caller-supplied reference, issuer or verifier identifier
 * must never establish L2 assurance by itself.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateOwnerAssurance
} from "../src/pp02/ownerAssurance.js";

import type {
  PP02EvidenceReference,
  PP02OwnerAssuranceInput,
  PP02RegistryTrustDecision
} from "../src/pp02/types.js";

const BLOCK_HASH = "a".repeat(64);
const MODULE = "b".repeat(64);

function evidence(
  id: string,
  origin: PP02EvidenceReference["origin"] = "source_claim"
): PP02EvidenceReference {
  return {
    evidenceId: id,
    origin,
    sourceRef: "synthetic:identity-source",
    verifierRef:
      origin === "independent_verification"
        ? "synthetic:trusted-verifier"
        : null
  };
}

function registryTrust(): PP02RegistryTrustDecision {
  return {
    gate: "TRUST-01",
    status: "indeterminate",
    reasonCode: "external_registry_authentication_required",
    evidenceIds: ["registry-observation"],
    registry: {
      network: "concordium:testnet",
      contractIndex: "12802",
      contractSubindex: "0"
    },
    observedModule: MODULE,
    policyId: "synthetic:registry-policy"
  };
}

function fixture(
  requiredLevel: "L1" | "L2" = "L2"
): PP02OwnerAssuranceInput {
  const trust = registryTrust();

  return {
    policy: {
      policyId: "synthetic:owner-policy",
      requiredLevel,
      trustedIssuerRefs: ["synthetic:trusted-issuer"],
      trustedVerifierRefs: ["synthetic:trusted-verifier"],
      expectedChallengeRef: "synthetic:challenge-001",
      expectedPurpose: "proofpath.owner-assurance"
    },
    registryTrust: trust,
    owner: {
      agentRef: "synthetic:agent-287",
      ownerAccount: "synthetic:account-A",
      registry: {...trust.registry},
      block: {
        network: "concordium:testnet",
        height: "100",
        hash: BLOCK_HASH,
        finalized: true
      },
      evidence: [evidence("owner-observation")]
    },
    accountControl: {
      account: "synthetic:account-A",
      challengeRef: "synthetic:challenge-001",
      purpose: "proofpath.owner-assurance",
      verifierRef: "synthetic:trusted-verifier",
      evidence: [evidence("account-control")]
    },
    humanAssurance: {
      assuranceRef: "synthetic:human-assurance",
      issuerRef: "synthetic:trusted-issuer",
      subjectBindingRef: "synthetic:subject-binding",
      accountBindingRef: "synthetic:account-binding",
      challengeRef: "synthetic:challenge-001",
      purpose: "proofpath.owner-assurance",
      verifierRef: "synthetic:trusted-verifier",
      evidence: [evidence("human-assurance")]
    }
  };
}

test("ID-01: consistent L1 evidence remains indeterminate", () => {
  const result = evaluateOwnerAssurance(fixture("L1"));

  assert.equal(result.gate, "ID-01");
  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "external_registry_authentication_required"
  );
  assert.equal(result.establishedLevel, "none");
});

test("ID-01: consistent L2 evidence cannot establish verified human", () => {
  const result = evaluateOwnerAssurance(fixture());

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "external_subject_account_binding_verification_required"
  );
  assert.equal(result.establishedLevel, "none");
});

test("ID-01: independent-verification labels do not establish L2", () => {
  const input = fixture();

  input.owner!.evidence = [
    evidence("owner-observation", "independent_verification")
  ];
  input.accountControl!.evidence = [
    evidence("account-control", "independent_verification")
  ];
  input.humanAssurance!.evidence = [
    evidence("human-assurance", "independent_verification")
  ];

  const result = evaluateOwnerAssurance(input);

  assert.notEqual(result.status, "verified");
  assert.equal(result.establishedLevel, "none");
});

test("ID-01: registry trust failure propagates", () => {
  const input = fixture();
  input.registryTrust.status = "failed";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "registry_trust_failed");
});

test("ID-01: missing Registry ownership is indeterminate", () => {
  const input = fixture();
  input.owner = null;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "owner_observation_missing");
});

test("ID-01: substituted Registry contract fails", () => {
  const input = fixture();
  input.owner!.registry.contractIndex = "99999";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_owner_registry_binding");
});

test("ID-01: unfinalized owner snapshot fails", () => {
  const input = fixture();
  input.owner!.block.finalized = false;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_owner_snapshot");
});

test("ID-01: missing account-control evidence is indeterminate", () => {
  const input = fixture();
  input.accountControl = null;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "account_control_evidence_missing"
  );
});

test("ID-01: account-control substitution fails", () => {
  const input = fixture();
  input.accountControl!.account = "synthetic:account-B";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "owner_account_control_mismatch"
  );
});

test("ID-01: mismatched account-control challenge fails", () => {
  const input = fixture();
  input.accountControl!.challengeRef = "synthetic:old-challenge";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "account_control_challenge_or_purpose_mismatch"
  );
});

test("ID-01: wrong account-control purpose fails", () => {
  const input = fixture();
  input.accountControl!.purpose = "synthetic:unrelated-purpose";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "account_control_challenge_or_purpose_mismatch"
  );
});

test("ID-01: untrusted account verifier fails", () => {
  const input = fixture();
  input.accountControl!.verifierRef = "synthetic:unknown-verifier";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "untrusted_account_control_verifier"
  );
});

test("ID-01: missing human assurance is indeterminate", () => {
  const input = fixture();
  input.humanAssurance = null;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "human_assurance_evidence_missing"
  );
});

test("ID-01: untrusted human identity issuer fails", () => {
  const input = fixture();
  input.humanAssurance!.issuerRef = "synthetic:unknown-issuer";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "untrusted_identity_issuer");
});

test("ID-01: untrusted presentation verifier fails", () => {
  const input = fixture();
  input.humanAssurance!.verifierRef = "synthetic:unknown-verifier";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "untrusted_identity_verifier");
});

test("ID-01: unrelated human-presentation challenge fails", () => {
  const input = fixture();
  input.humanAssurance!.challengeRef = "synthetic:other-challenge";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "identity_challenge_or_purpose_mismatch"
  );
});

test("ID-01: unrelated human-presentation purpose fails", () => {
  const input = fixture();
  input.humanAssurance!.purpose = "synthetic:buyer-eligibility";

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(
    result.reasonCode,
    "identity_challenge_or_purpose_mismatch"
  );
});

test("ID-01: missing subject/account link cannot establish L2", () => {
  const input = fixture();
  input.humanAssurance!.accountBindingRef = null;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "human_account_binding_evidence_missing"
  );
  assert.equal(result.establishedLevel, "none");
});

test("ID-01: unsafe L2 issuer policy fails", () => {
  const input = fixture();
  input.policy.trustedIssuerRefs = [];

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "unsafe_l2_assurance_policy");
});

test("ID-01: unsafe L2 challenge policy fails", () => {
  const input = fixture();
  input.policy.expectedChallengeRef = null;

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "unsafe_l2_assurance_policy");
});

test("ID-01: missing owner evidence fails", () => {
  const input = fixture();
  input.owner!.evidence = [];

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_owner_evidence");
});

test("ID-01: duplicate account evidence identifiers fail", () => {
  const input = fixture();
  input.accountControl!.evidence.push(evidence("account-control"));

  const result = evaluateOwnerAssurance(input);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "invalid_account_control_evidence");
});

test("ID-01: malformed input throws", () => {
  assert.throws(
    () => evaluateOwnerAssurance(
      null as unknown as PP02OwnerAssuranceInput
    ),
    TypeError
  );
});

test("ID-01: evaluation does not mutate its input", () => {
  const input = fixture();
  const original = structuredClone(input);

  evaluateOwnerAssurance(input);

  assert.deepEqual(input, original);
});
