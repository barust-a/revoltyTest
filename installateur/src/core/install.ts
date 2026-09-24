import { z } from 'zod';

import { dueTomorrow } from './alerts';
import { parseSerial, batteryLabel } from './serial';
import { enqueue } from './sync';
import { PilotModeSchema, type DomainState, type Manip, type System } from './types';

// Persisted so an interrupted installation (phone call, basement) resumes where it stopped.
export const InstallDraftSchema = z.object({
  step: z.number().int().min(1).max(5),
  serial: z.string().nullable(),
  clientMode: z.enum(['nouveau', 'existant']),
  client: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  pilotMode: PilotModeSchema,
  comm: z.enum(['ok', 'skipped']).nullable(),
  commSocPct: z.number().nullable(),
});

export type InstallDraft = z.infer<typeof InstallDraftSchema>;

export const INSTALL_STEPS = 5;

export function emptyDraft(): InstallDraft {
  return {
    step: 1,
    serial: null,
    clientMode: 'nouveau',
    client: { name: '', address: '', phone: '', email: '' },
    pilotMode: 'autoconsommation',
    comm: null,
    commSocPct: null,
  };
}

const EmailSchema = z.email();

export function isValidOptionalEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed === '' || EmailSchema.safeParse(trimmed).success;
}

export function canAdvance(draft: InstallDraft): boolean {
  switch (draft.step) {
    case 1:
      return draft.serial !== null && parseSerial(draft.serial).ok;
    case 2:
      return (
        draft.client.name.trim() !== '' &&
        draft.client.address.trim() !== '' &&
        isValidOptionalEmail(draft.client.email)
      );
    case 4:
      return draft.comm !== null;
    default:
      return true;
  }
}

export function cityFromAddress(address: string): string {
  const afterPostcode = /\b\d{5}\s+(.+)$/.exec(address.trim());
  if (afterPostcode?.[1] !== undefined) return afterPostcode[1].trim();
  const parts = address.split(',');
  return (parts[parts.length - 1] ?? address).trim();
}

export function completeInstallation(
  state: DomainState,
  draft: InstallDraft,
  now: Date,
): { state: DomainState; systemId: string } {
  const parsed = parseSerial(draft.serial ?? '');
  if (!parsed.ok) throw new Error('completeInstallation: invalid serial');
  const nowIso = now.toISOString();
  const verified = draft.comm === 'ok';
  const phone = draft.client.phone.trim();
  const email = draft.client.email.trim();

  const system: System = {
    id: `sys-${parsed.serial}`,
    serial: parsed.serial,
    client: {
      name: draft.client.name.trim(),
      address: draft.client.address.trim(),
      ...(phone !== '' && { phone }),
      ...(email !== '' && { email }),
    },
    city: cityFromAddress(draft.client.address),
    batteryLabel: batteryLabel(parsed.serial),
    pilotMode: draft.pilotMode,
    configuration: verified ? 'verifiee' : 'non_verifiee',
    lastMeasureAt: verified ? nowIso : null,
    installedAt: nowIso,
    isNew: true,
  };

  const manips: Manip[] = verified
    ? state.manips
    : [
        ...state.manips,
        {
          id: `mp-${system.id}-comm`,
          systemId: system.id,
          type: 'verifier_communication',
          origin: 'installation',
          alertId: null,
          createdAt: nowIso,
          dueAt: dueTomorrow(now),
          openedByInstaller: false,
          status: 'a_faire',
          reopened: false,
          transmitted: false,
          confirmBy: null,
          attempts: [],
        },
      ];

  return {
    systemId: system.id,
    state: {
      ...state,
      systems: [...state.systems.map((s) => (s.isNew ? { ...s, isNew: false } : s)), system],
      manips,
      queue: enqueue(state.queue, {
        id: `q-${system.id}`,
        kind: 'installation',
        refId: system.id,
        systemId: system.id,
        label: `Installation · ${system.client.name}`,
        createdAt: nowIso,
      }),
    },
  };
}
