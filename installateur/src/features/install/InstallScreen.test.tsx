/// <reference types="jest" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { createTestServices } from '../../adapters/testServices';
import { emptyDraft } from '../../core/install';
import { DRAFT_KEY } from '../../state/appStore';
import { AppProvider } from '../AppProvider';
import { InstallScreen } from './InstallScreen';

function renderInstall(services: ReturnType<typeof createTestServices>['services']) {
  return render(
    <AppProvider services={services} tickMs={0}>
      <InstallScreen />
    </AppProvider>,
  );
}

describe('InstallScreen · step 1 · Batterie', () => {
  it('shows the format hint for an invalid serial and disables Continuer', async () => {
    const { services } = createTestServices();
    await renderInstall(services);

    await fireEvent.press(screen.getByRole('button', { name: 'Saisir à la main' }));
    await fireEvent.changeText(screen.getByLabelText('Numéro de série'), 'RV-12');

    expect(await screen.findByText('Format attendu : RV-1234-5678')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Continuer' }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('recognizes a valid serial and enables Continuer', async () => {
    const { services } = createTestServices();
    await renderInstall(services);

    await fireEvent.press(screen.getByRole('button', { name: 'Saisir à la main' }));
    await fireEvent.changeText(screen.getByLabelText('Numéro de série'), 'RV-2150-3321');

    expect(await screen.findByText('Revolty 10 kWh · 4 modules')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Continuer' }).props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });
});

describe('InstallScreen · step 2 · Client', () => {
  it('prefills the address from the phone location', async () => {
    const { services } = createTestServices();
    services.storage.set(DRAFT_KEY, { ...emptyDraft(), step: 2 });
    await renderInstall(services);

    expect(await screen.findByDisplayValue('10 rue Garibaldi, 69006 Lyon')).toBeTruthy();
  });
});

describe('InstallScreen · step 3 · Mode de pilotage', () => {
  it('pre-selects Autoconsommation', async () => {
    const { services } = createTestServices();
    services.storage.set(DRAFT_KEY, { ...emptyDraft(), step: 3 });
    await renderInstall(services);

    expect(
      screen.getByRole('radio', { name: 'Autoconsommation' }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });
});

describe('InstallScreen · step 4 · Test de communication', () => {
  it('lets the installer continue via "Passer, vérifier plus tard"', async () => {
    const { services } = createTestServices({
      commTest: { run: () => new Promise(() => undefined) },
    });
    services.storage.set(DRAFT_KEY, {
      ...emptyDraft(),
      step: 4,
      serial: 'RV-2150-3321',
      client: { name: 'M. Blanc', address: '10 rue Garibaldi, 69006 Lyon', phone: '', email: '' },
    });
    await renderInstall(services);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Passer, vérifier plus tard' }),
    );

    expect(
      screen.getByRole('button', { name: 'Continuer' }).props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });
});

describe('InstallScreen · full flow', () => {
  it('goes from scan to "Installation créée ✓"', async () => {
    const { services } = createTestServices();
    await renderInstall(services);

    // Step 1 · Batterie
    await fireEvent.press(screen.getByRole('button', { name: 'Saisir à la main' }));
    await fireEvent.changeText(screen.getByLabelText('Numéro de série'), 'RV-2150-3321');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    // Step 2 · Client
    await fireEvent.changeText(await screen.findByLabelText('Nom'), 'M. Blanc');
    await waitFor(() =>
      expect(screen.getByDisplayValue('10 rue Garibaldi, 69006 Lyon')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    // Step 3 · Mode de pilotage (Autoconsommation already selected)
    await fireEvent.press(await screen.findByRole('button', { name: 'Continuer' }));

    // Step 4 · Test de communication (fake succeeds instantly)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Continuer' }).props.accessibilityState,
      ).toMatchObject({ disabled: false }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    // Step 5 · Récapitulatif
    await fireEvent.press(await screen.findByRole('button', { name: 'Terminer' }));

    expect(await screen.findByText('Installation créée ✓')).toBeTruthy();
  });
});
