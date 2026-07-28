// Voting DApp — MainLayout component
// SPDX-License-Identifier: Apache-2.0

import React, { type PropsWithChildren } from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';

const MainLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top left, #1A0533 0%, #0F0F1A 40%, #0A0A14 100%)',
    }}
  >
    <Header />
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 4, md: 6 },
        px: { xs: 2, md: 4 },
      }}
    >
      {children}
    </Container>
  </Box>
);

export default MainLayout;
