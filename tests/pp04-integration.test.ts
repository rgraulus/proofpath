
/**
 * ProofPath PP-04-B — Integrated application regression.
 *
 * Exercises real PP-04 orchestration, PP-01 schema
 * validation, portable exports and the CLI entrypoint.
 *
 * Offline synthetic fixtures only.
 * No wallet, payment, live node or Testnet execution.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  runProofPathDemo
} from "../src/application/pp04/orchestrator.js";

import {
  loadPP04CanonicalScenario
} from "../src/application/pp04/fixtures.js";

import {
  createPP04TrustedValidator
} from "../src/application/pp04/trustedConfig.js";

import {
  exportPP04DemoEvidence
} from "../src/application/pp04/export.js";

import {
  verifyExportDigest
} from "../src/core/export.js";

import type {
  PP04ScenarioId
} from "../src/application/pp04/contracts.js";

const repositoryRoot = process.cwd();

const validator = createPP04TrustedValidator(
  repositoryRoot
);

const dependencies = {
  validator,
  async loadScenario() {
    return loadPP04CanonicalScenario(repositoryRoot);
  }
};

const EXPECTED = [
  {
    id: "consistent",
    status: "incomplete",
    manifest: true,
    diagnostics: [
      "delivery_authentication_not_established",
      "seller_authentication_not_established"
    ]
  },
  {
    id: "missing-evidence",
    status: "incomplete",
    manifest: true,
    diagnostics: [
      "delivery_authentication_not_established",
      "missing_verification_result",
      "seller_authentication_not_established"
    ]
  },
  {
    id: "binding-conflict",
    status: "rejected",
    manifest: false,
    diagnostics: [
      "delivery_authentication_not_established",
      "seller_authentication_not_established",
      "transaction_binding_mismatch"
    ]
  },
  {
    id: "unsupported-assurance",
    status: "rejected",
    manifest: false,
    diagnostics: [
      "delivery_authentication_not_established",
      "unsupported_assurance_promotion"
    ]
  }
] as const;

const SOURCE_STATUSES = {
  receipt: "verified",
  settlement: "verified",
  agentAuthority: "verified",
  seller: "indeterminate"
} as const;

function runCli(args: string[]) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "demo/pp04/cli.ts",
      ...args
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      timeout: 30000
    }
  );
}

test("PP-04-B four scenarios preserve composition boundaries", async () => {
  for (const scenario of EXPECTED) {
    const result = await runProofPathDemo(
      {
        scenarioId: scenario.id,
        sourceMode: "fixture"
      },
      dependencies
    );

    assert.equal(result.execution.completed, true);
    assert.ok(result.composition);

    assert.equal(
      result.composition.status,
      scenario.status
    );

    assert.equal(
      result.composition.manifest !== null,
      scenario.manifest
    );

    const reasons = result.composition.diagnostics.reasons
      .map(item => item.code)
      .sort();

    assert.deepEqual(
      reasons,
      [...scenario.diagnostics].sort()
    );

    assert.equal(
      result.sourceAssessments.receipt?.status,
      SOURCE_STATUSES.receipt
    );

    assert.equal(
      result.sourceAssessments.settlement?.status,
      SOURCE_STATUSES.settlement
    );

    assert.equal(
      result.sourceAssessments.agentAuthority?.status,
      SOURCE_STATUSES.agentAuthority
    );

    assert.equal(
      result.sourceAssessments.seller?.status,
      SOURCE_STATUSES.seller
    );

    if (result.composition.manifest !== null) {
      assert.equal(
        validator.validateManifest(
          result.composition.manifest
        ).valid,
        true
      );
    }
  }
});

test("PP-04-B public export excludes the manifest", async () => {
  for (const scenarioId of [
    "consistent",
    "missing-evidence"
  ] as const) {
    const result = await runProofPathDemo(
      { scenarioId, sourceMode: "fixture" },
      dependencies
    );

    const outcome = exportPP04DemoEvidence(
      result,
      validator,
      {
        disclosure: "public",
        channel: "local-cli"
      }
    );

    assert.equal(outcome.compositionStatus, "incomplete");
    assert.equal(outcome.transactionVerified, false);
    assert.equal(outcome.digestVerified, true);

    const exported = outcome.portableExport;

    assert.equal(exported.disclosure, "public");
    assert.equal(exported.manifest, null);
    assert.equal(exported.originalManifestDigestSha256, null);
    assert.equal(exported.omissions.transactionMetadataOmitted, true);
    assert.equal(exported.omissions.participantMetadataOmitted, true);
    assert.equal(exported.omissions.assuranceClaimsOmitted, true);
    assert.equal(verifyExportDigest(exported), true);
  }
});

test("PP-04-B restricted export requires local acknowledgement", async () => {
  const result = await runProofPathDemo(
    {
      scenarioId: "consistent",
      sourceMode: "fixture"
    },
    dependencies
  );

  assert.throws(
    () => exportPP04DemoEvidence(
      result,
      validator,
      {
        disclosure: "restricted",
        channel: "local-cli"
      }
    ),
    /PP04_EXPORT_NOT_PERMITTED/
  );

  assert.throws(
    () => exportPP04DemoEvidence(
      result,
      validator,
      {
        disclosure: "restricted",
        channel: "browser",
        restrictedAcknowledged: true
      }
    ),
    /PP04_EXPORT_NOT_PERMITTED/
  );

  const outcome = exportPP04DemoEvidence(
    result,
    validator,
    {
      disclosure: "restricted",
      channel: "local-cli",
      restrictedAcknowledged: true
    }
  );

  assert.equal(
    outcome.portableExport.disclosure,
    "restricted"
  );

  assert.ok(outcome.portableExport.manifest);

  assert.equal(
    validator.validateManifest(
      outcome.portableExport.manifest
    ).valid,
    true
  );

  assert.equal(
    verifyExportDigest(outcome.portableExport),
    true
  );
});

test("PP-04-B rejects exports for conflicting evidence", async () => {
  for (const scenarioId of [
    "binding-conflict",
    "unsupported-assurance"
  ] as const) {
    const result = await runProofPathDemo(
      { scenarioId, sourceMode: "fixture" },
      dependencies
    );

    for (const disclosure of [
      "public",
      "restricted"
    ] as const) {
      assert.throws(
        () => exportPP04DemoEvidence(
          result,
          validator,
          {
            disclosure,
            channel: "local-cli",
            restrictedAcknowledged: true
          }
        ),
        /PP04_EXPORT_NOT_PERMITTED/
      );
    }
  }
});

test("PP-04-B export digest detects tampering", async () => {
  const result = await runProofPathDemo(
    {
      scenarioId: "consistent",
      sourceMode: "fixture"
    },
    dependencies
  );

  for (const disclosure of [
    "public",
    "restricted"
  ] as const) {
    const exported = exportPP04DemoEvidence(
      result,
      validator,
      {
        disclosure,
        channel: "local-cli",
        restrictedAcknowledged: true
      }
    ).portableExport;

    assert.equal(verifyExportDigest(exported), true);

    const tampered = structuredClone(exported);

    tampered.verificationNotice += " altered";

    assert.equal(
      verifyExportDigest(tampered),
      false
    );
  }
});

test("PP-04-B CLI preserves scenario acceptance", () => {
  for (const scenario of EXPECTED) {
    const call = runCli([
      "--scenario",
      scenario.id
    ]);

    assert.equal(call.status, 0);
    assert.match(
      call.stdout,
      /DEMO_ACCEPTANCE_PASS=true/
    );

    assert.match(
      call.stdout,
      /TRANSACTION_VERIFIED=false/
    );

    assert.match(
      call.stdout,
      /SELLER_STATUS=indeterminate/
    );

    assert.match(
      call.stdout,
      new RegExp(
        "COMPOSITION_STATUS=" + scenario.status
      )
    );
  }
});

test("PP-04-B CLI export enforces exclusive creation", () => {
  const temporary = mkdtempSync(
    join(tmpdir(), "pp04-regression-")
  );

  try {
    const output = join(
      temporary,
      "public-evidence.json"
    );

    const args = [
      "--scenario", "consistent",
      "--export", "public",
      "--output", output
    ];

    const first = runCli(args);

    assert.equal(first.status, 0);
    assert.equal(existsSync(output), true);

    const exported = JSON.parse(
      readFileSync(output, "utf8")
    );

    assert.equal(exported.disclosure, "public");
    assert.equal(exported.manifest, null);
    assert.equal(verifyExportDigest(exported), true);

    const originalBytes = readFileSync(output);

    const second = runCli(args);

    assert.equal(second.status, 1);
    assert.deepEqual(
      readFileSync(output),
      originalBytes
    );

    assert.doesNotMatch(
      second.stdout,
      /EXPORT_FILE_CREATED=true/
    );
  } finally {
    rmSync(temporary, {
      recursive: true,
      force: true
    });
  }
});

test("PP-04-B CLI never creates a rejected export", () => {
  const temporary = mkdtempSync(
    join(tmpdir(), "pp04-rejected-")
  );

  try {
    for (const scenarioId of [
      "binding-conflict",
      "unsupported-assurance"
    ] as const) {
      const output = join(
        temporary,
        `${scenarioId}.json`
      );

      const call = runCli([
        "--scenario", scenarioId,
        "--export", "public",
        "--output", output
      ]);

      assert.equal(call.status, 1);
      assert.equal(existsSync(output), false);
    }
  } finally {
    rmSync(temporary, {
      recursive: true,
      force: true
    });
  }
});

test("PP-04-B CLI blocks unacknowledged restricted export", () => {
  const temporary = mkdtempSync(
    join(tmpdir(), "pp04-unacknowledged-")
  );

  try {
    const output = join(
      temporary,
      "restricted.json"
    );

    const call = runCli([
      "--scenario", "consistent",
      "--export", "restricted",
      "--output", output
    ]);

    assert.equal(call.status, 2);
    assert.equal(existsSync(output), false);
  } finally {
    rmSync(temporary, {
      recursive: true,
      force: true
    });
  }
});

test("PP-04-B refuses unsupported source execution", async () => {
  const result = await runProofPathDemo(
    {
      scenarioId: "consistent" as PP04ScenarioId,
      sourceMode: "testnet"
    },
    dependencies
  );

  assert.equal(result.execution.completed, false);
  assert.equal(result.composition, null);
});
