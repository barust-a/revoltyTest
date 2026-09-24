import { describe, expect, it, vi } from 'vitest';

import type { QueueItem } from '../core/types';
import { createFakeBackend } from './backendFake';
import { createDemoClock } from './clockDemo';
import { createCommTestFake, createFieldCaptureFake, createLocationFake } from './deviceFakes';
import { createDemoState } from './fixtures';
import { createFixtureMeasures } from './measuresFixtures';

const ITEM: QueueItem = {
  id: 'q1',
  kind: 'cloture',
  refId: 'mp-1-a1',
  systemId: 'sys-petit',
  label: 'Clôture · Mme Petit',
  sync: 'en_attente',
  createdAt: '2026-09-24T13:00:00Z',
};

const instant = () => Promise.resolve();

describe('demo clock', () => {
  it('starts at the demo time and follows real elapsed time', () => {
    let real = 1_000_000;
    const clock = createDemoClock('2026-09-24T13:00:00Z', () => real);
    expect(clock.now().toISOString()).toBe('2026-09-24T13:00:00.000Z');
    real += 3_000;
    expect(clock.now().toISOString()).toBe('2026-09-24T13:00:03.000Z');
  });
});

describe('fake backend', () => {
  it('accepts sends while online', async () => {
    const { sync, network } = createFakeBackend({ wait: instant });
    expect(network.isOnline()).toBe(true);
    await expect(sync.send(ITEM)).resolves.toBeUndefined();
  });

  it('rejects sends while offline', async () => {
    const { sync, network } = createFakeBackend({ wait: instant });
    network.setOffline(true);
    expect(network.isOnline()).toBe(false);
    await expect(sync.send(ITEM)).rejects.toThrow();
  });

  it('fails exactly the next send once armed', async () => {
    const { sync, network } = createFakeBackend({ wait: instant });
    network.failNextSend();
    await expect(sync.send(ITEM)).rejects.toThrow();
    await expect(sync.send(ITEM)).resolves.toBeUndefined();
  });

  it('waits for the configured latency', async () => {
    const wait = vi.fn(instant);
    const { sync } = createFakeBackend({ wait, latencyMs: 1200 });
    await sync.send(ITEM);
    expect(wait).toHaveBeenCalledWith(1200);
  });
});

describe('fixture measures', () => {
  it('generates measures for a demo system and memoizes them', () => {
    const measures = createFixtureMeasures();
    const petit = createDemoState().systems.find((s) => s.id === 'sys-petit');
    if (petit === undefined) throw new Error('fixture');
    const a = measures.forSystem(petit, '2026-09-17', '2026-09-24T13:00:00Z');
    const b = measures.forSystem(petit, '2026-09-17', '2026-09-24T13:05:00Z');
    expect(a.length).toBe(7 * 96 + 60);
    expect(b).toBe(a);
  });
});

describe('device fakes', () => {
  it('returns a prefilled address', async () => {
    expect(await createLocationFake({ wait: instant }).currentAddress()).toBe(
      '10 rue Garibaldi, 69006 Lyon',
    );
  });

  it('transcribes online and attaches the audio memo offline', async () => {
    const capture = createFieldCaptureFake({ wait: instant });
    expect(await capture.dictate(true)).toEqual({
      note: 'Disjoncteur batterie réarmé, voyant vert, charge relancée.',
    });
    expect(await capture.dictate(false)).toEqual({ audioMemo: 'memo-audio-1.m4a' });
    expect(await capture.takePhoto(1)).toBe('photo-1.jpg');
  });

  it('passes the communication test online, deterministically', async () => {
    const comm = createCommTestFake({ wait: instant });
    const first = await comm.run('RV-2150-3321', true);
    expect(first.ok).toBe(true);
    expect(await comm.run('RV-2150-3321', true)).toEqual(first);
    expect(await comm.run('RV-2150-3321', false)).toEqual({ ok: false });
  });
});
