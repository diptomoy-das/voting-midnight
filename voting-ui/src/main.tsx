// Voting DApp — Entry point
// SPDX-License-Identifier: Apache-2.0

/**
 * Single Page Application for the Midnight Voting DApp.
 * @packageDocumentation
 */
import './globals';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { setNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './config/theme';
import '@midnight-ntwrk/dapp-connector-api';
import * as pino from 'pino';
import { DeployedVotingProvider } from './contexts';

// Contract address placeholder — replace after deployment:
// CONTRACT_ADDRESS = <YOUR_DEPLOYED_CONTRACT_ADDRESS>

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
setNetworkId(networkId);

export const logger = pino.pino({
  level: import.meta.env.VITE_LOGGING_LEVEL as string,
});

logger.trace(`networkId = ${networkId}`);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <DeployedVotingProvider logger={logger}>
        <App />
      </DeployedVotingProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
