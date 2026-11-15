import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256Bytes, sha256Record } from "../src/core/hash.js";
import { assessArtifactProvenance } from "../src/core/provenance.js";
import {
  mapX402ChallengeEvidence,
  type ChallengeEvidenceInput
} from "../src/adapters/x402/challengeEvidence.js";

const URL = "https://x402-doctor.fizzl.eu/api/v1/diagnose?url=https%3A%2F%2Fexample.com";
const ASSET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x6B0F4651eD42893ab58139938175E4a69f175F25";
const TIME = "2026-11-15T16:00:00.000Z";

const option = () => ({
  scheme: "exact", network: "eip155:8453", asset: ASSET, amount: "10000", payTo: PAY_TO
});
const challenge = () => ({
  x402Version: 2, error: "Payment required",
  resource: { url: URL, description: "x402 doctor diagnostic", mimeType: "application/json" },
  accepts: [option(), {
    scheme: "exact", network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    asset: "synthetic-solana-asset", amount: "10000", payTo: "synthetic-solana-payee"
  }], extensions: {}
});
const jsonBytes = (value: unknown): Uint8Array => Buffer.from(JSON.stringify(value), "utf8");
const b64 = (value: unknown): string => Buffer.from(jsonBytes(value)).toString("base64");
function fixture(): ChallengeEvidenceInput {
  return {
    artifactId: "fizzl-i2-a1-challenge",
    expected: {
      resourceUrl: URL, method: "GET", scheme: "exact", network: "eip155:8453",
      asset: ASSET, amount: "10000", payTo: PAY_TO
    },
    observation: {
      httpStatus: 402, requestUrl: URL, requestMethod: "GET",
      paymentRequired: b64(challenge()), observedAt: TIME, collectedAt: TIME,
      collectorRef: "proofpath-i2-fixture", producerRef: "https://x402-doctor.fizzl.eu"
    }
  };
}
function rejected(input: ChallengeEvidenceInput, reason: string): void {
  const result = mapX402ChallengeEvidence(input);
  assert.equal(result.status, "rejected");
  assert.equal(result.reasonCode, reason);
  assert.equal(result.artifact, null);
  assert.equal(result.claim, null);
}

test("T01: Base challenge maps as unverified using PP-01 contracts", () => {
  const result = mapX402ChallengeEvidence(fixture());
  assert.equal(result.status, "mapped_unverified");
  if (result.status !== "mapped_unverified") return;
  assert.equal(result.artifact.kind, "x402.v2.payment-required.challenge");
  assert.equal(result.artifact.disclosure, "restricted");
  assert.equal(result.commercialTerms.amountAtomic, "10000");
  assert.equal(result.commercialTerms.asset, ASSET);
  assert.equal(result.commercialTerms.recipient, PAY_TO);
  assert.equal(result.claim.status, "not_evaluated");
  assert.equal(result.claim.verifierRef, null);
});

test("T02: reordered body keys are semantically equivalent", () => {
  const input = fixture();
  const c = challenge();
  input.observation.responseBodyBytes = jsonBytes({ extensions: c.extensions, accepts: c.accepts,
    resource: c.resource, error: c.error, x402Version: c.x402Version });
  assert.equal(mapX402ChallengeEvidence(input).status, "mapped_unverified");
});

test("T03: absent payment header rejected", () => {
  const input = fixture(); input.observation.paymentRequired = "";
  rejected(input, "invalid_base64_header");
});

test("T04: unsupported version rejected", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), x402Version: 1 });
  rejected(input, "unsupported_x402_challenge");
});

test("T05: malformed base64 and invalid JSON fail closed", () => {
  const input = fixture(); input.observation.paymentRequired = "$$$";
  rejected(input, "invalid_base64_header");
  input.observation.paymentRequired = Buffer.from("{broken").toString("base64");
  assert.equal(mapX402ChallengeEvidence(input).status, "rejected");
});

test("T06: ambiguous Base options rejected", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), accepts: [option(), option()] });
  rejected(input, "ambiguous_base_option");
});

test("T07: independent network expectation cannot be replaced by challenge", () => {
  const input = fixture();
  input.expected.network = "eip155:1" as "eip155:8453";
  rejected(input, "invalid_mapping_input");
});

test("T08: asset substitution rejected", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), accepts: [{ ...option(), asset: "0x" + "1".repeat(40) }] });
  rejected(input, "asset_binding_mismatch");
});

test("T09: amount substitution rejected", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), accepts: [{ ...option(), amount: "10001" }] });
  rejected(input, "amount_binding_mismatch");
});

test("T10: payee substitution rejected", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), accepts: [{ ...option(), payTo: "0x" + "2".repeat(40) }] });
  rejected(input, "payTo_binding_mismatch");
});

test("T11: header/body disagreement rejected", () => {
  const input = fixture();
  input.observation.responseBodyBytes = jsonBytes({ ...challenge(), error: "Changed" });
  rejected(input, "header_body_conflict");
});

test("T12: bounded header, depth and duplicate keys", () => {
  const input = fixture();
  input.observation.paymentRequired = "A".repeat(131076);
  rejected(input, "invalid_base64_header");
  input.observation.paymentRequired = Buffer.from('{"x402Version":2,"x402Version":2}').toString("base64");
  rejected(input, "duplicate_json_key");
  input.observation.paymentRequired = Buffer.from('{"x402Version":2,"\\u0078402Version":2}').toString("base64");
  rejected(input, "duplicate_json_key");
  input.observation.paymentRequired = Buffer.from('{"x402Version":2,"nested":' + "[".repeat(34) + "0" + "]".repeat(34) + "}").toString("base64");
  rejected(input, "json_depth_exceeded");
});

test("T13: raw decoded bytes and structured terms have distinct reproducible commitments", () => {
  const input = fixture();
  const result = mapX402ChallengeEvidence(input);
  assert.equal(result.status, "mapped_unverified");
  if (result.status !== "mapped_unverified") return;
  assert.equal(result.artifact.digestSha256, sha256Bytes(Buffer.from(input.observation.paymentRequired, "base64")));
  assert.equal(result.artifact.digestSha256, sha256Bytes(result.artifactBytes));
  assert.equal(result.termsDigestSha256, sha256Record("terms", {
    method: "GET", resource: URL, amountAtomic: "10000", asset: ASSET,
    recipient: PAY_TO, scheme: "exact", network: "eip155:8453"
  }));
  assert.notEqual(result.artifact.digestSha256, result.termsDigestSha256);
});

test("T14: PP-01 integrity match does not authenticate source or payment", () => {
  const result = mapX402ChallengeEvidence(fixture());
  assert.equal(result.status, "mapped_unverified");
  if (result.status !== "mapped_unverified") return;
  const assessment = assessArtifactProvenance(result.artifact, result.artifactBytes);
  assert.equal(assessment.integrity.status, "matches");
  assert.equal(assessment.attribution.status, "claimed_only");
  assert.equal(assessment.authentication.status, "not_evaluated");
  assert.equal(assessment.claimVerification.status, "not_evaluated");
  assert.equal(result.claim.status, "not_evaluated");
});

test("T15: deterministic, side-effect-free, without mutating inputs", () => {
  const input = fixture();
  const snapshot = JSON.stringify(input);
  const a = mapX402ChallengeEvidence(input);
  const b = mapX402ChallengeEvidence(input);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(input), snapshot);
});

test("T16: request URL and method binding cannot be substituted", () => {
  const input = fixture(); input.observation.requestMethod = "POST";
  rejected(input, "request_context_mismatch");
  input.observation.requestMethod = "GET";
  input.observation.requestUrl = "https://example.com/other";
  rejected(input, "request_context_mismatch");
  input.observation.requestUrl = URL;
  input.observation.paymentRequired = b64({ ...challenge(), resource: { url: "https://example.com/other" } });
  rejected(input, "resource_binding_mismatch");
});

test("T17: no matching Base option fails closed", () => {
  const input = fixture();
  input.observation.paymentRequired = b64({ ...challenge(), accepts: [] });
  rejected(input, "base_option_missing");
});

test("T18: response other than HTTP 402 rejected", () => {
  const input = fixture(); input.observation.httpStatus = 200;
  rejected(input, "invalid_mapping_input");
});
