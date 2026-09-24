/// <reference types="jest" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { createTestServices } from '../../adapters/testServices';
import { AppProvider } from '../AppProvider';
import { ClosureScreen } from './ClosureScreen';

async function renderClosure(manipId = 'mp-petit') {
  const { services, advance } = createTestServices();
  await render(
    <AppProvider services={services} tickMs={0}>
      <ClosureScreen manipId={manipId} />
    </AppProvider>,
  );
  return { services, advance };
}

describe('ClosureScreen', () => {
  it('disables "Clôturer" until a result is chosen, then enables it', async () => {
    await renderClosure();
    const closeButton = await screen.findByRole('button', { name: 'Clôturer' });
    expect(closeButton.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(screen.getByRole('radio', { name: 'Résolu' }));

    expect(screen.getByRole('button', { name: 'Clôturer' }).props.accessibilityState).toMatchObject(
      { disabled: false },
    );
  });

  it('shows "Et maintenant ?" with the two follow-up options once "Pas résolu" is chosen', async () => {
    await renderClosure();
    await fireEvent.press(await screen.findByRole('radio', { name: 'Pas résolu' }));

    expect(await screen.findByText('Et maintenant ?')).toBeTruthy();
    expect(screen.getByText('Je repasse')).toBeTruthy();
    expect(screen.getByText('Je transmets à Revolty')).toBeTruthy();
  });

  it('offline: closing records it locally and queues the send', async () => {
    const { services } = createTestServices();
    services.network.setOffline(true);
    await render(
      <AppProvider services={services} tickMs={0}>
        <ClosureScreen manipId="mp-petit" />
      </AppProvider>,
    );

    await fireEvent.press(await screen.findByRole('radio', { name: 'Résolu' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Clôturer' }));

    expect(await screen.findByText('Enregistrée · envoi au retour du réseau')).toBeTruthy();
    expect(await screen.findByText("En attente d'envoi")).toBeTruthy();
  });

  it('online: closing confirms then reports the send as sent', async () => {
    await renderClosure();

    await fireEvent.press(await screen.findByRole('radio', { name: 'Résolu' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Clôturer' }));

    expect(await screen.findByText('Clôturée ✓')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Envoyé ✓')).toBeTruthy());
  });

  it("lists Mme Petit's remise en service chips, including “Disjoncteur réarmé”", async () => {
    await renderClosure();
    expect(await screen.findByRole('checkbox', { name: 'Disjoncteur réarmé' })).toBeTruthy();
  });
});
