import type { ComponentType } from 'react';

export interface HapticsPort {
  success(): void;
  warning(): void;
}

// Prefills the client address from the phone's position (typing with gloves is the enemy).
export interface LocationPort {
  currentAddress(): Promise<string | null>;
}

export interface FieldCapturePort {
  takePhoto(index: number): Promise<string | null>;
  // Transcription can fail (noise, offline): the audio memo is then attached as is.
  dictate(online: boolean): Promise<{ note?: string; audioMemo?: string }>;
}

export type CommTestResult = { ok: true; socPct: number } | { ok: false };

export interface CommTestPort {
  run(serial: string, online: boolean): Promise<CommTestResult>;
}

export type ScannerViewProps = {
  onScanned: (code: string) => void;
  onUnavailable: () => void;
};

export interface ScannerPort {
  View: ComponentType<ScannerViewProps>;
}
