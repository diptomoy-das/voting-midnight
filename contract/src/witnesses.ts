// Voting DApp — contract witnesses and private state definition
// SPDX-License-Identifier: Apache-2.0

/*
 * Defines the shape of the voting contract's private state
 * and the single witness function that accesses it.
 *
 * PRIVATE DATA: Only the voter's secretKey is stored privately.
 * The nullifier derived from it is publicly committed on-chain,
 * but the link between nullifier and voter identity cannot be
 * recovered without the secret key.
 */

import { Ledger } from "./managed/voting/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

/**
 * The private state for the Voting DApp.
 * Only the voter's secret key is held locally — it never touches the chain.
 */
export type VotingPrivateState = {
  readonly secretKey: Uint8Array;
};

/** Creates a VotingPrivateState from a 32-byte secret key. */
export const createVotingPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

/**
 * Witnesses implementation for the voting contract.
 * Maps the Compact `localSecretKey` witness to its TypeScript implementation.
 */
export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, VotingPrivateState>): [
    VotingPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
