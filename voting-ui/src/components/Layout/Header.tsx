// Voting DApp — Header component
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, alpha } from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LockIcon from '@mui/icons-material/Lock';
import { WalletConnect } from '../WalletConnect';

const Header: React.FC = () => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, #0F0F1A 0%, #1A1A2E 100%)',
        borderBottom: `1px solid ${alpha('#7C3AED', 0.3)}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Logo + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(124, 58, 237, 0.6)',
            }}
          >
            <HowToVoteIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #7C3AED, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              VoteDApp
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF', lineHeight: 1 }}>
              Powered by Midnight
            </Typography>
          </Box>
        </Box>

        {/* Right action bar: Privacy badge + Wallet connect */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<LockIcon sx={{ fontSize: '14px !important' }} />}
            label="Zero-Knowledge Privacy"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              background: alpha('#7C3AED', 0.15),
              border: `1px solid ${alpha('#7C3AED', 0.4)}`,
              color: '#A78BFA',
              fontWeight: 500,
              fontSize: '0.7rem',
            }}
          />
          <WalletConnect />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
