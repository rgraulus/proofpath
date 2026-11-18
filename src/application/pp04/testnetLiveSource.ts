/**
 * ProofPath PP-04-C / C-08C.
 *
 * Controlled, read-only CRP payment-search acquisition.
 *
 * Gate A permits injected offline transport testing only.
 * Gate B operational connectivity is separately authorized.
 *
 * No import-time I/O, wallet interaction, payment mutation,
 * trust approval, or independent settlement verification.
 */

import * as http from "node:http";

import type {
  C08BExpectedCrpPayment
} from "./testnetSource.js";

export const C08C_SEARCH_ENDPOINT =
  "http://127.0.0.1:8080/v1/crp/payments/search";

export const C08C_MAX_RESPONSE_BYTES = 65536;
export const C08C_CONNECT_TIMEOUT_MS = 2000;
export const C08C_TOTAL_TIMEOUT_MS = 5000;
export const C08C_SEARCH_LIMIT = 100;

/**
 * Remains false throughout Gate A.
 * No caller-supplied flag may override this prohibition.
 */
const C08C_GATE_B_LIVE_ENABLED = false;

export type C08CSourceMode =
  | "offline_mock"
  | "controlled_live";

export interface C08CSearchInput {
  readonly mode: C08CSourceMode;
  readonly expected: C08BExpectedCrpPayment;
  readonly endpoint: string;
  readonly response: Response;
}

export type C08CSourceResult =
  | {
      readonly status: "blocked";
      readonly reasonCode:
        | "live_not_authorized"
        | "invalid_source_configuration";
      readonly response: null;
    }
  | {
      readonly status: "unavailable";
      readonly reasonCode:
        | "transport_failed"
        | "invalid_http_response";
      readonly response: null;
    }
  | {
      readonly status: "observed";
      readonly reasonCode: "bounded_search_response";
      readonly response: unknown;
      readonly sourceAuthenticated: false;
      readonly settlementIndependentlyVerified: false;
    };

function nonempty(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function validExpected(
  expected: C08BExpectedCrpPayment
): boolean {
  return Boolean(
    expected &&
    nonempty(expected.merchantId) &&
    nonempty(expected.nonce) &&
    expected.network === "concordium:testnet" &&
    nonempty(expected.amount) &&
    nonempty(expected.payTo) &&
    expected.asset &&
    expected.asset.type === "PLT" &&
    nonempty(expected.asset.tokenId) &&
    expected.asset.decimals === 6
  );
}

function validEndpoint(endpoint: string): boolean {
  if (endpoint !== C08C_SEARCH_ENDPOINT) {
    return false;
  }

  try {
    const url = new URL(endpoint);

    return url.protocol === "http:" &&
      url.hostname === "127.0.0.1" &&
      url.port === "8080" &&
      url.pathname === "/v1/crp/payments/search" &&
      url.search === "" &&
      url.hash === "" &&
      url.username === "" &&
      url.password === "";
  } catch {
    return false;
  }
}

/**
 * The server filters merchantId, network, tokenId and payTo.
 * It does not expose nonce or amount query filters.
 *
 * C-08B performs exact local tuple correlation afterward.
 */
export function buildC08CSearchUrl(
  expected: C08BExpectedCrpPayment,
  endpoint: string
): string | null {
  if (!validExpected(expected) ||
      !validEndpoint(endpoint)) {
    return null;
  }

  const url = new URL(endpoint);

  url.searchParams.set("merchantId", expected.merchantId);
  url.searchParams.set("network", expected.network);
  url.searchParams.set("tokenId", expected.asset.tokenId);
  url.searchParams.set("payTo", expected.payTo);
  url.searchParams.set(
    "limit",
    String(C08C_SEARCH_LIMIT)
  );

  return url.toString();
}

/**
 * Read a response incrementally and reject oversized data.
 * No raw response or JWS is logged.
 */
async function readBoundedJson(
  response: Response
): Promise<unknown> {
  if (response.status !== 200 ||
      response.redirected ||
      !response.ok) {
    throw new Error("invalid_http_status");
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new Error("invalid_content_type");
  }

  const declared = response.headers.get("content-length");

  if (declared !== null) {
    const size = Number(declared);

    if (!Number.isSafeInteger(size) ||
        size < 0 ||
        size > C08C_MAX_RESPONSE_BYTES) {
      throw new Error("response_too_large");
    }
  }

  if (!response.body) {
    throw new Error("missing_response_body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const part = await reader.read();

      if (part.done) {
        break;
      }

      total += part.value.byteLength;

      if (total > C08C_MAX_RESPONSE_BYTES) {
        throw new Error("response_too_large");
      }

      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(buffer)
  ) as unknown;
}

/**
 * Gate A consumes a preconstructed Response fixture, not an
 * executable transport callback. This function cannot open a socket.
 * Fixture provenance is a responsibility of the offline harness.
 *
 * Live mode is hard-disabled independently of caller inputs.
 */
export async function acquireC08CSearchObservation(
  input: C08CSearchInput
): Promise<C08CSourceResult> {
  if (input?.mode === "controlled_live" &&
      !C08C_GATE_B_LIVE_ENABLED) {
    return {
      status: "blocked",
      reasonCode: "live_not_authorized",
      response: null
    };
  }

  if (!input ||
      (input.mode !== "offline_mock" &&
        input.mode !== "controlled_live") ||
      !(input.response instanceof Response)) {
    return {
      status: "blocked",
      reasonCode: "invalid_source_configuration",
      response: null
    };
  }

  const requestUrl = buildC08CSearchUrl(
    input.expected,
    input.endpoint
  );

  if (!requestUrl) {
    return {
      status: "blocked",
      reasonCode: "invalid_source_configuration",
      response: null
    };
  }

  // Gate A consumes an already-constructed response fixture.
  // No callback, fetch, URL request, or network transport is invoked.
  void requestUrl;

  try {
    const body = await readBoundedJson(input.response);

    return {
      status: "observed",
      reasonCode: "bounded_search_response",
      response: body,
      sourceAuthenticated: false,
      settlementIndependentlyVerified: false
    };
  } catch {
    return {
      status: "unavailable",
      reasonCode: "transport_failed",
      response: null
    };
  }
}

/**
 * Gate B operational activation remains default-denied.
 * Both exact-value flags must be explicitly configured.
 *
 * Loopback confirmation is an operational assertion,
 * not proof of the Facilitator's actual bind address.
 */
function gateBLiveAuthorized(): boolean {
  return process.env.PROOFPATH_C08C_GATE_B_LIVE_ENABLED === "true" &&
    process.env.PROOFPATH_C08C_GATE_B_LOOPBACK_CONFIRMED === "true";
}

/**
 * Single-request, read-only native HTTP acquisition.
 *
 * Fixed numeric loopback host and port, GET only.
 * No arbitrary destination, proxy, redirect following,
 * cookies, authorization headers, retries or writes.
 */
function fetchBoundedC08CSearch(
  target: string
): Promise<Response> {
  return new Promise((resolve, reject) => {
    let url: URL;

    try {
      url = new URL(target);
    } catch {
      reject(new Error("invalid_destination"));
      return;
    }

    if (url.protocol !== "http:" ||
        url.hostname !== "127.0.0.1" ||
        url.port !== "8080" ||
        url.pathname !== "/v1/crp/payments/search" ||
        url.username !== "" ||
        url.password !== "" ||
        url.hash !== "") {
      reject(new Error("invalid_destination"));
      return;
    }

    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    let request: http.ClientRequest | undefined;
    let connectTimer: NodeJS.Timeout | undefined;
    let totalTimer: NodeJS.Timeout | undefined;

    function finish(error?: Error, response?: Response): void {
      if (settled) return;
      settled = true;

      if (connectTimer) clearTimeout(connectTimer);
      if (totalTimer) clearTimeout(totalTimer);

      if (error) {
        request?.destroy();
        reject(error);
        return;
      }

      if (!response) {
        request?.destroy();
        reject(new Error("missing_response"));
        return;
      }

      resolve(response);
    }

    try {
      request = http.request({
        protocol: "http:",
        hostname: "127.0.0.1",
        port: 8080,
        path: url.pathname + url.search,
        method: "GET",
        agent: false,
        maxHeaderSize: 8192,
        headers: {
          accept: "application/json",
          "accept-encoding": "identity",
          connection: "close"
        }
      }, incoming => {
        if (incoming.statusCode !== 200) {
          finish(new Error("invalid_http_status"));
          return;
        }

        const contentType = incoming.headers["content-type"];

        if (typeof contentType !== "string" ||
            !/^application\/json(?:\s*;|$)/i.test(contentType)) {
          finish(new Error("invalid_content_type"));
          return;
        }

        const encoding = incoming.headers["content-encoding"];

        if (encoding !== undefined && encoding !== "identity") {
          finish(new Error("unsupported_encoding"));
          return;
        }

        const declared = incoming.headers["content-length"];

        if (declared !== undefined &&
            (typeof declared !== "string" ||
             !/^\d+$/.test(declared) ||
             !Number.isSafeInteger(Number(declared)) ||
             Number(declared) > C08C_MAX_RESPONSE_BYTES)) {
          finish(new Error("invalid_content_length"));
          return;
        }

        incoming.on("data", (chunk: Buffer) => {
          if (settled) return;

          total += chunk.byteLength;

          if (total > C08C_MAX_RESPONSE_BYTES) {
            finish(new Error("response_too_large"));
            return;
          }

          chunks.push(chunk);
        });

        incoming.on("aborted", () => {
          finish(new Error("response_aborted"));
        });

        incoming.on("error", () => {
          finish(new Error("response_failed"));
        });

        incoming.on("end", () => {
          if (settled) return;

          if (declared !== undefined &&
              Number(declared) !== total) {
            finish(new Error("content_length_mismatch"));
            return;
          }

          try {
            const bytes = new Uint8Array(
              Buffer.concat(chunks, total)
            );

            finish(undefined, new Response(bytes, {
              status: 200,
              headers: { "content-type": contentType }
            }));
          } catch {
            finish(new Error("response_construction_failed"));
          }
        });
      });

      request.on("socket", socket => {
        if (!socket.connecting) {
          if (connectTimer) clearTimeout(connectTimer);
        } else {
          socket.once("connect", () => {
            if (connectTimer) clearTimeout(connectTimer);
          });
        }
      });

      request.on("error", () => {
        finish(new Error("http_transport_failed"));
      });

      request.setTimeout(C08C_CONNECT_TIMEOUT_MS, () => {
        finish(new Error("http_socket_timeout"));
      });

      connectTimer = setTimeout(() => {
        finish(new Error("http_connect_timeout"));
      }, C08C_CONNECT_TIMEOUT_MS);

      totalTimer = setTimeout(() => {
        finish(new Error("http_total_deadline"));
      }, C08C_TOTAL_TIMEOUT_MS);

      request.end();
    } catch {
      finish(new Error("http_request_failed"));
    }
  });
}

/**
 * Separately gated Gate B acquisition.
 *
 * Does not accept user-supplied URLs, methods, transports,
 * request headers or response fixtures.
 *
 * A successful observation provides no authenticated-source
 * or independently verified settlement assurance.
 */
export async function acquireC08CControlledLiveObservation(
  expected: C08BExpectedCrpPayment
): Promise<C08CSourceResult> {
  if (!gateBLiveAuthorized()) {
    return {
      status: "blocked",
      reasonCode: "live_not_authorized",
      response: null
    };
  }

  const target = buildC08CSearchUrl(
    expected,
    C08C_SEARCH_ENDPOINT
  );

  if (!target) {
    return {
      status: "blocked",
      reasonCode: "invalid_source_configuration",
      response: null
    };
  }

  try {
    const response = await fetchBoundedC08CSearch(target);
    const body = await readBoundedJson(response);

    return {
      status: "observed",
      reasonCode: "bounded_search_response",
      response: body,
      sourceAuthenticated: false,
      settlementIndependentlyVerified: false
    };
  } catch {
    return {
      status: "unavailable",
      reasonCode: "transport_failed",
      response: null
    };
  }
}
