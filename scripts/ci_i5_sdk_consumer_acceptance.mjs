/**
 * I5 — Independent installed-SDK behavioral acceptance.
 *
 * Reads the preserved I3 capture outside this repository.
 * Runs against an installed SDK in an external consumer project.
 * Never logs raw HTTP headers, challenge bytes or captured metadata.
 *
 * Does not authenticate Fizzl, execute payments or verify settlement.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const evidenceDir = process.env.PROOFPATH_I5_EVIDENCE_DIR;
const consumerDir = process.env.PROOFPATH_I5_CONSUMER_DIR;

if (!evidenceDir || !consumerDir) {
  throw Error("I5 consumer and evidence directories must be supplied");
}

if (!existsSync(join(consumerDir, "node_modules", "@proofpath", "core"))) {
  throw Error("Independent installed SDK not found");
}

const expectedHashes = {
  "response.headers":
    "640639bf8fef61cd06cdf8d7379da96fba07464e128f654a053881ea34a81caf",
  "response.body":
    "661f6260f331cace4e7140c49bb744eb796bf8a382862e749b65a20a49fc0376",
  "capture.metadata":
    "eee4c02817995db6e3168c2c8c5a2b1b93152441eb099f3e23334029225cff3d"
};

const files = {};

for (const [name, expectedHash] of Object.entries(expectedHashes)) {
  const bytes = readFileSync(join(evidenceDir, name));
  const digest = createHash("sha256").update(bytes).digest("hex");

  assert.equal(digest, expectedHash, `I3 evidence integrity: ${name}`);
  files[name] = bytes;
}

console.log("I5_I3_CAPTURE_INTEGRITY=PASS");

const metadata = {};

for (const line of files["capture.metadata"].toString("utf8").split(/\r?\n/)) {
  if (!line.trim()) continue;

  const position = line.indexOf("=");
  assert.ok(position > 0, "Invalid capture metadata field");

  const key = line.slice(0, position).trim();
  const value = line.slice(position + 1).trim();

  assert.ok(!Object.hasOwn(metadata, key), "Duplicate metadata field");
  metadata[key] = value;
}

const expectedKeys = [
  "authentication_status",
  "capture_utc",
  "collection_method",
  "curl_exit",
  "http_code",
  "payment_executed",
  "request_method",
  "request_url"
].sort();

assert.deepEqual(Object.keys(metadata).sort(), expectedKeys);

const expectedUrl =
  "https://x402-doctor.fizzl.eu/api/v1/diagnose?url=https%3A%2F%2Fexample.com";

assert.equal(metadata.request_method, "GET");
assert.equal(metadata.request_url, expectedUrl);
assert.equal(metadata.http_code, "402");
assert.equal(metadata.curl_exit, "0");
assert.equal(metadata.payment_executed.toLowerCase(), "false");
assert.ok(
  metadata.authentication_status.length > 0,
  "Missing authentication-status declaration"
);

const timestamp = new Date(metadata.capture_utc);

assert.ok(Number.isFinite(timestamp.getTime()));
const observedAt = timestamp.toISOString();

const headerLines =
  files["response.headers"].toString("utf8").split(/\r?\n/);

assert.ok(
  headerLines.some(line => /^HTTP\/\S+\s+402(?:\s|$)/i.test(line)),
  "Captured HTTP status is not 402"
);

const paymentHeaders = headerLines
  .filter(line => /^payment-required\s*:/i.test(line))
  .map(line => line.slice(line.indexOf(":") + 1).trim());

assert.equal(paymentHeaders.length, 1);
assert.ok(paymentHeaders[0]);

const expected = {
  resourceUrl: expectedUrl,
  method: "GET",
  scheme: "exact",
  network: "eip155:8453",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: "10000",
  payTo: "0x6B0F4651eD42893ab58139938175E4a69f175F25"
};

const input = {
  artifactId: "fizzl-i3-original-capture",
  expected,
  observation: {
    httpStatus: 402,
    requestUrl: metadata.request_url,
    requestMethod: metadata.request_method,
    paymentRequired: paymentHeaders[0],
    responseBodyBytes: files["response.body"],
    observedAt,
    collectedAt: observedAt,
    collectorRef: "proofpath-i5-independent-capture",
    producerRef: "https://x402-doctor.fizzl.eu"
  }
};

console.log("I5_CAPTURE_INPUT_CONTRACT=PASS");

/*
 * Execute the acceptance checks from the external project.
 * Dynamic resolution must find the installed @proofpath/core package.
 */
const consumerProgram = `
import assert from "node:assert/strict";

import {
  assessArtifactProvenance,
  sha256Bytes,
  sha256Record
} from "@proofpath/core";

import {
  mapX402ChallengeEvidence
} from "@proofpath/core/x402";

const input = JSON.parse(process.env.PROOFPATH_I5_INPUT);
input.observation.responseBodyBytes =
  Buffer.from(process.env.PROOFPATH_I5_BODY, "base64");

const result = mapX402ChallengeEvidence(input);

assert.equal(result.status, "mapped_unverified");
assert.equal(result.reasonCode, "structural_binding_match_only");
assert.equal(result.claim.status, "not_evaluated");
assert.equal(result.claim.verifierRef, null);
assert.equal(result.claim.evaluatedAt, null);
assert.equal(result.artifact.disclosure, "restricted");

assert.equal(
  result.artifact.digestSha256,
  "bf63cf4fd8e6b9c93389b89682715fef17174a69476b9c37b9b59e9b68930504"
);

assert.equal(
  result.termsDigestSha256,
  "26556fb1889e64918a53707588b32ca3968bf62b7260f1c9c6387c3561ec04d1"
);

assert.equal(
  sha256Bytes(result.artifactBytes),
  result.artifact.digestSha256
);

assert.equal(
  sha256Record("terms", {
    method: input.expected.method,
    resource: input.expected.resourceUrl,
    amountAtomic: input.expected.amount,
    asset: input.expected.asset,
    recipient: input.expected.payTo,
    scheme: input.expected.scheme,
    network: input.expected.network
  }),
  result.termsDigestSha256
);

const provenance = assessArtifactProvenance(
  result.artifact,
  result.artifactBytes
);

assert.equal(provenance.integrity.status, "matches");
assert.equal(provenance.attribution.status, "claimed_only");
assert.equal(provenance.authentication.status, "not_evaluated");
assert.equal(provenance.claimVerification.status, "not_evaluated");
assert.equal(result.claim.reasonCode, "source_and_payment_not_authenticated");

console.log("SDK_05_LIVE_CHALLENGE=PASS");
console.log("SDK_07_DIGEST_AND_PROVENANCE=PASS");

const original = JSON.parse(
  Buffer.from(input.observation.paymentRequired, "base64").toString("utf8")
);

const originalBody = input.observation.responseBodyBytes;

function makeInput() {
  return {
    ...input,
    expected: { ...input.expected },
    observation: {
      ...input.observation,
      responseBodyBytes: originalBody
    }
  };
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

function challengeMutation(mutator) {
  const copy = structuredClone(original);
  mutator(copy);
  const item = makeInput();

  item.observation.paymentRequired = encode(copy);
  item.observation.responseBodyBytes = undefined;

  return item;
}

const cases = [
  ["network expectation", () => {
    const item = makeInput();
    item.expected.network = "eip155:1";
    return item;
  }, "invalid_mapping_input"],

  ["asset substitution", () =>
    challengeMutation(c => {
      c.accepts.find(a => a.network === "eip155:8453").asset =
        "0x" + "1".repeat(40);
    }), "asset_binding_mismatch"],

  ["amount substitution", () =>
    challengeMutation(c => {
      c.accepts.find(a => a.network === "eip155:8453").amount = "10001";
    }), "amount_binding_mismatch"],

  ["payee substitution", () =>
    challengeMutation(c => {
      c.accepts.find(a => a.network === "eip155:8453").payTo =
        "0x" + "2".repeat(40);
    }), "payTo_binding_mismatch"],

  ["request method", () => {
    const item = makeInput();
    item.observation.requestMethod = "POST";
    return item;
  }, "request_context_mismatch"],

  ["request URL", () => {
    const item = makeInput();
    item.observation.requestUrl = "https://example.com/other";
    return item;
  }, "request_context_mismatch"],

  ["HTTP status", () => {
    const item = makeInput();
    item.observation.httpStatus = 200;
    return item;
  }, "invalid_mapping_input"],

  ["resource substitution", () =>
    challengeMutation(c => {
      c.resource.url = "https://example.com/other";
    }), "resource_binding_mismatch"],

  ["missing header", () => {
    const item = makeInput();
    item.observation.paymentRequired = "";
    return item;
  }, "invalid_base64_header"],

  ["malformed base64", () => {
    const item = makeInput();
    item.observation.paymentRequired = "$$$";
    return item;
  }, "invalid_base64_header"],

  ["duplicate JSON key", () => {
    const item = makeInput();
    item.observation.paymentRequired =
      Buffer.from('{"x402Version":2,"x402Version":2}').toString("base64");
    item.observation.responseBodyBytes = undefined;
    return item;
  }, "duplicate_json_key"],

  ["ambiguous Base selection", () =>
    challengeMutation(c => {
      const option = c.accepts.find(a => a.network === "eip155:8453");
      c.accepts.push(structuredClone(option));
    }), "ambiguous_base_option"],

  ["header/body conflict", () => {
    const item = makeInput();
    item.observation.responseBodyBytes =
      Buffer.from(JSON.stringify({ ...original, error: "Changed" }));
    return item;
  }, "header_body_conflict"],

  ["unsupported version", () =>
    challengeMutation(c => {
      c.x402Version = 1;
    }), "unsupported_x402_challenge"]
];

let count = 0;

for (const [name, build, expectedReason] of cases) {
  const rejected = mapX402ChallengeEvidence(build());

  assert.equal(rejected.status, "rejected", name);
  assert.equal(rejected.reasonCode, expectedReason, name);
  assert.equal(rejected.artifact, null, name);
  assert.equal(rejected.claim, null, name);

  count++;
}

assert.equal(count, 14);

console.log("SDK_06_ADVERSARIAL_CASES=" + count);
console.log("SDK_06_ADVERSARIAL_REJECTION=PASS");
console.log("I5_P2F_CONSUMER_ACCEPTANCE=PASS");
`;

const child = spawnSync(
  process.execPath,
  ["--input-type=module", "-e", consumerProgram],
  {
    cwd: resolve(consumerDir),
    encoding: "utf8",
    env: {
      ...process.env,
      PROOFPATH_I5_INPUT: JSON.stringify({
        ...input,
        observation: {
          ...input.observation,
          responseBodyBytes: undefined
        }
      }),
      PROOFPATH_I5_BODY:
        files["response.body"].toString("base64")
    },
    maxBuffer: 1024 * 1024
  }
);

/*
 * The child is designed to print only acceptance markers.
 * Do not relay exception stacks or captured evidence on failure.
 */
if (child.status !== 0 || child.error) {
  console.log("I5_P2F_CONSUMER_ACCEPTANCE=FAIL");
  process.exitCode = 1;
} else {
  const allowed = [
    "SDK_05_LIVE_CHALLENGE=PASS",
    "SDK_07_DIGEST_AND_PROVENANCE=PASS",
    "SDK_06_ADVERSARIAL_CASES=14",
    "SDK_06_ADVERSARIAL_REJECTION=PASS",
    "I5_P2F_CONSUMER_ACCEPTANCE=PASS"
  ];

  const actual = child.stdout.trim().split(/\r?\n/);

  if (JSON.stringify(actual) !== JSON.stringify(allowed)) {
    console.log("I5_P2F_CONSUMER_ACCEPTANCE=FAIL");
    process.exitCode = 1;
  } else {
    for (const marker of allowed) console.log(marker);
  }
}
