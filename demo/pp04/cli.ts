
/**
 * ProofPath PP-04-B — Offline Demonstration CLI.
 *
 * Runs the shared application orchestrator.
 * Optional portable exports reuse the PP-01 exporter.
 *
 * Output safeguards:
 * - explicit disclosure profile and absolute destination
 * - restricted disclosure requires acknowledgement
 * - destination must be outside the repository
 * - exclusive file creation (no overwrites)
 * - no raw evidence or manifest printed to stdout
 * - rejected compositions cannot be exported
 */

import {
  closeSync,
  openSync,
  realpathSync,
  unlinkSync,
  writeFileSync
} from "node:fs";

import {
  dirname,
  isAbsolute,
  relative,
  isAbsolute as pathIsAbsolute
} from "node:path";

import { runProofPathDemo }
  from "../../src/application/pp04/orchestrator.js";

import { loadPP04CanonicalScenario }
  from "../../src/application/pp04/fixtures.js";

import { createPP04TrustedValidator }
  from "../../src/application/pp04/trustedConfig.js";

import { exportPP04DemoEvidence }
  from "../../src/application/pp04/export.js";

import type {
  ExportDisclosure
} from "../../src/core/export.js";

import type {
  PP04ScenarioId
} from "../../src/application/pp04/contracts.js";

const SCENARIOS: readonly PP04ScenarioId[] = [
  "consistent",
  "missing-evidence",
  "binding-conflict",
  "unsupported-assurance"
];

const EXPECTED_STATUS: Record<PP04ScenarioId, string> = {
  consistent: "incomplete",
  "missing-evidence": "incomplete",
  "binding-conflict": "rejected",
  "unsupported-assurance": "rejected"
};

interface CliOptions {
  scenarioId: PP04ScenarioId;
  disclosure: ExportDisclosure | null;
  outputPath: string | null;
  restrictedAcknowledged: boolean;
}

const HELP = [
  "ProofPath PP-04-B — Offline Evidence Demonstration",
  "",
  "Scenario:",
  "  --scenario <scenario-id>",
  "",
  "Optional export:",
  "  --export public|restricted --output <absolute-file-path>",
  "",
  "Restricted export additionally requires:",
  "  --acknowledge-restricted",
  "",
  "Examples:",
  "  node.exe --import tsx demo/pp04/cli.ts --scenario consistent",
  "  node.exe --import tsx demo/pp04/cli.ts --scenario consistent --export public --output <absolute-path>",
  "",
  "Scenario IDs:",
  "  consistent",
  "  missing-evidence",
  "  binding-conflict",
  "  unsupported-assurance",
  "",
  "Only offline synthetic evidence is supported.",
  "Export destinations must be outside this repository.",
  "Existing files are never overwritten.",
  "Restricted acknowledgement is not access authorization.",
  "No transaction-wide verification is asserted."
].join("\n");

function isScenario(
  value: string | undefined
): value is PP04ScenarioId {
  return value !== undefined &&
    SCENARIOS.some(item => item === value);
}

function parseOptions(args: string[]): CliOptions | null {
  if (
    args.length < 2 ||
    args[0] !== "--scenario" ||
    !isScenario(args[1])
  ) {
    return null;
  }

  const scenarioId = args[1];

  if (args.length === 2) {
    return {
      scenarioId,
      disclosure: null,
      outputPath: null,
      restrictedAcknowledged: false
    };
  }

  if (
    (args.length !== 6 && args.length !== 7) ||
    args[2] !== "--export" ||
    args[4] !== "--output"
  ) {
    return null;
  }

  const disclosure = args[3];
  const outputPath = args[5];

  if (
    (disclosure !== "public" &&
      disclosure !== "restricted") ||
    !outputPath ||
    !isAbsolute(outputPath)
  ) {
    return null;
  }

  const acknowledged =
    args.length === 7 &&
    args[6] === "--acknowledge-restricted";

  if (
    args.length === 7 && !acknowledged
  ) {
    return null;
  }

  if (
    disclosure === "restricted" && !acknowledged
  ) {
    return null;
  }

  if (
    disclosure === "public" && acknowledged
  ) {
    return null;
  }

  return {
    scenarioId,
    disclosure,
    outputPath,
    restrictedAcknowledged: acknowledged
  };
}

/**
 * Resolve the output parent and reject destinations
 * within the repository, including symlinked parents.
 *
 * This is a convenience safeguard for the local demo,
 * not a filesystem sandbox against hostile local users.
 */
function checkOutputDestination(
  outputPath: string,
  repositoryRoot: string
): void {
  const parent = realpathSync(dirname(outputPath));
  const root = realpathSync(repositoryRoot);

  const fromRoot = relative(root, parent);

  const outsideRepository =
    fromRoot === ".." ||
    fromRoot.startsWith(".." + (process.platform ===
      "win32" ? "\\" : "/")) ||
    pathIsAbsolute(fromRoot);

  if (!outsideRepository) {
    throw new Error("PP04_EXPORT_DESTINATION_REJECTED");
  }
}

/**
 * Exclusive creation, with cleanup if writing fails.
 * No export bytes are echoed to the terminal.
 */
function writeExport(
  outputPath: string,
  value: unknown
): void {
  const bytes = JSON.stringify(value, null, 2) + "\n";

  const fd = openSync(outputPath, "wx", 0o600);
  let completed = false;

  try {
    writeFileSync(fd, bytes, { encoding: "utf8" });
    completed = true;
  } finally {
    closeSync(fd);

    if (!completed) {
      try {
        unlinkSync(outputPath);
      } catch {
        // Preserve the original failure.
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 1 && args[0] === "--help") {
    console.log(HELP);
    return;
  }

  const options = parseOptions(args);

  if (options === null) {
    console.error("PP04_INVALID_CLI_ARGUMENTS");
    console.error(HELP);
    process.exitCode = 2;
    return;
  }

  const repositoryRoot = process.cwd();

  try {
    const validator = createPP04TrustedValidator(
      repositoryRoot
    );

    const dependencies = {
      validator,

      async loadScenario() {
        return loadPP04CanonicalScenario(
          repositoryRoot
        );
      }
    };

    const result = await runProofPathDemo(
      {
        scenarioId: options.scenarioId,
        sourceMode: "fixture"
      },
      dependencies
    );

    if (
      !result.execution.completed ||
      result.composition === null
    ) {
      console.error(
        "PP04_EXECUTION_FAILED=" +
        (result.execution.failureCode ?? "unknown")
      );

      process.exitCode = 1;
      return;
    }

    const composition = result.composition;

    console.log("=== PROOFPATH PP-04-B ===");
    console.log("SOURCE_MODE=fixture");
    console.log("SCENARIO=" + options.scenarioId);
    console.log("EXECUTION_COMPLETED=true");
    console.log(
      "COMPOSITION_STATUS=" + composition.status
    );

    console.log(
      "RECEIPT_STATUS=" +
      (result.sourceAssessments.receipt?.status ??
        "unavailable")
    );

    console.log(
      "SETTLEMENT_STATUS=" +
      (result.sourceAssessments.settlement?.status ??
        "unavailable")
    );

    console.log(
      "AGENT_STATUS=" +
      (result.sourceAssessments.agentAuthority?.status ??
        "unavailable")
    );

    console.log(
      "SELLER_STATUS=" +
      (result.sourceAssessments.seller?.status ??
        "unavailable")
    );

    console.log(
      "MANIFEST_PRESENT=" +
      (composition.manifest !== null)
    );

    const reasons = [
      ...new Set(
        composition.diagnostics.reasons.map(
          item => item.code
        )
      )
    ].sort();

    console.log(
      "DIAGNOSTIC_CODES=" +
      (reasons.length > 0
        ? reasons.join(",")
        : "none")
    );

    console.log("TRANSACTION_VERIFIED=false");
    console.log("SYNTHETIC_SOURCE_AUTHENTICATION=false");

    console.log(
      "ADVERSARIAL_COMPOSITION_INPUT=" +
      (
        options.scenarioId === "binding-conflict" ||
        options.scenarioId === "unsupported-assurance"
      )
    );

    const passed =
      composition.status ===
        EXPECTED_STATUS[options.scenarioId];

    console.log("DEMO_ACCEPTANCE_PASS=" + passed);

    if (!passed) {
      process.exitCode = 1;
      return;
    }

    if (
      options.disclosure !== null &&
      options.outputPath !== null
    ) {
      // Validate the path before constructing an export.
      checkOutputDestination(
        options.outputPath,
        repositoryRoot
      );

      const outcome = exportPP04DemoEvidence(
        result,
        validator,
        {
          disclosure: options.disclosure,
          channel: "local-cli",
          restrictedAcknowledged:
            options.restrictedAcknowledged
        }
      );

      writeExport(
        options.outputPath,
        outcome.portableExport
      );

      console.log(
        "EXPORT_DISCLOSURE=" + outcome.disclosure
      );
      console.log("EXPORT_DIGEST_VERIFIED=true");
      console.log("EXPORT_FILE_CREATED=true");
      console.log("EXPORT_TRANSACTION_VERIFIED=false");
    }
  } catch {
    // No raw evidence, JWS, manifest or stack traces.
    console.error("PP04_CLI_EXECUTION_FAILED");
    process.exitCode = 1;
  }
}

await main();
