// Voting DApp — VotingCard component
// SPDX-License-Identifier: Apache-2.0
//
// This component renders the interactive UI for a deployed Voting DApp contract.
// It shows:
//   - The proposal title
//   - Live vote tallies (A / B / C) with animated progress bars
//   - A voting interface when the poll is OPEN and the user hasn't voted
//   - A "You already voted" badge when the user's nullifier is on-chain
//   - A CLOSED badge when the poll is closed

import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Skeleton,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { type VotingDerivedState, type DeployedVotingAPI } from '../../../api/src/index';
import { useDeployedVotingContext } from '../hooks';
import { type VotingDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { VotingStatus } from '../../../contract/src/index';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VotingCardProps {
  votingDeployment$?: Observable<VotingDeployment>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toShortAddress = (addr: ContractAddress | undefined): string => {
  if (!addr) return 'Loading...';
  return `0x${addr.slice(0, 8)}…${addr.slice(-8)}`;
};

const calcPct = (votes: bigint, total: bigint): number => {
  if (total === 0n) return 0;
  return Number((votes * 100n) / total);
};

const OPTION_LABELS = ['Option A', 'Option B', 'Option C'] as const;
const OPTION_COLORS = ['#7C3AED', '#10B981', '#F59E0B'] as const;

interface TallyBarProps {
  label: string;
  votes: bigint;
  total: bigint;
  color: string;
}

const TallyBar: React.FC<TallyBarProps> = ({ label, votes, total, color }) => {
  const pct = calcPct(votes, total);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          {votes.toString()} votes ({pct}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(color, 0.15),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: color,
            transition: 'width 0.6s ease-in-out',
          },
        }}
      />
    </Box>
  );
};

// ─── Empty state (no deployment yet) ─────────────────────────────────────────

interface EmptyVotingCardProps {
  onDeployCallback: (title: string) => void;
  onJoinCallback: (address: ContractAddress) => void;
}

const EmptyVotingCard: React.FC<EmptyVotingCardProps> = ({ onDeployCallback, onJoinCallback }) => {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');

  return (
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <HowToVoteIcon sx={{ fontSize: 48, color: '#7C3AED', mb: 1 }} />
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          Start a Vote
        </Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          Deploy a new proposal or join an existing one.
        </Typography>
      </Box>

      {/* Deploy new */}
      <Box sx={{ mb: 3 }}>
        <input
          id="proposal-title-input"
          placeholder="Proposal title (e.g. Best consensus mechanism?)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(124,58,237,0.4)',
            background: 'rgba(124,58,237,0.08)',
            color: '#F3F4F6',
            fontSize: 14,
            outline: 'none',
            marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        <Button
          id="deploy-btn"
          variant="contained"
          fullWidth
          disabled={!title.trim()}
          onClick={() => onDeployCallback(title.trim())}
          sx={{
            background: 'linear-gradient(90deg, #7C3AED, #6D28D9)',
            '&:hover': { background: 'linear-gradient(90deg, #6D28D9, #5B21B6)' },
            py: 1.2,
          }}
        >
          Deploy New Proposal
        </Button>
      </Box>

      <Typography variant="caption" sx={{ color: '#4B5563', display: 'block', textAlign: 'center', mb: 1.5 }}>
        — or join existing —
      </Typography>

      {/* Join existing */}
      <input
        id="contract-address-input"
        placeholder="Contract address (hex)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(16,185,129,0.4)',
          background: 'rgba(16,185,129,0.06)',
          color: '#F3F4F6',
          fontSize: 14,
          outline: 'none',
          marginBottom: 10,
          boxSizing: 'border-box',
        }}
      />
      <Button
        id="join-btn"
        variant="outlined"
        fullWidth
        disabled={!address.trim()}
        onClick={() => onJoinCallback(address.trim() as ContractAddress)}
        sx={{
          borderColor: alpha('#10B981', 0.5),
          color: '#10B981',
          '&:hover': { borderColor: '#10B981', background: alpha('#10B981', 0.08) },
          py: 1.2,
        }}
      >
        Join Existing Proposal
      </Button>
    </CardContent>
  );
};

// ─── Main VotingCard ─────────────────────────────────────────────────────────

export const VotingCard: React.FC<Readonly<VotingCardProps>> = ({ votingDeployment$ }) => {
  const votingAPIProvider = useDeployedVotingContext();
  const [votingDeployment, setVotingDeployment] = useState<VotingDeployment>();
  const [deployedAPI, setDeployedAPI] = useState<DeployedVotingAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [votingState, setVotingState] = useState<VotingDerivedState>();
  const [isWorking, setIsWorking] = useState(!!votingDeployment$);
  const [copied, setCopied] = useState(false);

  const onDeployCallback = useCallback(
    (title: string) => votingAPIProvider.resolve(undefined, title),
    [votingAPIProvider],
  );
  const onJoinCallback = useCallback(
    (address: ContractAddress) => votingAPIProvider.resolve(address),
    [votingAPIProvider],
  );

  const onVote = useCallback(
    async (option: 'A' | 'B' | 'C') => {
      if (!deployedAPI) return;
      try {
        setIsWorking(true);
        if (option === 'A') await deployedAPI.castA();
        else if (option === 'B') await deployedAPI.castB();
        else await deployedAPI.castC();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
      } finally {
        setIsWorking(false);
      }
    },
    [deployedAPI],
  );

  const onCloseVoting = useCallback(async () => {
    if (!deployedAPI) return;
    try {
      setIsWorking(true);
      await deployedAPI.closeVoting();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsWorking(false);
    }
  }, [deployedAPI]);

  const onCopyAddress = useCallback(async () => {
    if (deployedAPI?.deployedContractAddress) {
      await navigator.clipboard.writeText(deployedAPI.deployedContractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [deployedAPI]);

  // Subscribe to deployment observable
  useEffect(() => {
    if (!votingDeployment$) return;
    const sub = votingDeployment$.subscribe(setVotingDeployment);
    return () => sub.unsubscribe();
  }, [votingDeployment$]);

  // Handle state changes
  useEffect(() => {
    if (!votingDeployment) return;
    if (votingDeployment.status === 'in-progress') return;

    setIsWorking(false);

    if (votingDeployment.status === 'failed') {
      setErrorMessage(
        votingDeployment.error.message.length ? votingDeployment.error.message : 'Unexpected error.',
      );
      return;
    }

    setDeployedAPI(votingDeployment.api);
    const sub = votingDeployment.api.state$.subscribe(setVotingState);
    return () => sub.unsubscribe();
  }, [votingDeployment]);

  const isOpen = votingState?.status === VotingStatus.OPEN;
  const hasVoted = votingState?.hasVoted ?? false;
  const total = votingState?.totalVotes ?? 0n;

  return (
    <Card
      sx={{
        position: 'relative',
        minWidth: 380,
        maxWidth: 460,
        width: '100%',
      }}
    >
      {/* Loading overlay */}
      <Backdrop
        sx={{ position: 'absolute', color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, borderRadius: '16px' }}
        open={isWorking}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress data-testid="voting-working-indicator" sx={{ color: '#7C3AED' }} />
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Generating ZK Proof…
          </Typography>
        </Box>
      </Backdrop>

      {/* Error overlay */}
      <Backdrop
        sx={{
          position: 'absolute',
          color: '#EF4444',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderRadius: '16px',
          flexDirection: 'column',
          gap: 1,
          p: 3,
        }}
        open={!!errorMessage}
        onClick={() => setErrorMessage(undefined)}
      >
        <ErrorIcon fontSize="large" />
        <Typography
          component="div"
          data-testid="voting-error-message"
          sx={{ color: '#EF4444', textAlign: 'center', fontSize: '0.85rem' }}
        >
          {errorMessage}
        </Typography>
        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
          (click to dismiss)
        </Typography>
      </Backdrop>

      {/* Empty card — no deployment yet */}
      {!votingDeployment$ && (
        <EmptyVotingCard onDeployCallback={onDeployCallback} onJoinCallback={onJoinCallback} />
      )}

      {/* Deployed card */}
      {votingDeployment$ && (
        <>
          {/* Card header */}
          <CardHeader
            avatar={
              votingState ? (
                isOpen ? (
                  <LockOpenIcon data-testid="voting-open-icon" sx={{ color: '#10B981' }} />
                ) : (
                  <LockIcon data-testid="voting-closed-icon" sx={{ color: '#9CA3AF' }} />
                )
              ) : (
                <Skeleton variant="circular" width={24} height={24} />
              )
            }
            title={
              votingState ? (
                <Typography variant="subtitle2" noWrap data-testid="voting-proposal-title" sx={{ fontWeight: 700 }}>
                  {votingState.proposalTitle}
                </Typography>
              ) : (
                <Skeleton width={160} height={20} />
              )
            }
            subheader={
              deployedAPI ? (
                <Typography variant="caption" sx={{ color: '#6B7280', fontFamily: 'monospace' }}>
                  {toShortAddress(deployedAPI.deployedContractAddress)}
                </Typography>
              ) : (
                <Skeleton width={120} height={14} />
              )
            }
            action={
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', pt: 1, pr: 1 }}>
                {/* Status chip */}
                {votingState && (
                  <Chip
                    label={isOpen ? 'OPEN' : 'CLOSED'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      background: isOpen ? alpha('#10B981', 0.15) : alpha('#9CA3AF', 0.15),
                      color: isOpen ? '#10B981' : '#9CA3AF',
                      border: `1px solid ${isOpen ? alpha('#10B981', 0.4) : alpha('#9CA3AF', 0.3)}`,
                    }}
                  />
                )}
                {/* Copy address */}
                {deployedAPI?.deployedContractAddress && (
                  <Tooltip title={copied ? 'Copied!' : 'Copy contract address'}>
                    <IconButton
                      id="copy-contract-address-btn"
                      size="small"
                      onClick={onCopyAddress}
                      data-testid="copy-address-btn"
                    >
                      <ContentCopyIcon sx={{ fontSize: 16, color: copied ? '#10B981' : '#9CA3AF' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            }
            sx={{ pb: 0 }}
          />

          <CardContent sx={{ pt: 1.5 }}>
            {/* Tally bars */}
            {votingState ? (
              <Box sx={{ mb: 2.5 }}>
                <TallyBar label="Option A" votes={votingState.votesA} total={total} color={OPTION_COLORS[0]} />
                <TallyBar label="Option B" votes={votingState.votesB} total={total} color={OPTION_COLORS[1]} />
                <TallyBar label="Option C" votes={votingState.votesC} total={total} color={OPTION_COLORS[2]} />
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  Total votes: <strong style={{ color: '#F3F4F6' }}>{total.toString()}</strong>
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 2.5 }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={20} sx={{ mb: 1.5, borderRadius: 1 }} />
                ))}
              </Box>
            )}

            {/* Vote actions */}
            {deployedAPI && (
              <>
                {hasVoted ? (
                  <Box
                    data-testid="already-voted-badge"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      background: alpha('#10B981', 0.08),
                      border: `1px solid ${alpha('#10B981', 0.3)}`,
                      mb: 1.5,
                    }}
                  >
                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>
                      Your vote has been cast privately.
                    </Typography>
                  </Box>
                ) : isOpen ? (
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    {(['A', 'B', 'C'] as const).map((opt, idx) => (
                      <Button
                        key={opt}
                        id={`vote-option-${opt.toLowerCase()}-btn`}
                        data-testid={`vote-option-${opt.toLowerCase()}-btn`}
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => onVote(opt)}
                        sx={{
                          borderColor: alpha(OPTION_COLORS[idx], 0.5),
                          color: OPTION_COLORS[idx],
                          '&:hover': {
                            borderColor: OPTION_COLORS[idx],
                            background: alpha(OPTION_COLORS[idx], 0.1),
                          },
                          fontWeight: 700,
                        }}
                      >
                        {OPTION_LABELS[idx]}
                      </Button>
                    ))}
                  </Box>
                ) : null}

                {/* Close voting (admin action) */}
                {isOpen && (
                  <Button
                    id="close-voting-btn"
                    data-testid="close-voting-btn"
                    variant="text"
                    size="small"
                    fullWidth
                    onClick={onCloseVoting}
                    sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' }, fontSize: '0.72rem' }}
                  >
                    Close Voting
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
};
