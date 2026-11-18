/**
 * ProofPath PP-04-C / C-08C Gate A: offline fixtures only.
 * No fetch calls, transport callbacks, sockets, servers or payments.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { Socket } from "node:net";
import { mock } from "node:test";
import {
  C08C_SEARCH_ENDPOINT,
  C08C_MAX_RESPONSE_BYTES,
  C08C_SEARCH_LIMIT,
  buildC08CSearchUrl,
  acquireC08CSearchObservation,
  acquireC08CControlledLiveObservation
} from "../src/application/pp04/testnetLiveSource.js";
import {
  runC08COfflineObservation,
  runC08CLiveObservation,
  runC08CGateBControlledObservation
} from "../src/application/pp04/testnetLiveRunner.js";
import type {
  C08BExpectedCrpPayment
} from "../src/application/pp04/testnetSource.js";

const expected: C08BExpectedCrpPayment = {
  merchantId: "demo-merchant",
  nonce: "c08c-offline-test-nonce",
  network: "concordium:testnet",
  asset: { type: "PLT", tokenId: "EUDemo", decimals: 6 },
  amount: "0.050101",
  payTo: "c08c-test-recipient"
};
const jws = "header.payload.signature";

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    merchant_id: expected.merchantId,
    nonce: expected.nonce,
    network: expected.network,
    asset: { ...expected.asset },
    amount: expected.amount,
    pay_to: expected.payTo,
    status: "fulfilled",
    receipt: { jws, payload: {} },
    ...overrides
  };
}
function searchResponse(matches: unknown[] = [challenge()]) {
  return { ok: true, filters: {}, matches };
}
function jsonResponse(
  body: unknown,
  options: {
    status?: number;
    contentType?: string;
    contentLength?: string;
  } = {}
): Response {
  const headers = new Headers({
    "content-type": options.contentType ?? "application/json"
  });
  if (options.contentLength !== undefined) {
    headers.set("content-length", options.contentLength);
  }
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    headers
  });
}
function input(response: Response) {
  return {
    mode: "offline_mock" as const,
    expected,
    endpoint: C08C_SEARCH_ENDPOINT,
    response
  };
}
function run(response: Response) {
  return runC08COfflineObservation({ expected, response });
}

test("builds a fixed GET search target with supported filters", () => {
  const target = buildC08CSearchUrl(expected, C08C_SEARCH_ENDPOINT);
  assert.ok(target);
  const url = new URL(target);
  assert.equal(url.origin, "http://127.0.0.1:8080");
  assert.equal(url.pathname, "/v1/crp/payments/search");
  assert.equal(url.searchParams.get("merchantId"), expected.merchantId);
  assert.equal(url.searchParams.get("network"), expected.network);
  assert.equal(url.searchParams.get("tokenId"), expected.asset.tokenId);
  assert.equal(url.searchParams.get("payTo"), expected.payTo);
  assert.equal(url.searchParams.get("limit"), String(C08C_SEARCH_LIMIT));
  assert.equal(url.searchParams.has("nonce"), false);
  assert.equal(url.searchParams.has("amount"), false);
});
test("rejects non-allowlisted hosts and ports", () => {
  for (const endpoint of [
    "http://localhost:8080/v1/crp/payments/search",
    "http://127.0.0.1:8081/v1/crp/payments/search",
    "https://example.org/v1/crp/payments/search",
    "http://127.0.0.1:8080/v1/crp/payments/fulfill",
    "http://127.0.0.1:8080/v1/crp/payments/search?x=1"
  ]) {
    assert.equal(buildC08CSearchUrl(expected, endpoint), null);
  }
});
test("rejects Mainnet payment expectations", () => {
  assert.equal(buildC08CSearchUrl(
    { ...expected, network: "concordium:mainnet" },
    C08C_SEARCH_ENDPOINT
  ), null);
});
test("rejects unsupported asset decimals", () => {
  assert.equal(buildC08CSearchUrl(
    { ...expected, asset: { ...expected.asset, decimals: 7 } },
    C08C_SEARCH_ENDPOINT
  ), null);
});
test("hard-blocks controlled_live before consuming any fixture", async () => {
  const result = await acquireC08CSearchObservation({
    ...input(jsonResponse(searchResponse())), mode: "controlled_live"
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.reasonCode, "live_not_authorized");
});
test("rejects an invalid endpoint before reading the fixture", async () => {
  const result = await acquireC08CSearchObservation({
    ...input(jsonResponse(searchResponse())),
    endpoint: "http://127.0.0.1:8080/v1/crp/payments/fulfill"
  });
  assert.equal(result.status, "blocked");
});
test("does not require or invoke global fetch", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("network_must_not_run");
  }) as typeof fetch;
  try {
    const result = await acquireC08CSearchObservation(
      input(jsonResponse(searchResponse()))
    );
    assert.equal(result.status, "observed");
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("preserves untrusted source and settlement flags", async () => {
  const result = await acquireC08CSearchObservation(
    input(jsonResponse(searchResponse()))
  );
  assert.equal(result.status, "observed");
  if (result.status === "observed") {
    assert.equal(result.sourceAuthenticated, false);
    assert.equal(result.settlementIndependentlyVerified, false);
  }
});
test("treats HTTP failure as unavailable", async () => {
  const result = await acquireC08CSearchObservation(
    input(jsonResponse({ error: "not_found" }, { status: 404 }))
  );
  assert.equal(result.status, "unavailable");
  assert.equal(result.response, null);
});
test("rejects a simulated redirect response", async () => {
  const response = new Response(null, {
    status: 302,
    headers: { location: "https://example.org/" }
  });
  const result = await acquireC08CSearchObservation(input(response));
  assert.equal(result.status, "unavailable");
});
test("rejects unsupported content type", async () => {
  const result = await acquireC08CSearchObservation(
    input(jsonResponse(searchResponse(), { contentType: "text/plain" }))
  );
  assert.equal(result.status, "unavailable");
});
test("rejects oversized declared content length", async () => {
  const result = await acquireC08CSearchObservation(
    input(jsonResponse(searchResponse(), {
      contentLength: String(C08C_MAX_RESPONSE_BYTES + 1)
    }))
  );
  assert.equal(result.status, "unavailable");
});
test("rejects oversized streamed body", async () => {
  const oversized = "x".repeat(C08C_MAX_RESPONSE_BYTES + 1);
  const result = await acquireC08CSearchObservation(
    input(jsonResponse({ data: oversized }))
  );
  assert.equal(result.status, "unavailable");
});
test("rejects malformed JSON without leaking content", async () => {
  const response = new Response("{not-json", {
    status: 200,
    headers: { "content-type": "application/json" }
  });
  const result = await acquireC08CSearchObservation(input(response));
  assert.equal(result.status, "unavailable");
  assert.equal(result.response, null);
});
test("rejects missing HTTP response body", async () => {
  const response = new Response(null, {
    status: 200,
    headers: { "content-type": "application/json" }
  });
  const result = await acquireC08CSearchObservation(input(response));
  assert.equal(result.status, "unavailable");
});
test("blocks non-Response dependencies", async () => {
  const result = await acquireC08CSearchObservation({
    ...input(jsonResponse(searchResponse())),
    response: null as unknown as Response
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.reasonCode, "invalid_source_configuration");
});
test("runner reports candidate without exposing JWS", async () => {
  const result = await run(jsonResponse(searchResponse()));
  assert.equal(result.status, "candidate");
  assert.equal(result.receiptAuthenticated, false);
  assert.equal(result.sourceAuthenticated, false);
  assert.equal(result.settlementIndependentlyVerified, false);
  assert.equal(JSON.stringify(result).includes(jws), false);
});
test("runner preserves missing challenge as unavailable", async () => {
  const result = await run(jsonResponse(searchResponse([])));
  assert.equal(result.status, "unavailable");
  assert.equal(result.reasonCode, "challenge_not_found");
});
test("runner preserves pending receipt as unavailable", async () => {
  const result = await run(jsonResponse(searchResponse([
    challenge({ status: "pending", receipt: null })
  ])));
  assert.equal(result.status, "unavailable");
  assert.equal(result.reasonCode, "receipt_not_available");
});
test("runner rejects duplicate matching challenges", async () => {
  const result = await run(jsonResponse(searchResponse([
    challenge(), challenge()
  ])));
  assert.equal(result.status, "rejected");
  assert.equal(result.reasonCode, "ambiguous_challenge_records");
});
test("runner does not accept mismatched amount", async () => {
  const result = await run(jsonResponse(searchResponse([
    challenge({ amount: "9.999999" })
  ])));
  assert.equal(result.status, "unavailable");
  assert.equal(result.reasonCode, "challenge_not_found");
});
test("runner rejects malformed candidate JWS", async () => {
  const result = await run(jsonResponse(searchResponse([
    challenge({ receipt: { jws: "not-a-compact-jws" } })
  ])));
  assert.equal(result.status, "rejected");
  assert.equal(result.reasonCode, "invalid_receipt_shape");
});
test("runner rejects malformed response envelopes", async () => {
  const result = await run(jsonResponse({ ok: true, matches: "invalid" }));
  assert.equal(result.status, "rejected");
  assert.equal(result.reasonCode, "invalid_search_response");
});
test("runner blocks missing dependencies", async () => {
  const result = await runC08COfflineObservation(
    null as unknown as Parameters<typeof runC08COfflineObservation>[0]
  );
  assert.equal(result.status, "blocked");
  assert.equal(result.reasonCode, "invalid_offline_dependencies");
});
test("runner blocks non-Response fixture", async () => {
  const result = await runC08COfflineObservation({
    expected,
    response: null as unknown as Response
  });
  assert.equal(result.status, "blocked");
});
test("operational runner remains prohibited", () => {
  assert.throws(
    () => runC08CLiveObservation(),
    /c08c_gate_b_live_not_authorized/
  );
});


/**
 * C-08C Gate B transport tests.
 *
 * Every authorized request is intercepted in memory.
 * Socket.connect is separately blocked as defense in depth.
 *
 * Operational flags are isolated to the test process and
 * restored after each scenario.
 */
const gateBRequire = createRequire(import.meta.url);
const gateBHttp = gateBRequire("node:http") as typeof import("node:http");

type GateBScenario = {
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly event?: "error" | "aborted" | "timeout" | "hang";
};

async function withGateBMock<T>(
  scenario: GateBScenario,
  action: (capture: {
    requests: () => number;
    sockets: () => number;
    options: () => Record<string, unknown> | null;
  }) => Promise<T>,
  authorized = true
): Promise<T> {
  const flags = [
    "PROOFPATH_C08C_GATE_B_LIVE_ENABLED",
    "PROOFPATH_C08C_GATE_B_LOOPBACK_CONFIRMED"
  ];

  const previous = flags.map(name => process.env[name]);

  let requestCount = 0;
  let socketCount = 0;
  let requestOptions: Record<string, unknown> | null = null;

  try {
    for (const name of flags) {
      delete process.env[name];
    }

    mock.method(Socket.prototype, "connect", function () {
      socketCount++;
      throw new Error("real_socket_forbidden");
    });

    mock.method(
      gateBHttp,
      "request",
      (options: Record<string, unknown>,
       onResponse: (incoming: EventEmitter & {
         statusCode?: number;
         headers?: Record<string, string>;
       }) => void) => {
        requestCount++;
        requestOptions = options;

        const request = new EventEmitter() as EventEmitter & {
          end: () => unknown;
          destroy: () => unknown;
          setTimeout: (
            ms: number,
            callback: () => void
          ) => unknown;
        };

        let timeoutCallback: (() => void) | undefined;

        request.setTimeout = (_ms, callback) => {
          timeoutCallback = callback;
          return request;
        };

        request.destroy = () => request;

        request.end = () => {
          queueMicrotask(() => {
            if (scenario.event === "hang") {
              // Model an established TCP connection whose
              // HTTP response then hangs indefinitely.
              // This clears only the connection deadline.
              const socket = new EventEmitter() as
                EventEmitter & { connecting: boolean };

              socket.connecting = false;
              request.emit("socket", socket);
              return;
            }

            if (scenario.event === "error") {
              request.emit("error", new Error("synthetic_transport_error"));
              return;
            }

            if (scenario.event === "timeout") {
              timeoutCallback?.();
              return;
            }

            const incoming = new EventEmitter() as EventEmitter & {
              statusCode?: number;
              headers?: Record<string, string>;
            };

            incoming.statusCode = scenario.status ?? 200;
            incoming.headers = scenario.headers ?? {
              "content-type": "application/json"
            };

            onResponse(incoming);

            if (scenario.event === "aborted") {
              incoming.emit("aborted");
              return;
            }

            if (scenario.body !== undefined) {
              incoming.emit("data", Buffer.from(scenario.body));
            }

            incoming.emit("end");
          });

          return request;
        };

        return request;
      }
    );

    syncBuiltinESMExports();

    if (authorized) {
      for (const name of flags) {
        process.env[name] = "true";
      }
    }

    return await action({
      requests: () => requestCount,
      sockets: () => socketCount,
      options: () => requestOptions
    });
  } finally {
    for (let i = 0; i < flags.length; i++) {
      const name = flags[i]!;
      const value = previous[i];

      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }

    mock.restoreAll();
    syncBuiltinESMExports();
  }
}

test("Gate B: default-denied before HTTP acquisition", async () => {
  await withGateBMock({}, async capture => {
    const result = await acquireC08CControlledLiveObservation(expected);

    assert.equal(result.status, "blocked");
    assert.equal(result.reasonCode, "live_not_authorized");
    assert.equal(capture.requests(), 0);
    assert.equal(capture.sockets(), 0);
  }, false);
});

test("Gate B: fixed GET, supported filters, synthetic success", async () => {
  await withGateBMock({
    body: JSON.stringify(searchResponse([]))
  }, async capture => {
    const result = await acquireC08CControlledLiveObservation(expected);

    assert.equal(result.status, "observed");
    assert.equal(capture.requests(), 1);
    assert.equal(capture.sockets(), 0);

    if (result.status === "observed") {
      assert.equal(result.sourceAuthenticated, false);
      assert.equal(result.settlementIndependentlyVerified, false);
    }

    const options = capture.options();
    assert.ok(options);

    assert.equal(options.method, "GET");
    assert.equal(options.hostname, "127.0.0.1");
    assert.equal(options.port, 8080);
    assert.equal(options.agent, false);

    const path = String(options.path);
    const url = new URL("http://127.0.0.1:8080" + path);

    assert.equal(url.pathname, "/v1/crp/payments/search");
    assert.equal(url.searchParams.get("merchantId"), expected.merchantId);
    assert.equal(url.searchParams.get("network"), expected.network);
    assert.equal(url.searchParams.get("tokenId"), expected.asset.tokenId);
    assert.equal(url.searchParams.get("payTo"), expected.payTo);
    assert.equal(url.searchParams.get("limit"), "100");
    assert.equal(url.searchParams.has("nonce"), false);
    assert.equal(url.searchParams.has("amount"), false);

    const headers = options.headers as Record<string, string>;
    assert.equal(headers["accept-encoding"], "identity");
    assert.equal(headers.authorization, undefined);
    assert.equal(headers.cookie, undefined);
  });
});

test("Gate B: invalid expected tuple never reaches HTTP", async () => {
  await withGateBMock({}, async capture => {
    const result = await acquireC08CControlledLiveObservation({
      ...expected,
      network: "concordium:mainnet"
    });

    assert.equal(result.status, "blocked");
    assert.equal(result.reasonCode, "invalid_source_configuration");
    assert.equal(capture.requests(), 0);
    assert.equal(capture.sockets(), 0);
  });
});

test("Gate B: candidate stays sanitized and untrusted", async () => {
  await withGateBMock({
    body: JSON.stringify(searchResponse())
  }, async capture => {
    const result = await runC08CGateBControlledObservation(expected);

    assert.equal(result.status, "candidate");
    assert.equal(result.sourceAuthenticated, false);
    assert.equal(result.receiptAuthenticated, false);
    assert.equal(result.settlementIndependentlyVerified, false);
    assert.equal(JSON.stringify(result).includes(jws), false);
    assert.equal(capture.requests(), 1);
    assert.equal(capture.sockets(), 0);
  });
});

const gateBFailures: ReadonlyArray<{
  name: string;
  scenario: GateBScenario;
}> = [
  {
    name: "HTTP redirect",
    scenario: { status: 302, headers: { location: "https://example.org" } }
  },
  {
    name: "HTTP authentication rejection",
    scenario: { status: 401 }
  },
  {
    name: "unsupported content type",
    scenario: { headers: { "content-type": "text/plain" } }
  },
  {
    name: "unsupported compression",
    scenario: { headers: {
      "content-type": "application/json",
      "content-encoding": "gzip"
    } }
  },
  {
    name: "oversized declared content length",
    scenario: { headers: {
      "content-type": "application/json",
      "content-length": String(C08C_MAX_RESPONSE_BYTES + 1)
    } }
  },
  {
    name: "oversized streamed response",
    scenario: { body: "x".repeat(C08C_MAX_RESPONSE_BYTES + 1) }
  },
  {
    name: "truncated declared response",
    scenario: { headers: {
      "content-type": "application/json",
      "content-length": "500"
    }, body: "{}" }
  },
  {
    name: "malformed JSON",
    scenario: { body: "{not-json" }
  },
  {
    name: "aborted response stream",
    scenario: { event: "aborted" }
  },
  {
    name: "transport failure",
    scenario: { event: "error" }
  },
  {
    name: "socket timeout",
    scenario: { event: "timeout" }
  }
];

for (const failure of gateBFailures) {
  test("Gate B: fail-closed " + failure.name, async () => {
    await withGateBMock(failure.scenario, async capture => {
      const result = await acquireC08CControlledLiveObservation(expected);

      assert.equal(result.status, "unavailable");
      assert.equal(result.reasonCode, "transport_failed");
      assert.equal(result.response, null);
      assert.equal(capture.requests(), 1);
      assert.equal(capture.sockets(), 0);
    });
  });
}

test("Gate B: hanging transport reaches total deadline", async () => {
  await withGateBMock({ event: "hang" }, async capture => {
    const started = Date.now();

    const result = await acquireC08CControlledLiveObservation(expected);

    const elapsed = Date.now() - started;

    assert.equal(result.status, "unavailable");
    assert.equal(result.reasonCode, "transport_failed");
    assert.ok(elapsed >= 4500);
    assert.ok(elapsed < 8000);
    assert.equal(capture.requests(), 1);
    assert.equal(capture.sockets(), 0);
  });
});
