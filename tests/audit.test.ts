/**
 * ProofPath PP-01 — Persistent audit-journal acceptance tests.
 *
 * All event data and commitments in these tests are synthetic.
 *
 * A valid journal proves consistency against an expected commitment.
 * It does not establish independently authenticated event producers,
 * timestamps, complete real-world event capture, or immutable storage.
 */

import test from "node:test";
import assert from "node:assert/strict";

import type { AuditEvent } from "../src/core/types.js";

import {
  appendAuditEvent,
  computeAuditEventDigest,
  verifyAuditJournal
} from "../src/core/audit.js";

import type {
  AuditEventInput,
  AuditJournalExpectation
} from "../src/core/audit.js";

import { sha256Record } from "../src/core/hash.js";

const transactionId = "synthetic-transaction-001";
const correlationId = "synthetic-correlation-001";
const observedAt = "2026-11-03T09:00:00Z";

function input(
  eventId: string,
  eventType: AuditEventInput["eventType"] = "authorization_denied"
): AuditEventInput {
  return {
    schema: {
      type: "proofpath.audit-event",
      version: "1.0.0"
    },
    eventId,
    transactionId,
    correlationId,
    eventType,
    source: {
      sourceType: "controlled_fixture",
      producerRef: null,
      collectorRef: "synthetic-collector",
      authenticationEvidenceIds: []
    },
    sourceEventAt: null,
    observedAt,
    outcome: "denied",
    payloadVersion: "1.0.0",
    payload: { synthetic: true },
    evidenceIds: [],
    externalAnchorRefs: []
  };
}

function expectation(
  events: readonly AuditEvent[]
): AuditJournalExpectation {
  return {
    transactionId,
    correlationId,
    eventCount: events.length,
    headDigestSha256:
      events.length === 0
        ? null
        : events[events.length - 1]!.eventDigestSha256
  };
}

function fixtureJournal(): AuditEvent[] {
  let events: AuditEvent[] = [];

  events = appendAuditEvent(
    events,
    input("event-001"),
    expectation(events)
  );

  events = appendAuditEvent(
    events,
    input("event-002", "payment_submitted"),
    expectation(events)
  );

  events = appendAuditEvent(
    events,
    input("event-003", "payment_finalized"),
    expectation(events)
  );

  return events;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const original = fixtureJournal();
const pinned = expectation(original);

test("empty journal verifies against empty commitment", () => {
  const empty: AuditEvent[] = [];

  const result = verifyAuditJournal(
    empty,
    expectation(empty)
  );

  assert.equal(result.valid, true);
  assert.equal(result.eventCount, 0);
  assert.equal(result.headDigestSha256, null);
});

test("genesis event has sequence one and null predecessor", () => {
  assert.equal(original[0]!.sequence, 1);
  assert.equal(original[0]!.previousDigestSha256, null);
});

test("successive events have contiguous sequence numbers", () => {
  assert.deepEqual(
    original.map(event => event.sequence),
    [1, 2, 3]
  );
});

test("every predecessor link matches the prior commitment", () => {
  for (let i = 1; i < original.length; i++) {
    assert.equal(
      original[i]!.previousDigestSha256,
      original[i - 1]!.eventDigestSha256
    );
  }
});

test("event digest excludes its own commitment field", () => {
  const event = clone(original[0]!);
  const computed = computeAuditEventDigest(event);

  event.eventDigestSha256 = "f".repeat(64);

  assert.equal(
    computeAuditEventDigest(event),
    computed
  );

  const { eventDigestSha256, ...payload } = event;
  void eventDigestSha256;

  assert.equal(
    computed,
    sha256Record("audit-event", payload)
  );
});

test("equivalent event inputs produce deterministic commitments", () => {
  const a = appendAuditEvent(
    [],
    input("event-deterministic"),
    expectation([])
  );

  const b = appendAuditEvent(
    [],
    input("event-deterministic"),
    expectation([])
  );

  assert.equal(
    a[0]!.eventDigestSha256,
    b[0]!.eventDigestSha256
  );
});

test("complete journal verifies against pinned head and count", () => {
  const result = verifyAuditJournal(original, pinned);

  assert.equal(result.valid, true);
  assert.equal(result.eventCount, 3);
  assert.equal(
    result.headDigestSha256,
    pinned.headDigestSha256
  );
});

test("payload modification is detected", () => {
  const changed = clone(original);
  changed[1]!.payload = { synthetic: false };

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "event_digest_mismatch");
});

test("event reordering is rejected", () => {
  const changed = clone(original);

  [changed[0], changed[1]] = [
    changed[1]!,
    changed[0]!
  ];

  assert.equal(
    verifyAuditJournal(changed, pinned).valid,
    false
  );
});

test("missing intermediate event is detected", () => {
  const changed = [original[0]!, original[2]!];

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "event_count_mismatch");
});

test("journal truncation is detected", () => {
  const changed = original.slice(0, 2);

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "event_count_mismatch");
});

test("wrong pinned head is rejected", () => {
  const wrong = {
    ...pinned,
    headDigestSha256: "f".repeat(64)
  };

  const result = verifyAuditJournal(original, wrong);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "journal_head_mismatch");
});

test("recomputed hash chain cannot bypass original pinned head", () => {
  const changed = clone(original);

  changed[1]!.payload = { synthetic: false };
  changed[1]!.eventDigestSha256 =
    computeAuditEventDigest(changed[1]!);

  changed[2]!.previousDigestSha256 =
    changed[1]!.eventDigestSha256;

  changed[2]!.eventDigestSha256 =
    computeAuditEventDigest(changed[2]!);

  // The altered chain is internally consistent under its own head.
  assert.equal(
    verifyAuditJournal(changed, expectation(changed)).valid,
    true
  );

  // It cannot satisfy the independently retained original head.
  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "journal_head_mismatch");
});

test("whole-journal substitution fails against pinned commitment", () => {
  let replacement: AuditEvent[] = [];

  for (const id of ["replacement-001", "replacement-002", "replacement-003"]) {
    replacement = appendAuditEvent(
      replacement,
      input(id),
      expectation(replacement)
    );
  }

  assert.equal(
    verifyAuditJournal(replacement, expectation(replacement)).valid,
    true
  );

  const result = verifyAuditJournal(replacement, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "journal_head_mismatch");
});

test("duplicate event identifier is rejected during verification", () => {
  const changed = clone(original);
  changed[1]!.eventId = changed[0]!.eventId;

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "duplicate_or_invalid_event_id");
});

test("incorrect sequence transition is rejected", () => {
  const changed = clone(original);
  changed[1]!.sequence = 4;

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "sequence_mismatch");
});

test("incorrect predecessor commitment is rejected", () => {
  const changed = clone(original);
  changed[1]!.previousDigestSha256 = "f".repeat(64);

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "previous_digest_mismatch");
});

test("malformed event digest is rejected", () => {
  const changed = clone(original);
  changed[0]!.eventDigestSha256 = "invalid";

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "malformed_event_digest");
});

test("transaction substitution is rejected", () => {
  const changed = clone(original);
  changed[1]!.transactionId = "different-transaction";

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "transaction_binding_mismatch");
});

test("correlation substitution is rejected", () => {
  const changed = clone(original);
  changed[1]!.correlationId = "different-correlation";

  const result = verifyAuditJournal(changed, pinned);

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "transaction_binding_mismatch");
});

test("append refuses duplicate event identifiers", () => {
  assert.throws(
    () => appendAuditEvent(
      original,
      input("event-001"),
      pinned
    )
  );
});

test("append refuses altered existing journal", () => {
  const changed = clone(original);
  changed[0]!.payload = { tampered: true };

  assert.throws(
    () => appendAuditEvent(
      changed,
      input("event-004"),
      pinned
    )
  );
});

test("append refuses stale head commitment", () => {
  const stale = expectation(original.slice(0, 2));

  assert.throws(
    () => appendAuditEvent(
      original,
      input("event-004"),
      stale
    )
  );
});

test("append refuses cross-transaction input", () => {
  const changed = input("event-004");
  changed.transactionId = "different-transaction";

  assert.throws(
    () => appendAuditEvent(
      original,
      changed,
      pinned
    ),
    TypeError
  );
});

test("append returns a new journal without mutating its input", () => {
  const snapshot = clone(original);

  const extended = appendAuditEvent(
    original,
    input("event-004"),
    pinned
  );

  assert.deepEqual(original, snapshot);
  assert.equal(original.length, 3);
  assert.equal(extended.length, 4);

  assert.equal(
    verifyAuditJournal(
      extended,
      expectation(extended)
    ).valid,
    true
  );
});

test("source occurrence and collector observation times remain distinct", () => {
  const event = input("event-timestamps");

  event.sourceEventAt = "2026-11-03T08:59:00Z";
  event.observedAt = "2026-11-03T09:00:00Z";

  const journal = appendAuditEvent(
    [],
    event,
    expectation([])
  );

  assert.equal(
    journal[0]!.sourceEventAt,
    "2026-11-03T08:59:00Z"
  );

  assert.equal(
    journal[0]!.observedAt,
    "2026-11-03T09:00:00Z"
  );
});

test("ambiguous canonical values fail closed during append", () => {
  const event = input("event-invalid-payload");

  event.payload = { fractionalValue: 1.25 };

  assert.throws(
    () => appendAuditEvent(
      [],
      event,
      expectation([])
    ),
    TypeError
  );
});

test("invalid expected head/count relationship is rejected", () => {
  const invalidExpectation = {
    transactionId,
    correlationId,
    eventCount: 3,
    headDigestSha256: null
  };

  const result = verifyAuditJournal(
    original,
    invalidExpectation
  );

  assert.equal(result.valid, false);
  assert.equal(result.reasonCode, "inconsistent_expected_head");
});

test("invalid expected digest format fails closed", () => {
  assert.throws(
    () => verifyAuditJournal(original, {
      ...pinned,
      headDigestSha256: "not-a-digest"
    }),
    TypeError
  );
});
