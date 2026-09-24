import { Stack } from 'expo-router';
import React from 'react';

import { createServices } from '../src/adapters/wiring';
import { AppProvider } from '../src/features/AppProvider';

// Composition root: the ONLY file that touches adapters/wiring.
const services = createServices();

export default function RootLayout() {
  return (
    <AppProvider services={services}>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
