/**
 * ProofPath PP-04-C / C-08B.
 *
 * Deterministic, offline-only CRP candidate mapping tests.
 * No network, wallet, node or service execution.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  mapC08BCrpSearchResponse
} from "../src/application/pp04/testnetSource.js";

import type {
  C08BExpectedCrpPayment
} from "../src/application/pp04/testnetSource.js";

import {
  getC08BActivationDecision
} from "../src/application/pp04/testnetConfig.js";

import {
  runC08BLiveAcquisition,
  runC08BOfflineEvaluation
} from "../src/application/pp04/testnetRunner.js";

const expected: C08BExpectedCrpPayment = {
  merchantId: "demo-merchant",
  nonce: "test-controlled-nonce",
  network: "concordium:testnet",
  asset: {
    type: "PLT",
    tokenId: "EUDemo",
    decimals: 6
  },
  amount: "0.050101",
  payTo: "trusted-recipient"
};

function challenge() {
  return {
    merchant_id: expected.merchantId,
    nonce: expected.nonce,
    network: expected.network,
    asset: { ...expected.asset },
    amount: expected.amount,
    pay_to: expected.payTo,
    status: "fulfilled",
    receipt: {
      jws: "YWJj.ZGVm.Z2hp",
      payload: { untrusted: true }
    }
  };
}

function search(...matches: unknown[]) {
  return { ok: true, matches };
}

test("C08B: unique matching JWS is candidate only", () => {
  const result = mapC08BCrpSearchResponse(
    expected, search(challenge())
  );

  assert.equal(result.status, "candidate");

  if (result.status !== "candidate") {
    assert.fail("Expected candidate");
  }

  assert.equal(result.reasonCode, "unique_receipt_candidate");
  assert.equal(result.receiptAuthenticated, false);
  assert.equal(result.settlementIndependentlyVerified, false);
  assert.equal(result.jws, "YWJj.ZGVm.Z2hp");
});

test("C08B: candidate ignores untrusted receipt payload", () => {
  const row = challenge();
  row.receipt.payload = {
    untrusted: true,
    settlementFinalized: true,
    signatureValid: true
  } as { untrusted: boolean };

  const result = mapC08BCrpSearchResponse(
    expected, search(row)
  );

  assert.equal(result.status, "candidate");

  if (result.status === "candidate") {
    assert.equal(result.receiptAuthenticated, false);
    assert.equal(result.settlementIndependentlyVerified, false);
  }
});

test("C08B: repeated mapping is deterministic", () => {
  const response = search(challenge());

  assert.deepEqual(
    mapC08BCrpSearchResponse(expected, response),
    mapC08BCrpSearchResponse(expected, response)
  );
});

test("C08B: mapping does not mutate observations", () => {
  const response = search(challenge());
  const before = structuredClone(response);

  mapC08BCrpSearchResponse(expected, response);

  assert.deepEqual(response, before);
});

test("C08B: absent matching challenge is unavailable", () => {
  const result = mapC08BCrpSearchResponse(
    expected, search()
  );

  assert.deepEqual(result, {
    status: "unavailable",
    reasonCode: "challenge_not_found"
  });
});

test("C08B: unrelated nonce is not correlated", () => {
  const row = challenge();
  row.nonce = "different-nonce";

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: unrelated recipient is not correlated", () => {
  const row = challenge();
  row.pay_to = "different-recipient";

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: unrelated amount is not correlated", () => {
  const row = challenge();
  row.amount = "0.050102";

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: unrelated network is not correlated", () => {
  const row = challenge();
  row.network = "concordium:mainnet";

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: unrelated token is not correlated", () => {
  const row = challenge();
  row.asset.tokenId = "OtherToken";

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: pending challenge remains unavailable", () => {
  const row = challenge();
  row.status = "pending";

  assert.deepEqual(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ),
    {
      status: "unavailable",
      reasonCode: "receipt_not_available"
    }
  );
});

test("C08B: null receipt remains unavailable", () => {
  const row = {
    ...challenge(),
    receipt: null
  };

  assert.equal(
    mapC08BCrpSearchResponse(
      expected, search(row)
    ).status,
    "unavailable"
  );
});

test("C08B: duplicate matching records are rejected", () => {
  assert.deepEqual(
    mapC08BCrpSearchResponse(
      expected,
      search(challenge(), challenge())
    ),
    {
      status: "rejected",
      reasonCode: "ambiguous_challenge_records"
    }
  );
});

test("C08B: malformed unrelated row fails closed", () => {
  assert.deepEqual(
    mapC08BCrpSearchResponse(
      expected,
      search(challenge(), { nonce: "other" })
    ),
    {
      status: "rejected",
      reasonCode: "invalid_challenge_record"
    }
  );
});

test("C08B: malformed search envelope is rejected", () => {
  for (const value of [
    null,
    {},
    { ok: false, matches: [] },
    { ok: true, matches: {} }
  ]) {
    assert.deepEqual(
      mapC08BCrpSearchResponse(expected, value),
      {
        status: "rejected",
        reasonCode: "invalid_search_response"
      }
    );
  }
});

test("C08B: malformed compact JWS is rejected", () => {
  for (const jws of [
    "",
    "one",
    "one.two",
    "one..three",
    "one.two.three.four",
    "one.two.invalid+base64"
  ]) {
    const row = challenge();
    row.receipt.jws = jws;

    assert.deepEqual(
      mapC08BCrpSearchResponse(
        expected, search(row)
      ),
      {
        status: "rejected",
        reasonCode: "invalid_receipt_shape"
      }
    );
  }
});

test("C08B: invalid trusted expectations are rejected", () => {
  const invalid = {
    ...expected,
    network: "concordium:mainnet"
  };

  assert.deepEqual(
    mapC08BCrpSearchResponse(
      invalid, search(challenge())
    ),
    {
      status: "rejected",
      reasonCode: "invalid_expected_payment"
    }
  );
});

test("C08B: wrong PLT precision is rejected", () => {
  const invalid = {
    ...expected,
    asset: {
      ...expected.asset,
      decimals: 8
    }
  };

  assert.equal(
    mapC08BCrpSearchResponse(
      invalid, search(challenge())
    ).status,
    "rejected"
  );
});

test("C08B: default operational activation is denied", () => {
  assert.deepEqual(getC08BActivationDecision(), {
    allowed: false,
    reason: "c08b_live_acquisition_not_authorized"
  });
});

test("C08B: live acquisition always throws", () => {
  assert.throws(
    () => runC08BLiveAcquisition(),
    /c08b_live_acquisition_not_authorized/
  );
});

test("C08B: offline runner rejects missing dependencies", async () => {
  const result = await runC08BOfflineEvaluation(
    null as never
  );

  assert.deepEqual(result, {
    status: "blocked",
    reasonCode: "invalid_offline_dependencies",
    mapping: null,
    composition: null
  });
});


/**
 * C-08B full runner integration.
 *
 * All evidence below comes from the repository's canonical
 * synthetic PP-04 fixture. No external sources are queried.
 *
 * These tests demonstrate execution of the existing
 * verifiers, not independent live trust approval.
 */

import {
  loadPP04CanonicalScenario
} from "../src/application/pp04/fixtures.js";

import {
  createPP04TrustedValidator
} from "../src/application/pp04/trustedConfig.js";

function canonicalOfflineInput() {
  const scenario = loadPP04CanonicalScenario(process.cwd());

  const payment = scenario.verification.receipt.expected;
  const contract = payment.contract;

  const expectedCrpPayment: C08BExpectedCrpPayment = {
    merchantId: contract.merchantId,
    nonce: payment.nonce,
    network: contract.network,
    asset: {
      type: "PLT",
      tokenId: contract.asset.tokenId,
      decimals: contract.asset.decimals
    },
    amount: contract.amount,
    payTo: contract.payTo
  };

  const crpRecord = {
    merchant_id: expectedCrpPayment.merchantId,
    nonce: expectedCrpPayment.nonce,
    network: expectedCrpPayment.network,
    asset: { ...expectedCrpPayment.asset },
    amount: expectedCrpPayment.amount,
    pay_to: expectedCrpPayment.payTo,
    status: "fulfilled",
    receipt: {
      jws: scenario.verification.receipt.jws
    }
  };

  return {
    expectedCrpPayment,
    crpSearchResponse: {
      ok: true,
      matches: [crpRecord]
    },
    scenario,
    validator: createPP04TrustedValidator(
      process.cwd()
    )
  };
}

test("C08B: canonical synthetic receipt reaches existing verifiers", async () => {
  const input = canonicalOfflineInput();
  const result = await runC08BOfflineEvaluation(input);

  assert.equal(result.status, "evaluated");

  if (result.status !== "evaluated") {
    assert.fail("Expected completed offline evaluation");
  }

  assert.equal(result.mapping.status, "candidate");
  assert.equal(result.receipt.status, "verified");

  assert.equal(
    result.composition.status,
    "incomplete"
  );
});

test("C08B: offline evaluation never implies full assurance", async () => {
  const result = await runC08BOfflineEvaluation(
    canonicalOfflineInput()
  );

  assert.equal(result.status, "evaluated");

  if (result.status !== "evaluated") {
    assert.fail("Expected evaluation result");
  }

  assert.notEqual(
    result.composition.status,
    "fully_verified"
  );

  assert.equal(
    result.receipt.settlementIndependentlyVerified,
    false
  );
});

test("C08B: trusted receipt tuple mismatch blocks evaluation", async () => {
  const input = canonicalOfflineInput();

  const result = await runC08BOfflineEvaluation({
    ...input,
    scenario: {
      ...input.scenario,
      verification: {
        ...input.scenario.verification,
        receipt: {
          ...input.scenario.verification.receipt,
          expected: {
            ...input.scenario.verification.receipt.expected,
            nonce: "different-trusted-nonce"
          }
        }
      }
    }
  });

  assert.deepEqual(result, {
    status: "blocked",
    reasonCode: "trusted_receipt_binding_mismatch",
    mapping: null,
    composition: null
  });
});

test("C08B: tampered candidate JWS cannot authenticate", async () => {
  const input = canonicalOfflineInput();
  const original = input.scenario.verification.receipt.jws;
  const parts = original.split(".");

  assert.equal(parts.length, 3);

  const signature = parts[2];

  assert.ok(signature && signature.length > 0);

  const replacement =
    (signature[0] === "A" ? "B" : "A") +
    signature.slice(1);

  const tampered = [
    parts[0],
    parts[1],
    replacement
  ].join(".");

  const record = input.crpSearchResponse.matches[0];

  const result = await runC08BOfflineEvaluation({
    ...input,
    crpSearchResponse: {
      ok: true,
      matches: [{
        ...record,
        receipt: { jws: tampered }
      }]
    }
  });

  assert.equal(result.status, "evaluated");

  if (result.status !== "evaluated") {
    assert.fail("Expected adversarial evaluation");
  }

  assert.notEqual(result.receipt.status, "verified");
});

test("C08B: missing CRP record prevents composition", async () => {
  const input = canonicalOfflineInput();

  const result = await runC08BOfflineEvaluation({
    ...input,
    crpSearchResponse: {
      ok: true,
      matches: []
    }
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.composition, null);
});

test("C08B: ambiguous CRP records prevent composition", async () => {
  const input = canonicalOfflineInput();
  const record = input.crpSearchResponse.matches[0];

  const result = await runC08BOfflineEvaluation({
    ...input,
    crpSearchResponse: {
      ok: true,
      matches: [record, structuredClone(record)]
    }
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.composition, null);
});

test("C08B: receipt cannot override trusted transaction hash", async () => {
  const input = canonicalOfflineInput();
  const expected = input.scenario.verification.receipt.expected;
  const hash = expected.transactionHash;

  assert.ok(hash.length > 0);

  const alteredHash =
    (hash[0] === "a" ? "b" : "a") +
    hash.slice(1);

  const result = await runC08BOfflineEvaluation({
    ...input,
    scenario: {
      ...input.scenario,
      verification: {
        ...input.scenario.verification,
        receipt: {
          ...input.scenario.verification.receipt,
          expected: {
            ...expected,
            transactionHash: alteredHash
          }
        }
      }
    }
  });

  assert.equal(result.status, "evaluated");

  if (result.status !== "evaluated") {
    assert.fail("Expected independent-binding evaluation");
  }

  assert.notEqual(result.receipt.status, "verified");
});
