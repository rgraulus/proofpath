/**
 * ProofPath PP-03 M3.2 — Facilitator Receipt Verification Tests.
 *
 * Synthetic Ed25519 keys and offline fixtures only.
 * Positive tests establish cryptographic verifier mechanics,
 * not independently approved live signing-key authority.
 *
 * No blockchain finality is independently verified.
 */

import assert from "node:assert/strict";
import {
  createPrivateKey,
  createPublicKey,
  sign
} from "node:crypto";
import { test } from "node:test";

import {
  digestFacilitatorReceiptPolicy,
  verifyFacilitatorReceipt
} from "../src/verification/facilitatorReceipt.js";

import type {
  AuthorizedFacilitatorSigningKey,
  FacilitatorExpectedPayment,
  FacilitatorReceiptVerificationContext,
  FacilitatorReceiptVerificationStatus,
  TrustedFacilitatorReceiptPolicy
} from "../src/verification/types.js";

const NOW = new Date("2026-11-04T12:00:00.000Z");
const NOW_SEC = Math.floor(NOW.getTime() / 1000);

const TESTNET = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
const MAINNET = "ccd:9dd9ca4d19e9393877d2c44b70f89acb";

const TX = "a".repeat(64);
const BLOCK = "b".repeat(64);

const KID = "synthetic-m32-key";

/*
 * Fixed synthetic Ed25519 seed for repeatable offline tests.
 * Not a production credential.
 */
const PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420", "hex"
);

function testKey(seedByte: number) {
  const der = Buffer.concat([
    PKCS8_PREFIX,
    Buffer.alloc(32, seedByte)
  ]);

  return createPrivateKey({
    key: der,
    format: "der",
    type: "pkcs8"
  });
}

const PRIVATE_KEY = testKey(0x11);
const PUBLIC_JWK = createPublicKey(PRIVATE_KEY)
  .export({ format: "jwk" });

function authorizedKey(): AuthorizedFacilitatorSigningKey {
  return {
    kid: KID,
    kty: "OKP",
    crv: "Ed25519",
    x: PUBLIC_JWK.x!,
    alg: "EdDSA",
    use: "sig"
  };
}

function policy(): TrustedFacilitatorReceiptPolicy {
  return {
    policyId: "synthetic:m32-policy",
    policyVersion: "1",
    facilitatorId: "synthetic-facilitator",
    authorizedKeys: [authorizedKey()],
    acceptedProofVersions: ["ccd-plt-proof@v1"],
    maxReceiptAgeSeconds: 300,
    maxFutureSkewSeconds: 10
  };
}

function expected(): FacilitatorExpectedPayment {
  return {
    nonce: "synthetic-challenge-001",
    transactionHash: TX,
    contract: {
      contractId: "synthetic-contract",
      contractVersion: "1",
      isFrozen: true,
      merchantId: "demo-merchant",
      resource: {
        method: "GET",
        path: "/paid-gated"
      },
      chain_id: TESTNET,
      network: "concordium:testnet",
      asset: {
        type: "PLT",
        tokenId: "EUDemo",
        decimals: 6
      },
      amount: "0.050101",
      payTo: "synthetic-merchant-wallet"
    }
  };
}

function payload(): Record<string, any> {
  const e = expected();

  return {
    proofVersion: "ccd-plt-proof@v1",
    contract: structuredClone(e.contract),
    nonce: e.nonce,
    settlement: {
      status: "finalized",
      settledAt: NOW_SEC - 30,
      expiresAt: NOW_SEC + 120
    },
    chain: {
      transactionHash: TX,
      blockHash: BLOCK,
      blockHeight: 123456
    },
    paymentEvent: {
      kind: "plt.transfer",
      tokenId: "EUDemo",
      amountRaw: "50101",
      from: "synthetic-payer-wallet",
      to: "synthetic-merchant-wallet"
    }
  };
}

function encode(value: string | object): string {
  const source = typeof value === "string"
    ? value
    : JSON.stringify(value);

  return Buffer.from(source, "utf8").toString("base64url");
}

function signed(
  proof: string | object = payload(),
  header: string | object = {
    alg: "EdDSA",
    kid: KID,
    typ: "JWT"
  },
  privateKey = PRIVATE_KEY
): string {
  const signingInput = encode(header) + "." + encode(proof);

  const signature = sign(
    null,
    Buffer.from(signingInput, "ascii"),
    privateKey
  ).toString("base64url");

  return signingInput + "." + signature;
}

function context(
  changes: Partial<FacilitatorReceiptVerificationContext> = {}
): FacilitatorReceiptVerificationContext {
  const configuredPolicy = changes.policy ?? policy();

  return {
    jws: signed(),
    expected: expected(),
    policy: configuredPolicy,
    trustedPolicyDigest:
      digestFacilitatorReceiptPolicy(configuredPolicy),
    now: () => NOW,
    ...changes
  };
}

function verify(
  changes: Partial<FacilitatorReceiptVerificationContext> = {}
) {
  return verifyFacilitatorReceipt(context(changes));
}

function expectDecision(
  changes: Partial<FacilitatorReceiptVerificationContext>,
  status: FacilitatorReceiptVerificationStatus,
  reasonCode: string
): void {
  const result = verify(changes);

  assert.equal(result.status, status);
  assert.equal(result.reasonCode, reasonCode);
  assert.equal(
    result.claim,
    "facilitator_receipt_signature_and_binding"
  );
  assert.equal(
    result.assuranceModel,
    "trusted_facilitator_receipt_signature_v1"
  );
  assert.equal(result.settlementIndependentlyVerified, false);
}

test("M3.2: deterministic policy commitment", () => {
  assert.equal(
    digestFacilitatorReceiptPolicy(policy()),
    digestFacilitatorReceiptPolicy(policy())
  );

  assert.match(
    digestFacilitatorReceiptPolicy(policy()),
    /^[0-9a-f]{64}$/
  );
});

test("M3.2: authentic synthetic receipt verifies narrow claim", () => {
  const result = verify();

  assert.equal(result.status, "verified");
  assert.equal(result.signatureAuthenticated, true);
  assert.equal(result.signingKeyId, KID);
  assert.equal(result.transactionHash, TX);
  assert.equal(result.settlementIndependentlyVerified, false);
});

test("M3.2: supported receipt without optional fields", () => {
  const proof = payload();

  delete proof.settlement.expiresAt;
  delete proof.chain.blockHash;
  delete proof.chain.blockHeight;
  delete proof.paymentEvent.from;

  expectDecision(
    { jws: signed(proof) },
    "verified",
    "facilitator_receipt_signature_and_binding_verified"
  );
});

test("M3.2: signed receipt missing canonical chain ID fails", () => {
  const proof = payload();
  delete proof.contract.chain_id;

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_contract_mismatch"
  );
});

test("M3.2: modified signed payload without resigning fails", () => {
  const parts = signed().split(".");
  const modified = payload();
  modified.nonce = "substituted-nonce";

  parts[1] = encode(modified);

  expectDecision(
    { jws: parts.join(".") },
    "failed",
    "receipt_signature_invalid"
  );
});

test("M3.2: modified signature fails", () => {
  const parts = signed().split(".");
  const signature = parts[2]!;

  parts[2] = (signature[0] === "A" ? "B" : "A")
    + signature.slice(1);

  expectDecision(
    { jws: parts.join(".") },
    "failed",
    "receipt_signature_invalid"
  );
});

test("M3.2: forged signer with approved kid fails", () => {
  expectDecision(
    { jws: signed(payload(), undefined, testKey(0x22)) },
    "failed",
    "receipt_signature_invalid"
  );
});

test("M3.2: unsupported and unsigned algorithms fail", () => {
  for (const alg of ["none", "HS256", "RS256"]) {
    expectDecision(
      { jws: signed(payload(), { alg, kid: KID, typ: "JWT" }) },
      "failed",
      "receipt_jws_header_invalid"
    );
  }
});

test("M3.2: unapproved kid cannot select signing authority", () => {
  expectDecision(
    {
      jws: signed(payload(), {
        alg: "EdDSA",
        kid: "unapproved-key",
        typ: "JWT"
      })
    },
    "failed",
    "facilitator_signing_key_not_approved"
  );
});

test("M3.2: missing or altered policy anchor fails closed", () => {
  expectDecision(
    { trustedPolicyDigest: "" },
    "indeterminate",
    "trusted_policy_digest_mismatch"
  );

  expectDecision(
    { trustedPolicyDigest: "f".repeat(64) },
    "indeterminate",
    "trusted_policy_digest_mismatch"
  );
});

test("M3.2: caller changes signing key but keeps old anchor", () => {
  const altered = policy();

  const otherJwk = createPublicKey(testKey(0x22))
    .export({ format: "jwk" });

  altered.authorizedKeys[0]!.x = otherJwk.x!;

  expectDecision(
    {
      policy: altered,
      trustedPolicyDigest: digestFacilitatorReceiptPolicy(policy())
    },
    "indeterminate",
    "trusted_policy_digest_mismatch"
  );
});

test("M3.2: malformed and noncanonical compact JWS fail", () => {
  for (const jws of [
    "",
    "a.b",
    "a.b.c.d",
    "!!." + encode(payload()) + ".abc",
    signed().replace(/\./, "..")
  ]) {
    assert.equal(verify({ jws }).status, "failed");
  }
});

test("M3.2: duplicate and ambiguous JSON headers fail", () => {
  const headers = [
    '{"alg":"EdDSA","alg":"none","kid":"' + KID + '","typ":"JWT"}',
    '{"alg":"EdDSA","\\u0061lg":"none","kid":"' + KID + '","typ":"JWT"}',
    '{"alg":"EdDSA","kid":"' + KID + '","typ":"JWT","jku":"https://example.org/jwks"}',
    '{"alg":"EdDSA","kid":"' + KID + '","typ":"JWT","crit":["exp"]}'
  ];

  for (const header of headers) {
    expectDecision(
      { jws: signed(payload(), header) },
      "failed",
      header.includes("jku") || header.includes("crit")
        ? "receipt_jws_header_invalid"
        : "receipt_jws_encoding_invalid"
    );
  }
});

test("M3.2: signed duplicate JSON payload keys fail", () => {
  const proof = JSON.stringify(payload());

  const ambiguous = proof.replace(
    '"nonce":"synthetic-challenge-001"',
    '"nonce":"synthetic-challenge-001","nonce":"other"'
  );

  expectDecision(
    { jws: signed(ambiguous) },
    "failed",
    "receipt_payload_json_invalid"
  );
});

test("M3.2: unknown receipt profile fails", () => {
  const proof = payload();
  proof.proofVersion = "unsupported@v1";

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "unsupported_receipt_profile"
  );
});

const bindingMutations: Array<[
  string,
  (proof: Record<string, any>) => void,
  string
]> = [
  ["nonce", p => { p.nonce = "wrong"; }, "receipt_nonce_mismatch"],
  ["merchant", p => { p.contract.merchantId = "wrong"; }, "receipt_contract_mismatch"],
  ["method", p => { p.contract.resource.method = "POST"; }, "receipt_contract_mismatch"],
  ["path", p => { p.contract.resource.path = "/other"; }, "receipt_contract_mismatch"],
  ["contract ID", p => { p.contract.contractId = "wrong"; }, "receipt_contract_mismatch"],
  ["contract version", p => { p.contract.contractVersion = "2"; }, "receipt_contract_mismatch"],
  ["frozen flag", p => { p.contract.isFrozen = false; }, "receipt_contract_mismatch"],
  ["network", p => { p.contract.network = "concordium:mainnet"; }, "receipt_contract_mismatch"],
  ["chain ID", p => { p.contract.chain_id = MAINNET; }, "receipt_contract_mismatch"],
  ["asset", p => { p.contract.asset.tokenId = "other"; }, "receipt_contract_mismatch"],
  ["decimals", p => { p.contract.asset.decimals = 5; }, "receipt_contract_mismatch"],
  ["amount", p => { p.contract.amount = "0.050102"; }, "receipt_contract_mismatch"],
  ["payee", p => { p.contract.payTo = "other"; }, "receipt_contract_mismatch"],
  ["transaction", p => { p.chain.transactionHash = "c".repeat(64); }, "receipt_transaction_mismatch"],
  ["event asset", p => { p.paymentEvent.tokenId = "other"; }, "receipt_payment_tuple_mismatch"],
  ["event amount", p => { p.paymentEvent.amountRaw = "50102"; }, "receipt_payment_tuple_mismatch"],
  ["event recipient", p => { p.paymentEvent.to = "other"; }, "receipt_payment_tuple_mismatch"]
];

for (const [name, mutate, reason] of bindingMutations) {
  test("M3.2: signed " + name + " substitution fails", () => {
    const proof = payload();
    mutate(proof);

    expectDecision(
      { jws: signed(proof) },
      "failed",
      reason
    );
  });
}

test("M3.2: finalized assertion is required", () => {
  const proof = payload();
  proof.settlement.status = "pending";

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_settlement_claim_invalid"
  );
});

test("M3.2: expired receipt fails", () => {
  const proof = payload();
  proof.settlement.expiresAt = NOW_SEC - 1;

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_expired_or_inconsistent"
  );
});

test("M3.2: stale receipt fails independently of expiry", () => {
  const proof = payload();

  proof.settlement.settledAt = NOW_SEC - 301;
  delete proof.settlement.expiresAt;

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_time_window_invalid"
  );
});

test("M3.2: future settlement outside skew fails", () => {
  const proof = payload();

  proof.settlement.settledAt = NOW_SEC + 11;
  proof.settlement.expiresAt = NOW_SEC + 120;

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_time_window_invalid"
  );
});

test("M3.2: expiry before settlement fails", () => {
  const proof = payload();

  proof.settlement.expiresAt =
    proof.settlement.settledAt - 1;

  expectDecision(
    { jws: signed(proof) },
    "failed",
    "receipt_expired_or_inconsistent"
  );
});

test("M3.2: invalid expected transaction fails closed", () => {
  const e = expected();
  e.transactionHash = "not-a-transaction-hash";

  expectDecision(
    { expected: e },
    "indeterminate",
    "expected_payment_invalid"
  );
});

test("M3.2: contradictory expected chain fails closed", () => {
  const e = expected();
  e.contract.chain_id = MAINNET;

  expectDecision(
    { expected: e },
    "indeterminate",
    "expected_payment_invalid"
  );
});

test("M3.2: invalid verification clock fails closed", () => {
  expectDecision(
    { now: () => new Date(NaN) },
    "indeterminate",
    "verification_clock_invalid"
  );
});

test("M3.2: receipt verification never establishes finality", () => {
  const result = verify();

  assert.equal(result.status, "verified");
  assert.equal(result.signatureAuthenticated, true);
  assert.equal(result.settlementIndependentlyVerified, false);
});
