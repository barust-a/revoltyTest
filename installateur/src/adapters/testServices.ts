import type { Services } from '../ports/services';
import { createFakeBackend } from './backendFake';
import { createCommTestFake, createFieldCaptureFake, createLocationFake } from './deviceFakes';
import { createDemoPort, DEMO_NOW_ISO } from './fixtures';
import { createFixtureMeasures } from './measuresFixtures';
import { createMemoryStorage } from './storageMemory';

// Test-only composition: instant fakes, in-memory storage and a clock the test drives.
export function createTestServices(overrides: Partial<Services> = {}) {
  let now = new Date(DEMO_NOW_ISO);
  const instant = () => Promise.resolve();
  const backend = createFakeBackend({ wait: instant });
  const services: Services = {
    storage: createMemoryStorage(),
    clock: { now: () => now },
    sync: backend.sync,
    network: backend.network,
    measures: createFixtureMeasures(),
    demo: createDemoPort(),
    haptics: { success: () => undefined, warning: () => undefined },
    location: createLocationFake({ wait: instant }),
    capture: createFieldCaptureFake({ wait: instant }),
    commTest: createCommTestFake({ wait: instant }),
    scanner: { View: () => null },
    ...overrides,
  };
  return {
    services,
    advance(ms: number) {
      now = new Date(now.getTime() + ms);
    },
  };
}
