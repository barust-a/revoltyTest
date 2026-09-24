import type { QueueItem, SyncState } from './types';

export function nextToSend(queue: QueueItem[]): QueueItem | null {
  return queue.find((item) => item.sync === 'en_attente') ?? null;
}

export function setSync(queue: QueueItem[], id: string, sync: SyncState): QueueItem[] {
  return queue.map((item) => (item.id === id ? { ...item, sync } : item));
}

export function retry(queue: QueueItem[], id: string): QueueItem[] {
  return queue.map((item) =>
    item.id === id && item.sync === 'echec' ? { ...item, sync: 'en_attente' } : item,
  );
}

export function pendingCount(queue: QueueItem[]): number {
  return queue.filter((item) => item.sync !== 'envoyee').length;
}

export function failedCount(queue: QueueItem[]): number {
  return queue.filter((item) => item.sync === 'echec').length;
}

export function syncOf(queue: QueueItem[], refId: string): SyncState | null {
  for (let i = queue.length - 1; i >= 0; i--) {
    const item = queue[i];
    if (item !== undefined && item.refId === refId) return item.sync;
  }
  return null;
}

export function enqueue(queue: QueueItem[], item: Omit<QueueItem, 'sync'>): QueueItem[] {
  return [...queue, { ...item, sync: 'en_attente' }];
}
