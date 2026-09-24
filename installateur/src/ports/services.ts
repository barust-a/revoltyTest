import type { StoragePort } from './storage';

// Everything a feature may need from the outside world, provided via AppProvider.
export interface Services {
  storage: StoragePort;
}
