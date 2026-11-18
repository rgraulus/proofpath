
# ProofPath PP-04-D — Gate D1 Historical Evidence Resolution Closeout

**Milestone:** PP-04-D — Historical Full-Assurance Integration  
**Gate:** D1 — Repository-Based Historical Evidence Resolution  
**Status:** DISCOVERY COMPLETE — HISTORICAL FULL ASSURANCE NO-GO  
**Decision:** Close repository-based discovery; retain PP-04-D as an active roadmap objective  
**Evidence:** Blocks 260–261  
**Predecessor:** Gate D0 Historical Assurance Feasibility Decision  
**Environment:** Concordium Testnet  
**Payment execution:** None  
**C-08D implementation:** Excluded  

---

## 1. Executive Summary

Gate D1 examined the historical Git revision provenance of the Facilitator signing implementation, Gateway payment-contract configuration, and ProofPath verification policies.

The investigation established that relevant implementation and configuration artifacts exist in historical repository revisions. It also identified a potentially useful Gateway-side payment-provenance source.

However, it did not establish independent historical signing-key authorization, transaction-specific payment provenance, or independently approved settlement-policy authority.

**Final disposition: Repository discovery COMPLETE; full historical assurance remains NO-GO pending independent evidence.**

No further repository investigation or implementation is authorized by this closeout.

PP-04-D remains active, with additional technical work deferred until the necessary trust-authority evidence becomes available.

---

## 2. Evidence Examined and Findings

### D1-A — Historical Facilitator Signing-Key Authority

**Disposition: NO-GO — authority not established.**

Block 260 confirmed historical Git revisions for:

- `xcf-concordium-facilitator/src/crypto/signer.ts`
- `xcf-concordium-facilitator/src/routes/jwks.ts`

The retrieved revision history extends to November 2025 and January 2026.

These findings establish implementation history, not independent historical authorization.

PP-04-C previously demonstrated cryptographic compatibility between the selected historical receipt and the public key obtained from the running Facilitator.

However, neither the matching public key nor the Git revision history establishes that the key was independently authorized when the receipt was issued.

**Outstanding requirement:** A historically applicable, independently supportable signing-key authorization record and trusted Facilitator receipt-verification policy.

Receipt expiry and historical verification-time constraints remain applicable.

### D1-B — Independent Payment and Transaction Provenance

**Disposition: CONDITIONAL GO — historical configuration identified; transaction-specific provenance not established.**

Block 260 identified multiple historical revisions of:

`payfi-gateway-demo/config/contracts.json`

Block 261 confirmed:

- The April 12, 2026 revision was canonically identical to the configuration committed at the inspected Gateway HEAD.
- The April 10, 2026 revision differed from the current configuration.
- Both April revisions and the current configuration produced two `/paid-gated` matches under the recursive discovery method.
- The earlier inspected revisions produced no `/paid-gated` matches under that method.
- The duplicate matches were not structurally disambiguated, so no unique historical contract identity was established by this check.

Gateway HEAD inspected:

`3246e9c0015c227b8082cd071f4fb6d4c8ce0119`

The historical revisions establish configuration lineage but do not demonstrate which configuration was deployed or used for the selected historical payment.

The Gateway contract remains a plausible independent source of expected payment terms. It has not yet been authenticated as the transaction-specific source applicable to the selected payment.

**Outstanding requirement:** Contemporaneous or otherwise independently authenticated Gateway-side evidence binding the selected historical transaction to its expected merchant, contract, resource, network, asset, amount, recipient, and transaction reference.

Facilitator receipt and internal event records may corroborate consistency, but cannot independently authorize their own expected payment values.

### D1-C — Concordium Settlement-Policy Authority

**Disposition: NO-GO — approved policy not established.**

Block 260 identified the ProofPath settlement verification implementation:

`proofpath/src/verification/settlementFinality.ts`

Its retrieved history includes a November 4, 2026 revision.

This establishes the existence of the verification implementation, not a historically approved settlement policy.

PP-04-C separately demonstrated a finalized and successful Concordium Testnet PLT transfer observation through the existing trusted-node transport.

However, repository discovery did not establish:

- Independently approved full Testnet genesis hash.
- Authorized trusted-node endpoint.
- Applicable settlement verification policy and approval provenance.
- Independently anchored settlement-policy digest.

**Outstanding requirement:** An independently supportable settlement trust configuration satisfying the existing M3.3 verification contract.

A computed digest alone does not prove policy approval. Trusted-node verification must not be represented as independent consensus verification.

---

## 3. Formal Gate D1 Decision

| Workstream | Decision | Remaining requirement |
|---|---|---|
| D1-A — Signing-key authority | NO-GO | Historical key authorization and receipt policy |
| D1-B — Payment provenance | CONDITIONAL GO | Authenticated transaction-specific Gateway-side expectations |
| D1-C — Settlement-policy authority | NO-GO | Approved network, endpoint, policy, and anchored digest |

**Repository-based evidence discovery: COMPLETE.**

**Full M3.2 historical assurance: NOT ESTABLISHED.**

**Full M3.3 historical assurance: NOT ESTABLISHED.**

**Genuine historical M3.5 Evidence Manifest: NOT PRODUCED.**

**Full end-to-end historical transaction assurance: NO-GO.**

These conclusions do not contradict the historical cryptographic and settlement observations already accepted under PP-04-C.

### Assurance boundaries

Git history establishes repository revision provenance, not necessarily deployment history or independent governance approval.

Historical authorization cannot be manufactured retrospectively.

A newly approved policy for retrospective evaluation, if separately authorized, cannot be presented as evidence that the policy was approved when the historical transaction occurred.

An expired receipt must not be made valid through artificial verification-time manipulation.

No verifier acceptance rule may be weakened to force a positive result.

---

## 4. Closeout, Resumption Conditions, and Roadmap

### Closeout

The bounded repository-based Gate D1 investigation is complete.

The identified source-code and configuration records do not independently satisfy the outstanding assurance requirements.

No further repository search or implementation work is justified by the evidence currently available.

### Conditions for resuming PP-04-D

Further historical full-assurance integration may be considered only when at least one genuine, independently supportable evidence source is identified for the outstanding trust requirements.

Priority evidence:

1. **Signing authority:** Dated historical Facilitator key authorization and associated trusted receipt-verification policy.
2. **Payment provenance:** Independently authenticated historical Gateway payment expectations tied to the selected transaction.
3. **Settlement authority:** Approved Testnet genesis hash, trusted-node endpoint, settlement policy, and independently anchored digest.

Each source must be assessed for origin, integrity, historical applicability, independence, and authorization.

Any subsequent verifier execution or evidence composition requires a separately bounded scope and explicit authorization.

If historical trust authority cannot be substantiated, the historical assurance NO-GO remains the correct outcome.

A separately authorized forward-looking assurance demonstration may be considered in the future, but must not be misrepresented as retrospective approval of the historical transaction.

### Scope preservation

- PP-04-C remains formally closed and accepted within its historical-observation scope.
- PP-04-D remains an active roadmap milestone, with integration deferred pending independent evidence.
- Gate D0 remains the governing feasibility decision.
- Gate D1 repository discovery is closed.
- No new payment execution is authorized.
- C-08D remains excluded.
- No source-code changes, credential access, database mutation, or production release are authorized.
- No additional PR ladder is initiated.

### Final handoff

**The next dependency is independent historical trust-authority evidence, not additional software implementation.**

ProofPath will preserve the validated historical observations, retain the full-assurance NO-GO, and resume the PP-04-D objective only when defensible new evidence justifies further evaluation.
