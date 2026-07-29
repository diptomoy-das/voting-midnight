// Voting DApp — Lace Wallet Management
// SPDX-License-Identifier: Apache-2.0

/**
 * Provides Midnight Lace Wallet connection and disconnection utilities
 * using @midnight-ntwrk/dapp-connector-api and @midnight-ntwrk/midnight-js-network-provider.
 * @packageDocumentation
 */

import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightNetworkProvider } from '@midnight-ntwrk/midnight-js-network-provider';
import semver from 'semver';
import { type Logger } from 'pino';

export const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  accountAddress?: string;
  error?: string;
}

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export const getLaceWalletAPI = (): InitialAPI | undefined => {
  const globalObj = globalThis as unknown as { window?: { midnight?: Record<string, InitialAPI> } };
  const midnight = globalObj.window?.midnight;
  if (!midnight) return undefined;
  return Object.values(midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      typeof wallet.apiVersion === 'string' &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

/**
 * Connects to the Midnight Lace wallet extension using the DApp Connector API.
 */
export const connectLaceWallet = async (
  logger?: Logger,
  networkId: string = 'preprod',
): Promise<ConnectedAPI> => {
  const wallet = getLaceWalletAPI();
  if (!wallet) {
    logger?.error('Midnight Lace wallet extension not found in browser');
    throw new Error('Midnight Lace wallet extension not found. Please install the extension.');
  }

  logger?.info({ networkId }, 'Initiating connection to Midnight Lace Wallet');
  const connectedAPI = await wallet.connect(networkId);
  const status = await connectedAPI.getConnectionStatus();
  logger?.info({ status }, 'Connected to Midnight Lace Wallet successfully');

  return connectedAPI;
};

/**
 * Disconnects an active Midnight Lace wallet connection.
 */
export const disconnectLaceWallet = async (
  connectedAPI?: ConnectedAPI,
  logger?: Logger,
): Promise<void> => {
  if (!connectedAPI) {
    logger?.info('No active wallet session to disconnect');
    return;
  }

  try {
    logger?.info('Disconnecting Midnight Lace wallet session');
    if ('disconnect' in connectedAPI && typeof (connectedAPI as unknown as { disconnect: () => Promise<void> }).disconnect === 'function') {
      await (connectedAPI as unknown as { disconnect: () => Promise<void> }).disconnect();
    }
  } catch (error) {
    logger?.warn({ error }, 'Wallet disconnect warning');
  }
};

/**
 * Checks whether the wallet is currently connected and returns status metadata.
 */
export const checkWalletConnectionStatus = async (
  connectedAPI: ConnectedAPI,
): Promise<{ isConnected: boolean; shieldedCoinPublicKey?: string }> => {
  try {
    const status = await connectedAPI.getConnectionStatus();
    const shielded = await connectedAPI.getShieldedAddresses();
    return {
      isConnected: !!status,
      shieldedCoinPublicKey: shielded.shieldedCoinPublicKey,
    };
  } catch {
    return { isConnected: false };
  }
};
