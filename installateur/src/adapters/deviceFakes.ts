import { hash32 } from '../core/hash';
import type { CommTestPort, FieldCapturePort, LocationPort } from '../ports/device';

// Simulated device capabilities: the prototype must run on the web (Loom demo), where GPS
// reverse geocoding, speech recognition and the battery link are not available.

type Opts = { wait?: (ms: number) => Promise<void> };
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createLocationFake({ wait = sleep }: Opts = {}): LocationPort {
  return {
    async currentAddress() {
      await wait(600);
      return '10 rue Garibaldi, 69006 Lyon';
    },
  };
}

export function createFieldCaptureFake({ wait = sleep }: Opts = {}): FieldCapturePort {
  let memos = 0;
  return {
    async takePhoto(index) {
      await wait(300);
      return `photo-${index}.jpg`;
    },
    async dictate(online) {
      await wait(1500);
      if (online) return { note: 'Disjoncteur batterie réarmé, voyant vert, charge relancée.' };
      memos += 1;
      return { audioMemo: `memo-audio-${memos}.m4a` };
    },
  };
}

export function createCommTestFake({ wait = sleep }: Opts = {}): CommTestPort {
  return {
    async run(serial, online) {
      await wait(online ? 2500 : 4000);
      if (!online) return { ok: false };
      return { ok: true, socPct: 40 + (hash32(serial) % 40) };
    },
  };
}
