
/**
 * ProofPath Hackathon — Portable Historical Assessment.
 *
 * Exports a sanitized, bounded source-corroboration record.
 * NOT a PP-01 Evidence Manifest.
 *
 * Private historical source material is never embedded.
 * No network, blockchain or payment operations.
 */

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  compareHistoricalCommercialBinding,
  loadHistoricalCommercialAssessment
} from "./historicalCommercialBinding.js";

function argument(name: string): string {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);

  if (
    index < 0 ||
    index + 1 >= args.length ||
    args[index + 1]?.startsWith("--")
  ) {
    throw new Error("required_argument_missing");
  }

  return resolve(args[index + 1]!);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (
    args.length !== 6 ||
    args[0] !== "--evidence" ||
    args[2] !== "--gateway" ||
    args[4] !== "--output"
  ) {
    throw new Error("invalid_arguments");
  }

  const evidencePath = argument("--evidence");
  const gatewayPath = argument("--gateway");
  const outputPath = argument("--output");

  // Keep the output in the same private evidence directory.
  if (
    dirname(outputPath) !== dirname(evidencePath) ||
    outputPath === evidencePath
  ) {
    throw new Error("private_output_directory_required");
  }

  const { assessment, contract, evidence } =
    await loadHistoricalCommercialAssessment(
      evidencePath,
      gatewayPath
    );

  const altered = structuredClone(contract);
  altered.amount = "0.050102";

  const negative = compareHistoricalCommercialBinding(
    altered,
    evidence,
    assessment.provenance.gatewayContractSha256,
    assessment.provenance.historicalEvidenceSha256
  );

  const negativePassed =
    negative.status === "mismatched" &&
    negative.checks.some(
      check =>
        check.name === "amount_binding" &&
        !check.matched
    );

  if (
    assessment.status !== "matched" ||
    !assessment.checks.every(check => check.matched) ||
    !negativePassed
  ) {
    throw new Error("commercial_acceptance_incomplete");
  }

  const output = {
    schemaVersion:
      "proofpath.hackathon.portable-assessment.v1",

    artifactType:
      "bounded_historical_commercial_assessment",

    pp01EvidenceManifest: false,

    transaction: {
      network: "concordium:testnet",
      transactionHash: assessment.transactionHash,
      historicalDate: "2026-08-22"
    },

    sourceReferences: {
      gateway: {
        repositoryRole: "xcf_gateway",
        commit: assessment.provenance.gatewayCommit,
        path: "config/contracts.json",
        sha256:
          assessment.provenance.gatewayContractSha256
      },
      facilitator: {
        sourceRole: "xcf_historical_facilitator_export",
        availability: "private_local_file",
        sha256:
          assessment.provenance.historicalEvidenceSha256
      }
    },

    commercialComparison: {
      status: assessment.status,
      contractId: assessment.contractId,
      checks: assessment.checks,
      recipientComparisonPerformed: false,
      scope:
        "historical_source_record_consistency"
    },

    recordedFinality: {
      facilitatorRecordSaysFinalized:
        assessment.recordedFinality,
      independentlyVerified: false
    },

    negativeAcceptance: {
      test: "altered_expected_commercial_amount",
      result: negativePassed
        ? "mismatch_detected"
        : "not_established",
      source: "in_memory_test_only"
    },

    assurance: assessment.assurance,

    limitations: [
      "Historical Gateway configuration does not establish runtime deployment.",
      "Receipt signing-key authorization has not been established.",
      "Receipt signature verification has not been performed.",
      "Independent trusted-node settlement observation has not been performed.",
      "Recipient equality has not been established by this comparison.",
      "Agent authority, seller binding and delivery authenticity remain unverified.",
      "Source correlation does not establish transaction-wide assurance.",
      "This record is not a validated PP-01 Evidence Manifest."
    ]
  };

  // Exclusive creation: never overwrite prior evidence.
  await writeFile(
    outputPath,
    JSON.stringify(output, null, 2) + "\n",
    {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    }
  );

  console.log("PORTABLE_ASSESSMENT_CREATED=true");
  console.log("COMMERCIAL_STATUS=" + assessment.status);
  console.log("NEGATIVE_AMOUNT_TEST=PASS");
  console.log("PP01_MANIFEST=false");
  console.log("TRANSACTION_WIDE_VERIFIED=false");
  console.log("JWS_PRINTED=false");
  console.log("NONCE_PRINTED=false");
  console.log("D8_EXPORT=PASS");
}

main().catch(() => {
  console.error("D8_EXPORT=STOP_INPUT_OR_OUTPUT_ERROR");
  process.exitCode = 1;
});
