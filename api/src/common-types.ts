// Voting DApp — common types and abstractions
// SPDX-License-Identifier: Apache-2.0

/**
 * Voting DApp common types.
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightNetworkProvider } from '@midnight-ntwrk/midnight-js-network-provider';
import type { VotingStatus, VotingPrivateState, Contract, Witnesses } from '../../contract/src/index';

export type { ConnectedAPI, InitialAPI, MidnightNetworkProvider };

export const votingPrivateStateKey = 'votingPrivateState';
export type PrivateStateId = typeof votingPrivateStateKey;

/**
 * Schema describing all private states in the application.
 * Currently just one: the voter's secret key store.
 */
export type PrivateStates = {
  readonly votingPrivateState: VotingPrivateState;
};

/** Voting contract type parameterised by private state and witnesses. */
export type VotingContract = Contract<VotingPrivateState, Witnesses<VotingPrivateState>>;

/** Circuit keys exported from the compiled VotingContract. */
export type VotingCircuitKeys = Exclude<keyof VotingContract['impureCircuits'], number | symbol>;

/** Providers required by the voting contract. */
export type VotingProviders = MidnightProviders<VotingCircuitKeys, PrivateStateId, VotingPrivateState>;

/** A VotingContract that has been deployed to the network. */
export type DeployedVotingContract = FoundContract<VotingContract>;

/**
 * Derived state combining public ledger data with local private state.
 * The UI uses this to render vote tallies and whether the user has voted.
 */
export type VotingDerivedState = {
  /** The proposal title stored on-chain. */
  readonly proposalTitle: string;
  /** Current voting status: OPEN or CLOSED. */
  readonly status: VotingStatus;
  /** Tally for option A. */
  readonly votesA: bigint;
  /** Tally for option B. */
  readonly votesB: bigint;
  /** Tally for option C. */
  readonly votesC: bigint;
  /** Total number of ballots cast. */
  readonly totalVotes: bigint;
  /**
   * Whether the current user has already voted.
   * Derived by checking if the user's nullifier is in the nullifier set.
   */
  readonly hasVoted: boolean;
};
