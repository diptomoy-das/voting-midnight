// Voting DApp — Type declaration for @midnight-ntwrk/midnight-js-network-provider
// SPDX-License-Identifier: Apache-2.0

declare module '@midnight-ntwrk/midnight-js-network-provider' {
  export type NetworkId = 'standalone' | 'preview' | 'preprod' | 'mainnet';

  export interface MidnightNetworkProvider {
    readonly networkId: NetworkId | string;
    submitTx: (tx: unknown) => Promise<unknown>;
  }

  export const createNetworkProvider: (networkId: NetworkId | string) => MidnightNetworkProvider;
}
