# VoteDApp — Deployment Guide

## Prerequisites

1. Node.js v22+ installed
2. Docker installed and running
3. Compact compiler installed: `npm install -g @midnight-ntwrk/compact-compiler`
4. tNIGHT/tDUST tokens on preprod (from the faucet)

## Step 1: Start the Proof Server

```bash
docker run -p 6300:6300 midnightnetwork/proof-server
```

## Step 2: Compile the contract

```bash
cd contract
compact compile src/voting.compact ./src/managed/voting
```

## Step 3: Deploy via CLI

```bash
cd voting-cli
NODE_OPTIONS="--max-old-space-size=12288" node --loader ts-node/esm src/launcher/preprod.ts
```

When prompted:
- Choose option 1 (Build a fresh wallet) or 2 (restore from seed)
- Wait for wallet funding
- Choose option 1 (Deploy a new Voting DApp contract)
- Enter your proposal title

## Step 4: Copy the contract address

After deployment, copy the contract address printed in the logs:
```
Deployed contract at address: <address>
```

## Step 5: Update placeholders

Replace `<YOUR_DEPLOYED_CONTRACT_ADDRESS>` in:

1. `voting-ui/.env.preprod`:
   ```env
   CONTRACT_ADDRESS=<address>
   ```

2. `README.md` — the Contract Address table

3. `voting-ui/src/main.tsx` — the comment near the top

## Step 6: Build and serve the UI

```bash
cd voting-ui
npm run build
npm run start
```

## Networks

| Network | Indexer | Node |
|---------|---------|------|
| preprod | `https://indexer.preprod.midnight.network` | `https://rpc.preprod.midnight.network` |
| preview | `https://indexer.preview.midnight.network` | `https://rpc.preview.midnight.network` |
