
/**
 * ProofPath IOT-08B — XDC token-transfer verification tests.
 *
 * All observations and positive assertions are simulated.
 * No live RPC, wallet, token transfer, or production trust
 * authorization is involved.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  digestXdcPaymentPolicy,
  verifyXdcTokenTransfer
} from "../src/verification/xdcTokenTransfer.js";

import type {
  XdcExpectedTransfer,
  XdcPaymentObservation,
  XdcTrustedPaymentPolicy,
  XdcVerificationContext
} from "../src/verification/xdcTypes.js";

const NETWORK = "eip155:51";

const TOKEN =
  "0xb5ab69f7bbada22b28e79c8ffaece55ef1c771d4";

const TX =
  "0xc7d36e42643c270ab70436770bae39c680782b70b6f63f2940a53b9cc2232520";

const BLOCK =
  "0xf04560246430c88fe02cf327d60b9f2dc7070bc0bd1564b70ddece9823d56554";

const FROM =
  "0xa29e266009ccfc899f1135a0fc904b785e8e90b0";

const TO =
  "0x5d778f347eb5fcc0bc04c11624245985b0dbcc21";

const OTHER =
  "0x1111111111111111111111111111111111111111";

const AMOUNT = "10000";
const HEIGHT = "0x51ceee7";
const FINALIZED_HEIGHT = "0x51cf0a5";

const NOW = "2026-11-24T07:00:00.000Z";

function calldata(to: string, amount: bigint): string {
  return "0xa9059cbb" +
    to.slice(2).toLowerCase().padStart(64, "0") +
    amount.toString(16).padStart(64, "0");
}

function policy(): XdcTrustedPaymentPolicy {
  return {
    policyId: "iot08-test-policy",
    policyVersion: "1",
    network: NETWORK,
    approvedTokenContract: TOKEN,
    approvedTokenDecimals: 6,
    trustedNodeEndpoint: "https://rpc.apothem.network/",
    requireSuccessfulExecution: true,
    requireExactTransfer: true,
    requireFinalizedBlock: true,
    requireCanonicalAncestry: true,
    maxObservationAgeSeconds: 300,
    maxFutureSkewSeconds: 30
  };
}

function expected(): XdcExpectedTransfer {
  return {
    network: NETWORK,
    transactionHash: TX,
    tokenContract: TOKEN,
    from: FROM,
    to: TO,
    amountAtomic: AMOUNT,
    decimals: 6
  };
}

function observation(): XdcPaymentObservation {
  return {
    network: NETWORK,
    nodeEndpoint: "https://rpc.apothem.network/",
    observedAt: NOW,

    transaction: {
      transactionHash: TX,
      from: FROM,
      to: TOKEN,
      input: calldata(TO, 10000n),

      blockHash: BLOCK,
      blockNumber: HEIGHT,

      receiptTransactionHash: TX,
      receiptBlockHash: BLOCK,
      receiptBlockNumber: HEIGHT,
      receiptStatus: "0x1",

      blockContainsTransaction: true,
      transferEvidenceComplete: true,

      transfers: [{
        tokenContract: TOKEN,
        transactionHash: TX,
        blockHash: BLOCK,
        logIndex: "0x0",
        from: FROM,
        to: TO,
        amountAtomic: AMOUNT,
        removed: false
      }]
    },

    finality: {
      canonicalBlockHash: BLOCK,
      canonicalBlockNumber: HEIGHT,
      finalizedBlockHash:
        "0x" + "22".repeat(32),
      finalizedBlockNumber: FINALIZED_HEIGHT,
      canonicalAncestryReported: true
    },

    tokenSemantics: {
      contractCodePresentAtBlock: true,
      historicalImplementationReference:
        "iot08-synthetic-implementation-reference",
      supportedTransferSemanticsReported: true
    }
  };
}

function fixture(): XdcVerificationContext {
  const p = policy();

  return {
    environment: "simulated_test_only",
    policy: p,
    expected: expected(),
    observation: observation(),
    trustedPolicyDigest: digestXdcPaymentPolicy(p),
    now: () => new Date(NOW)
  };
}

test("T01: matching simulated transfer remains indeterminate without source trust", () => {
  const result = verifyXdcTokenTransfer(fixture());

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "simulated_checks_passed_trust_unestablished"
  );
  assert.equal(result.environment, "simulated_test_only");
  assert.equal(result.liveAssuranceEstablished, false);
  assert.equal(result.consensusIndependentlyVerified, false);

  assert.equal(result.obligations.execution, "satisfied");
  assert.equal(result.obligations.transfer, "satisfied");
  assert.equal(result.obligations.finality, "satisfied");

  // Simulation must not masquerade as authenticated source trust.
  assert.equal(result.obligations.sourceTrust, "indeterminate");

  assert.ok(result.limitations.includes("simulation_only"));
  assert.ok(
    result.limitations.includes(
      "commercial_payment_purpose_not_established"
    )
  );
});

test("T02: unexpected transaction token contract fails", () => {
  const ctx = fixture();
  ctx.observation.transaction.to = OTHER;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "token_contract_mismatch");
  assert.equal(result.liveAssuranceEstablished, false);
});

test("T03: wrong calldata recipient fails", () => {
  const ctx = fixture();
  ctx.observation.transaction.input =
    calldata(OTHER, 10000n);

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "calldata_transfer_mismatch");
});

test("T04: wrong atomic amount fails", () => {
  const ctx = fixture();
  ctx.observation.transaction.input =
    calldata(TO, 9999n);

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "calldata_transfer_mismatch");
});

test("T05: reverted transaction fails", () => {
  const ctx = fixture();
  ctx.observation.transaction.receiptStatus = "0x0";

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "transaction_reverted");
});

test("T06: missing policy approval commitment is indeterminate", () => {
  const ctx = fixture();
  ctx.trustedPolicyDigest = "";

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "policy_digest_mismatch");
});

test("T07: unapproved live source cannot produce verification", () => {
  const ctx = {
    ...fixture(),
    environment: "unapproved_live" as const
  };

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "live_trust_gates_not_approved"
  );
  assert.equal(result.liveAssuranceEstablished, false);
});

test("T08: missing finalized checkpoint is indeterminate", () => {
  const ctx = fixture();
  ctx.observation.finality.finalizedBlockHash = null;
  ctx.observation.finality.finalizedBlockNumber = null;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "finality_evidence_missing");
});

test("T09: missing canonical ancestry is indeterminate", () => {
  const ctx = fixture();
  ctx.observation.finality.canonicalAncestryReported = false;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "finalized_ancestry_unresolved");
});

test("T10: missing historical token semantics is indeterminate", () => {
  const ctx = fixture();

  ctx.observation.tokenSemantics
    .historicalImplementationReference = null;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "token_semantics_unresolved");
});

test("T11: transaction-to-receipt binding mismatch fails", () => {
  const ctx = fixture();

  ctx.observation.transaction.receiptTransactionHash =
    "0x" + "33".repeat(32);

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "transaction_binding_mismatch");
});

test("T12: unsupported calldata is indeterminate", () => {
  const ctx = fixture();
  ctx.observation.transaction.input = "0x12345678";

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "unsupported_transfer_calldata");
});

test("T13: stale source observation is indeterminate", () => {
  const ctx = fixture();

  ctx.observation.observedAt =
    "2026-11-23T07:00:00.000Z";

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(
    result.reasonCode,
    "observation_time_out_of_policy"
  );
});

test("T14: contradictory transfer log fails", () => {
  const ctx = fixture();

  ctx.observation.transaction.transfers[0]!.to = OTHER;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "failed");
  assert.equal(result.reasonCode, "transfer_log_mismatch");
});

test("T15: incomplete transfer evidence is indeterminate", () => {
  const ctx = fixture();

  ctx.observation.transaction.transferEvidenceComplete = false;

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "transfer_evidence_incomplete");
});

test("T16: multiple transfer effects cannot silently pass", () => {
  const ctx = fixture();

  ctx.observation.transaction.transfers.push({
    ...ctx.observation.transaction.transfers[0]!,
    logIndex: "0x1"
  });

  const result = verifyXdcTokenTransfer(ctx);

  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "transfer_evidence_incomplete");
});

test("unapproved live mode remains closed even with valid data", () => {
  const ctx = {
    ...fixture(),
    environment: "unapproved_live" as const
  };

  const result = verifyXdcTokenTransfer(ctx);

  assert.notEqual(result.status, "verified");
  assert.equal(result.liveAssuranceEstablished, false);
  assert.equal(result.consensusIndependentlyVerified, false);
});
