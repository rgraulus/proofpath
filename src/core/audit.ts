/**
 * ProofPath PP-01 — Hash-linked audit journal v1.
 *
 * This module verifies deterministic commitments and journal
 * continuity. It does not authenticate event producers, prove
 * event timestamps, guarantee capture completeness, or provide
 * immutable storage.
 *
 * The expected journal head/count must be retained independently
 * of the journal being checked.
 */

import type { AuditEvent } from "./types.js";
import {
  sha256Record,
  verifySha256Digest
} from "./hash.js";

export type AuditEventInput = Omit<
  AuditEvent,
  "sequence" | "previousDigestSha256" | "eventDigestSha256"
>;

export interface AuditJournalExpectation {
  transactionId: string;
  correlationId: string;
  eventCount: number;
  headDigestSha256: string | null;
}

export interface AuditJournalVerification {
  valid: boolean;
  eventCount: number;
  headDigestSha256: string | null;
  reasonCode: string | null;
  failedIndex: number | null;
}

const DIGEST = /^[0-9a-f]{64}$/;

function isDigest(value: unknown): value is string {
  return typeof value === "string" && DIGEST.test(value);
}

function invalid(
  eventCount: number,
  headDigestSha256: string | null,
  reasonCode: string,
  failedIndex: number | null
): AuditJournalVerification {
  return {
    valid: false,
    eventCount,
    headDigestSha256,
    reasonCode,
    failedIndex
  };
}

/**
 * Compute an event commitment without including its own digest.
 *
 * Hash input:
 * domain-separated SHA-256 of the canonical event object,
 * with the eventDigestSha256 property excluded.
 */
export function computeAuditEventDigest(
  event: AuditEvent
): string {
  if (
    event === null ||
    typeof event !== "object" ||
    Array.isArray(event)
  ) {
    throw new TypeError("Invalid audit event");
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      event,
      "eventDigestSha256"
    )
  ) {
    throw new TypeError("Missing event digest field");
  }

  const { eventDigestSha256, ...payload } = event;
  void eventDigestSha256;

  return sha256Record("audit-event", payload);
}

/**
 * Verify a complete journal against an externally supplied
 * expected event count and head commitment.
 *
 * An internally consistent journal without a trusted external
 * expectation is not independently authenticated.
 */
export function verifyAuditJournal(
  events: readonly AuditEvent[],
  expected: AuditJournalExpectation
): AuditJournalVerification {
  if (!Array.isArray(events)) {
    throw new TypeError("Journal must be an array");
  }

  if (
    !expected ||
    typeof expected.transactionId !== "string" ||
    expected.transactionId.length === 0 ||
    typeof expected.correlationId !== "string" ||
    expected.correlationId.length === 0 ||
    !Number.isSafeInteger(expected.eventCount) ||
    expected.eventCount < 0 ||
    !(
      expected.headDigestSha256 === null ||
      isDigest(expected.headDigestSha256)
    )
  ) {
    throw new TypeError("Invalid journal expectation");
  }

  const count = events.length;
  const head = count === 0
    ? null
    : (events[count - 1]?.eventDigestSha256 ?? null);

  if (
    (expected.eventCount === 0) !==
    (expected.headDigestSha256 === null)
  ) {
    return invalid(
      count,
      head,
      "inconsistent_expected_head",
      null
    );
  }

  if (count !== expected.eventCount) {
    return invalid(
      count,
      head,
      "event_count_mismatch",
      null
    );
  }

  const seenIds = new Set<string>();
  let previous: string | null = null;

  for (let index = 0; index < count; index++) {
    const event = events[index];

    if (!event || typeof event !== "object") {
      return invalid(
        count, head, "malformed_event", index
      );
    }

    if (
      !Number.isSafeInteger(event.sequence) ||
      event.sequence !== index + 1
    ) {
      return invalid(
        count, head, "sequence_mismatch", index
      );
    }

    if (
      typeof event.eventId !== "string" ||
      event.eventId.length === 0 ||
      seenIds.has(event.eventId)
    ) {
      return invalid(
        count, head, "duplicate_or_invalid_event_id", index
      );
    }

    seenIds.add(event.eventId);

    if (
      event.transactionId !== expected.transactionId ||
      event.correlationId !== expected.correlationId
    ) {
      return invalid(
        count, head, "transaction_binding_mismatch", index
      );
    }

    if (event.previousDigestSha256 !== previous) {
      return invalid(
        count, head, "previous_digest_mismatch", index
      );
    }

    if (!isDigest(event.eventDigestSha256)) {
      return invalid(
        count, head, "malformed_event_digest", index
      );
    }

    let computed: string;

    try {
      computed = computeAuditEventDigest(event);
    } catch {
      return invalid(
        count, head, "event_canonicalization_failed", index
      );
    }

    if (
      !verifySha256Digest(
        computed,
        event.eventDigestSha256
      )
    ) {
      return invalid(
        count, head, "event_digest_mismatch", index
      );
    }

    previous = event.eventDigestSha256;
  }

  if (head !== expected.headDigestSha256) {
    return invalid(
      count, head, "journal_head_mismatch", null
    );
  }

  return {
    valid: true,
    eventCount: count,
    headDigestSha256: head,
    reasonCode: null,
    failedIndex: null
  };
}

/**
 * Append one event after verifying the entire preceding journal.
 *
 * The caller must provide a trusted expectation for the
 * pre-append journal, including its head and event count.
 *
 * Returns a new array; the supplied journal is not modified.
 * No persistent storage or atomic disk append is performed.
 */
export function appendAuditEvent(
  events: readonly AuditEvent[],
  input: AuditEventInput,
  expectedBefore: AuditJournalExpectation
): AuditEvent[] {
  const verification = verifyAuditJournal(
    events,
    expectedBefore
  );

  if (!verification.valid) {
    throw new Error(
      "Audit journal precondition failed: " +
      verification.reasonCode
    );
  }

  if (!input || typeof input !== "object") {
    throw new TypeError("Invalid event input");
  }

  if (
    input.transactionId !== expectedBefore.transactionId ||
    input.correlationId !== expectedBefore.correlationId
  ) {
    throw new TypeError("New event transaction binding mismatch");
  }

  if (
    typeof input.eventId !== "string" ||
    input.eventId.length === 0 ||
    events.some(event => event.eventId === input.eventId)
  ) {
    throw new TypeError("Duplicate or invalid new event ID");
  }

  const copiedInput = structuredClone(input);

  const newEvent: AuditEvent = {
    ...copiedInput,
    sequence: events.length + 1,
    previousDigestSha256: expectedBefore.headDigestSha256,
    eventDigestSha256: "0".repeat(64)
  };

  newEvent.eventDigestSha256 = computeAuditEventDigest(
    newEvent
  );

  const result = [
    ...events.map(event => structuredClone(event)),
    newEvent
  ];

  const verified = verifyAuditJournal(result, {
    transactionId: expectedBefore.transactionId,
    correlationId: expectedBefore.correlationId,
    eventCount: result.length,
    headDigestSha256: newEvent.eventDigestSha256
  });

  if (!verified.valid) {
    throw new Error(
      "New audit journal verification failed: " +
      verified.reasonCode
    );
  }

  return result;
}
