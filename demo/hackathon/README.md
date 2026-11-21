
# ProofPath — Historical x402 Accountability Demonstration

**Payments happen in the moment. Accountability must endure.**

**Every transaction leaves a trail. ProofPath finds the breadcrumbs.**

## 1. Demonstration overview

This demonstration reconstructs a real Concordium Testnet payment executed on August 22, 2026, using historical evidence retained by the XCF payment infrastructure.

Rather than manufacturing a new payment scenario, ProofPath examines surviving evidence from an earlier autonomous-agent x402 workflow.

The demonstration illustrates three principles:

1. **Evidence persistence:** Transaction evidence remains available for retrospective examination.
2. **Auditability:** Historical commercial expectations can be compared with separately retained transaction records.
3. **Separation of responsibilities:** ProofPath evaluates evidence without controlling wallets, executing payments or releasing protected resources.

ProofPath is an independent evidence-assurance layer. It does not replace the XCF Gateway, Facilitator or Orchestrator.

## 2. Historical transaction

The selected payment was executed on Concordium Testnet on August 22, 2026.

| Property | Value |
|---|---|
| Network | `concordium:testnet` |
| Transaction hash | `cde858a003bb29d180c352fa3fd7409395829ed156ac9f9166e7f9969f3ad377` |
| Merchant | `demo-merchant` |
| Resource | `GET /paid-gated` |
| Asset | PLT EUDemo |
| Decimals | 6 |
| Commercial amount | `0.050101` |
| Atomic amount | `50101` |

The transaction was not recreated for this demonstration.

The historical Facilitator records include a payment challenge, a compact JWS receipt and a PLT event marked finalized.

The recorded finality flag is a statement from the retained Facilitator evidence; it is not, by itself, independent blockchain-finality verification.

## 3. Historical commercial reference

The expected commercial payment terms are obtained from the Gateway repository's historical Git object:

- Repository: `payfi-gateway-demo`
- Commit: `1861711b1483eeb09a2c66fa84152da69585b604`
- File: `config/contracts.json`
- Contract ID: `cid_e7fb8ef3933f5b45c7a246267858baf5b84ba60a7c178d0b84cc4e90fc564d98`

The selected contract identifies the resource, merchant, network, PLT asset, amount and recipient.

The Git object provides a separately retained commercial reference. Its existence does not prove that the exact same configuration was loaded by the Gateway runtime on August 22.

## 4. Evidence sources

The demonstration uses two historical source artifacts.

### 4.1 Facilitator historical evidence

The private local evidence package was reconstructed from historical XCF Facilitator records.

Its format is defined by:

`demo/hackathon/historicalEvidence.ts`

It contains transaction, challenge, receipt and recorded PLT-event data.

Because this evidence includes a compact JWS and transaction-specific nonce, the raw package is not committed to the public ProofPath repository.

### 4.2 Gateway commercial contract

The commercial reference is retrieved from the specified historical Gateway Git commit.

The contract is evaluated independently of the contents of the historical Facilitator receipt.

The two sources originate within the broader XCF environment and are not independently authenticated third-party attestations.

## 5. ProofPath implementation

The demonstration uses the existing packaged ProofPath SDK and a narrow set of hackathon-specific adapters.

| File | Responsibility |
|---|---|
| `historicalEvidence.ts` | Parse and load the private historical evidence package |
| `consumer.ts` | Execute the bounded historical receipt assessment |
| `historicalCommercialBinding.ts` | Compare historical commercial terms and compute source digests |
| `portableAssessment.ts` | Export a sanitized, machine-readable assessment |
| `tests/hackathon-settlement-boundary.test.ts` | Validate the settlement verifier with synthetic offline observations |

The existing SDK provides receipt verification, settlement verification and evidence-composition interfaces.

The hackathon adapters do not implement a replacement blockchain verifier or settlement engine.

## 6. Local reproduction

### Prerequisites

- Node.js 22-compatible development environment.
- Repository dependencies installed.
- ProofPath SDK built.
- Access to the Gateway Git repository and specified historical commit.
- Authorized local access to the private historical evidence package.

The historical evidence package must be obtained through an authorized process. It is not included in this repository.

### 6.1 Build and typecheck

From the ProofPath repository root:

```bash
npm ci
npm run build:sdk
npm run typecheck
```

### 6.2 Historical receipt assessment

The following command uses the private evidence package.

```bash
node.exe --import tsx \
  demo/hackathon/consumer.ts \
  --evidence "$HOME/proofpath-private-evidence/aug22-demo4-primary.json"
```

Without independently approved historical signer trust configuration, the consumer intentionally reports:

```text
RECEIPT_STATUS=indeterminate
RECEIPT_REASON=historical_signing_authority_unavailable
SIGNATURE_AUTHENTICATED=false
RECEIPT_SDK_VERIFICATION_PERFORMED=false
TRANSACTION_WIDE_ASSURANCE=false
```

This is a fail-closed assessment, not a conclusion that the historical signature is cryptographically invalid.

### 6.3 Export the bounded historical assessment

```bash
node.exe --import tsx \
  demo/hackathon/portableAssessment.ts \
  --evidence "$HOME/proofpath-private-evidence/aug22-demo4-primary.json" \
  --gateway "$HOME/Documents/GitHub/payfi-gateway-demo" \
  --output "$HOME/proofpath-private-evidence/aug22-proofpath-assessment.json"
```

The exporter creates its output exclusively and will not overwrite an existing file.

For reproduction, use a new output filename in the same private evidence directory if a prior report already exists.

The report includes source SHA-256 commitments, commercial comparisons, the negative amount-mismatch result and unresolved assurance limitations.

It does not include the raw JWS or nonce.

### 6.4 Offline settlement acceptance tests

```bash
node.exe --import tsx --test \
  tests/hackathon-settlement-boundary.test.ts
```

These tests use synthetic observations and a synthetic trust policy.

They demonstrate that the existing settlement verifier:

- Accepts complete matching settlement evidence under test assumptions.
- Does not verify an altered transfer amount.
- Does not verify incomplete execution evidence.
- Can evaluate an old transaction when the observation itself is fresh.

These tests do not independently verify the historical August 22 payment.

## 7. Historical commercial-binding assessment

The historical comparison currently covers:

| Check | Expected outcome |
|---|---|
| Historical contract identity | Match |
| Protected resource | Match |
| Transaction hash consistency | Match |
| Merchant | Match |
| Network | Match |
| Asset and decimals | Match |
| Atomic amount | Match |
| Recipient present in contract | Confirmed |

A deliberately altered expected amount (`0.050102`) must not match the recorded `50101` atomic units.

This negative case demonstrates commercial inconsistency detection. It does not independently authenticate the altered source artifact.

The recipient check confirms only that the historical contract contains a recipient. It does not establish recipient equality against an independently authenticated transfer.

## 8. Portable assessment format

The exporter produces:

`proofpath.hackathon.portable-assessment.v1`

Its artifact type is:

`bounded_historical_commercial_assessment`

The report contains:

- Historical transaction reference.
- Historical Gateway Git provenance.
- SHA-256 reference to the Gateway contract source.
- SHA-256 reference to the private Facilitator export.
- Individual commercial-binding results.
- Recorded finality status.
- Negative amount-mismatch result.
- Explicit unresolved assurance claims.

The source hashes commit to particular source-file bytes. They do not independently authenticate who produced those bytes or establish historical deployment authority.

**This artifact is not a PP-01 Evidence Manifest.**

The existing ProofPath composition engine requires independently established agent, seller, delivery and transaction context before a PP-01 manifest can be legitimately constructed.

No such context is invented for this demonstration.

## 9. Assurance limitations

The current demonstration does not establish:

1. Historical Facilitator signing-key authorization.
2. Cryptographic authentication of the August receipt.
3. Independent trusted-node verification of the historical settlement.
4. Independent verification of blockchain consensus.
5. Historical Agent Registry authorization at the transaction time.
6. Seller endpoint ownership or authenticated seller binding.
7. Delivery authenticity or resource consumption.
8. Human identity or action-specific delegation authority.
9. Transaction-wide assurance.

The recovered evidence may support further verification if suitable independently trusted historical records and authorization are established.

A valid source-record comparison must not be promoted into an unsupported cryptographic, settlement, identity or delivery claim.

## 10. Privacy and publication

The raw Facilitator evidence and locally exported assessment are initially stored outside Git.

No JWS, nonce, private signing key, credential or private evidence payload is intended for publication.

The portable assessment has passed an automated field-allowlist and disclosure review. Public release still requires a separate review of the exact artifact being published.

The raw Facilitator evidence must remain private.

## 11. Demonstration acceptance

The following milestones were completed during development:

- Historical evidence recovered from an August 22 Concordium Testnet transaction.
- Historical evidence adapter validation passed.
- Standalone receipt consumer executed with bounded, indeterminate assurance.
- Four offline settlement-verifier tests passed.
- Historical commercial-binding adapter passed eight positive checks.
- Altered commercial amount was detected.
- Portable historical assessment was generated.
- Both historical source SHA-256 references were independently recomputed and matched.
- Automated disclosure checks passed.

These results establish retrospective evidence correlation and bounded assessment behavior, not complete transaction assurance.

## 12. Demonstration narrative

**Payments happen in the moment. Accountability must endure.**

In August, XCF executed a real payment on Concordium Testnet.

Nearly three months later, ProofPath recovered its surviving evidence, examined the original commercial expectations and identified what the historical record could substantiate.

When evidence was consistent, ProofPath recorded that consistency.

When the expected amount was altered, the comparison detected the mismatch.

When independent signing authority or settlement assurance was unavailable, ProofPath did not manufacture a verified result.

The outcome is a portable accountability record showing both the evidence that survived and the limits of the conclusions it supports.

**Every transaction leaves a trail. ProofPath finds the breadcrumbs.**
