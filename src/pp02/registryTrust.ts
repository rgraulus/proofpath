
/**
 * ProofPath PP-02 — TRUST-01 Registry Trust Evaluator.
 *
 * Deterministic, offline and fail-closed.
 *
 * Evaluates consistency with a caller-supplied trust policy.
 * Does NOT authenticate the policy, blockchain observations,
 * module upgrades, signatures, or transaction senders.
 *
 * A matching module is policy-eligible, NOT independently verified.
 */

import type {
  PP02Decision,
  PP02EvidenceReference,
  PP02FinalizedBlock,
  PP02ModuleTransition,
  PP02RegistryCoordinate,
  PP02RegistryTrustDecision,
  PP02RegistryTrustInput
} from "./types.js";

const HEX_64 = /^[0-9a-f]{64}$/;
const NONNEGATIVE_DECIMAL = /^(0|[1-9][0-9]*)$/;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function sameRegistry(
  left: PP02RegistryCoordinate,
  right: PP02RegistryCoordinate
): boolean {
  return left.network === right.network &&
    left.contractIndex === right.contractIndex &&
    left.contractSubindex === right.contractSubindex;
}

function validRegistry(
  registry: PP02RegistryCoordinate
): boolean {
  return nonEmpty(registry.network) &&
    NONNEGATIVE_DECIMAL.test(registry.contractIndex) &&
    NONNEGATIVE_DECIMAL.test(registry.contractSubindex);
}

function validBlock(
  block: PP02FinalizedBlock,
  network: string
): boolean {
  return block.network === network &&
    NONNEGATIVE_DECIMAL.test(block.height) &&
    HEX_64.test(block.hash) &&
    block.finalized === true;
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

function validTransition(
  transition: PP02ModuleTransition,
  registry: PP02RegistryCoordinate
): boolean {
  return sameRegistry(transition.registry, registry) &&
    HEX_64.test(transition.fromModule) &&
    HEX_64.test(transition.toModule) &&
    transition.fromModule !== transition.toModule &&
    validBlock(transition.block, registry.network) &&
    HEX_64.test(transition.transactionHash) &&
    nonEmpty(transition.transactionSender) &&
    (
      transition.recordedContractOwner === null ||
      nonEmpty(transition.recordedContractOwner)
    ) &&
    typeof transition.successfulUpgradeEvent === "boolean" &&
    validEvidence(transition.evidence);
}

function evidenceIds(
  evidence: PP02EvidenceReference[]
): string[] {
  return [...new Set(evidence.map(item => item.evidenceId))]
    .sort();
}

function decision(
  input: PP02RegistryTrustInput,
  status: PP02Decision["status"],
  reasonCode: string,
  ids: string[] = []
): PP02RegistryTrustDecision {
  return {
    gate: "TRUST-01",
    status,
    reasonCode,
    evidenceIds: [...new Set(ids)].sort(),
    registry: input.policy.registry,
    observedModule: input.observation?.moduleReference ?? null,
    policyId: input.policy.policyId
  };
}

/**
 * Evaluate Registry trust-policy consistency without
 * promoting unverified source claims into trusted facts.
 *
 * "failed" means the supplied evidence or policy
 * contradicts a required condition.
 *
 * "indeterminate" means the data may be compatible
 * with the policy, but authentic evidence and policy
 * authority have not been established by this function.
 */
export function evaluateRegistryTrust(
  input: PP02RegistryTrustInput
): PP02RegistryTrustDecision {
  if (!input ||
      !input.policy ||
      !input.policy.registry) {
    throw new TypeError("Malformed Registry trust input");
  }

  const {policy, observation, transitions} = input;

  if (!nonEmpty(policy.policyId) ||
      !validRegistry(policy.registry) ||
      policy.requireFinalizedBlock !== true ||
      policy.requireAuthenticatedObservation !== true ||
      policy.requireApprovedModule !== true ||
      !Array.isArray(policy.approvedModuleReferences) ||
      policy.approvedModuleReferences.length === 0 ||
      policy.approvedModuleReferences.some(
        module => !HEX_64.test(module)
      )) {
    return decision(input, "failed", "unsafe_or_invalid_trust_policy");
  }

  if (!Array.isArray(transitions)) {
    return decision(input, "failed", "invalid_transition_collection");
  }

  if (observation === null) {
    return decision(input, "indeterminate", "registry_observation_missing");
  }

  if (!observation.registry ||
      !sameRegistry(observation.registry, policy.registry)) {
    return decision(input, "failed", "registry_coordinate_mismatch");
  }

  if (!HEX_64.test(observation.moduleReference)) {
    return decision(input, "failed", "invalid_module_reference");
  }

  if (!observation.block ||
      !validBlock(observation.block, policy.registry.network)) {
    return decision(input, "failed", "invalid_or_unfinalized_snapshot");
  }

  if (!validEvidence(observation.evidence)) {
    return decision(input, "failed", "invalid_observation_evidence");
  }

  const ids = evidenceIds(observation.evidence);

  for (const transition of transitions) {
    if (!transition ||
        !transition.registry ||
        !transition.block ||
        !validTransition(transition, policy.registry)) {
      return decision(input, "failed", "invalid_module_transition", ids);
    }
  }

  if (!policy.approvedModuleReferences.includes(
    observation.moduleReference
  )) {
    return decision(
      input,
      "failed",
      "module_not_approved_by_policy",
      ids
    );
  }

  /*
   * All checks above are structural or policy-comparison checks.
   *
   * Evidence origin labels, upgrade event booleans,
   * signer/owner matches and verifier references are
   * caller-supplied. None is cryptographically authenticated
   * by this function.
   *
   * Returning "verified" here would be a trust-boundary error.
   */
  return decision(
    input,
    "indeterminate",
    "external_registry_authentication_required",
    ids
  );
}
