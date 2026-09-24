import Storage from 'expo-sqlite/kv-store';

import type { Services } from '../ports/services';
import { createFakeBackend } from './backendFake';
import { createDemoClock } from './clockDemo';
import { createCommTestFake, createFieldCaptureFake, createLocationFake } from './deviceFakes';
import { createDemoPort, DEMO_NOW_ISO } from './fixtures';
import { createExpoHaptics } from './hapticsExpo';
import { createFixtureMeasures } from './measuresFixtures';
import { createCameraScanner } from './scannerCamera';
import { createKvStorage } from './storageKv';

// Composition root: the ONLY place adapters are assembled into Services.
// Imported exclusively by app/_layout.tsx — never by features.
export function createServices(): Services {
  const backend = createFakeBackend();
  return {
    storage: createKvStorage(Storage),
    clock: createDemoClock(DEMO_NOW_ISO),
    sync: backend.sync,
    network: backend.network,
    measures: createFixtureMeasures(),
    demo: createDemoPort(),
    haptics: createExpoHaptics(),
    location: createLocationFake(),
    capture: createFieldCaptureFake(),
    commTest: createCommTestFake(),
    scanner: createCameraScanner(),
  };
}
