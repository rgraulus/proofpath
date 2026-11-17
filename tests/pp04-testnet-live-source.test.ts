/**
 * ProofPath PP-04-C / C-08C Gate A: offline fixtures only.
 * No fetch calls, transport callbacks, sockets, servers or payments.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  C08C_SEARCH_ENDPOINT,
  C08C_MAX_RESPONSE_BYTES,
  C08C_SEARCH_LIMIT,
  buildC08CSearchUrl,
  acquireC08CSearchObservation
} from "../src/application/pp04/testnetLiveSource.js";
import {
  runC08COfflineObservation,
  runC08CLiveObservation
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
