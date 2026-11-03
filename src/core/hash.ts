/**
 * ProofPath PP-01 — SHA-256 commitment primitives.
 *
 * Artifact commitments hash exact bytes.
 * Structured commitments hash canonical ProofPath JSON.
 *
 * Matching digests establish byte integrity relative to a
 * commitment; they do not establish source authenticity,
 * transaction validity, or historical existence.
 */

import {
  createHash,
  timingSafeEqual
} from "node:crypto";

import { canonicalJsonBytes } from "./canonical.js";

export type StructuredDomain =
  | "manifest"
  | "audit-event"
  | "terms";

const SHA256_HEX = /^[0-9a-f]{64}$/;

const DOMAIN_PREFIX = "proofpath:structured:v1:";

function assertBytes(value: unknown): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError("Expected Uint8Array bytes");
  }
}

/**
 * SHA-256 over exact supplied bytes.
 *
 * No content normalization or implicit serialization occurs.
 */
export function sha256Bytes(bytes: Uint8Array): string {
  assertBytes(bytes);

  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

/**
 * SHA-256 over a supported, domain-separated canonical record.
 *
 * Input:
 * UTF8("proofpath:structured:v1:<domain>") || 0x00
 * || canonicalJsonBytes(value)
 */
export function sha256Record(
  domain: StructuredDomain,
  value: unknown
): string {
  if (
    domain !== "manifest" &&
    domain !== "audit-event" &&
    domain !== "terms"
  ) {
    throw new TypeError("Unsupported commitment domain");
  }

  const prefix = Buffer.from(
    DOMAIN_PREFIX + domain + "\0",
    "utf8"
  );

  const payload = canonicalJsonBytes(value);

  return createHash("sha256")
    .update(prefix)
    .update(payload)
    .digest("hex");
}

/**
 * Verify a SHA-256 digest using constant-time byte comparison.
 *
 * Malformed or non-lowercase digests are rejected.
 * Validly formatted but unequal digests return false.
 *
 * Constant-time comparison does not imply that the supplied
 * reference digest is authenticated or trusted.
 */
export function verifySha256Digest(
  actualDigest: string,
  expectedDigest: string
): boolean {
  if (
    typeof actualDigest !== "string" ||
    typeof expectedDigest !== "string" ||
    !SHA256_HEX.test(actualDigest) ||
    !SHA256_HEX.test(expectedDigest)
  ) {
    throw new TypeError("Invalid SHA-256 digest format");
  }

  return timingSafeEqual(
    Buffer.from(actualDigest, "hex"),
    Buffer.from(expectedDigest, "hex")
  );
}

/**
 * Check supplied artifact bytes against a reference commitment.
 */
export function verifyArtifactBytes(
  bytes: Uint8Array,
  expectedDigest: string
): boolean {
  assertBytes(bytes);

  return verifySha256Digest(
    sha256Bytes(bytes),
    expectedDigest
  );
}
