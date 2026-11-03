/**
 * ProofPath PP-01 — Persistent export acceptance tests.
 *
 * All fixtures are synthetic. No payment, blockchain finality,
 * independent authentication, or external publication occurs.
 *
 * Export digest consistency is distinct from export authenticity
 * and conformance to an independently trusted export schema.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { canonicalJson } from "../src/core/canonical.js";
import { sha256Record } from "../src/core/hash.js";
import { createRuntimeValidator } from "../src/core/validate.js";

import {
  exportEvidence,
  verifyExportDigest
} from "../src/core/export.js";

const loadSchema = (path: string): object =>
  JSON.parse(readFileSync(path, "utf8")) as object;

const validator = createRuntimeValidator(
  loadSchema("schemas/proofpath-evidence-v1.schema.json"),
  loadSchema("schemas/proofpath-audit-event-v1.schema.json")
);

const timestamp = "2026-11-03T09:00:00Z";
const sensitive = "SYNTHETIC_PRIVATE_DO_NOT_DISCLOSE";
const publicDigest = "a".repeat(64);
const restrictedDigest = "b".repeat(64);

function artifact(
  id: string,
  disclosure: "public" | "restricted",
  digestSha256: string
) {
  return {
    id,
    kind: "controlled_fixture",
    mediaType: "application/json",
    digestSha256,
    disclosure,
    availability: "referenced",
    source: {
      type: "controlled_fixture",
      producerRef: sensitive,
      collectorRef: sensitive,
      collectionMethod: "fixture",
      observedAt: timestamp,
      collectedAt: timestamp,
      historicalContext: null
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
      id: sensitive,
      correlationId: sensitive,
      recordedAt: timestamp,
      status: "evidence_collected"
    },
    participants: {
      buyer: {
        agentRef: sensitive,
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
    payment: {
      evidenceIds: ["public-artifact", "restricted-artifact"]
    },
    delivery: { evidenceIds: [] },
    evidence: [
      artifact("public-artifact", "public", publicDigest),
      artifact("restricted-artifact", "restricted", restrictedDigest)
    ],
    audit: {
      eventIds: [],
      headDigestSha256: null,
      completeness: "partial",
      coverageScope: sensitive
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

function publicFixture() {
  const result = exportEvidence(
    manifestFixture(),
    validator,
    "public"
  );

  if (result.disclosure !== "public") {
    throw new Error("Unexpected export profile");
  }

  return result;
}

function restrictedFixture() {
  const result = exportEvidence(
    manifestFixture(),
    validator,
    "restricted"
  );

  if (result.disclosure !== "restricted") {
    throw new Error("Unexpected export profile");
  }

  return result;
}

function independentDigest(value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}

test("synthetic manifest passes trusted schema validation", () => {
  assert.equal(
    validator.validateManifest(manifestFixture()).valid,
    true
  );
});

test("restricted export preserves complete validated manifest", () => {
  const result = restrictedFixture();

  assert.deepEqual(result.manifest, manifestFixture());
  assert.equal(result.disclosure, "restricted");
});

test("restricted manifest commitment matches SHA-256 contract", () => {
  const result = restrictedFixture();

  assert.equal(
    result.originalManifestDigestSha256,
    sha256Record("manifest", manifestFixture())
  );
});

test("restricted export digest matches independent calculation", () => {
  const result = restrictedFixture();

  const { exportDigestSha256, ...payload } = result;

  assert.equal(
    exportDigestSha256,
    independentDigest(payload)
  );
});

test("public export digest matches independent calculation", () => {
  const result = publicFixture();

  const { exportDigestSha256, ...payload } = result;

  assert.equal(
    exportDigestSha256,
    independentDigest(payload)
  );
});

test("public export includes only approved public digests", () => {
  const result = publicFixture();

  assert.deepEqual(
    result.publicArtifactCommitments,
    [{ digestSha256: publicDigest }]
  );
});

test("public export reports restricted artifact omissions", () => {
  const result = publicFixture();

  assert.equal(
    result.omissions.restrictedArtifactCount,
    1
  );

  assert.equal(
    result.omissions.transactionMetadataOmitted,
    true
  );

  assert.equal(
    result.omissions.participantMetadataOmitted,
    true
  );

  assert.equal(
    result.omissions.assuranceClaimsOmitted,
    true
  );
});

test("public export excludes restricted source identifiers", () => {
  const result = publicFixture();
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes(sensitive), false);
});

test("public export excludes restricted artifact digest", () => {
  const serialized = JSON.stringify(publicFixture());

  assert.equal(
    serialized.includes(restrictedDigest),
    false
  );
});

test("public export excludes artifact IDs and source metadata", () => {
  const result = publicFixture();
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes("public-artifact"), false);
  assert.equal(serialized.includes("restricted-artifact"), false);
  assert.equal(serialized.includes("collectorRef"), false);
  assert.equal(serialized.includes("producerRef"), false);
  assert.equal(result.manifest, null);
});

test("public export omits original manifest commitment", () => {
  const result = publicFixture();

  assert.equal(
    result.originalManifestDigestSha256,
    null
  );
});

test("public export remains stable across insertion ordering", () => {
  const first = manifestFixture();
  const reordered = {
    governance: first.governance,
    assurance: first.assurance,
    audit: first.audit,
    evidence: first.evidence,
    delivery: first.delivery,
    payment: first.payment,
    authorization: first.authorization,
    commercialTerms: first.commercialTerms,
    participants: first.participants,
    transaction: first.transaction,
    schema: first.schema
  };

  const a = exportEvidence(first, validator, "public");
  const b = exportEvidence(reordered, validator, "public");

  assert.equal(a.exportDigestSha256, b.exportDigestSha256);
});

test("restricted metadata changes do not leak into public export", () => {
  const changed = manifestFixture();

  changed.transaction.id = "ANOTHER_PRIVATE_TRANSACTION";
  changed.transaction.correlationId = "ANOTHER_PRIVATE_CORRELATION";

  const first = publicFixture();
  const second = exportEvidence(changed, validator, "public");

  assert.deepEqual(first, second);
});

test("changing public artifact digest invalidates export digest", () => {
  const changed = structuredClone(publicFixture());

  changed.publicArtifactCommitments[0]!.digestSha256 =
    "c".repeat(64);

  assert.equal(verifyExportDigest(changed), false);
});

test("changing restricted manifest invalidates export digest", () => {
  const changed = structuredClone(restrictedFixture());

  changed.manifest.transaction.id = "modified";

  assert.equal(verifyExportDigest(changed), false);
});

test("changing omission metadata invalidates export digest", () => {
  const changed = structuredClone(publicFixture());

  changed.omissions.restrictedArtifactCount = 999;

  assert.equal(verifyExportDigest(changed), false);
});

test("invalid manifest reference fails closed", () => {
  const changed = manifestFixture();

  changed.payment.evidenceIds = ["missing-artifact"];

  assert.throws(
    () => exportEvidence(changed, validator, "public"),
    TypeError
  );
});

test("invalid manifest timestamp fails closed", () => {
  const changed = manifestFixture();

  changed.transaction.recordedAt = "not-a-timestamp";

  assert.throws(
    () => exportEvidence(changed, validator, "restricted"),
    TypeError
  );
});

test("unknown disclosure profile fails closed", () => {
  assert.throws(
    () => exportEvidence(
      manifestFixture(),
      validator,
      "internal" as "public"
    ),
    TypeError
  );
});

test("malformed export digest fails closed", () => {
  const changed = structuredClone(publicFixture());

  changed.exportDigestSha256 = "invalid";

  assert.throws(
    () => verifyExportDigest(changed),
    TypeError
  );
});

test("export does not mutate its input", () => {
  const original = manifestFixture();
  const snapshot = structuredClone(original);

  exportEvidence(original, validator, "public");
  exportEvidence(original, validator, "restricted");

  assert.deepEqual(original, snapshot);
});

test("original and derived commitments remain distinct", () => {
  const restricted = restrictedFixture();
  const publicExport = publicFixture();

  assert.notEqual(
    restricted.originalManifestDigestSha256,
    restricted.exportDigestSha256
  );

  assert.notEqual(
    restricted.exportDigestSha256,
    publicExport.exportDigestSha256
  );
});

test("export does not promote claims to verified", () => {
  const restricted = restrictedFixture();
  const publicExport = publicFixture();

  assert.deepEqual(restricted.manifest.assurance.claims, []);

  assert.equal(
    publicExport.omissions.assuranceClaimsOmitted,
    true
  );

  assert.ok(
    publicExport.verificationNotice.includes("do not establish")
  );
});

test("export integrity is not export schema conformance", () => {
  const original = publicFixture();
  const changed = Object.assign(
    structuredClone(original),
    { unexpectedField: "synthetic-extra" }
  );

  // Unchanged commitment detects the added field.
  assert.equal(verifyExportDigest(changed), false);

  // Anyone can recompute an unkeyed digest. This demonstrates
  // why an independent export schema and trusted source matter.
  const { exportDigestSha256, ...payload } = changed;
  void exportDigestSha256;

  changed.exportDigestSha256 = independentDigest(payload);

  assert.equal(verifyExportDigest(changed), true);
});
