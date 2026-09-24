import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { ClosureScreen } from '../../../src/features/closure/ClosureScreen';

export default function CloseManipRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClosureScreen manipId={id} />;
}
