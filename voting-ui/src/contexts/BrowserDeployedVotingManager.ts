// Voting DApp — Browser Deployed Voting Manager
// SPDX-License-Identifier: Apache-2.0

import {
  VotingAPI,
  type VotingCircuitKeys,
  type VotingProviders,
  type DeployedVotingAPI,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { VotingPrivateState } from '@midnight-ntwrk/voting-contract';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

// ─── Deployment status types ─────────────────────────────────────────────────

export interface InProgressVotingDeployment {
  readonly status: 'in-progress';
}

export interface DeployedVotingDeployment {
  readonly status: 'deployed';
  readonly api: DeployedVotingAPI;
}

export interface FailedVotingDeployment {
  readonly status: 'failed';
  readonly error: Error;
}

export type VotingDeployment = InProgressVotingDeployment | DeployedVotingDeployment | FailedVotingDeployment;

// ─── Provider interface ───────────────────────────────────────────────────────

export interface DeployedVotingAPIProvider {
  readonly votingDeployments$: Observable<Array<Observable<VotingDeployment>>>;

  /**
   * Deploy a new Voting DApp or join an existing one by contract address.
   * @param contractAddress If provided, joins an existing contract; otherwise deploys a new one.
   * @param proposalTitle   Required when deploying a new contract.
   */
  readonly resolve: (contractAddress?: ContractAddress, proposalTitle?: string) => Observable<VotingDeployment>;
}

// ─── BrowserDeployedVotingManager ────────────────────────────────────────────

export class BrowserDeployedVotingManager implements DeployedVotingAPIProvider {
  readonly #deploymentsSubject: BehaviorSubject<Array<BehaviorSubject<VotingDeployment>>>;
  #initializedProviders: Promise<VotingProviders> | undefined;

  constructor(private readonly logger: Logger) {
    this.#deploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<VotingDeployment>>>([]);
    this.votingDeployments$ = this.#deploymentsSubject;
  }

  readonly votingDeployments$: Observable<Array<Observable<VotingDeployment>>>;

  resolve(contractAddress?: ContractAddress, proposalTitle?: string): Observable<VotingDeployment> {
    const deployments = this.#deploymentsSubject.value;

    // Reuse an existing deployment if already connected.
    const existing = deployments.find(
      (d) => d.value.status === 'deployed' && d.value.api.deployedContractAddress === contractAddress,
    );
    if (existing) return existing;

    const deployment = new BehaviorSubject<VotingDeployment>({ status: 'in-progress' });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment, proposalTitle ?? 'Community Vote');
    }

    this.#deploymentsSubject.next([...deployments, deployment]);
    return deployment;
  }

  private getProviders(): Promise<VotingProviders> {
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<VotingDeployment>, proposalTitle: string): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await VotingAPI.deploy(providers, proposalTitle, this.logger);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<VotingDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers = await this.getProviders();
      const api = await VotingAPI.join(providers, contractAddress, this.logger);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

// ─── Provider initialization ──────────────────────────────────────────────────

const initializeProviders = async (logger: Logger): Promise<VotingProviders> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<VotingCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  const inMemoryVotingPrivateStateProvider = inMemoryPrivateStateProvider<string, VotingPrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider: inMemoryVotingPrivateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, 'Balancing transaction via wallet');
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, 'Error balancing transaction via wallet');
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0];
        logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
        return txId;
      },
    },
  };
};

// ─── Wallet connection helpers ────────────────────────────────────────────────

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  const midnightObj = window.midnight as Record<string, InitialAPI>;

  const semverMatch = Object.values(midnightObj).find(
    (w) =>
      !!w &&
      typeof w === 'object' &&
      'connect' in w &&
      'apiVersion' in w &&
      typeof w.apiVersion === 'string' &&
      semver.satisfies(w.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
  if (semverMatch) return semverMatch;

  const broadMatch = Object.values(midnightObj).find(
    (w) =>
      !!w &&
      typeof w === 'object' &&
      'connect' in w &&
      'apiVersion' in w &&
      typeof w.apiVersion === 'string' &&
      semver.satisfies(w.apiVersion, '>=0.1.0'),
  );
  if (broadMatch) return broadMatch;

  return Object.values(midnightObj).find(
    (w): w is InitialAPI =>
      !!w && typeof w === 'object' && 'connect' in w && typeof (w as unknown as { connect: unknown }).connect === 'function',
  );
};

const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> =>
  firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((api) => logger.info(api, 'Check for wallet connector API')),
      filter((api): api is InitialAPI => !!api),
      tap((api) => logger.info(api, 'Compatible wallet connector API found. Connecting.')),
      take(1),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');
            return new Error('Could not find Midnight wallet. Extension installed and enabled?');
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const status = await connectedAPI.getConnectionStatus();
        logger.info(status, 'Wallet connector API enabled status');
        return connectedAPI;
      }),
      timeout({
        first: 30_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');
            return new Error('Midnight wallet has failed to respond. Check popup approval.');
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API' + error);
              return new Error('Application is not authorized');
            })
          : apis,
      ),
    ),
  );
