// Voting DApp — Frontend ZK Circuit Call Abstractions
// SPDX-License-Identifier: Apache-2.0

/**
 * Exposes explicit ZK circuit execution wrappers with progress reporting
 * for frontend triggers and proof generation visibility.
 * @packageDocumentation
 */

import { type DeployedVotingContract } from './common-types.js';
import { type Logger } from 'pino';

export type CircuitProofPhase = 'idle' | 'generating-proof' | 'submitting-tx' | 'finalized' | 'error';

export interface CircuitProofProgress {
  phase: CircuitProofPhase;
  circuitName: 'castA' | 'castB' | 'castC' | 'closeVoting';
  txHash?: string;
  error?: string;
}

export type ProofProgressCallback = (progress: CircuitProofProgress) => void;

/**
 * Triggers the `castA` zero-knowledge circuit execution on the deployed contract.
 */
export const callCastACircuit = async (
  contract: DeployedVotingContract,
  onProgress?: ProofProgressCallback,
  logger?: Logger,
): Promise<{ txHash: string }> => {
  logger?.info('Executing frontend ZK circuit call: castA');
  onProgress?.({ phase: 'generating-proof', circuitName: 'castA' });

  try {
    const txData = await contract.callTx.castA();
    const txHash = txData.public.txHash;

    onProgress?.({ phase: 'submitting-tx', circuitName: 'castA', txHash });
    logger?.info({ txHash }, 'castA circuit execution completed successfully');
    onProgress?.({ phase: 'finalized', circuitName: 'castA', txHash });

    return { txHash };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger?.error({ error: errorMsg }, 'castA circuit call failed');
    onProgress?.({ phase: 'error', circuitName: 'castA', error: errorMsg });
    throw err;
  }
};

/**
 * Triggers the `castB` zero-knowledge circuit execution on the deployed contract.
 */
export const callCastBCircuit = async (
  contract: DeployedVotingContract,
  onProgress?: ProofProgressCallback,
  logger?: Logger,
): Promise<{ txHash: string }> => {
  logger?.info('Executing frontend ZK circuit call: castB');
  onProgress?.({ phase: 'generating-proof', circuitName: 'castB' });

  try {
    const txData = await contract.callTx.castB();
    const txHash = txData.public.txHash;

    onProgress?.({ phase: 'submitting-tx', circuitName: 'castB', txHash });
    logger?.info({ txHash }, 'castB circuit execution completed successfully');
    onProgress?.({ phase: 'finalized', circuitName: 'castB', txHash });

    return { txHash };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger?.error({ error: errorMsg }, 'castB circuit call failed');
    onProgress?.({ phase: 'error', circuitName: 'castB', error: errorMsg });
    throw err;
  }
};

/**
 * Triggers the `castC` zero-knowledge circuit execution on the deployed contract.
 */
export const callCastCCircuit = async (
  contract: DeployedVotingContract,
  onProgress?: ProofProgressCallback,
  logger?: Logger,
): Promise<{ txHash: string }> => {
  logger?.info('Executing frontend ZK circuit call: castC');
  onProgress?.({ phase: 'generating-proof', circuitName: 'castC' });

  try {
    const txData = await contract.callTx.castC();
    const txHash = txData.public.txHash;

    onProgress?.({ phase: 'submitting-tx', circuitName: 'castC', txHash });
    logger?.info({ txHash }, 'castC circuit execution completed successfully');
    onProgress?.({ phase: 'finalized', circuitName: 'castC', txHash });

    return { txHash };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger?.error({ error: errorMsg }, 'castC circuit call failed');
    onProgress?.({ phase: 'error', circuitName: 'castC', error: errorMsg });
    throw err;
  }
};

/**
 * Triggers the `closeVoting` zero-knowledge circuit execution on the deployed contract.
 */
export const callCloseVotingCircuit = async (
  contract: DeployedVotingContract,
  onProgress?: ProofProgressCallback,
  logger?: Logger,
): Promise<{ txHash: string }> => {
  logger?.info('Executing frontend ZK circuit call: closeVoting');
  onProgress?.({ phase: 'generating-proof', circuitName: 'closeVoting' });

  try {
    const txData = await contract.callTx.closeVoting();
    const txHash = txData.public.txHash;

    onProgress?.({ phase: 'submitting-tx', circuitName: 'closeVoting', txHash });
    logger?.info({ txHash }, 'closeVoting circuit execution completed successfully');
    onProgress?.({ phase: 'finalized', circuitName: 'closeVoting', txHash });

    return { txHash };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger?.error({ error: errorMsg }, 'closeVoting circuit call failed');
    onProgress?.({ phase: 'error', circuitName: 'closeVoting', error: errorMsg });
    throw err;
  }
};
