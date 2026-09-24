import React from 'react';

import { InstallScreen } from '../src/features/install/InstallScreen';

// Route is thin by convention: no params, renders the feature screen.
export default function Install() {
  return <InstallScreen />;
}
