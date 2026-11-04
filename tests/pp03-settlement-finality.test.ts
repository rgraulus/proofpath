/**
 * ProofPath PP-03 M3.3 — Synthetic settlement verification tests.
 *
 * No real node, live transaction or independently verified
 * consensus is represented by these fixtures.
 */

import assert from "node:assert/strict";
import { AccountAddress } from "@concordium/web-sdk";
import { test } from "node:test";

import {
  digestSettlementPolicy,
  verifySettlementFinality
} from "../src/verification/settlementFinality.js";

import {
  normalizeSettlementExecution
} from "../src/adapters/concordium/settlementFinality.js";

import * as sdk from "@concordium/web-sdk";

import type {
  ExpectedSettlementPayment,
  SettlementObservation,
  SettlementVerificationContext,
  SettlementTransport,
  TrustedSettlementPolicy
} from "../src/verification/types.js";

const NOW = new Date("2026-11-04T17:00:00.000Z");

const GENESIS = "a".repeat(64);
const TX = "b".repeat(64);
const BLOCK = "c".repeat(64);

function syntheticAddress(seed: number): string {
  const bytes = new Uint8Array(32);
  bytes[0] = seed;
  return AccountAddress.fromBuffer(bytes.buffer).toString();
}

const RECIPIENT = syntheticAddress(4);
const SENDER = syntheticAddress(5);
const OTHER = syntheticAddress(6);

const ENDPOINT = "https://synthetic-node.example:20000/";

function policy(): TrustedSettlementPolicy {
  return {
    policyId: "synthetic:pp03-m33",
    policyVersion: "1",
    network: "concordium:testnet",
    expectedGenesisHash: GENESIS,
    trustedNodeEndpoint: ENDPOINT,
    maxObservationAgeSeconds: 300,
    maxFutureSkewSeconds: 10,
    requireFinalizedBlock: true
  };
}

function expected(): ExpectedSettlementPayment {
  return {
    network: "concordium:testnet",
    transactionHash: TX,
    tokenId: "EUDemo",
    decimals: 6,
    amountRaw: "50101",
    payTo: RECIPIENT,
    from: SENDER
  };
}

function observation(): SettlementObservation {
  return {
    network: "concordium:testnet",
    genesisHash: GENESIS,
    nodeEndpoint: ENDPOINT,
    transactionHash: TX,
    transactionStatus: "finalized",
    executionStatus: "success",
    blockHash: BLOCK,
    blockHeight: "123456",
    blockTimestamp: "2026-11-04T16:59:30.000Z",
    blockFinalized: true,
    observedAt: "2026-11-04T16:59:40.000Z",
    executionEvidenceComplete: true,
    transfers: [{
      tokenId: "EUDemo",
      from: SENDER,
      to: RECIPIENT,
      decimals: 6,
      amountRaw: "50101"
    }]
  };
}

function context(
  overrides: {
    policy?: TrustedSettlementPolicy;
    expected?: ExpectedSettlementPayment;
    observation?: SettlementObservation;
    trustedPolicyDigest?: string;
    now?: Date;
    transport?: SettlementTransport;
  } = {}
): SettlementVerificationContext {
  const selectedPolicy = overrides.policy ?? policy();

  return {
    policy: selectedPolicy,
    trustedPolicyDigest:
      overrides.trustedPolicyDigest ??
      digestSettlementPolicy(selectedPolicy),
    expected: overrides.expected ?? expected(),
    transport: overrides.transport ?? {
      async readSettlement() {
        return overrides.observation ?? observation();
      }
    },
    now: () => overrides.now ?? NOW
  };
}

async function decision(
  input: SettlementVerificationContext,
  status: "verified" | "failed" | "indeterminate",
  reasonCode: string
): Promise<void> {
  const result = await verifySettlementFinality(input);

  assert.equal(result.status, status);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(
    result.claim,
    "finalized_plt_transfer_matches_expected_payment"
  );
  assert.equal(
    result.assuranceModel,
    "trusted_node_finalized_plt_transfer_v1"
  );
  assert.equal(result.consensusIndependentlyVerified, false);

  if (status !== "verified") {
    assert.equal(
      result.expectedPltTransferMatched,
      false
    );
  }
}

test("M3.3: policy commitment is deterministic", () => {
  const a = digestSettlementPolicy(policy());
  const b = digestSettlementPolicy(policy());

  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("M3.3: finalized successful exact PLT transfer verifies", async () => {
  const result = await verifySettlementFinality(context());

  assert.equal(result.status, "verified");
  assert.equal(
    result.reasonCode,
    "trusted_node_finalized_plt_transfer_verified"
  );
  assert.equal(result.transactionFinalized, true);
  assert.equal(result.transactionExecutionSucceeded, true);
  assert.equal(result.expectedPltTransferMatched, true);
  assert.equal(result.blockHash, BLOCK);
  assert.equal(result.blockHeight, "123456");
  assert.equal(result.consensusIndependentlyVerified, false);
});

test("M3.3: wrong trusted policy digest is indeterminate", async () => {
  await decision(
    context({ trustedPolicyDigest: "f".repeat(64) }),
    "indeterminate",
    "trusted_policy_digest_mismatch"
  );
});

test("M3.3: policy substitution does not preserve anchor", async () => {
  const configured = policy();
  const anchored = digestSettlementPolicy(configured);

  configured.expectedGenesisHash = "d".repeat(64);

  await decision(
    context({
      policy: configured,
      trustedPolicyDigest: anchored
    }),
    "indeterminate",
    "trusted_policy_digest_mismatch"
  );
});

test("M3.3: invalid policy never invokes transport", async () => {
  const configured = policy();
  configured.trustedNodeEndpoint = "http://synthetic-node.example/";

  let calls = 0;

  const result = await verifySettlementFinality({
    policy: configured,
    trustedPolicyDigest: "f".repeat(64),
    expected: expected(),
    transport: {
      async readSettlement() {
        calls++;
        return observation();
      }
    },
    now: () => NOW
  });

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "settlement_policy_invalid");
  assert.equal(calls, 0);
});

test("M3.3: expected network mismatch is failed", async () => {
  const payment = expected();
  payment.network = "concordium:mainnet";

  await decision(
    context({ expected: payment }),
    "failed",
    "settlement_network_mismatch"
  );
});

test("M3.3: invalid expected payment fails before transport", async () => {
  const payment = expected();
  payment.amountRaw = "50.101";

  let calls = 0;

  const input = context({
    expected: payment,
    transport: {
      async readSettlement() {
        calls++;
        return observation();
      }
    }
  });

  await decision(
    input,
    "indeterminate",
    "expected_settlement_invalid"
  );

  assert.equal(calls, 0);
});

test("M3.3: observed node endpoint mismatch fails", async () => {
  const actual = observation();
  actual.nodeEndpoint = "https://other-node.example:20000/";

  await decision(
    context({ observation: actual }),
    "failed",
    "settlement_node_endpoint_mismatch"
  );
});

test("M3.3: observed genesis mismatch fails", async () => {
  const actual = observation();
  actual.genesisHash = "d".repeat(64);

  await decision(
    context({ observation: actual }),
    "failed",
    "settlement_genesis_mismatch"
  );
});

test("M3.3: observed transaction hash mismatch fails", async () => {
  const actual = observation();
  actual.transactionHash = "d".repeat(64);

  await decision(
    context({ observation: actual }),
    "failed",
    "settlement_transaction_hash_mismatch"
  );
});

test("M3.3: received transaction is not verified", async () => {
  const actual = observation();
  actual.transactionStatus = "received";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "transaction_not_finalized"
  );
});

test("M3.3: committed transaction is not verified", async () => {
  const actual = observation();
  actual.transactionStatus = "committed";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "transaction_not_finalized"
  );
});

test("M3.3: missing finalized block evidence is indeterminate", async () => {
  const actual = observation();
  actual.blockHash = null;

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "finalized_block_evidence_missing"
  );
});

test("M3.3: explicitly unfinalized block fails", async () => {
  const actual = observation();
  actual.blockFinalized = false;

  await decision(
    context({ observation: actual }),
    "failed",
    "finalized_block_not_confirmed"
  );
});

test("M3.3: rejected transaction cannot verify settlement", async () => {
  const actual = observation();
  actual.executionStatus = "rejected";

  await decision(
    context({ observation: actual }),
    "failed",
    "settlement_execution_rejected"
  );
});

test("M3.3: unknown execution remains indeterminate", async () => {
  const actual = observation();
  actual.executionStatus = "unknown";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_execution_unknown"
  );
});

test("M3.3: incomplete event set remains indeterminate", async () => {
  const actual = observation();
  actual.executionEvidenceComplete = false;

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_events_incomplete"
  );
});

test("M3.3: wrong token ID fails", async () => {
  const actual = observation();
  actual.transfers[0]!.tokenId = "OtherToken";

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: wrong recipient fails", async () => {
  const actual = observation();
  actual.transfers[0]!.to = OTHER;

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: wrong sender fails when expected", async () => {
  const actual = observation();
  actual.transfers[0]!.from = OTHER;

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: wrong decimal precision fails", async () => {
  const actual = observation();
  actual.transfers[0]!.decimals = 5;

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: single raw unit mismatch fails", async () => {
  const actual = observation();
  actual.transfers[0]!.amountRaw = "50102";

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: unrelated complete PLT event is allowed", async () => {
  const actual = observation();

  actual.transfers.push({
    tokenId: "OtherToken",
    from: SENDER,
    to: RECIPIENT,
    decimals: 6,
    amountRaw: "1"
  });

  await decision(
    context({ observation: actual }),
    "verified",
    "trusted_node_finalized_plt_transfer_verified"
  );
});

test("M3.3: duplicate matching transfers are ambiguous", async () => {
  const actual = observation();
  actual.transfers.push({ ...actual.transfers[0]! });

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_transfer_ambiguous"
  );
});

test("M3.3: unknown holder prevents positive verification", async () => {
  const actual = observation();
  actual.transfers[0]!.to = null;

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_transfer_undecodable"
  );
});

test("M3.3: missing matching transfer fails when complete", async () => {
  const actual = observation();
  actual.transfers = [];

  await decision(
    context({ observation: actual }),
    "failed",
    "expected_plt_transfer_not_found"
  );
});

test("M3.3: stale observation remains indeterminate", async () => {
  const actual = observation();
  actual.observedAt = "2026-11-04T16:45:00.000Z";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_observation_stale"
  );
});

test("M3.3: inconsistent block timestamp remains indeterminate", async () => {
  const actual = observation();
  actual.blockTimestamp = "2026-11-04T17:02:00.000Z";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_block_time_inconsistent"
  );
});

test("M3.3: transport error remains indeterminate", async () => {
  await decision(
    context({
      transport: {
        async readSettlement() {
          throw new Error("synthetic_transport_failure");
        }
      }
    }),
    "indeterminate",
    "settlement_transport_unavailable"
  );
});

test("M3.3: invalid clock remains indeterminate", async () => {
  await decision(
    context({ now: new Date(Number.NaN) }),
    "indeterminate",
    "verification_clock_invalid"
  );
});

test("M3.3: malformed observation remains indeterminate", async () => {
  const actual = observation();
  actual.blockHeight = "-1";

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_observation_invalid"
  );
});

test("M3.3: policy and expected payment are not mutated", async () => {
  const input = context();

  const beforePolicy = JSON.stringify(input.policy);
  const beforeExpected = JSON.stringify(input.expected);

  await verifySettlementFinality(input);

  assert.equal(JSON.stringify(input.policy), beforePolicy);
  assert.equal(JSON.stringify(input.expected), beforeExpected);
});

test("M3.3: synthetic transport cannot independently verify consensus", async () => {
  const result = await verifySettlementFinality(context());

  assert.equal(result.status, "verified");
  assert.equal(result.consensusIndependentlyVerified, false);
});


test("M3.3: invalid expected account checksum blocks transport", async () => {
  const payment = expected();
  payment.payTo = "4".repeat(50);

  let calls = 0;

  const input = context({
    expected: payment,
    transport: {
      async readSettlement() {
        calls++;
        return observation();
      }
    }
  });

  await decision(
    input,
    "indeterminate",
    "expected_settlement_invalid"
  );

  assert.equal(calls, 0);
});

test("M3.3: invalid observed account checksum fails closed", async () => {
  const actual = observation();
  actual.transfers[0]!.to = "4".repeat(50);

  await decision(
    context({ observation: actual }),
    "indeterminate",
    "settlement_observation_invalid"
  );
});


// SDK-shaped execution fixtures. No Concordium node is contacted.

function sdkTransfer(
  overrides: Record<string, unknown> = {}
): any {
  return {
    tag: sdk.TransactionEventTag.TokenTransfer,
    tokenId: sdk.TokenId.fromString("EUDemo"),
    from: sdk.TokenHolder.fromBase58(SENDER),
    to: sdk.TokenHolder.fromBase58(RECIPIENT),
    amount: sdk.TokenAmount.fromDecimal("0.050101", 6),
    ...overrides
  };
}

function sdkSummary(
  transactionType = "tokenUpdate",
  events: unknown[] = [sdkTransfer()]
): any {
  return {
    type: sdk.TransactionSummaryType.AccountTransaction,
    hash: sdk.TransactionHash.fromHexString(TX),
    transactionType,
    events
  };
}

test("M3.3 adapter: exact SDK transfer normalizes", () => {
  const result = normalizeSettlementExecution(
    sdkSummary(), TX, sdk
  );

  assert.equal(result.executionStatus, "success");
  assert.equal(result.executionEvidenceComplete, true);
  assert.deepEqual(result.transfers, [{
    tokenId: "EUDemo",
    from: SENDER,
    to: RECIPIENT,
    decimals: 6,
    amountRaw: "50101"
  }]);
});

test("M3.3 adapter: failed transaction is rejected", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("failed", []), TX, sdk
  );
  assert.equal(result.executionStatus, "rejected");
  assert.deepEqual(result.transfers, []);
});

test("M3.3 adapter: missing summary is unknown", () => {
  const result = normalizeSettlementExecution(null, TX, sdk);
  assert.equal(result.executionStatus, "unknown");
  assert.equal(result.executionEvidenceComplete, false);
});

test("M3.3 adapter: wrong transaction hash throws", () => {
  const summary = sdkSummary();
  summary.hash = sdk.TransactionHash.fromHexString(
    "d".repeat(64)
  );

  assert.throws(
    () => normalizeSettlementExecution(summary, TX, sdk),
    /settlement_summary_hash_mismatch/
  );
});

test("M3.3 adapter: non-account summary is unknown", () => {
  const summary = sdkSummary();
  summary.type = sdk.TransactionSummaryType.AccountCreation;

  const result = normalizeSettlementExecution(
    summary, TX, sdk
  );
  assert.equal(result.executionStatus, "unknown");
});

test("M3.3 adapter: non-token transaction is unknown", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("transfer", []), TX, sdk
  );
  assert.equal(result.executionStatus, "unknown");
});

test("M3.3 adapter: missing events are incomplete", () => {
  const summary = sdkSummary();
  summary.events = null;

  const result = normalizeSettlementExecution(
    summary, TX, sdk
  );
  assert.equal(result.executionEvidenceComplete, false);
});

test("M3.3 adapter: null event is incomplete", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("tokenUpdate", [sdkTransfer(), null]),
    TX, sdk
  );
  assert.equal(result.executionEvidenceComplete, false);
});

test("M3.3 adapter: unsupported event is incomplete", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("tokenUpdate", [
      sdkTransfer(),
      { tag: "UnknownTokenEvent" }
    ]),
    TX, sdk
  );
  assert.equal(result.executionEvidenceComplete, false);
});

test("M3.3 adapter: malformed PLT amount throws", () => {
  assert.throws(
    () => normalizeSettlementExecution(
      sdkSummary("tokenUpdate", [
        sdkTransfer({
          amount: { value: "50101", decimals: 6 }
        })
      ]),
      TX, sdk
    ),
    /invalid_plt_transfer_encoding/
  );
});

test("M3.3 adapter: duplicate transfers remain distinct", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("tokenUpdate", [
      sdkTransfer(), sdkTransfer()
    ]),
    TX, sdk
  );

  assert.equal(result.transfers.length, 2);
});

test("M3.3 adapter: unknown recipient is incomplete", () => {
  const result = normalizeSettlementExecution(
    sdkSummary("tokenUpdate", [
      sdkTransfer({ to: null })
    ]),
    TX, sdk
  );

  assert.equal(result.executionEvidenceComplete, false);
});
