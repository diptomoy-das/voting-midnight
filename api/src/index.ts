// Voting DApp — API layer
// SPDX-License-Identifier: Apache-2.0

/**
 * Provides types and utilities for working with the Voting DApp contract.
 * @packageDocumentation
 */

import * as Voting from '../../contract/src/managed/voting/contract/index.js';

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type VotingDerivedState,
  type VotingContract,
  type VotingProviders,
  type DeployedVotingContract,
  votingPrivateStateKey,
} from './common-types.js';
import { CompiledVotingContractContract } from '../../contract/src/index';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { VotingPrivateState, createVotingPrivateState } from '../../contract/src/witnesses.js';
import { pureCircuits } from '../../contract/src/managed/voting/contract/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Public API interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The public interface exposed to the UI for a deployed Voting DApp contract.
 */
export interface DeployedVotingAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<VotingDerivedState>;

  /** Cast a vote for Option A. */
  castA: () => Promise<void>;
  /** Cast a vote for Option B. */
  castB: () => Promise<void>;
  /** Cast a vote for Option C. */
  castC: () => Promise<void>;
  /** Close the voting poll. */
  closeVoting: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// VotingAPI implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adapter that wraps a deployed VotingContract and exposes a clean API.
 *
 * Privacy notes:
 * - The voter's `secretKey` lives only in local private state.
 * - A nullifier is derived from it inside ZK and stored publicly.
 * - From the chain, it is impossible to trace a nullifier back to a voter.
 */
export class VotingAPI implements DeployedVotingAPI {
  private constructor(
    public readonly deployedContract: DeployedVotingContract,
    providers: VotingProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = combineLatest(
      [
        // Public ledger state observable
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => Voting.ledger(contractState.data)),
          tap((ls) =>
            logger?.trace({
              ledgerState: {
                title: ls.proposalTitle,
                status: ls.status,
                votesA: ls.votesA.toString(),
                votesB: ls.votesB.toString(),
                votesC: ls.votesC.toString(),
                totalVotes: ls.totalVotes.toString(),
              },
            }),
          ),
        ),
        // Private state (read once — the secret key never changes)
        from(providers.privateStateProvider.get(votingPrivateStateKey) as Promise<VotingPrivateState>),
      ],
      (ledgerState, privateState) => {
        // Derive the user's nullifier to check if they have already voted.
        const nullifier = pureCircuits.deriveNullifier(privateState.secretKey);
        const hasVoted = ledgerState.nullifiers.member(nullifier);

        return {
          proposalTitle: ledgerState.proposalTitle,
          status: ledgerState.status,
          votesA: ledgerState.votesA,
          votesB: ledgerState.votesB,
          votesC: ledgerState.votesC,
          totalVotes: ledgerState.totalVotes,
          hasVoted,
        } satisfies VotingDerivedState;
      },
    );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<VotingDerivedState>;

  async castA(): Promise<void> {
    this.logger?.info('castA: casting vote for Option A');
    const txData = await this.deployedContract.callTx.castA();
    this.logger?.trace({ circuit: 'castA', txHash: txData.public.txHash });
  }

  async castB(): Promise<void> {
    this.logger?.info('castB: casting vote for Option B');
    const txData = await this.deployedContract.callTx.castB();
    this.logger?.trace({ circuit: 'castB', txHash: txData.public.txHash });
  }

  async castC(): Promise<void> {
    this.logger?.info('castC: casting vote for Option C');
    const txData = await this.deployedContract.callTx.castC();
    this.logger?.trace({ circuit: 'castC', txHash: txData.public.txHash });
  }

  async closeVoting(): Promise<void> {
    this.logger?.info('closeVoting: closing the poll');
    const txData = await this.deployedContract.callTx.closeVoting();
    this.logger?.trace({ circuit: 'closeVoting', txHash: txData.public.txHash });
  }

  // ─── Static factory methods ─────────────────────────────────────────────

  /**
   * Deploys a new Voting DApp contract with the given proposal title.
   */
  static async deploy(providers: VotingProviders, proposalTitle: string, logger?: Logger): Promise<VotingAPI> {
    logger?.info({ deployContract: { proposalTitle } });

    const deployedContract = await deployContract(providers, {
      compiledContract: CompiledVotingContractContract,
      privateStateId: votingPrivateStateKey,
      initialPrivateState: createVotingPrivateState(utils.randomBytes(32)),
      args: [proposalTitle],
    });

    logger?.trace({ contractDeployed: deployedContract.deployTxData.public });

    return new VotingAPI(deployedContract, providers, logger);
  }

  /**
   * Joins an already-deployed Voting DApp contract.
   */
  static async join(providers: VotingProviders, contractAddress: ContractAddress, logger?: Logger): Promise<VotingAPI> {
    logger?.info({ joinContract: { contractAddress } });

    const deployedContract = await findDeployedContract<VotingContract>(providers, {
      contractAddress,
      compiledContract: CompiledVotingContractContract,
      privateStateId: votingPrivateStateKey,
      initialPrivateState: await VotingAPI.getPrivateState(providers, contractAddress),
    });

    logger?.trace({ contractJoined: deployedContract.deployTxData.public });

    return new VotingAPI(deployedContract, providers, logger);
  }

  private static async getPrivateState(
    providers: VotingProviders,
    contractAddress: ContractAddress,
  ): Promise<VotingPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existing = await providers.privateStateProvider.get(votingPrivateStateKey);
    return existing ?? createVotingPrivateState(utils.randomBytes(32));
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';
