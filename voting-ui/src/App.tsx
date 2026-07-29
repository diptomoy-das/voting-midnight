// Voting DApp — Root Application Component
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { MainLayout, VotingCard } from './components';
import { useDeployedVotingContext } from './hooks';
import { type VotingDeployment } from './contexts';
import { type Observable } from 'rxjs';
import LockIcon from '@mui/icons-material/Lock';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightNetworkProvider } from '@midnight-ntwrk/midnight-js-network-provider';

/**
 * Root Voting DApp component.
 *
 * Subscribes to `votingDeployments$` from the context and renders
 * a VotingCard for each active deployment, plus an empty "start" card.
 */
const App: React.FC = () => {
  const votingAPIProvider = useDeployedVotingContext();
  const [votingDeployments, setVotingDeployments] = useState<Array<Observable<VotingDeployment>>>([]);

  useEffect(() => {
    const subscription = votingAPIProvider.votingDeployments$.subscribe(setVotingDeployments);
    return () => subscription.unsubscribe();
  }, [votingAPIProvider]);

  return (
    <Box sx={{ background: '#0F0F1A', minHeight: '100vh' }}>
      <MainLayout>
        {/* Hero section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #10B981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1.5,
            }}
          >
            Private Voting on Midnight
          </Typography>
          <Typography variant="body1" sx={{ color: '#9CA3AF', maxWidth: 560, mx: 'auto', mb: 2 }}>
            Cast your ballot anonymously using zero-knowledge proofs. The vote tally is public; your identity stays
            private on the Midnight blockchain.
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: 2,
              py: 0.8,
              borderRadius: 10,
              border: `1px solid ${alpha('#7C3AED', 0.4)}`,
              background: alpha('#7C3AED', 0.08),
            }}
          >
            <LockIcon sx={{ fontSize: 14, color: '#A78BFA' }} />
            <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 600 }}>
              Zero-Knowledge • Nullifier-Based Double-Vote Prevention • Midnight Network
            </Typography>
          </Box>
        </Box>

        {/* Contract address placeholder comment — filled in after deployment */}
        {/* CONTRACT_ADDRESS = <YOUR_DEPLOYED_CONTRACT_ADDRESS> */}

        {/* Voting cards grid */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {/* Active deployments */}
          {votingDeployments.map((deployment, idx) => (
            <div data-testid={`voting-card-${idx}`} key={`voting-card-${idx}`}>
              <VotingCard votingDeployment$={deployment} />
            </div>
          ))}

          {/* Empty "start" card always at the end */}
          <div data-testid="voting-card-start">
            <VotingCard />
          </div>
        </Box>
      </MainLayout>
    </Box>
  );
};

export default App;
