/**
 * ProofPath PP-01 — Persistent schema conformance tests.
 *
 * All records are synthetic.
 *
 * JSON Schema and semantic validation do not establish:
 * - source authenticity;
 * - authorized agency;
 * - actual payment settlement or finality;
 * - completeness of real-world observations; or
 * - truth of the claims represented in an evidence manifest.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import {
  createRuntimeValidator
} from "../src/core/validate.js";

const require = createRequire(import.meta.url);

const Ajv2020 = require("ajv/dist/2020").default as
  new (options: Record<string, unknown>) => {
    compile: (schema: object) =>
      ((data: unknown) => boolean) & {
        errors?: unknown;
      };
  };

const addFormats = require("ajv-formats").default as
  (ajv: InstanceType<typeof Ajv2020>) => void;

function loadSchema(path: string): object {
  return JSON.parse(
    readFileSync(path, "utf8")
  ) as object;
}

const evidenceSchema = loadSchema(
  "schemas/proofpath-evidence-v1.schema.json"
);

const auditSchema = loadSchema(
  "schemas/proofpath-audit-event-v1.schema.json"
);

const validator = createRuntimeValidator(
  evidenceSchema,
  auditSchema
);

const ajv = new Ajv2020({
  strict: true,
  allErrors: true
});

addFormats(ajv);

const validateEvidenceSchema = ajv.compile(evidenceSchema);
const validateAuditSchema = ajv.compile(auditSchema);

const time = "2026-11-03T09:00:00Z";
const digest = "a".repeat(64);

function evidenceArtifact() {
  return {
    id: "artifact-001",
    kind: "synthetic_fixture",
    mediaType: "application/json",
    digestSha256: digest,
    disclosure: "restricted",
    availability: "referenced",
    source: {
      type: "synthetic_fixture",
      producerRef: "unverified-producer",
      collectorRef: "synthetic-collector",
      collectionMethod: "fixture",
      observedAt: time,
      collectedAt: time,
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
      id: "tx-synthetic-001",
      correlationId: "correlation-synthetic-001",
      recordedAt: time,
      status: "evidence_collected"
    },
    participants: {
      buyer: {
        agentRef: "claimed-agent",
        ownerRef: null,
        identityEvidenceIds: [] as string[]
      },
      seller: {
        agentRef: null,
        ownerRef: null,
        identityEvidenceIds: []
      }
    },
    commercialTerms: {},
    authorization: {
      evidenceIds: []
    },
    payment: {
      evidenceIds: ["artifact-001"]
    },
    delivery: {
      evidenceIds: []
    },
    evidence: [
      evidenceArtifact()
    ],
    audit: {
      eventIds: [],
      headDigestSha256: null as string | null,
      completeness: "partial",
      coverageScope: "synthetic-test"
    },
    assurance: {
      claims: []
    },
    governance: {
      disclosureProfile: "restricted",
      retentionPolicyRef: null,
      retentionResponsibleParty: null,
      retentionUntil: null,
      auditProfile: "proofpath.article12-aligned.v1"
    }
  };
}

function auditFixture() {
  return {
    schema: {
      type: "proofpath.audit-event",
      version: "1.0.0"
    },
    eventId: "event-001",
    transactionId: "tx-synthetic-001",
    correlationId: "correlation-synthetic-001",
    eventType: "payment_submitted",
    sequence: 1,
    source: {
      sourceType: "synthetic_fixture",
      producerRef: null,
      collectorRef: "synthetic-collector",
      authenticationEvidenceIds: []
    },
    sourceEventAt: null,
    observedAt: time,
    outcome: "pending",
    payloadVersion: "1.0.0",
    payload: {},
    evidenceIds: ["artifact-001"],
    previousDigestSha256: null as string | null,
    eventDigestSha256: digest,
    externalAnchorRefs: []
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function schemaAccepts(
  validate: (data: unknown) => boolean,
  value: unknown
): boolean {
  return validate(value);
}

function manifestValid(value: unknown): boolean {
  return validator.validateManifest(value).valid;
}

/* Evidence Manifest — structural conformance */

test("both frozen v1 schemas compile under strict Ajv 2020", () => {
  assert.equal(typeof validateEvidenceSchema, "function");
  assert.equal(typeof validateAuditSchema, "function");
});

test("synthetic manifest satisfies evidence JSON Schema", () => {
  assert.equal(
    schemaAccepts(validateEvidenceSchema, manifestFixture()),
    true
  );
});

test("synthetic manifest satisfies runtime semantic validation", () => {
  assert.equal(manifestValid(manifestFixture()), true);
});

test("manifest missing schema declaration is rejected", () => {
  const changed = clone(manifestFixture());

  const invalid = {
    ...changed,
    schema: undefined
  };

  assert.equal(manifestValid(invalid), false);
});

test("manifest rejects unsupported schema version", () => {
  const changed = clone(manifestFixture());

  changed.schema.version = "2.0.0";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects unsupported schema type", () => {
  const changed = clone(manifestFixture());

  changed.schema.type = "untrusted.schema";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects missing transaction identifier", () => {
  const changed = clone(manifestFixture());

  changed.transaction.id = "";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects invalid recording timestamp", () => {
  const changed = clone(manifestFixture());

  changed.transaction.recordedAt = "invalid-date";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects malformed artifact digest", () => {
  const changed = clone(manifestFixture());

  changed.evidence[0]!.digestSha256 = "invalid";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects malformed artifact digest case", () => {
  const changed = clone(manifestFixture());

  changed.evidence[0]!.digestSha256 = "A".repeat(64);

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects unsupported disclosure value", () => {
  const changed = clone(manifestFixture());

  changed.evidence[0]!.disclosure = "secret";

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects unknown top-level field", () => {
  const invalid = {
    ...manifestFixture(),
    unknownTopLevelField: true
  };

  assert.equal(
    schemaAccepts(validateEvidenceSchema, invalid),
    false
  );
});

test("manifest rejects duplicate evidence identifiers", () => {
  const changed = clone(manifestFixture());

  changed.evidence.push(
    clone(changed.evidence[0]!)
  );

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects dangling payment evidence reference", () => {
  const changed = clone(manifestFixture());

  changed.payment.evidenceIds = ["missing-evidence"];

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects dangling participant evidence reference", () => {
  const changed = clone(manifestFixture());

  changed.participants.buyer.identityEvidenceIds = [
    "missing-identity"
  ];

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects inconsistent empty audit head", () => {
  const changed = clone(manifestFixture());

  changed.audit.headDigestSha256 = digest;

  assert.equal(manifestValid(changed), false);
});

test("manifest rejects non-null completeness outside vocabulary", () => {
  const changed = clone(manifestFixture());

  changed.audit.completeness = "guaranteed";

  assert.equal(manifestValid(changed), false);
});

/* Audit Event — structural conformance */

test("audit schema declares the frozen event vocabulary", () => {
  const properties = (
    auditSchema as {
      properties: {
        eventType: {
          enum: string[];
        };
      };
    }
  ).properties;

  const values = properties.eventType.enum;

  assert.equal(values.length, 26);
  assert.ok(values.includes("payment_finalized"));
  assert.ok(values.includes("payment_submitted"));
  assert.equal(values.includes("payment_settled"), false);
});

test("synthetic audit event satisfies audit JSON Schema", () => {
  assert.equal(
    schemaAccepts(validateAuditSchema, auditFixture()),
    true
  );
});

test("audit schema rejects unsupported event version", () => {
  const changed = clone(auditFixture());

  changed.schema.version = "2.0.0";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects unsupported event classification", () => {
  const changed = clone(auditFixture());

  changed.eventType = "payment_settled";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects invalid sequence", () => {
  const changed = clone(auditFixture());

  changed.sequence = 0;

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects invalid observation timestamp", () => {
  const changed = clone(auditFixture());

  changed.observedAt = "not-a-timestamp";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects invalid event digest", () => {
  const changed = clone(auditFixture());

  changed.eventDigestSha256 = "not-sha256";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects unknown top-level fields", () => {
  const invalid = {
    ...auditFixture(),
    unexpectedField: true
  };

  assert.equal(
    schemaAccepts(validateAuditSchema, invalid),
    false
  );
});

test("audit schema rejects invalid outcome", () => {
  const changed = clone(auditFixture());

  changed.outcome = "guaranteed";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

test("audit schema rejects malformed predecessor digest", () => {
  const changed = clone(auditFixture());

  changed.previousDigestSha256 = "bad-digest";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    false
  );
});

/* Trust-boundary conformance */

test("valid manifest does not authenticate its claimed producer", () => {
  const changed = clone(manifestFixture());

  changed.evidence[0]!.source.producerRef =
    "arbitrary-unverified-producer";

  assert.equal(manifestValid(changed), true);
});

test("schema-valid event does not establish payment finality", () => {
  const changed = clone(auditFixture());

  changed.eventType = "payment_finalized";
  changed.outcome = "succeeded";

  assert.equal(
    schemaAccepts(validateAuditSchema, changed),
    true
  );

  // This assertion establishes structural validity only.
  // It must not be interpreted as blockchain finality proof.
});

test("runtime validator never mutates its input manifest", () => {
  const original = manifestFixture();
  const before = clone(original);

  validator.validateManifest(original);

  assert.deepEqual(original, before);
});
