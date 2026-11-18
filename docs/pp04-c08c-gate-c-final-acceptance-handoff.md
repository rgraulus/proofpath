# ProofPath — PP-04-C / C-08C Gate C
## Final Acceptance & Handoff Record

**Record date:** November 18, 2026  
**Milestone:** PP-04-C / C-08C — Controlled Live Testnet Observation  
**Status:** ACCEPTED — Observation and Correlation Boundary  
**Final execution:** Block 226 — PASS  
**Implementation baseline:** PR #17, merged into `main`

### 1. Executive Summary

ProofPath successfully completed its first explicitly authorized, controlled live observation of an existing Concordium Testnet payment challenge through the x402 Concordium Facilitator.

The execution demonstrated that ProofPath can:

- Establish bounded, read-only HTTP connectivity to the local Facilitator.
- Acquire an actual CRP payment-search response.
- Correlate the observed data with a frozen expected-payment tuple.
- Identify exactly one matching historical receipt candidate.
- Preserve all source-authentication, receipt-authentication, and independent settlement-verification restrictions.

The observation completed without requesting payment execution, resource release, repository changes, or infrastructure modifications.

**Acceptance conclusion:** Gate C is accepted for controlled live acquisition and exact historical payment correlation only.

### 2. Frozen Implementation Baseline

| Component | Commit |
|---|---|
| ProofPath | `d8a1e8c08a80256b93d30152a2f225cba251f50d` |
| XCF Facilitator | `530b53c88eb7715beac3cb0afb1c8c277f5535b9` |

The accepted ProofPath implementation uses the existing C-08C controlled live acquisition and C-08B exact-tuple mapping capabilities.

No implementation changes were required for Gate C acceptance.

### 3. Frozen Observation Target

**Expected-payment tuple SHA-256:**

`a49e5f7f06d569511121ba2c6c4a3a298bdb65fd3b75f4011ad2bfe4c7517621`

| Field | Value |
|---|---|
| Merchant | `demo-merchant` |
| Nonce | `demo-903a0935-872c-4b4b-a3e2-d8ef0f9aac80` |
| Network | `concordium:testnet` |
| Asset | PLT / EUDemo |
| Decimals | 6 |
| Amount | `0.05` |
| Payee | `4Wx1vpgAfpE6k9ksmtYaH6z4iQN61LFFRUgbbG6gDro1ziKNL7` |
| Historical challenge status | `fulfilled` |
| Recorded expiry | January 1, 2030 |

The historical challenge is used as an observation and correlation fixture. Its recorded status and expiry do not independently establish ongoing payment authorization or settlement validity.

### 4. Operational Execution Boundary

The minimum local stack consisted of:

- PostgreSQL: running.
- Wallet Proxy: running.
- Facilitator: running, bound to `127.0.0.1:8080`.
- Facilitator stream worker: not started.
- Gateway: stopped.
- Orchestrator: stopped.

The controlled acquisition used:

- HTTP GET only.
- Fixed endpoint: `http://127.0.0.1:8080/v1/crp/payments/search`.
- Maximum one request; no retries.
- 65,536-byte response ceiling.
- 2-second connection timeout.
- 5-second total timeout.
- Process-local, explicitly authorized Gate B activation.

The expected-payment tuple was frozen before execution.

### 5. Acceptance Evidence

**Pre-execution checks**

| Check | Result |
|---|---|
| Exact database matches | 1 |
| Exact matches in search window | 1 |
| Search records | 6 |
| Reconstructed response size | 12,687 bytes |
| Response within permitted limit | PASS |
| Facilitator health and readiness | PASS |
| Facilitator loopback binding | PASS |
| Repository integrity | PASS |

**Block 226 — Recorded live execution**

```text
FROZEN_TUPLE=PASS
PROCESS_LOCAL_AUTHORIZATION=PASS
HTTP_METHOD=GET
HTTP_REQUEST_LIMIT=1
HTTP_RETRIES=0
OBSERVATION_STATUS=candidate
OBSERVATION_REASON=unique_receipt_candidate
SOURCE_AUTHENTICATED=false
RECEIPT_AUTHENTICATED=false
SETTLEMENT_INDEPENDENTLY_VERIFIED=false
GATE_C_OBSERVATION=PASS
PAYMENT_EXECUTION_REQUESTED=false
RESOURCE_RELEASE_REQUESTED=false
OBSERVATION_PROCESS_EXIT=0
PERSISTENT_GATE_B_FLAGS_DISABLED=true
REPOSITORIES_UNCHANGED=true
NO_RETRY_PERFORMED=true
BLOCK226_RESULT=PASS
SCRIPT_EXIT=0
```

This evidence establishes the successful observation and correlation outcome. It does not constitute a cryptographic attestation of the receipt or independent proof of blockchain settlement.

### 6. Preserved Trust Boundaries

The following assurances deliberately remained false:

```text
sourceAuthenticated=false
receiptAuthenticated=false
settlementIndependentlyVerified=false
```

Gate C did not establish:

- Authenticity of the Facilitator as an independently trusted source.
- Cryptographic validity of the observed receipt.
- Independent Concordium transaction-finality evidence.
- Payment-policy or trust-policy approval.
- Authorization for resource release.
- Authorization for a new payment or wallet transaction.

These remain separate verification and governance responsibilities.

### 7. Infrastructure Findings

The existing PostgreSQL container `xcf-pg` uses:

- PostgreSQL 16.
- Persistent Windows bind mount: `C:\DockerData\xcf-pg-data`.
- Docker networks: `bridge`, `infra_default`, and `xcf-net`.
- Host port 5432 published on IPv4 and IPv6 wildcard interfaces.

Potential external PostgreSQL exposure remains a documented infrastructure-hardening concern. Effective external reachability was not established.

No Docker, firewall, PostgreSQL, or persistent-storage modifications were performed.

The infrastructure finding is deferred to a separately scoped hardening activity and does not invalidate the observed Gate C application result.

### 8. Milestone Disposition

**Gate C acceptance: PASS**

The milestone is accepted within its explicitly defined observation-and-correlation scope.

No additional live acquisition, implementation PR, or payment execution is required to establish this acceptance result.

The single-use authorization exercised during Block 226 is considered consumed. Any additional live observation requires separate authorization.

### 9. Handoff to Subsequent Work

The next ProofPath work should be scoped independently, with particular attention to:

1. Receipt-signature authenticity and issuer-key trust.
2. Independent Concordium settlement and finality evidence.
3. Explicit composition of verified evidence into the existing ProofPath trust and policy framework.

Existing verification capabilities and deferred governance decisions must be reviewed before proposing new implementation work.

**Final disposition:** PP-04-C / C-08C Gate C — ACCEPTED AND CLOSED at the controlled live observation and exact-tuple correlation boundary.
