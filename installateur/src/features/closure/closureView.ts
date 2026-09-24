import type { ClosureInput } from '../../core/closure';
import type { ManipStatus, ManipType, NextStep } from '../../core/types';
import { CLOSURE_STRINGS } from './strings';

// Pure presentation/build logic for the closure screen — kept out of the JSX (brief rule).

// "Ce que j'ai fait" chips, one list per manip type (spec §3.4 D).
export const CLOSURE_ACTIONS: Record<ManipType, readonly string[]> = {
  remise_en_service: [
    'Disjoncteur réarmé',
    'Batterie redémarrée',
    'Câble de communication rebranché',
  ],
  verifier_tore: ['Tore vérifié', 'Tore réorienté', 'Tore remplacé'],
  changer_module: ['Module remplacé', 'Connectique vérifiée'],
  rappeler_client: ['Client joint', 'Message laissé'],
  verifier_communication: ['Box redémarrée', 'Câble réseau rebranché', 'Wi-Fi reconfiguré'],
};

export function actionsFor(type: ManipType): readonly string[] {
  return CLOSURE_ACTIONS[type];
}

export function toggleAction(actions: readonly string[], action: string): string[] {
  return actions.includes(action) ? actions.filter((a) => a !== action) : [...actions, action];
}

export type ClosureDraft = {
  manipId: string;
  result: 'resolu' | 'pas_resolu';
  next: NextStep;
  actions: readonly string[];
  photos: readonly string[];
  note?: string;
  audioMemo?: string;
  arrivedAt: string;
};

export function buildClosureInput(draft: ClosureDraft): ClosureInput {
  return {
    manipId: draft.manipId,
    result: draft.result,
    ...(draft.result === 'pas_resolu' ? { next: draft.next } : {}),
    actions: [...draft.actions],
    photos: [...draft.photos],
    ...(draft.note !== undefined ? { note: draft.note } : {}),
    ...(draft.audioMemo !== undefined ? { audioMemo: draft.audioMemo } : {}),
    arrivedAt: draft.arrivedAt,
  };
}

export function confirmationTitle(offline: boolean): string {
  return offline ? CLOSURE_STRINGS.closedOffline : CLOSURE_STRINGS.closedOnline;
}

// Only meaningful for a "resolu" closure tied to an alert (spec §3.3): the caller must
// gate this on `manip.alertId !== null` before showing the line at all.
export function batteryStatusLabel(status: ManipStatus): string | null {
  if (status === 'attente_confirmation') return CLOSURE_STRINGS.waitingBattery;
  if (status === 'cloturee') return CLOSURE_STRINGS.confirmedBattery;
  return null;
}

export function nextRecapLabel(next: NextStep): string {
  return next === 'repasser' ? CLOSURE_STRINGS.recapRepasser : CLOSURE_STRINGS.recapTransmettre;
}
