/// <reference types="jest" />
import { router } from 'expo-router';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createTestServices } from '../../adapters/testServices';
import { AppProvider } from '../AppProvider';
import { SystemScreen } from './SystemScreen';

describe('SystemScreen', () => {
  it("shows Mme Petit's outage, its reason, its age and the data verdict", async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <SystemScreen systemId="sys-petit" />
      </AppProvider>,
    );

    expect(screen.getByText('En panne')).toBeTruthy();
    expect(screen.getAllByText('La batterie ne se recharge plus').length).toBeGreaterThan(0);
    expect(screen.getByText('Depuis lun. 21 sept., 14 h (3 jours)')).toBeTruthy();
    expect(screen.getByText('Pour le client')).toBeTruthy();
    expect(screen.getByText('Anormal depuis lun. 21 sept.')).toBeTruthy();
  });

  it('opens the data screen when the data card is pressed', async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <SystemScreen systemId="sys-petit" />
      </AppProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Voir les données' }));
    expect(router.push).toHaveBeenCalledWith('/system/sys-petit/data');
  });

  it('shows no active problem for a healthy system', async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <SystemScreen systemId="sys-lefevre" />
      </AppProvider>,
    );

    expect(screen.getByText('OK')).toBeTruthy();
    expect(screen.getByText('Rien à signaler sur ce système')).toBeTruthy();
  });
});
