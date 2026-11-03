/**
 * ProofPath PP-01 — Integrated integrity acceptance tests.
 *
 * All fixtures are synthetic.
 * No real payment, blockchain verification, source authentication,
 * or independently verified commercial claim is represented here.
 */

import type { EvidenceArtifact } from "../src/core/types.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  canonicalJson,
  canonicalJsonBytes
} from "../src/core/canonical.js";

import {
  sha256Bytes,
  sha256Record,
  verifySha256Digest,
  verifyArtifactBytes
} from "../src/core/hash.js";

import {
  assessArtifactProvenance
} from "../src/core/provenance.js";

import {
  createRuntimeValidator
} from "../src/core/validate.js";

const readJson = (path: string): object =>
  JSON.parse(readFileSync(path, "utf8")) as object;

const validator = createRuntimeValidator(
  readJson("schemas/proofpath-evidence-v1.schema.json"),
  readJson("schemas/proofpath-audit-event-v1.schema.json")
);

const timestamp = "2026-11-03T09:00:00Z";
const evidenceBytes = Buffer.from("synthetic-evidence-v1", "utf8");
const digest = sha256Bytes(evidenceBytes);

function artifactFixture(): EvidenceArtifact {
  return {
    id: "artifact-001",
    kind: "controlled_fixture",
    mediaType: "application/octet-stream",
    digestSha256: digest,
    disclosure: "restricted",
    availability: "included",
    source: {
      type: "controlled_fixture",
      producerRef: "claimed-producer",
      collectorRef: "fixture-collector",
      collectionMethod: "fixture",
      observedAt: timestamp,
      collectedAt: timestamp,
      historicalContext: {
        reference: "synthetic-only"
      }
    }
  };
}

function manifestFixture() {
  return {
    schema: {
      type: "proofpath.transaction-evidence",
      version: "1.0.0",
      profile: "proofpath.concordium.x402.v1"
    },
    transaction: {
      id: "transaction-001",
      correlationId: "correlation-001",
      recordedAt: timestamp,
      status: "evidence_collected"
    },
    participants: {
      buyer: {
        agentRef: null,
        ownerRef: null,
        identityEvidenceIds: []
      },
      seller: {
        agentRef: null,
        ownerRef: null,
        identityEvidenceIds: []
      }
    },
    commercialTerms: {},
    authorization: { evidenceIds: [] },
    payment: { evidenceIds: ["artifact-001"] },
    delivery: { evidenceIds: [] },
    evidence: [artifactFixture()],
    audit: {
      eventIds: ["event-001"],
      headDigestSha256: "a".repeat(64),
      completeness: "partial",
      coverageScope: "synthetic_transaction_events"
    },
    assurance: { claims: [] },
    governance: {
      disclosureProfile: "restricted",
      retentionPolicyRef: null,
      retentionResponsibleParty: null,
      retentionUntil: null,
      auditProfile: "proofpath.article12-aligned.v1"
    }
  };
}

function eventFixture() {
  return {
    schema: {
      type: "proofpath.audit-event",
      version: "1.0.0"
    },
    eventId: "event-001",
    transactionId: "transaction-001",
    correlationId: "correlation-001",
    eventType: "authorization_denied",
    sequence: 1,
    source: {
      sourceType: "controlled_fixture",
      producerRef: null,
      collectorRef: "fixture-collector",
      authenticationEvidenceIds: []
    },
    sourceEventAt: null,
    observedAt: timestamp,
    outcome: "denied",
    payloadVersion: "1.0.0",
    payload: {},
    evidenceIds: ["artifact-001"],
    previousDigestSha256: null,
    eventDigestSha256: "a".repeat(64),
    externalAnchorRefs: []
  };
}

test("canonical serialization is independent of object insertion order", () => {
  const left = { z: [2, 1], a: { y: true, b: null } };
  const right = { a: { b: null, y: true }, z: [2, 1] };

  assert.equal(canonicalJson(left), canonicalJson(right));
  assert.deepEqual(canonicalJsonBytes(left), canonicalJsonBytes(right));
});

test("structured digest matches independently constructed SHA-256 input", () => {
  const record = { b: 2, a: 1 };

  const independentlyCalculated = createHash("sha256")
    .update(Buffer.from("proofpath:structured:v1:manifest\0"))
    .update(Buffer.from('{"a":1,"b":2}', "utf8"))
    .digest("hex");

  assert.equal(
    independentlyCalculated,
    "a7ba2e28056ba03a93205d75624aa0c8775450a53d7d27e0f5d4b5655240d062"
  );

  assert.equal(sha256Record("manifest", record), independentlyCalculated);
});

test("commitment domains cannot be substituted", () => {
  const record = { id: "synthetic-record" };

  assert.notEqual(
    sha256Record("manifest", record),
    sha256Record("audit-event", record)
  );

  assert.notEqual(
    sha256Record("audit-event", record),
    sha256Record("terms", record)
  );
});

test("exact artifact bytes match their own commitment", () => {
  assert.equal(verifyArtifactBytes(evidenceBytes, digest), true);
});

test("modified artifact bytes fail integrity verification", () => {
  const tampered = Buffer.from("synthetic-evidence-v2", "utf8");

  assert.equal(verifyArtifactBytes(tampered, digest), false);
});

test("malformed digests and ambiguous canonical values fail closed", () => {
  assert.throws(
    () => verifySha256Digest("invalid", digest),
    TypeError
  );

  assert.throws(
    () => canonicalJson({ amount: 0.25 }),
    TypeError
  );

  assert.throws(
    () => canonicalJson({ value: "\uD800" }),
    TypeError
  );

  assert.throws(
    () => canonicalJson({ value: undefined }),
    TypeError
  );
});

test("matching artifact integrity never authenticates its producer", () => {
  const result = assessArtifactProvenance(
    artifactFixture(),
    evidenceBytes
  );

  assert.equal(result.integrity.status, "matches");
  assert.equal(result.attribution.status, "claimed_only");
  assert.equal(result.authentication.status, "not_evaluated");
  assert.equal(result.claimVerification.status, "not_evaluated");
});

test("tampering produces a provenance mismatch without trust promotion", () => {
  const result = assessArtifactProvenance(
    artifactFixture(),
    Buffer.from("tampered", "utf8")
  );

  assert.equal(result.integrity.status, "mismatch");
  assert.equal(result.authentication.status, "not_evaluated");
  assert.ok(result.issues.includes("artifact_digest_mismatch"));
});

test("missing bytes cannot establish integrity", () => {
  const result = assessArtifactProvenance(artifactFixture());

  assert.equal(result.integrity.status, "not_evaluated");
  assert.ok(result.issues.includes("included_artifact_bytes_missing"));
});

test("synthetic manifest passes structural and reference validation only", () => {
  const result = validator.validateManifest(manifestFixture());

  assert.equal(result.valid, true);

  if (result.valid) {
    assert.deepEqual(result.value.assurance.claims, []);
    assert.equal(result.value.audit.completeness, "partial");
  }
});

test("broken payment evidence reference is rejected", () => {
  const manifest = {
    ...manifestFixture(),
    payment: { evidenceIds: ["nonexistent-artifact"] }
  };

  const result = validator.validateManifest(manifest);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(
      issue => issue.code === "unknown_evidence_reference"
    )
  );
});

test("duplicate evidence identifiers are rejected", () => {
  const manifest = {
    ...manifestFixture(),
    evidence: [artifactFixture(), artifactFixture()]
  };

  const result = validator.validateManifest(manifest);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(issue => issue.code === "duplicate_artifact_id")
  );
});

test("unsupported verified-claim metadata is rejected", () => {
  const manifest = {
    ...manifestFixture(),
    assurance: {
      claims: [{
        id: "claim-001",
        type: "payment_finality",
        subjectRef: "transaction-001",
        status: "verified",
        evidenceIds: [],
        verifierRef: null,
        evaluatedAt: null,
        reasonCode: null
      }]
    }
  };

  const result = validator.validateManifest(manifest);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(
      issue => issue.code === "verified_claim_metadata_incomplete"
    )
  );
});

test("linked synthetic audit event passes structural checks only", () => {
  const manifestResult = validator.validateManifest(manifestFixture());

  assert.equal(manifestResult.valid, true);

  if (!manifestResult.valid) return;

  const eventResult = validator.validateEvent(
    eventFixture(),
    manifestResult.value
  );

  assert.equal(eventResult.valid, true);

  // The fixture's event digest is not independently verified here.
  // Audit hash-chain verification belongs to M1.3.
});

test("cross-transaction audit event is rejected", () => {
  const manifestResult = validator.validateManifest(manifestFixture());

  assert.equal(manifestResult.valid, true);
  if (!manifestResult.valid) return;

  const event = {
    ...eventFixture(),
    transactionId: "different-transaction"
  };

  const result = validator.validateEvent(event, manifestResult.value);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(
      issue => issue.code === "transaction_id_mismatch"
    )
  );
});
