import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { SystemScreen } from '../../../src/features/system/SystemScreen';

export default function SystemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SystemScreen systemId={id} />;
}
