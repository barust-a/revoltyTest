import React from 'react';

import { HomeScreen } from '../src/features/home/HomeScreen';

// Route files stay thin: compose features, no business logic.
export default function Index() {
  return <HomeScreen />;
}
