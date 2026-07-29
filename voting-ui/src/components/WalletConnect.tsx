// Voting DApp — WalletConnect Component
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Chip, Typography, CircularProgress, Tooltip, alpha } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import {
  connectLaceWallet,
  disconnectLaceWallet,
  getLaceWalletAPI,
  type WalletConnectionStatus,
} from '../../../api/src/index';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export const WalletConnect: React.FC = () => {
  const [status, setStatus] = useState<WalletConnectionStatus>('disconnected');
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);
  const [shieldedAddress, setShieldedAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect wallet presence on mount or window load
  useEffect(() => {
    const checkWallet = () => {
      const wallet = getLaceWalletAPI();
      if (wallet) {
        setErrorMsg(null);
      } else {
        setErrorMsg('Midnight 1AM / Lace extension not detected');
      }
    };
    checkWallet();
    const intervalId = setInterval(checkWallet, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = useCallback(async () => {
    setStatus('connecting');
    setErrorMsg(null);
    try {
      if (connectedAPI) {
        try {
          await disconnectLaceWallet(connectedAPI);
        } catch {
          // Ignore pre-connect disconnect errors
        }
      }
      const netId = (import.meta.env.VITE_NETWORK_ID as string) || 'preprod';
      const api = await connectLaceWallet(undefined, netId);
      setConnectedAPI(api);
      try {
        const addresses = await api.getShieldedAddresses();
        setShieldedAddress(addresses.shieldedCoinPublicKey);
      } catch (addrErr) {
        console.warn('Could not retrieve shielded address:', addrErr);
      }
      setStatus('connected');
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  }, [connectedAPI]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (connectedAPI) {
        await disconnectLaceWallet(connectedAPI);
      }
    } catch (err) {
      console.warn('Error during disconnect:', err);
    } finally {
      setConnectedAPI(null);
      setShieldedAddress(null);
      setStatus('disconnected');
      setErrorMsg(null);
    }
  }, [connectedAPI]);

  const shortAddress = shieldedAddress
    ? `${shieldedAddress.slice(0, 6)}…${shieldedAddress.slice(-6)}`
    : null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {status === 'connected' ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
            label={shortAddress ? `1AM: ${shortAddress}` : '1AM Connected'}
            size="small"
            sx={{
              background: alpha('#10B981', 0.15),
              border: `1px solid ${alpha('#10B981', 0.4)}`,
              color: '#10B981',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          <Tooltip title="Disconnect 1AM Wallet">
            <Button
              id="disconnect-lace-wallet-btn"
              data-testid="disconnect-lace-wallet-btn"
              variant="outlined"
              size="small"
              onClick={handleDisconnect}
              sx={{
                minWidth: 32,
                px: 1,
                py: 0.5,
                borderColor: alpha('#EF4444', 0.4),
                color: '#EF4444',
                '&:hover': {
                  borderColor: '#EF4444',
                  background: alpha('#EF4444', 0.1),
                },
              }}
            >
              <PowerSettingsNewIcon sx={{ fontSize: 16 }} />
            </Button>
          </Tooltip>
        </Box>
      ) : status === 'connecting' ? (
        <Button
          disabled
          variant="contained"
          size="small"
          startIcon={<CircularProgress size={14} color="inherit" />}
          sx={{ background: alpha('#7C3AED', 0.3), color: '#A78BFA', fontSize: '0.75rem' }}
        >
          Connecting 1AM…
        </Button>
      ) : (
        <Tooltip title={errorMsg ?? 'Connect your Midnight 1AM Wallet'}>
          <Button
            id="connect-lace-wallet-btn"
            data-testid="connect-lace-wallet-btn"
            variant="contained"
            size="small"
            onClick={handleConnect}
            startIcon={
              errorMsg ? (
                <WarningIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
              ) : (
                <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              background: 'linear-gradient(90deg, #7C3AED, #6D28D9)',
              '&:hover': { background: 'linear-gradient(90deg, #6D28D9, #5B21B6)' },
              color: '#FFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 2,
              py: 0.6,
            }}
          >
            Connect 1AM Wallet
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};
