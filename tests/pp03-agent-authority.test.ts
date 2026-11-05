/**
 * ProofPath PP-03 M3.4 — Offline acceptance tests.
 *
 * All blockchain observations are synthetic.
 * No live Registry trust or independent consensus assurance.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as ts from "typescript";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { AccountAddress } from "@concordium/web-sdk";
import * as sdk from "@concordium/web-sdk";

import {
  digestAgentAuthorityPolicy,
  verifyAgentAuthority
} from "../src/verification/agentAuthority.js";

import {
  ConcordiumAgentAuthorityTransport,
  createConcordiumAgentAuthorityTransport
} from "../src/adapters/concordium/agentAuthority.js";

import { canonicalJsonBytes } from "../src/core/canonical.js";
import { sha256Bytes } from "../src/core/hash.js";

import type {
  AgentAuthorityObservation,
  AgentAuthorityVerificationContext,
  AgentAuthorityVerificationStatus,
  ExpectedAgentAuthority,
  TrustedAgentAuthorityPolicy
} from "../src/verification/types.js";

const NOW = new Date("2026-11-05T10:00:00.000Z");

const GENESIS = "a".repeat(64);
const AGENT_MODULE = "b".repeat(64);
const KEY_MODULE = "c".repeat(64);
const BLOCK = "d".repeat(64);
const WRONG = "e".repeat(64);

const ENDPOINT = "https://synthetic-node.example:20000/";

function account(seed: number): string {
  const bytes = new Uint8Array(32);
  bytes[0] = seed;
  return AccountAddress.fromBuffer(bytes.buffer).toString();
}

const OWNER = account(1);
const OTHER_OWNER = account(2);

function policy(): TrustedAgentAuthorityPolicy {
  return {
    policyId: "synthetic:pp03-m34",
    policyVersion: "1",
    network: "concordium:testnet",
    expectedGenesisHash: GENESIS,

    agentRegistry: {
      network: "concordium:testnet",
      contractIndex: "12802",
      contractSubindex: "0"
    },

    approvedAgentModuleReferences: [AGENT_MODULE],

    externalKeyRegistry: {
      network: "concordium:testnet",
      contractIndex: "12801",
      contractSubindex: "0"
    },

    approvedExternalKeyModuleReferences: [KEY_MODULE],

    trustedNodeEndpoint: ENDPOINT,
    allowedExternalKeyNamespaces: ["xcf:phase5"],
    allowedExternalKeyTypes: ["ed25519"],

    maxSnapshotAgeSeconds: 300,
    maxFutureSkewSeconds: 10,
    requireFinalizedBlock: true,
    requireSameBlock: true
  };
}

function expected(): ExpectedAgentAuthority {
  return {
    network: "concordium:testnet",
    agentTokenIdHex: "0100000000000000",
    expectedOwnerAccount: OWNER,
    expectedExternalKey: {
      namespace: "xcf:phase5",
      keyType: "ed25519",
      publicKeyHex: "11".repeat(32)
    }
  };
}

function observation(): AgentAuthorityObservation {
  const p = policy();
  const e = expected();

  return {
    network: p.network,
    genesisHash: GENESIS,
    nodeEndpoint: ENDPOINT,

    blockHash: BLOCK,
    blockHeight: "50360000",
    blockTimestamp: "2026-11-05T09:59:20.000Z",
    observedAt: "2026-11-05T09:59:40.000Z",
    blockFinalized: true,

    agentRegistry: { ...p.agentRegistry },
    agentModuleReference: AGENT_MODULE,
    agentReadBlockHash: BLOCK,
    agentReadComplete: true,

    agent: {
      agentTokenIdHex: e.agentTokenIdHex,
      ownerAccount: OWNER,
      status: "active",
      externalReference: {
        contract: { ...p.externalKeyRegistry },
        kind: "cis8",
        externalKey: { ...e.expectedExternalKey }
      },
      agentUri: null,
      metadataHash: null
    },

    externalKeyRegistry: { ...p.externalKeyRegistry },
    externalKeyModuleReference: KEY_MODULE,
    externalKeyReadBlockHash: BLOCK,
    externalKeyReadComplete: true,

    externalKeyRegistration: {
      ownerAccount: OWNER,
      externalKey: { ...e.expectedExternalKey },
      status: "active",
      proofScheme: "synthetic",
      lastUpdated: "2026-11-05T09:59:10.000Z"
    }
  };
}

type Changes = {
  policy?: TrustedAgentAuthorityPolicy;
  expected?: ExpectedAgentAuthority;
  observation?: AgentAuthorityObservation;
  digest?: string;
  now?: Date;
  throwTransport?: boolean;
};

function context(
  changes: Changes = {}
): AgentAuthorityVerificationContext {
  const p = changes.policy ?? policy();

  return {
    policy: p,
    trustedPolicyDigest:
      changes.digest ?? digestAgentAuthorityPolicy(p),
    expected: changes.expected ?? expected(),
    transport: {
      async readAgentAuthority() {
        if (changes.throwTransport) {
          throw new Error("synthetic_transport_failure");
        }
        return changes.observation ?? observation();
      }
    },
    now: () => changes.now ?? NOW
  };
}

async function check(
  changes: Changes,
  wanted: AgentAuthorityVerificationStatus,
  reason: string
): Promise<void> {
  const result = await verifyAgentAuthority(context(changes));

  assert.equal(result.status, wanted);
  assert.equal(result.reasonCode, reason);

  assert.equal(
    result.claim,
    "agent_registry_owner_external_key_binding_at_finalized_snapshot"
  );

  assert.equal(
    result.assuranceModel,
    "trusted_node_finalized_agent_key_binding_v1"
  );

  assert.equal(result.consensusIndependentlyVerified, false);
  assert.equal(result.historicalUpgradeAuthorityVerified, false);
  assert.equal(result.humanIdentityVerified, false);
  assert.equal(result.actionSpecificSigningAuthorityVerified, false);
}

function alteredObservation(
  change: (o: AgentAuthorityObservation) => void
): AgentAuthorityObservation {
  const o = observation();
  change(o);
  return o;
}

function alteredPolicy(
  change: (p: TrustedAgentAuthorityPolicy) => void
): TrustedAgentAuthorityPolicy {
  const p = policy();
  change(p);
  return p;
}

function alteredExpected(
  change: (e: ExpectedAgentAuthority) => void
): ExpectedAgentAuthority {
  const e = expected();
  change(e);
  return e;
}

test("M3.4-01: canonical digest deterministic", () => {
  assert.equal(
    digestAgentAuthorityPolicy(policy()),
    digestAgentAuthorityPolicy(policy())
  );
});

test("M3.4-02: digest uses exact domain separator", () => {
  const p = policy();
  const wanted = sha256Bytes(Buffer.concat([
    Buffer.from("proofpath:agent-authority-policy:v1\0"),
    canonicalJsonBytes(p)
  ]));

  assert.equal(digestAgentAuthorityPolicy(p), wanted);
});

test("M3.4-03: tampered policy rejected by prior anchor", async () => {
  const p = alteredPolicy(x => {
    x.maxSnapshotAgeSeconds = 301;
  });

  await check({
    policy: p,
    digest: digestAgentAuthorityPolicy(policy())
  }, "indeterminate", "trusted_policy_digest_mismatch");
});

test("M3.4-04: absent digest fails closed", async () => {
  await check({ digest: "" },
    "indeterminate", "trusted_policy_digest_mismatch");
});

test("M3.4-05: invalid policy blocks transport", async () => {
  let called = false;
  const p = alteredPolicy(x => {
    x.trustedNodeEndpoint = "http://unsafe.example/";
  });

  const input = context();
  input.policy = p;
  input.transport = {
    async readAgentAuthority() {
      called = true;
      return observation();
    }
  };

  const result = await verifyAgentAuthority(input);
  assert.equal(result.status, "indeterminate");
  assert.equal(result.reasonCode, "invalid_agent_authority_policy");
  assert.equal(called, false);
});

test("M3.4-06: invalid token ID", async () => {
  await check({
    expected: alteredExpected(e => {
      e.agentTokenIdHex = "invalid";
    })
  }, "indeterminate", "invalid_expected_agent_authority");
});

test("M3.4-07: invalid owner address", async () => {
  await check({
    expected: alteredExpected(e => {
      e.expectedOwnerAccount = "invalid-address";
    })
  }, "indeterminate", "invalid_expected_agent_authority");
});

test("M3.4-08: synthetic positive claim remains narrow", async () => {
  const result = await verifyAgentAuthority(context());

  assert.equal(result.status, "verified");
  assert.equal(
    result.reasonCode,
    "trusted_node_agent_key_binding_verified"
  );
  assert.equal(result.registryModulesApprovedByPolicy, true);
  assert.equal(result.snapshotFinalized, true);
  assert.equal(result.agentActive, true);
  assert.equal(result.ownerMatched, true);
  assert.equal(result.externalReferenceMatched, true);
  assert.equal(result.externalKeyRegistrationActive, true);
  assert.equal(result.externalKeyOwnerMatched, true);

  assert.equal(result.consensusIndependentlyVerified, false);
  assert.equal(result.historicalUpgradeAuthorityVerified, false);
  assert.equal(result.humanIdentityVerified, false);
  assert.equal(result.actionSpecificSigningAuthorityVerified, false);
});

test("M3.4-09: wrong network", async () => {
  await check({
    observation: alteredObservation(o => {
      o.network = "concordium:mainnet";
    })
  }, "failed", "network_mismatch");
});

test("M3.4-10: wrong genesis", async () => {
  await check({
    observation: alteredObservation(o => {
      o.genesisHash = WRONG;
    })
  }, "failed", "genesis_hash_mismatch");
});

test("M3.4-11: wrong endpoint", async () => {
  await check({
    observation: alteredObservation(o => {
      o.nodeEndpoint = "https://other-node.example/";
    })
  }, "failed", "node_endpoint_mismatch");
});

test("M3.4-12: wrong agent Registry contract", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agentRegistry.contractIndex = "999";
    })
  }, "failed", "agent_registry_coordinate_mismatch");
});

test("M3.4-13: wrong CIS-8 contract", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistry.contractIndex = "999";
    })
  }, "failed", "external_key_registry_coordinate_mismatch");
});

test("M3.4-14: unapproved agent module", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agentModuleReference = WRONG;
    })
  }, "failed", "agent_module_not_approved");
});

test("M3.4-15: unapproved CIS-8 module", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyModuleReference = WRONG;
    })
  }, "failed", "external_key_module_not_approved");
});

test("M3.4-16: different Registry read blocks", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyReadBlockHash = WRONG;
    })
  }, "indeterminate", "snapshot_block_mismatch");
});

test("M3.4-17: explicitly unfinalized block", async () => {
  await check({
    observation: alteredObservation(o => {
      o.blockFinalized = false;
    })
  }, "failed", "block_explicitly_unfinalized");
});

test("M3.4-18: stale snapshot", async () => {
  await check({
    observation: alteredObservation(o => {
      o.blockTimestamp = "2026-11-05T09:49:20.000Z";
      o.observedAt = "2026-11-05T09:50:00.000Z";
    })
  }, "indeterminate", "snapshot_stale");
});

test("M3.4-19: future observation", async () => {
  await check({
    observation: alteredObservation(o => {
      o.observedAt = "2026-11-05T10:01:00.000Z";
    })
  }, "indeterminate", "snapshot_future_dated");
});

test("M3.4-20: completed absent agent read", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent = null;
    })
  }, "failed", "agent_not_found");
});

test("M3.4-21: revoked agent", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.status = "revoked";
    })
  }, "failed", "agent_revoked");
});

test("M3.4-22: different agent token", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.agentTokenIdHex = "0200000000000000";
    })
  }, "failed", "agent_token_mismatch");
});

test("M3.4-23: different agent owner", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.ownerAccount = OTHER_OWNER;
    })
  }, "failed", "agent_owner_mismatch");
});

test("M3.4-24: missing external reference", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.externalReference = null;
    })
  }, "failed", "external_reference_missing");
});

test("M3.4-25: unsupported external-reference kind", async () => {
  const o = alteredObservation(x => {
    (x.agent!.externalReference as unknown as {
      kind: string;
    }).kind = "unsupported";
  });

  await check({
    observation: o
  }, "indeterminate", "observation_invalid");
});

test("M3.4-26: wrong external-reference key", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.externalReference!.externalKey.publicKeyHex =
        "22".repeat(32);
    })
  }, "failed", "external_reference_mismatch");
});

test("M3.4-27: completed absent CIS-8 registration", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration = null;
    })
  }, "failed", "external_key_registration_missing");
});

test("M3.4-28: revoked CIS-8 registration", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration!.status = "revoked";
    })
  }, "failed", "external_key_registration_revoked");
});

test("M3.4-29: displaced external key", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration!.ownerAccount = OTHER_OWNER;
    })
  }, "failed", "external_key_owner_mismatch");
});

test("M3.4-30: incomplete CIS-8 read", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyReadComplete = false;
    })
  }, "indeterminate", "external_key_read_incomplete");
});

test("M3.4-31: transport failure", async () => {
  await check({
    throwTransport: true
  }, "indeterminate", "transport_error");
});

test("M3.4-32: verifier does not mutate fixtures", async () => {
  const p = policy();
  const e = expected();
  const o = observation();

  const before = JSON.stringify({ p, e, o });

  await verifyAgentAuthority(context({
    policy: p,
    expected: e,
    observation: o
  }));

  assert.equal(JSON.stringify({ p, e, o }), before);
});

test("M3.4-33: key registration timestamp cannot exceed block time", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration!.lastUpdated =
        "2026-11-05T09:59:30.000Z";
    })
  }, "indeterminate", "snapshot_timestamp_inconsistent");
});

test("M3.4-34: unknown agent status fails closed", async () => {
  await check({
    observation: alteredObservation(o => {
      o.agent!.status = "unknown";
    })
  }, "indeterminate", "observation_invalid");
});

test("M3.4-35: unknown CIS-8 status fails closed", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration!.status = "unknown";
    })
  }, "indeterminate", "observation_invalid");
});

test("M3.4-36: malformed observation cannot verify", async () => {
  const o = observation();

  (o as unknown as { agentReadBlockHash: unknown })
    .agentReadBlockHash = undefined;

  await check({
    observation: o
  }, "indeterminate", "observation_invalid");
});

test("M3.4-37: unsafe module allowlist rejected", () => {
  const p = alteredPolicy(x => {
    x.approvedAgentModuleReferences = [AGENT_MODULE, AGENT_MODULE];
  });

  assert.throws(() => digestAgentAuthorityPolicy(p), TypeError);
});

test("M3.4-38: malformed public-key bytes rejected", async () => {
  await check({
    expected: alteredExpected(e => {
      e.expectedExternalKey.publicKeyHex = "xyz";
    })
  }, "indeterminate", "invalid_expected_agent_authority");
});

test("M3.4-39: wrong registration key", async () => {
  await check({
    observation: alteredObservation(o => {
      o.externalKeyRegistration!.externalKey.publicKeyHex =
        "33".repeat(32);
    })
  }, "failed", "external_key_mismatch");
});

test("M3.4-40: adapter constructor rejects insecure endpoint", () => {
  const p = alteredPolicy(x => {
    x.trustedNodeEndpoint = "http://unsafe.example/";
  });

  assert.throws(
    () => new ConcordiumAgentAuthorityTransport({
      policy: p
    })
  );
});

test("M3.4-41: adapter factory creates read-only transport", () => {
  const transport = createConcordiumAgentAuthorityTransport({
    policy: policy()
  });

  assert.equal(
    typeof transport.readAgentAuthority,
    "function"
  );
});

test("M3.4-42: invalid adapter request fails before node access", async () => {
  const transport = createConcordiumAgentAuthorityTransport({
    policy: policy()
  });

  await assert.rejects(
    transport.readAgentAuthority(
      alteredExpected(e => {
        e.agentTokenIdHex = "bad";
      })
    ),
    /invalid_agent_authority_request/
  );
});

/**
 * B6.7: Exercise the production adapter with mocked SDK gRPC
 * methods. No node requests are made by these tests.
 */

async function mockedGrpc() {
  const require = createRequire(import.meta.url);
  const sdkEntry = require.resolve("@concordium/web-sdk");

  const location = path.join(
    path.dirname(sdkEntry), "nodejs", "grpc.js"
  );

  return import(pathToFileURL(location).href);
}

async function installBoundaryMocks(
  t: import("node:test").TestContext,
  options: {
    finalized?: boolean;
    missingFinalized?: boolean;
    wrongBlockHash?: boolean;
  } = {}
) {
  const grpc = await mockedGrpc();
  const proto = grpc.ConcordiumGRPCNodeClient.prototype;

  const finalizedBlock = sdk.BlockHash.fromHexString(BLOCK);
  const genesisBlock = sdk.BlockHash.fromHexString(GENESIS);

  const calls: {
    blockInfo: unknown[][];
    instanceInfo: unknown[][];
    embeddedSchema: unknown[][];
    invocation: unknown[][];
  } = {
    blockInfo: [],
    instanceInfo: [],
    embeddedSchema: [],
    invocation: []
  };

  t.mock.method(proto, "getConsensusStatus", async () => ({
    genesisBlock,
    lastFinalizedBlock: options.missingFinalized
      ? undefined
      : finalizedBlock
  }));

  t.mock.method(
    proto,
    "getBlockInfo",
    async (...args: unknown[]) => {
      calls.blockInfo.push(args);
      return {
        finalized: options.finalized ?? true,
        blockHash: sdk.BlockHash.fromHexString(
          options.wrongBlockHash ? WRONG : BLOCK
        ),
        blockHeight: 123456n,
        blockSlotTime: NOW
      };
    }
  );

  t.mock.method(
    proto,
    "getInstanceInfo",
    async (...args: unknown[]) => {
      calls.instanceInfo.push(args);
      return {
        sourceModule:
          sdk.ModuleReference.fromHexString(AGENT_MODULE)
      };
    }
  );

  t.mock.method(
    proto,
    "getEmbeddedSchema",
    async (...args: unknown[]) => {
      calls.embeddedSchema.push(args);
      return undefined;
    }
  );

  t.mock.method(
    proto,
    "invokeContract",
    async (...args: unknown[]) => {
      calls.invocation.push(args);
      throw new Error("unexpected_contract_invocation");
    }
  );

  return calls;
}

test("M3.4-43: missing finalized block stops adapter", async t => {
  const calls = await installBoundaryMocks(t, {
    missingFinalized: true
  });

  const transport =
    createConcordiumAgentAuthorityTransport({
      policy: policy()
    });

  await assert.rejects(
    transport.readAgentAuthority(expected()),
    /finalized_block_unavailable/
  );

  assert.equal(calls.blockInfo.length, 0);
  assert.equal(calls.instanceInfo.length, 0);
  assert.equal(calls.invocation.length, 0);
});

test("M3.4-44: unfinalized block stops adapter", async t => {
  const calls = await installBoundaryMocks(t, {
    finalized: false
  });

  const transport =
    createConcordiumAgentAuthorityTransport({
      policy: policy()
    });

  await assert.rejects(
    transport.readAgentAuthority(expected()),
    /finalized_block_identity_mismatch/
  );

  assert.equal(calls.blockInfo.length, 1);
  assert.equal(calls.instanceInfo.length, 0);
  assert.equal(calls.invocation.length, 0);
});

test("M3.4-45: block-hash substitution stops adapter", async t => {
  const calls = await installBoundaryMocks(t, {
    wrongBlockHash: true
  });

  const transport =
    createConcordiumAgentAuthorityTransport({
      policy: policy()
    });

  await assert.rejects(
    transport.readAgentAuthority(expected()),
    /finalized_block_identity_mismatch/
  );

  assert.equal(calls.instanceInfo.length, 0);
  assert.equal(calls.invocation.length, 0);
});

test("M3.4-46: contract metadata reads pin finalized block", async t => {
  const calls = await installBoundaryMocks(t);

  const transport =
    createConcordiumAgentAuthorityTransport({
      policy: policy()
    });

  await assert.rejects(
    transport.readAgentAuthority(expected()),
    /contract_schema_unavailable/
  );

  assert.equal(calls.blockInfo.length, 1);
  assert.equal(calls.instanceInfo.length, 1);
  assert.equal(calls.embeddedSchema.length, 1);
  assert.equal(calls.invocation.length, 0);

  const expectedBlock = BLOCK;

  const infoBlock = calls.instanceInfo[0]?.[1];
  const schemaBlock = calls.embeddedSchema[0]?.[1];

  assert.equal(
    sdk.BlockHash.toHexString(
      calls.blockInfo[0]?.[0] as sdk.BlockHash.Type
    ),
    expectedBlock
  );

  assert.equal(
    sdk.BlockHash.toHexString(
      infoBlock as sdk.BlockHash.Type
    ),
    expectedBlock
  );

  assert.equal(
    sdk.BlockHash.toHexString(
      schemaBlock as sdk.BlockHash.Type
    ),
    expectedBlock
  );

  const observedContract = calls.instanceInfo[0]?.[0] as {
    index: bigint;
    subindex: bigint;
  };

  assert.equal(String(observedContract.index), "12802");
  assert.equal(String(observedContract.subindex), "0");
});


/**
 * B6.12: Isolated offline tests of the production decoder source.
 *
 * These tests do not exercise deployed contract schemas or
 * establish independent blockchain consensus.
 */
function b612Decoders() {
  const source = readFileSync(
    new URL(
      "../src/adapters/concordium/agentAuthority.ts",
      import.meta.url
    ),
    "utf8"
  );

  const start = source.indexOf("const HEX16 = ");
  const end = source.indexOf("function endpoint(");

  assert.ok(start >= 0);
  assert.ok(end > start);

  const isolated = source.slice(start, end);

  const compiled = ts.transpileModule(
    isolated + `
exports.agentForTest = agent;
exports.registrationForTest = registration;
`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.None
      }
    }
  );

  const exported: Record<string, unknown> = {};

  runInNewContext(
    compiled.outputText,
    {
      exports: exported,
      Buffer,
      Date
    },
    { timeout: 1000 }
  );

  return exported as {
    agentForTest: (
      value: unknown,
      network: string
    ) => any;
    registrationForTest: (
      value: unknown
    ) => any;
  };
}

function b612Agent(): any {
  return {
    Some: [{
      token_id: expected().agentTokenIdHex,
      owner_account: OWNER,
      status: { Active: [] },
      external_reference: { None: [] },
      agent_uri: { None: [] },
      metadata_hash: { None: [] },
      revoked_at: { None: [] },
      revocation_reason: { None: [] }
    }]
  };
}

function b612Registration(): any {
  const e = expected();

  return {
    Some: [{
      owner: OWNER,
      external_key: {
        namespace: e.expectedExternalKey.namespace,
        key_type: e.expectedExternalKey.keyType,
        public_key: Array.from(
          Buffer.from(e.expectedExternalKey.publicKeyHex, "hex"),
          byte => BigInt(byte)
        )
      },
      status: { Active: [] },
      proof_scheme: "fetch-ai-ed25519",
      last_updated: NOW.toISOString(),
      metadata: []
    }]
  };
}

test("M3.4-47: decoded active agent", () => {
  const decoder = b612Decoders();

  const result = decoder.agentForTest(
    b612Agent(),
    policy().network
  );

  assert.equal(result.status, "active");
  assert.equal(result.ownerAccount, OWNER);
});

test("M3.4-48: active agent with revoked_at rejected", () => {
  const decoder = b612Decoders();
  const input = b612Agent();

  input.Some[0].revoked_at = {
    Some: [NOW.toISOString()]
  };

  assert.throws(
    () => decoder.agentForTest(input, policy().network),
    /contradictory_active_agent_record/
  );
});

test("M3.4-49: active agent with revocation reason rejected", () => {
  const decoder = b612Decoders();
  const input = b612Agent();

  input.Some[0].revocation_reason = {
    Some: ["revoked"]
  };

  assert.throws(
    () => decoder.agentForTest(input, policy().network),
    /contradictory_active_agent_record/
  );
});

test("M3.4-50: revoked agent requires revocation time", () => {
  const decoder = b612Decoders();
  const input = b612Agent();

  input.Some[0].status = { Revoked: [] };

  assert.throws(
    () => decoder.agentForTest(input, policy().network),
    /contradictory_revoked_agent_record/
  );
});

test("M3.4-51: revoked agent normalizes correctly", () => {
  const decoder = b612Decoders();
  const input = b612Agent();

  input.Some[0].status = { Revoked: [] };
  input.Some[0].revoked_at = {
    Some: [NOW.toISOString()]
  };

  const result = decoder.agentForTest(
    input,
    policy().network
  );

  assert.equal(result.status, "revoked");
});

test("M3.4-52: CIS-8 active registration decodes", () => {
  const decoder = b612Decoders();

  const result = decoder.registrationForTest(
    b612Registration()
  );

  assert.equal(result.status, "active");
  assert.equal(result.ownerAccount, OWNER);
  assert.equal(result.externalKey.namespace, "xcf:phase5");
  assert.equal(result.externalKey.keyType, "ed25519");
  assert.equal(
    result.externalKey.publicKeyHex,
    "11".repeat(32)
  );
});

test("M3.4-53: invalid CIS-8 key byte rejected", () => {
  const decoder = b612Decoders();
  const input = b612Registration();

  input.Some[0].external_key.public_key = [256n];

  assert.throws(
    () => decoder.registrationForTest(input),
    /invalid_public_key_byte/
  );
});

test("M3.4-54: missing records remain absent", () => {
  const decoder = b612Decoders();

  assert.equal(
    decoder.agentForTest(
      { None: [] },
      policy().network
    ),
    null
  );

  assert.equal(
    decoder.registrationForTest({ None: [] }),
    null
  );
});
