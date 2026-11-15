/**
 * I2 — Offline x402 v2 payment-challenge evidence mapping (Base profile).
 *
 * This module only assesses structure and agreement with caller-controlled
 * expectations. It neither collects HTTP evidence nor authenticates sources,
 * executes payments, establishes settlement, or composes transactions.
 */
import type { ClaimAssessment, CommercialTerms, EvidenceArtifact } from "../../core/types.js";
import { canonicalJson } from "../../core/canonical.js";
import { sha256Bytes, sha256Record } from "../../core/hash.js";

const BASE = "eip155:8453";
const MAX_HEADER_CHARS = 131_072;
const MAX_DECODED_BYTES = 65_536;
const MAX_DEPTH = 32;
const UINT = /^(0|[1-9][0-9]*)$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const B64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export interface ExpectedBaseChallenge {
  /** Expected request URL, independently specified by the consuming application. */
  resourceUrl: string;
  method: "GET" | "POST";
  scheme: "exact";
  network: "eip155:8453";
  asset: string;
  amount: string;
  payTo: string;
}

export interface ChallengeObservation {
  /** Captured from an unpaid GET/POST exchange; this module does not make one. */
  httpStatus: number;
  requestUrl: string;
  requestMethod: "GET" | "POST";
  paymentRequired: string;
  /** Optional exact bytes of JSON response body, if collected. */
  responseBodyBytes?: Uint8Array;
  observedAt: string;
  collectedAt: string;
  collectorRef: string;
  /** Attribution is always claimed-only, never authenticated here. */
  producerRef?: string | null;
}

export interface ChallengeEvidenceInput {
  expected: ExpectedBaseChallenge;
  observation: ChallengeObservation;
  artifactId: string;
}

export type ChallengeEvidenceResult =
  | { status: "rejected"; reasonCode: string; artifact: null; commercialTerms: null; claim: null; termsDigestSha256: null; artifactBytes: null }
  | {
      status: "mapped_unverified";
      reasonCode: "structural_binding_match_only";
      artifact: EvidenceArtifact;
      commercialTerms: CommercialTerms;
      claim: ClaimAssessment;
      termsDigestSha256: string;
      /** Decoded original JSON bytes (not normalized/re-serialized). */
      artifactBytes: Uint8Array;
    };

type JsonRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is JsonRecord =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const rejected = (reasonCode: string): ChallengeEvidenceResult => ({
  status: "rejected", reasonCode, artifact: null,
  commercialTerms: null, claim: null, termsDigestSha256: null,
  artifactBytes: null
});

/** Scan JSON grammar before JSON.parse, including escaped duplicate object keys. */
function parseStrictObject(bytes: Uint8Array): JsonRecord {
  if (!bytes.length || bytes.length > MAX_DECODED_BYTES) throw Error("invalid_json_size");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  let pos = 0;
  const ws = () => { while (/[ \n\r\t]/.test(text[pos] ?? "") && pos < text.length) pos++; };
  function str(): string {
    if (text[pos] !== '"') throw Error("invalid_json_string");
    const start = pos++;
    while (pos < text.length) {
      const char = text[pos++];
      if (char === '"') return JSON.parse(text.slice(start, pos)) as string;
      if (char === "\\") {
        const escaped = text[pos++];
        if (!escaped || !'"\\/bfnrtu'.includes(escaped)) throw Error("invalid_json_escape");
        if (escaped === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(pos, pos + 4))) throw Error("invalid_unicode_escape");
          pos += 4;
        }
      } else if (char === undefined || char.charCodeAt(0) < 32) {
        throw Error("invalid_json_control");
      }
    }
    throw Error("unterminated_json_string");
  }
  function value(depth: number): void {
    if (depth > MAX_DEPTH) throw Error("json_depth_exceeded");
    ws();
    if (text[pos] === "{") {
      pos++; ws();
      const keys = new Set<string>();
      if (text[pos] === "}") { pos++; return; }
      while (true) {
        ws(); const key = str();
        if (keys.has(key)) throw Error("duplicate_json_key");
        keys.add(key); ws();
        if (text[pos++] !== ":") throw Error("invalid_json_colon");
        value(depth + 1); ws();
        const separator = text[pos++];
        if (separator === "}") return;
        if (separator !== ",") throw Error("invalid_json_object");
      }
    }
    if (text[pos] === "[") {
      pos++; ws();
      if (text[pos] === "]") { pos++; return; }
      while (true) {
        value(depth + 1); ws();
        const separator = text[pos++];
        if (separator === "]") return;
        if (separator !== ",") throw Error("invalid_json_array");
      }
    }
    if (text[pos] === '"') { str(); return; }
    const tail = text.slice(pos);
    const literal = /^(?:true|false|null)(?![a-zA-Z0-9])/.exec(tail);
    if (literal) { pos += literal[0].length; return; }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(tail);
    if (number) { pos += number[0].length; return; }
    throw Error("invalid_json_value");
  }
  value(0); ws();
  if (pos !== text.length) throw Error("json_trailing_content");
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed)) throw Error("json_root_not_object");
  return parsed;
}

function decodeHeader(value: string): Uint8Array {
  if (!value || value.length > MAX_HEADER_CHARS || !B64.test(value)) throw Error("invalid_base64_header");
  const bytes = Buffer.from(value, "base64");
  if (!bytes.length || bytes.length > MAX_DECODED_BYTES || bytes.toString("base64") !== value) {
    throw Error("noncanonical_base64_header");
  }
  return bytes;
}

function validUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096 || value.trim() !== value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.hash === "";
  } catch { return false; }
}

function validExpected(expected: unknown): expected is ExpectedBaseChallenge {
  return isRecord(expected) && validUrl(expected.resourceUrl) &&
    (expected.method === "GET" || expected.method === "POST") &&
    expected.scheme === "exact" && expected.network === BASE &&
    typeof expected.asset === "string" && EVM_ADDRESS.test(expected.asset) &&
    typeof expected.payTo === "string" && EVM_ADDRESS.test(expected.payTo) &&
    typeof expected.amount === "string" && UINT.test(expected.amount) && expected.amount !== "0";
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) &&
    !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString() === value;
}

function validObservation(value: unknown): value is ChallengeObservation {
  if (!isRecord(value)) return false;
  return value.httpStatus === 402 && validUrl(value.requestUrl) &&
    (value.requestMethod === "GET" || value.requestMethod === "POST") &&
    typeof value.paymentRequired === "string" &&
    validTimestamp(value.observedAt) && validTimestamp(value.collectedAt) &&
    typeof value.collectorRef === "string" && value.collectorRef.length > 0 &&
    value.collectorRef.length <= 256 &&
    (value.producerRef === undefined || value.producerRef === null ||
      (typeof value.producerRef === "string" && value.producerRef.length <= 4096)) &&
    (value.responseBodyBytes === undefined || value.responseBodyBytes instanceof Uint8Array);
}

function selectBase(challenge: JsonRecord): JsonRecord {
  if (challenge.x402Version !== 2 || !Array.isArray(challenge.accepts)) throw Error("unsupported_x402_challenge");
  const matches = challenge.accepts.filter((v: unknown) =>
    isRecord(v) && v.network === BASE && v.scheme === "exact");
  if (matches.length !== 1) throw Error(matches.length ? "ambiguous_base_option" : "base_option_missing");
  return matches[0] as JsonRecord;
}

function validateBindings(challenge: JsonRecord, option: JsonRecord, expected: ExpectedBaseChallenge): void {
  if (!isRecord(challenge.resource) || challenge.resource.url !== expected.resourceUrl) {
    throw Error("resource_binding_mismatch");
  }
  if (option.scheme !== expected.scheme || option.network !== expected.network) {
    throw Error("network_binding_mismatch");
  }
  for (const field of ["asset", "amount", "payTo"] as const) {
    if (option[field] !== expected[field]) throw Error(`${field}_binding_mismatch`);
  }
}

/**
 * Pure mapper. The caller is responsible for controlling expectations,
 * collecting bytes, governing disclosure, and later validating any manifest.
 */
export function mapX402ChallengeEvidence(input: ChallengeEvidenceInput): ChallengeEvidenceResult {
  if (!isRecord(input) || !validExpected(input.expected) ||
      !validObservation(input.observation) ||
      typeof input.artifactId !== "string" || !input.artifactId.length || input.artifactId.length > 256) {
    return rejected("invalid_mapping_input");
  }
  const { expected, observation } = input;
  if (observation.requestUrl !== expected.resourceUrl || observation.requestMethod !== expected.method) {
    return rejected("request_context_mismatch");
  }
  let bytes: Uint8Array;
  let challenge: JsonRecord;
  try {
    bytes = decodeHeader(observation.paymentRequired);
    challenge = parseStrictObject(bytes);
    const option = selectBase(challenge);
    validateBindings(challenge, option, expected);
    if (observation.responseBodyBytes !== undefined) {
      const body = parseStrictObject(observation.responseBodyBytes);
      // Structural equivalence is separate from the artifact's raw-byte digest.
      if (canonicalJson(body) !== canonicalJson(challenge)) throw Error("header_body_conflict");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const recognized = /^(?:invalid_|noncanonical_|duplicate_|unterminated_|json_|unsupported_|base_|ambiguous_|resource_|network_|asset_|amount_|payTo_|header_body_)/.test(message);
    return rejected(recognized ? message : "invalid_challenge_encoding");
  }
  const artifact: EvidenceArtifact = {
    id: input.artifactId,
    kind: "x402.v2.payment-required.challenge",
    mediaType: "application/json",
    digestSha256: sha256Bytes(bytes),
    disclosure: "restricted",
    availability: "included",
    source: {
      type: "http-response-header",
      producerRef: observation.producerRef ?? null,
      collectorRef: observation.collectorRef,
      collectionMethod: "provided-http-402-payment-required-base64",
      observedAt: observation.observedAt,
      collectedAt: observation.collectedAt,
      historicalContext: { httpStatus: 402, requestUrl: observation.requestUrl, requestMethod: observation.requestMethod }
    }
  };
  const terms = {
    method: expected.method,
    resource: expected.resourceUrl,
    amountAtomic: expected.amount,
    asset: expected.asset,
    recipient: expected.payTo
  } satisfies CommercialTerms;
  const termsDigestSha256 = sha256Record("terms", {
    ...terms, scheme: expected.scheme, network: expected.network
  });
  const claim: ClaimAssessment = {
    id: `${input.artifactId}.payment-requirements`,
    type: "payment_requirements_observed",
    subjectRef: expected.resourceUrl,
    status: "not_evaluated",
    evidenceIds: [input.artifactId],
    verifierRef: null,
    evaluatedAt: null,
    reasonCode: "source_and_payment_not_authenticated"
  };
  return {
    status: "mapped_unverified", reasonCode: "structural_binding_match_only",
    artifact, commercialTerms: { ...terms, termsEvidenceId: artifact.id, termsDigestSha256 },
    termsDigestSha256, claim, artifactBytes: Uint8Array.from(bytes)
  };
}
