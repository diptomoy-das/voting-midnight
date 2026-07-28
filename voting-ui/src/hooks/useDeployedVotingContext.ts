// Voting DApp — useDeployedVotingContext hook
// SPDX-License-Identifier: Apache-2.0

import { useContext } from 'react';
import { DeployedVotingContext, type DeployedVotingAPIProvider } from '../contexts';

/**
 * Retrieves the currently in-scope deployed voting provider.
 * Must be used inside a <DeployedVotingProvider />.
 */
export const useDeployedVotingContext = (): DeployedVotingAPIProvider => {
  const context = useContext(DeployedVotingContext);

  if (!context) {
    throw new Error('A <DeployedVotingProvider /> is required.');
  }

  return context;
};
