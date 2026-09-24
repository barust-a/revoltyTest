import { describe, expect, it } from 'vitest';

import { enqueue, failedCount, nextToSend, pendingCount, retry, setSync, syncOf } from './sync';
import type { QueueItem } from './types';

const CREATED_AT = '2026-09-24T13:00:00.000Z';

function makeQueue(): QueueItem[] {
  return [
    {
      id: 'q1',
      kind: 'cloture',
      refId: 'closure-1',
      systemId: 'sys-1',
      label: 'Clôture · Mme Petit',
      sync: 'en_attente',
      createdAt: CREATED_AT,
    },
    {
      id: 'q2',
      kind: 'installation',
      refId: 'install-1',
      systemId: 'sys-2',
      label: 'Installation · M. Dupont',
      sync: 'envoyee',
      createdAt: CREATED_AT,
    },
  ];
}

describe('sync', () => {
  it('walks the full chain en_attente -> envoi -> envoyee', () => {
    const queue = makeQueue();
    const sent = setSync(queue, 'q1', 'envoi');
    expect(sent.find((i) => i.id === 'q1')?.sync).toBe('envoi');

    const confirmed = setSync(sent, 'q1', 'envoyee');
    expect(confirmed.find((i) => i.id === 'q1')?.sync).toBe('envoyee');

    // original queue untouched
    expect(queue.find((i) => i.id === 'q1')?.sync).toBe('en_attente');
  });

  it('retries a failed item back to en_attente, leaving others unchanged', () => {
    const queue = makeQueue();
    const failed = setSync(queue, 'q1', 'echec');
    const retried = retry(failed, 'q1');
    expect(retried.find((i) => i.id === 'q1')?.sync).toBe('en_attente');
    expect(retried.find((i) => i.id === 'q2')?.sync).toBe('envoyee');
  });

  it('retry leaves non-echec items unchanged', () => {
    const queue = makeQueue();
    const retried = retry(queue, 'q2');
    expect(retried.find((i) => i.id === 'q2')?.sync).toBe('envoyee');
  });

  it('nextToSend skips envoi, echec and envoyee, returning the first en_attente item', () => {
    const queue: QueueItem[] = [
      { ...makeQueue()[1]!, id: 'q0', sync: 'envoi' },
      { ...makeQueue()[1]!, id: 'q2b', sync: 'echec' },
      { ...makeQueue()[1]!, id: 'q3', sync: 'envoyee' },
      { ...makeQueue()[0]!, id: 'q4', sync: 'en_attente' },
    ];
    expect(nextToSend(queue)?.id).toBe('q4');
  });

  it('nextToSend returns null when nothing is pending', () => {
    expect(nextToSend([{ ...makeQueue()[1]! }])).toBeNull();
  });

  it('pendingCount counts everything not envoyee', () => {
    const queue = makeQueue();
    expect(pendingCount(queue)).toBe(1);
  });

  it('failedCount counts echec items', () => {
    const queue = setSync(makeQueue(), 'q1', 'echec');
    expect(failedCount(queue)).toBe(1);
  });

  it('syncOf returns the sync of the LAST item with a given refId', () => {
    const queue = makeQueue();
    const withRetry = enqueue(queue, {
      id: 'q3',
      kind: 'cloture',
      refId: 'closure-1',
      systemId: 'sys-1',
      label: 'Clôture · Mme Petit',
      createdAt: CREATED_AT,
    });
    expect(syncOf(withRetry, 'closure-1')).toBe('en_attente');
  });

  it('syncOf returns null when the refId is unknown', () => {
    expect(syncOf(makeQueue(), 'unknown')).toBeNull();
  });

  it('enqueue appends a new item with sync en_attente', () => {
    const queue = makeQueue();
    const withNew = enqueue(queue, {
      id: 'q3',
      kind: 'installation',
      refId: 'install-2',
      systemId: 'sys-3',
      label: 'Installation · Mme Roux',
      createdAt: CREATED_AT,
    });
    expect(withNew).toHaveLength(3);
    expect(withNew[2]).toEqual({
      id: 'q3',
      kind: 'installation',
      refId: 'install-2',
      systemId: 'sys-3',
      label: 'Installation · Mme Roux',
      sync: 'en_attente',
      createdAt: CREATED_AT,
    });
    // original queue untouched
    expect(queue).toHaveLength(2);
  });
});
