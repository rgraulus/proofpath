
/**
 * ProofPath Hackathon — Offline Settlement Boundary Tests
 *
 * All observations and trust policies are SYNTHETIC.
 * A locally generated policy digest is acceptable for
 * isolated testing, never as evidence of real-world approval.
 *
 * No live node, database, wallet or payment execution.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  digestSettlementPolicy,
  verifySettlementFinality
} from "@proofpath/core/concordium";

import type {
  ExpectedSettlementPayment,
  SettlementObservation,
  TrustedSettlementPolicy
} from "@proofpath/core/concordium";

// Valid address used only as synthetic fixture data.
const TEST_ACCOUNT = "4Wx1vpgAfpE6k9ksmtYaH6z4iQN61LFFRUgbbG6gDro1ziKNL7";

const TX = "a".repeat(64);
const GENESIS = "b".repeat(64);
const BLOCK = "c".repeat(64);
const ENDPOINT = "https://example.com/";

const NOW = new Date("2026-11-20T20:00:00.000Z");

const policy: TrustedSettlementPolicy = {
  policyId: "hackathon-synthetic-settlement-test",
  policyVersion: "1.0.0",
  network: "concordium:testnet",
  expectedGenesisHash: GENESIS,
  trustedNodeEndpoint: ENDPOINT,
  maxObservationAgeSeconds: 300,
  maxFutureSkewSeconds: 10,
  requireFinalizedBlock: true
};

const expected: ExpectedSettlementPayment = {
  network: "concordium:testnet",
  transactionHash: TX,
  tokenId: "EUDemo",
  decimals: 6,
  amountRaw: "50101",
  payTo: TEST_ACCOUNT
};

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
    blockTimestamp: "2026-08-22T05:17:26.000Z",
    blockFinalized: true,
    observedAt: "2026-11-20T19:59:40.000Z",
    executionEvidenceComplete: true,
    transfers: [{
      tokenId: "EUDemo",
      from: TEST_ACCOUNT,
      to: TEST_ACCOUNT,
      decimals: 6,
      amountRaw: "50101"
    }]
  };
}

async function assess(
  supplied: SettlementObservation
) {
  return verifySettlementFinality({
    policy,
    trustedPolicyDigest: digestSettlementPolicy(policy),
    expected,
    transport: {
      async readSettlement() {
        return structuredClone(supplied);
      }
    },
    now: () => new Date(NOW.getTime())
  });
}

test("offline: finalized matching transfer is verified under synthetic trust", async () => {
  const result = await assess(observation());

  assert.equal(result.status, "verified");
  assert.equal(result.expectedPltTransferMatched, true);
  assert.equal(result.consensusIndependentlyVerified, false);
});

test("offline: changed amount cannot establish positive settlement", async () => {
  const altered = observation();
  altered.transfers[0]!.amountRaw = "50102";

  const result = await assess(altered);

  assert.notEqual(result.status, "verified");
  assert.equal(result.expectedPltTransferMatched, false);
});

test("offline: recorded finality without complete execution evidence is insufficient", async () => {
  const altered = observation();
  altered.executionEvidenceComplete = false;

  const result = await assess(altered);

  assert.notEqual(result.status, "verified");
  assert.equal(result.expectedPltTransferMatched, false);
});

test("offline: old transaction with fresh observation is assessable", async () => {
  const result = await assess(observation());

  assert.equal(result.status, "verified");
  assert.equal(result.consensusIndependentlyVerified, false);
});
