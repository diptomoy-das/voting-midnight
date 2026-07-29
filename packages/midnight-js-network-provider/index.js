// Voting DApp — Midnight Network Provider package
// SPDX-License-Identifier: Apache-2.0

export const createNetworkProvider = (networkId) => ({
  networkId,
  submitTx: async () => {},
});
