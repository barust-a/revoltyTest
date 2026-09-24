import type {
  CommTestPort,
  FieldCapturePort,
  HapticsPort,
  LocationPort,
  ScannerPort,
} from './device';
import type { ClockPort, DemoPort, MeasuresPort, NetworkPort, SyncPort } from './domain';
import type { StoragePort } from './storage';

// Everything a feature may need from the outside world, provided via AppProvider.
export interface Services {
  storage: StoragePort;
  clock: ClockPort;
  sync: SyncPort;
  network: NetworkPort;
  measures: MeasuresPort;
  demo: DemoPort;
  haptics: HapticsPort;
  location: LocationPort;
  capture: FieldCapturePort;
  commTest: CommTestPort;
  scanner: ScannerPort;
}
