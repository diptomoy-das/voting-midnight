// Voting DApp — MUI theme (dark midnight palette)
// SPDX-License-Identifier: Apache-2.0

import { createTheme, alpha } from '@mui/material';

// Midnight purple-violet palette for the Voting DApp
const midnightViolet = '#7C3AED'; // vivid violet
const midnightPurple = '#6D28D9'; // deep purple

export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    allVariants: {
      color: '#F3F4F6',
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: midnightViolet,
      light: alpha(midnightViolet, 0.7),
      dark: midnightPurple,
    },
    secondary: {
      main: '#10B981', // emerald green for "success" states
    },
    error: {
      main: '#EF4444',
    },
    background: {
      default: '#0F0F1A',
      paper: '#1A1A2E',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#9CA3AF',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
          border: `1px solid ${alpha(midnightViolet, 0.3)}`,
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});
