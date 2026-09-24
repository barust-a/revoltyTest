import type { DomainState, Measure, QueueItem, System } from '../core/types';

export interface ClockPort {
  now(): Date;
}

// Sends one queued write (closure, installation) to Revolty. Rejects on failure.
export interface SyncPort {
  send(item: QueueItem): Promise<void>;
}

// Network state as the app perceives it; the demo can force it offline or arm a failure.
export interface NetworkPort {
  isOnline(): boolean;
  setOffline(offline: boolean): void;
  failNextSend(): void;
}

export interface MeasuresPort {
  forSystem(system: System, fromDayKey: string, untilIso: string): Measure[];
}

export interface DemoPort {
  installerName: string;
  initialState(): DomainState;
  applyOutage(state: DomainState): DomainState;
  bringAlertBack(state: DomainState, systemId: string, now: Date): DomainState;
}
