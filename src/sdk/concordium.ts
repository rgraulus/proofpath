/**
 * ProofPath SDK — specialized Concordium verification and composition.
 * All results remain bounded by their explicit trust assumptions.
 */
export type * from "../verification/types.js";
export type * from "../composition/types.js";

export {
  CONCORDIUM_X402_PROFILE,
  normalizeConcordiumX402Profile
} from "../profiles/concordium-x402.js";

export type {
  ConcordiumNetwork,
  ConcordiumX402ReferenceKind,
  ConcordiumX402ReferenceInput,
  ConcordiumX402ProfileInput,
  ConcordiumX402ProfileRecord
} from "../profiles/concordium-x402.js";

export {
  digestRegistryPolicy,
  verifyRegistrySnapshot
} from "../verification/registrySnapshot.js";

export {
  ConcordiumRegistrySnapshotTransport,
  createConcordiumRegistrySnapshotTransport
} from "../adapters/concordium/registrySnapshot.js";

export type {
  ConcordiumRegistryTransportOptions
} from "../adapters/concordium/registrySnapshot.js";

export {
  digestFacilitatorReceiptPolicy,
  verifyFacilitatorReceipt
} from "../verification/facilitatorReceipt.js";

export {
  digestSettlementPolicy,
  verifySettlementFinality
} from "../verification/settlementFinality.js";

export {
  ConcordiumSettlementTransport,
  createConcordiumSettlementTransport
} from "../adapters/concordium/settlementFinality.js";

export type {
  ConcordiumSettlementTransportOptions
} from "../adapters/concordium/settlementFinality.js";

export {
  digestAgentAuthorityPolicy,
  verifyAgentAuthority
} from "../verification/agentAuthority.js";

export {
  ConcordiumAgentAuthorityTransport,
  createConcordiumAgentAuthorityTransport
} from "../adapters/concordium/agentAuthority.js";

export type {
  ConcordiumAgentAuthorityTransportOptions
} from "../adapters/concordium/agentAuthority.js";

export {
  composeTransactionEvidence
} from "../composition/transactionEvidence.js";
