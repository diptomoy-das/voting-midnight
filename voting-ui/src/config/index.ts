// Voting DApp — config barrel
export * from './theme';

// Contract address placeholder — replace after deployment
export const CONTRACT_ADDRESS = '<YOUR_DEPLOYED_CONTRACT_ADDRESS>';

// Supported networks
export const SUPPORTED_NETWORKS = ['preprod', 'preview'] as const;
export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];
