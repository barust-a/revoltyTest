import type { SyncState } from '../core/types';

export const UI_STRINGS = {
  back: 'Retour',
  sync: {
    en_attente: "En attente d'envoi",
    envoi: 'Envoi…',
    envoyee: 'Envoyé ✓',
    echec: 'Échec · Réessayer',
  } satisfies Record<SyncState, string>,
} as const;
