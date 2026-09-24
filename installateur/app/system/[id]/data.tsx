import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { DataScreen } from '../../../src/features/data/DataScreen';

export default function SystemDataRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DataScreen systemId={id} />;
}
