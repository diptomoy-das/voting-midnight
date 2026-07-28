// Voting DApp CLI — interactive command-line interface
// SPDX-License-Identifier: Apache-2.0

/*
 * Main driver for the Midnight Voting DApp CLI.
 * Startup files (standalone.ts, preprod.ts, etc.) call `run()` with
 * environment-specific configuration.
 */

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import {
  VotingAPI,
  type VotingDerivedState,
  type VotingProviders,
  type DeployedVotingContract,
  type PrivateStateId,
} from '../../api/src/index';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ledger, type Ledger, VotingStatus } from '../../contract/src/managed/voting/contract/index.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { TestEnvironment } from '@midnight-ntwrk/testkit-js';
import { MidnightWalletProvider } from './midnight-wallet-provider';
import { randomBytes } from '../../api/src/utils';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils';
import { generateDust } from './generate-dust';
import { VotingPrivateState } from '../../contract/src/witnesses.js';

// @ts-expect-error: Needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// ─── Ledger state query ───────────────────────────────────────────────────────

export const getVotingLedgerState = async (
  providers: VotingProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  return contractState != null ? ledger(contractState.data) : null;
};

// ─── Deploy or Join ───────────────────────────────────────────────────────────

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new Voting DApp contract
  2. Join an existing Voting DApp contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (providers: VotingProviders, rli: Interface, logger: Logger): Promise<VotingAPI | null> => {
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1': {
        const title = await rli.question('Enter the proposal title: ');
        const api = await VotingAPI.deploy(providers, title, logger);
        logger.info(`Deployed contract at address: ${api.deployedContractAddress}`);
        return api;
      }
      case '2': {
        const addr = await rli.question('Contract address (hex): ');
        const api = await VotingAPI.join(providers, addr, logger);
        logger.info(`Joined contract at address: ${api.deployedContractAddress}`);
        return api;
      }
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Display helpers ──────────────────────────────────────────────────────────

const displayLedgerState = async (
  providers: VotingProviders,
  deployedContract: DeployedVotingContract,
  logger: Logger,
): Promise<void> => {
  const addr = deployedContract.deployTxData.public.contractAddress;
  const ls = await getVotingLedgerState(providers, addr);
  if (!ls) {
    logger.info(`No contract found at ${addr}`);
  } else {
    logger.info(`Proposal: "${ls.proposalTitle}"`);
    logger.info(`Status:   ${ls.status === VotingStatus.OPEN ? 'OPEN' : 'CLOSED'}`);
    logger.info(`Votes A:  ${ls.votesA}`);
    logger.info(`Votes B:  ${ls.votesB}`);
    logger.info(`Votes C:  ${ls.votesC}`);
    logger.info(`Total:    ${ls.totalVotes}`);
  }
};

const displayDerivedState = (state: VotingDerivedState | undefined, logger: Logger) => {
  if (!state) {
    logger.info('No voting state available yet.');
    return;
  }
  logger.info(`Proposal: "${state.proposalTitle}"`);
  logger.info(`Status:   ${state.status === VotingStatus.OPEN ? 'OPEN' : 'CLOSED'}`);
  logger.info(`Votes A:  ${state.votesA}`);
  logger.info(`Votes B:  ${state.votesB}`);
  logger.info(`Votes C:  ${state.votesC}`);
  logger.info(`Total:    ${state.totalVotes}`);
  logger.info(`You have ${state.hasVoted ? 'already voted (nullifier on-chain)' : 'NOT voted yet'}`);
};

// ─── Main loop ────────────────────────────────────────────────────────────────

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Cast vote for Option A
  2. Cast vote for Option B
  3. Cast vote for Option C
  4. Close voting
  5. Display ledger state (public)
  6. Display derived state (includes your voting status)
  7. Exit
Which would you like to do? `;

const mainLoop = async (providers: VotingProviders, rli: Interface, logger: Logger): Promise<void> => {
  const votingApi = await deployOrJoin(providers, rli, logger);
  if (!votingApi) return;

  let currentState: VotingDerivedState | undefined;
  const subscription = votingApi.state$.subscribe((s) => (currentState = s));

  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case '1':
            await votingApi.castA();
            logger.info('Vote for Option A submitted.');
            break;
          case '2':
            await votingApi.castB();
            logger.info('Vote for Option B submitted.');
            break;
          case '3':
            await votingApi.castC();
            logger.info('Vote for Option C submitted.');
            break;
          case '4':
            await votingApi.closeVoting();
            logger.info('Voting closed.');
            break;
          case '5':
            await displayLedgerState(providers, votingApi.deployedContract, logger);
            break;
          case '6':
            displayDerivedState(currentState, logger);
            break;
          case '7':
            logger.info('Exiting...');
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        logError(logger, e);
        logger.info('Returning to main menu...');
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

// ─── Wallet setup ─────────────────────────────────────────────────────────────

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<string | undefined> => {
  if (config instanceof StandaloneConfig) {
    return GENESIS_MINT_WALLET_SEED;
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return toHex(randomBytes(32));
      case '2':
        return await rli.question('Enter your wallet seed: ');
      case '3':
        logger.info('Exiting...');
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Entry point ──────────────────────────────────────────────────────────────

export const run = async (config: Config, testEnv: TestEnvironment, logger: Logger): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];

  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started: ${JSON.stringify(envConfiguration)}`);

    const seed = await buildWallet(config, rli, logger);
    if (!seed) return;

    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;
    await walletProvider.start();

    const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, unshieldedToken());
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (!nightBalance) {
      logger.info('No funds received, exiting...');
      return;
    }
    logger.info(`NIGHT balance: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustGeneration) {
        logger.info(`Dust generation tx submitted: ${dustGeneration}`);
        await syncWallet(logger, walletFacade);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<'castA' | 'castB' | 'castC' | 'closeVoting'>(config.zkConfigPath);

    const providers: VotingProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, VotingPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => 'VotingDApp-Test-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };

    await mainLoop(providers, rli, logger);
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      for (const wallet of providersToBeStopped) {
        try {
          logger.info('Stopping wallet...');
          await wallet.stop();
        } catch (e) {
          logError(logger, e);
        }
      }
      if (testEnv) {
        try {
          logger.info('Stopping test environment...');
          await testEnv.shutdown();
        } catch (e) {
          logError(logger, e);
        }
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Error: ${e.message}`);
    logger.debug(e.stack);
  } else {
    logger.error('Unknown error');
  }
}
