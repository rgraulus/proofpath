
/**
 * ProofPath PP-04-B — Local Browser Demo Server.
 *
 * Fixture-only, loopback-only, read-only demonstration.
 *
 * The API intentionally exposes a diagnostic summary,
 * not raw evidence, JWS values, trusted policies,
 * transaction manifests or restricted export packages.
 *
 * Portable exports will be integrated separately after
 * their disclosure and access controls are validated.
 */

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runProofPathDemo
} from "../../src/application/pp04/orchestrator.js";

import {
  loadPP04CanonicalScenario
} from "../../src/application/pp04/fixtures.js";

import {
  createPP04TrustedValidator
} from "../../src/application/pp04/trustedConfig.js";

import type {
  PP04ScenarioId
} from "../../src/application/pp04/contracts.js";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 4174;

const SCENARIOS: readonly PP04ScenarioId[] = [
  "consistent",
  "missing-evidence",
  "binding-conflict",
  "unsupported-assurance"
];

const VIEWER_DIR = resolve(
  fileURLToPath(new URL("./viewer/", import.meta.url))
);

const STATIC_ROUTES: Readonly<
  Record<string, { file: string; contentType: string }>
> = {
  "/": {
    file: "index.html",
    contentType: "text/html; charset=utf-8"
  },
  "/app.js": {
    file: "app.js",
    contentType: "text/javascript; charset=utf-8"
  },
  "/style.css": {
    file: "style.css",
    contentType: "text/css; charset=utf-8"
  }
};

function validScenario(
  value: string | null
): value is PP04ScenarioId {
  return value !== null &&
    SCENARIOS.some(item => item === value);
}

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  data: unknown
): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'"
  });

  response.end(JSON.stringify(data));
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  if (!/^[0-9]+$/.test(value)) {
    throw new TypeError("Invalid PP04 demo port");
  }

  const port = Number(value);

  if (
    !Number.isSafeInteger(port) ||
    port < 1024 ||
    port > 65535
  ) {
    throw new TypeError("Invalid PP04 demo port");
  }

  return port;
}

async function main(): Promise<void> {
  const repositoryRoot = process.cwd();
  const port = parsePort(process.env.PP04_DEMO_PORT);

  const dependencies = {
    validator: createPP04TrustedValidator(
      repositoryRoot
    ),

    async loadScenario() {
      return loadPP04CanonicalScenario(
        repositoryRoot
      );
    }
  };

  const server = createServer(
    async (request, response) => {
      const method = request.method ?? "";

      if (method !== "GET" && method !== "HEAD") {
        sendJson(response, 405, {
          error: "method_not_allowed"
        });
        return;
      }

      const url = new URL(
        request.url ?? "/",
        `http://${HOST}:${port}`
      );

      if (url.pathname === "/healthz") {
        sendJson(response, 200, {
          ok: true,
          component: "proofpath-pp04-browser",
          sourceMode: "fixture",
          testnetExecutionEnabled: false
        });
        return;
      }

      if (url.pathname === "/api/scenario") {
        if (method !== "GET") {
          sendJson(response, 405, {
            error: "method_not_allowed"
          });
          return;
        }

        const scenarioId = url.searchParams.get(
          "scenario"
        );

        if (
          url.searchParams.size !== 1 ||
          !validScenario(scenarioId)
        ) {
          sendJson(response, 400, {
            error: "invalid_scenario"
          });
          return;
        }

        try {
          const result = await runProofPathDemo(
            {
              scenarioId,
              sourceMode: "fixture"
            },
            dependencies
          );

          if (
            !result.execution.completed ||
            result.composition === null
          ) {
            sendJson(response, 500, {
              error: "demo_execution_failed"
            });
            return;
          }

          const composition = result.composition;

          // Explicit response allowlist. No manifest,
          // source payload, receipt JWS, account, signing
          // key, policy or raw evidence records.
          sendJson(response, 200, {
            scenarioId,
            sourceMode: "fixture",
            executionCompleted: true,
            compositionStatus: composition.status,
            manifestPresent:
              composition.manifest !== null,
            assessments: {
              receipt:
                result.sourceAssessments.receipt?.status
                  ?? "unavailable",
              settlement:
                result.sourceAssessments.settlement?.status
                  ?? "unavailable",
              agentAuthority:
                result.sourceAssessments.agentAuthority?.status
                  ?? "unavailable",
              seller:
                result.sourceAssessments.seller?.status
                  ?? "unavailable"
            },
            diagnosticCodes: [
              ...new Set(
                composition.diagnostics.reasons.map(
                  reason => reason.code
                )
              )
            ].sort(),
            adversarialCompositionInput:
              scenarioId === "binding-conflict" ||
              scenarioId === "unsupported-assurance",
            transactionVerified: false,
            syntheticSourceAuthentication: false,
            disclosure: "diagnostic_summary_only"
          });
        } catch {
          sendJson(response, 500, {
            error: "demo_execution_failed"
          });
        }

        return;
      }

      // No generic filesystem serving or arbitrary paths.
      const route = STATIC_ROUTES[url.pathname];

      if (route === undefined) {
        sendJson(response, 404, {
          error: "not_found"
        });
        return;
      }

      try {
        const file = readFileSync(
          resolve(VIEWER_DIR, route.file)
        );

        response.writeHead(200, {
          "Content-Type": route.contentType,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Content-Security-Policy":
            "default-src 'none'; " +
            "script-src 'self'; " +
            "style-src 'self'; " +
            "connect-src 'self'; " +
            "base-uri 'none'; " +
            "form-action 'none'; " +
            "frame-ancestors 'none'"
        });

        response.end(
          method === "HEAD" ? undefined : file
        );
      } catch {
        sendJson(response, 404, {
          error: "viewer_not_installed"
        });
      }
    }
  );

  // Server errors must fail closed without a stack dump
  // that could inadvertently reveal local source details.
  server.on("error", () => {
    console.error("PP04_SERVER_START_FAILED");
    process.exitCode = 1;
  });

  server.listen(port, HOST, () => {
    console.log(
      "PP04_SERVER_READY=true"
    );
    console.log(
      `PP04_SERVER_URL=http://${HOST}:${port}`
    );
    console.log(
      "PP04_FIXTURE_ONLY=true"
    );
    console.log(
      "PP04_TESTNET_EXECUTION_ENABLED=false"
    );
    console.log(
      "PP04_RESTRICTED_EXPORT_ENABLED=false"
    );
  });
}

await main();
