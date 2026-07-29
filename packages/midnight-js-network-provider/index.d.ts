// Voting DApp — Midnight Network Provider package
// SPDX-License-Identifier: Apache-2.0

export type NetworkId = 'standalone' | 'preview' | 'preprod' | 'mainnet';

export interface MidnightNetworkProvider {
  readonly networkId: NetworkId | string;
  submitTx: (tx: unknown) => Promise<unknown>;
}

export declare const createNetworkProvider: (networkId: NetworkId | string) => MidnightNetworkProvider;
