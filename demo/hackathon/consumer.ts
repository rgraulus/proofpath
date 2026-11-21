
/**
 * ProofPath Hackathon — Standalone Historical Receipt Consumer
 *
 * Packaged SDK only. Historical evidence is untrusted.
 * An independent policy approval must precede positive verification.
 *
 * No payment execution or database access.
 */

import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

import {
  verifyFacilitatorReceipt
} from "@proofpath/core/concordium";

import type {
  FacilitatorExpectedPayment,
  TrustedFacilitatorReceiptPolicy
} from "@proofpath/core/concordium";

import {
  DEMO_TRANSACTION_HASH,
  loadHistoricalEvidence
} from "./historicalEvidence.js";

interface TrustedReceiptInput {
  expected: FacilitatorExpectedPayment;
  policy: TrustedFacilitatorReceiptPolicy;
  trustedPolicyDigest: string;
}

const EXPECTED_CONTRACT_ID =
  "cid_e7fb8ef3933f5b45c7a246267858baf5b84ba60a7c178d0b84cc4e90fc564d98";

const HEX64 = /^[a-fA-F0-9]{64}$/;

function record(value: unknown):
  value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function requirePath(value: string | undefined): string {
  if (!value || !isAbsolute(value)) {
    throw new Error("absolute_input_path_required");
  }

  return resolve(value);
}

async function readTrustedInput(
  filename: string
): Promise<TrustedReceiptInput> {
  const data: unknown = JSON.parse(
    await readFile(filename, "utf8")
  );

  if (
    !record(data) ||
    !record(data.expected) ||
    !record(data.policy) ||
    typeof data.trustedPolicyDigest !== "string" ||
    !HEX64.test(data.trustedPolicyDigest)
  ) {
    throw new Error("trusted_input_structure_invalid");
  }

  const expected = data.expected;

  if (
    expected.transactionHash !== DEMO_TRANSACTION_HASH ||
    !record(expected.contract) ||
    expected.contract.contractId !== EXPECTED_CONTRACT_ID ||
    expected.contract.contractVersion !== "1.0.0" ||
    expected.contract.isFrozen !== true ||
    expected.contract.merchantId !== "demo-merchant" ||
    expected.contract.network !== "concordium:testnet" ||
    expected.contract.amount !== "0.050101" ||
    !record(expected.contract.resource) ||
    expected.contract.resource.method !== "GET" ||
    expected.contract.resource.path !== "/paid-gated" ||
    !record(expected.contract.asset) ||
    expected.contract.asset.type !== "PLT" ||
    expected.contract.asset.tokenId !== "EUDemo" ||
    expected.contract.asset.decimals !== 6 ||
    typeof expected.contract.payTo !== "string" ||
    expected.contract.payTo.length === 0 ||
    typeof expected.nonce !== "string" ||
    expected.nonce.length === 0
  ) {
    throw new Error("trusted_expected_payment_invalid");
  }

  return data as unknown as TrustedReceiptInput;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (
    (args.length !== 2 && args.length !== 4) ||
    args[0] !== "--evidence" ||
    (args.length === 4 && args[2] !== "--trust")
  ) {
    throw new Error(
      "usage: --evidence <absolute-path> [--trust <absolute-path>]"
    );
  }

  const evidencePath = requirePath(args[1]);
  const trustPath = args.length === 4
    ? requirePath(args[3])
    : null;

  if (trustPath === evidencePath) {
    throw new Error("evidence_and_trust_paths_must_differ");
  }

  const evidence = await loadHistoricalEvidence(evidencePath);

  console.log("=== PROOFPATH HISTORICAL RECEIPT ASSESSMENT ===");
  console.log("TRANSACTION_PREFIX=" +
    DEMO_TRANSACTION_HASH.slice(0, 12));
  console.log("SDK_ENTRYPOINT=@proofpath/core/concordium");

  if (trustPath === null) {
    console.log("RECEIPT_STATUS=indeterminate");
    console.log(
      "RECEIPT_REASON=historical_signing_authority_unavailable"
    );
    console.log("SIGNATURE_AUTHENTICATED=false");
    console.log("RECEIPT_SDK_VERIFICATION_PERFORMED=false");
  } else {
    const trusted = await readTrustedInput(trustPath);

    if (
      evidence.challenge.merchantId !==
        trusted.expected.contract.merchantId ||
      evidence.challenge.nonce !== trusted.expected.nonce
    ) {
      throw new Error("challenge_binding_mismatch");
    }

    const result = verifyFacilitatorReceipt({
      jws: evidence.facilitatorReceipt.jws,
      expected: trusted.expected,
      policy: trusted.policy,
      trustedPolicyDigest: trusted.trustedPolicyDigest,
      now: () => new Date()
    });

    console.log("RECEIPT_STATUS=" + result.status);
    console.log("RECEIPT_REASON=" + result.reasonCode);
    console.log(
      "SIGNATURE_AUTHENTICATED=" +
      result.signatureAuthenticated
    );
    console.log("RECEIPT_SDK_VERIFICATION_PERFORMED=true");

    // A supplied trust file is not independently authenticated
    // merely because its contents have the correct structure.
    console.log(
      "TRUST_POLICY_APPROVAL_INDEPENDENTLY_ESTABLISHED=" +
      "not_assessed_by_consumer"
    );
  }

  console.log("INDEPENDENT_SETTLEMENT=not_assessed");
  console.log("AGENT_AUTHORITY=not_assessed");
  console.log("SELLER_BINDING=not_assessed");
  console.log("DELIVERY_AUTHENTICITY=not_assessed");
  console.log("TRANSACTION_WIDE_ASSURANCE=false");
  console.log("C3_6_EXECUTION=COMPLETE");
}

main().catch(() => {
  console.error("C3_6_EXECUTION=STOP_INPUT_OR_RUNTIME_ERROR");
  process.exitCode = 1;
});
