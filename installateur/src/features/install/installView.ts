import type { InstallDraft } from '../../core/install';
import { parseSerial } from '../../core/serial';
import type { System } from '../../core/types';

// Pure presentation helpers for the 5-step install screen — tested in isolation
// so InstallScreen.tsx stays free of business logic (spec §3.4 E).

const STEP_NAMES: Record<number, string> = {
  1: 'Batterie',
  2: 'Client',
  3: 'Mode de pilotage',
  4: 'Communication',
  5: 'Récapitulatif',
};

const STEP_HELP: Record<number, string> = {
  1: "Vise l'étiquette sous la batterie avec l'appareil photo, ou saisis le numéro à la main s'il est illisible.",
  2: "Recherche le client dans le parc s'il existe déjà, sinon crée-le. L'adresse est pré-remplie avec ta position.",
  3: 'Choisis comment la batterie doit se comporter. Modifiable plus tard depuis le système.',
  4: "Le test se lance automatiquement. S'il échoue, continue quand même : une manip sera créée pour vérifier plus tard.",
  5: 'Vérifie ce qui va être créé avant de terminer.',
};

export function stepLabel(step: number): string {
  return `Étape ${step} sur 5 · ${STEP_NAMES[step] ?? STEP_NAMES[1]}`;
}

export function stepHelp(step: number): string {
  return STEP_HELP[step] ?? STEP_HELP[1]!;
}

export function stepBackLabel(step: number): string {
  return step === 1 ? 'Accueil' : 'Étape précédente';
}

export function stepCta(step: number): string {
  return step === 5 ? 'Terminer' : 'Continuer';
}

// Shown as the serial field is typed: only once there is something to judge, and only
// while it does not (yet) match the expected format.
export function showInvalidSerialHint(input: string | null): boolean {
  const trimmed = (input ?? '').trim();
  return trimmed !== '' && !parseSerial(trimmed).ok;
}

export type ClientMatch = {
  systemId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
};

const MAX_CLIENT_MATCHES = 6;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

// "Client existant" search: name or city, accent/case-insensitive. Empty query → no
// results (avoids dumping the whole park under an empty search box).
export function searchClients(systems: System[], query: string): ClientMatch[] {
  const q = normalize(query.trim());
  if (q === '') return [];
  return systems
    .filter((s) => normalize(s.client.name).includes(q) || normalize(s.city).includes(q))
    .slice(0, MAX_CLIENT_MATCHES)
    .map((s) => ({
      systemId: s.id,
      name: s.client.name,
      city: s.city,
      address: s.client.address,
      phone: s.client.phone ?? '',
      email: s.client.email ?? '',
    }));
}

// What step 5 lists under "À compléter plus tard" for the client contact.
export function missingContactFields(client: InstallDraft['client']): ('phone' | 'email')[] {
  const out: ('phone' | 'email')[] = [];
  if (client.phone.trim() === '') out.push('phone');
  if (client.email.trim() === '') out.push('email');
  return out;
}
