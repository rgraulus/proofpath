
/**
 * ProofPath PP-02 — ID-01 Human-Owner Assurance Evaluator.
 *
 * Deterministic, offline and fail-closed.
 *
 * L1: Registry-to-owner account relationship.
 * L2: L1 plus account control, human identity assurance,
 *     and authenticated subject/account binding.
 *
 * This evaluator checks structural and policy consistency.
 * It does NOT verify blockchain proofs, account signatures,
 * identity presentations, issuer signatures or subject binding.
 *
 * A caller-supplied "verified" status is never sufficient.
 */

import type {
  PP02Decision,
  PP02EvidenceReference,
  PP02OwnerAssuranceDecision,
  PP02OwnerAssuranceInput,
  PP02RegistryCoordinate
} from "./types.js";

const HEX_64 = /^[0-9a-f]{64}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function sameRegistry(
  a: PP02RegistryCoordinate,
  b: PP02RegistryCoordinate
): boolean {
  return a.network === b.network &&
    a.contractIndex === b.contractIndex &&
    a.contractSubindex === b.contractSubindex;
}

function validEvidence(
  evidence: PP02EvidenceReference[]
): boolean {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of evidence) {
    if (!item ||
        !nonEmpty(item.evidenceId) ||
        !nonEmpty(item.sourceRef) ||
        ![
          "source_claim",
          "authenticated_observation",
          "independent_verification"
        ].includes(item.origin) ||
        (
          item.verifierRef !== null &&
          !nonEmpty(item.verifierRef)
        ) ||
        (
          item.origin === "independent_verification" &&
          !nonEmpty(item.verifierRef)
        ) ||
        ids.has(item.evidenceId)) {
      return false;
    }

    ids.add(item.evidenceId);
  }

  return true;
}

function collectIds(
  ...collections: PP02EvidenceReference[][]
): string[] {
  return [...new Set(
    collections.flat().map(item => item.evidenceId)
  )].sort();
}

function decision(
  input: PP02OwnerAssuranceInput,
  status: PP02Decision["status"],
  reasonCode: string,
  evidenceIds: string[] = []
): PP02OwnerAssuranceDecision {
  return {
    gate: "ID-01",
    status,
    reasonCode,
    evidenceIds: [...new Set(evidenceIds)].sort(),
    establishedLevel: "none",
    agentRef: input.owner?.agentRef ?? null,
    ownerAccount: input.owner?.ownerAccount ?? null,
    policyId: input.policy.policyId
  };
}

/**
 * Evaluate ID-01 without converting assertions into
 * independently verified identity facts.
 *
 * establishedLevel remains "none" until a separate
 * authenticated verification boundary is implemented.
 */
export function evaluateOwnerAssurance(
  input: PP02OwnerAssuranceInput
): PP02OwnerAssuranceDecision {
  if (!input ||
      !input.policy ||
      !input.registryTrust) {
    throw new TypeError("Malformed owner-assurance input");
  }

  const {
    policy,
    registryTrust,
    owner,
    accountControl,
    humanAssurance
  } = input;

  if (!nonEmpty(policy.policyId) ||
      !["L1", "L2"].includes(policy.requiredLevel) ||
      !nonEmpty(policy.expectedPurpose) ||
      !Array.isArray(policy.trustedIssuerRefs) ||
      !Array.isArray(policy.trustedVerifierRefs) ||
      policy.trustedIssuerRefs.some(x => !nonEmpty(x)) ||
      policy.trustedVerifierRefs.some(x => !nonEmpty(x)) ||
      (
        policy.expectedChallengeRef !== null &&
        !nonEmpty(policy.expectedChallengeRef)
      )) {
    return decision(
      input, "failed", "invalid_assurance_policy"
    );
  }

  if (policy.requiredLevel === "L2" &&
      (
        policy.trustedIssuerRefs.length === 0 ||
        policy.trustedVerifierRefs.length === 0 ||
        !nonEmpty(policy.expectedChallengeRef)
      )) {
    return decision(
      input, "failed", "unsafe_l2_assurance_policy"
    );
  }

  if (registryTrust.gate !== "TRUST-01" ||
      !["verified", "failed", "indeterminate",
         "not_evaluated"].includes(registryTrust.status) ||
      !registryTrust.registry) {
    return decision(
      input, "failed", "invalid_registry_trust_decision"
    );
  }

  if (registryTrust.status === "failed") {
    return decision(
      input, "failed", "registry_trust_failed",
      registryTrust.evidenceIds
    );
  }

  if (owner === null) {
    return decision(
      input, "indeterminate", "owner_observation_missing"
    );
  }

  if (!nonEmpty(owner.agentRef) ||
      !nonEmpty(owner.ownerAccount) ||
      !owner.registry ||
      !sameRegistry(
        owner.registry, registryTrust.registry
      )) {
    return decision(
      input, "failed", "invalid_owner_registry_binding"
    );
  }

  if (!owner.block ||
      owner.block.network !== owner.registry.network ||
      !DECIMAL.test(owner.block.height) ||
      !HEX_64.test(owner.block.hash) ||
      owner.block.finalized !== true) {
    return decision(
      input, "failed", "invalid_owner_snapshot"
    );
  }

  if (!validEvidence(owner.evidence)) {
    return decision(
      input, "failed", "invalid_owner_evidence"
    );
  }

  const ownerIds = collectIds(owner.evidence);

  if (policy.requiredLevel === "L1") {
    return decision(
      input,
      "indeterminate",
      "external_registry_authentication_required",
      ownerIds
    );
  }

  // L2 requires evidence independent of the owner field.
  if (accountControl === null) {
    return decision(
      input,
      "indeterminate",
      "account_control_evidence_missing",
      ownerIds
    );
  }

  if (!nonEmpty(accountControl.account) ||
      accountControl.account !== owner.ownerAccount) {
    return decision(
      input,
      "failed",
      "owner_account_control_mismatch",
      ownerIds
    );
  }

  if (!nonEmpty(accountControl.challengeRef) ||
      accountControl.challengeRef !==
        policy.expectedChallengeRef ||
      accountControl.purpose !== policy.expectedPurpose) {
    return decision(
      input,
      "failed",
      "account_control_challenge_or_purpose_mismatch",
      ownerIds
    );
  }

  if (!policy.trustedVerifierRefs.includes(
    accountControl.verifierRef
  )) {
    return decision(
      input,
      "failed",
      "untrusted_account_control_verifier",
      ownerIds
    );
  }

  if (!validEvidence(accountControl.evidence)) {
    return decision(
      input,
      "failed",
      "invalid_account_control_evidence",
      ownerIds
    );
  }

  const controlIds = collectIds(
    owner.evidence, accountControl.evidence
  );

  if (humanAssurance === null) {
    return decision(
      input,
      "indeterminate",
      "human_assurance_evidence_missing",
      controlIds
    );
  }

  if (!nonEmpty(humanAssurance.assuranceRef) ||
      !nonEmpty(humanAssurance.subjectBindingRef) ||
      !nonEmpty(humanAssurance.issuerRef) ||
      !nonEmpty(humanAssurance.verifierRef)) {
    return decision(
      input,
      "failed",
      "invalid_human_assurance_reference",
      controlIds
    );
  }

  if (!policy.trustedIssuerRefs.includes(
    humanAssurance.issuerRef
  )) {
    return decision(
      input,
      "failed",
      "untrusted_identity_issuer",
      controlIds
    );
  }

  if (!policy.trustedVerifierRefs.includes(
    humanAssurance.verifierRef
  )) {
    return decision(
      input,
      "failed",
      "untrusted_identity_verifier",
      controlIds
    );
  }

  if (humanAssurance.challengeRef !==
        policy.expectedChallengeRef ||
      humanAssurance.challengeRef !==
        accountControl.challengeRef ||
      humanAssurance.purpose !==
        policy.expectedPurpose ||
      humanAssurance.purpose !==
        accountControl.purpose) {
    return decision(
      input,
      "failed",
      "identity_challenge_or_purpose_mismatch",
      controlIds
    );
  }

  if (!validEvidence(humanAssurance.evidence)) {
    return decision(
      input,
      "failed",
      "invalid_human_assurance_evidence",
      controlIds
    );
  }

  const allIds = collectIds(
    owner.evidence,
    accountControl.evidence,
    humanAssurance.evidence
  );

  if (!nonEmpty(humanAssurance.accountBindingRef)) {
    return decision(
      input,
      "indeterminate",
      "human_account_binding_evidence_missing",
      allIds
    );
  }

  /*
   * A matching challenge, trusted issuer identifier and
   * account-binding reference do not prove that the verified
   * human is the authenticated controller of the owner account.
   *
   * These relationships require real cryptographic verification,
   * a subject-binding rule and independently trusted evidence.
   */
  return decision(
    input,
    "indeterminate",
    "external_subject_account_binding_verification_required",
    allIds
  );
}
