import { describe, expect, it } from 'vitest';

import {
  actionsFor,
  batteryStatusLabel,
  buildClosureInput,
  confirmationTitle,
  nextRecapLabel,
  toggleAction,
} from './closureView';

describe('actionsFor', () => {
  it('lists remise en service actions, including Mme Petit’s expected chip', () => {
    expect(actionsFor('remise_en_service')).toContain('Disjoncteur réarmé');
  });

  it('lists verifier_tore actions', () => {
    expect(actionsFor('verifier_tore')).toEqual([
      'Tore vérifié',
      'Tore réorienté',
      'Tore remplacé',
    ]);
  });

  it('lists changer_module actions', () => {
    expect(actionsFor('changer_module')).toEqual(['Module remplacé', 'Connectique vérifiée']);
  });

  it('lists rappeler_client actions', () => {
    expect(actionsFor('rappeler_client')).toEqual(['Client joint', 'Message laissé']);
  });

  it('lists verifier_communication actions', () => {
    expect(actionsFor('verifier_communication')).toEqual([
      'Box redémarrée',
      'Câble réseau rebranché',
      'Wi-Fi reconfiguré',
    ]);
  });
});

describe('toggleAction', () => {
  it('adds an action not yet selected', () => {
    expect(toggleAction(['Tore vérifié'], 'Tore remplacé')).toEqual([
      'Tore vérifié',
      'Tore remplacé',
    ]);
  });

  it('removes an action already selected', () => {
    expect(toggleAction(['Tore vérifié', 'Autre'], 'Autre')).toEqual(['Tore vérifié']);
  });
});

describe('buildClosureInput', () => {
  it('omits `next` for a resolved closure', () => {
    const input = buildClosureInput({
      manipId: 'mp-petit',
      result: 'resolu',
      next: 'repasser',
      actions: ['Disjoncteur réarmé'],
      photos: [],
      arrivedAt: '2026-09-24T13:32:00Z',
    });
    expect(input.result).toBe('resolu');
    expect(input.next).toBeUndefined();
    expect('next' in input).toBe(false);
  });

  it('keeps `next` for an unresolved closure', () => {
    const input = buildClosureInput({
      manipId: 'mp-petit',
      result: 'pas_resolu',
      next: 'transmettre_revolty',
      actions: [],
      photos: [],
      arrivedAt: '2026-09-24T13:32:00Z',
    });
    expect(input.next).toBe('transmettre_revolty');
  });

  it('carries note or audio memo only when present', () => {
    const withNote = buildClosureInput({
      manipId: 'mp-petit',
      result: 'resolu',
      next: 'repasser',
      actions: [],
      photos: [],
      note: 'Batterie relancée',
      arrivedAt: '2026-09-24T13:32:00Z',
    });
    expect(withNote.note).toBe('Batterie relancée');
    expect('audioMemo' in withNote).toBe(false);
  });
});

describe('confirmationTitle', () => {
  it('reads "Clôturée ✓" online', () => {
    expect(confirmationTitle(false)).toBe('Clôturée ✓');
  });

  it('reads "Enregistrée · envoi au retour du réseau" offline', () => {
    expect(confirmationTitle(true)).toBe('Enregistrée · envoi au retour du réseau');
  });
});

describe('batteryStatusLabel', () => {
  it('waits for the battery while attente_confirmation', () => {
    expect(batteryStatusLabel('attente_confirmation')).toBe(
      'En attente de confirmation par la batterie…',
    );
  });

  it('confirms once cloturee', () => {
    expect(batteryStatusLabel('cloturee')).toBe('Confirmé par la batterie ✓');
  });

  it('has nothing to say for other statuses', () => {
    expect(batteryStatusLabel('a_faire')).toBeNull();
    expect(batteryStatusLabel('a_confirmer')).toBeNull();
  });
});

describe('nextRecapLabel', () => {
  it('labels repasser', () => {
    expect(nextRecapLabel('repasser')).toBe('Tu repasses demain');
  });

  it('labels transmettre_revolty', () => {
    expect(nextRecapLabel('transmettre_revolty')).toBe('Transmise à Revolty');
  });
});
