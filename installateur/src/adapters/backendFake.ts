import type { NetworkPort, SyncPort } from '../ports/domain';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Stand-in for Revolty's API (no backend in this prototype): latency, offline, one-shot failure.
export function createFakeBackend({
  latencyMs = 1200,
  wait = sleep,
}: { latencyMs?: number; wait?: (ms: number) => Promise<void> } = {}): {
  sync: SyncPort;
  network: NetworkPort;
} {
  let offline = false;
  let failNext = false;
  return {
    network: {
      isOnline: () => !offline,
      setOffline: (value) => {
        offline = value;
      },
      failNextSend: () => {
        failNext = true;
      },
    },
    sync: {
      async send() {
        await wait(latencyMs);
        if (offline) throw new Error('offline');
        if (failNext) {
          failNext = false;
          throw new Error('server error');
        }
      },
    },
  };
}
