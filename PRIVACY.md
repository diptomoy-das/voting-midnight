# VoteDApp — Privacy Model

## Overview

VoteDApp uses Midnight's zero-knowledge proof system to guarantee voter anonymity
while maintaining a fully transparent and auditable vote tally.

## How it works

### 1. Voter Identity (Private)
Each voter holds a `secretKey` (32 random bytes) stored only in local private state.
This key **never** leaves the user's device.

### 2. Nullifier Derivation (ZK)
Inside the ZK circuit, the voter's `secretKey` is hashed to produce a **nullifier**:
```
nullifier = persistentHash(["voting:nul:", secretKey])
```
The nullifier is deterministic: the same key always produces the same nullifier for
a given proposal. This prevents double-voting.

### 3. On-Chain Registration
The nullifier is registered on-chain. The contract checks:
- The nullifier does NOT already exist in the nullifiers set.
- If not, it inserts it and increments the vote tally.

### 4. What the chain sees
- **Nullifiers** — cannot be reversed to identify the voter.
- **Vote counts** — fully transparent.
- **Proposal title** — fully transparent.

### 5. What stays private
- The voter's `secretKey`.
- Which specific nullifier belongs to which voter.
- Which option a specific voter chose (though tallies are public).

## Security properties

| Property | Guaranteed? | Mechanism |
|----------|------------|-----------|
| Voter anonymity | ✅ | ZK nullifier commitment |
| No double-voting | ✅ | On-chain nullifier set |
| Tally correctness | ✅ | Public ledger counters |
| Vote integrity | ✅ | ZK circuit enforcement |
| Coercion resistance | ⚠️ Partial | Secret key held locally |
