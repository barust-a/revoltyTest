/// <reference types="jest" />
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import { createDemoPort } from '../../adapters/fixtures';
import { createTestServices } from '../../adapters/testServices';
import type { Services } from '../../ports/services';
import { AppProvider } from '../AppProvider';
import { HomeScreen } from './HomeScreen';
import { HOME_STRINGS } from './strings';

async function renderHome(overrides: Partial<Services> = {}) {
  const { services, advance } = createTestServices(overrides);
  await render(
    <AppProvider services={services} tickMs={0}>
      <HomeScreen />
    </AppProvider>,
  );
  return { services, advance };
}

describe('HomeScreen — À faire', () => {
  it('orders cards urgent-first (Mme Petit, M. Garnier, M. Bernard) with their urgency labels', async () => {
    await renderHome();

    const cards = screen.getAllByRole('button', {
      name: /^(Remise en service|Changer un module) ·/,
    });
    expect(cards.map((c) => c.props.accessibilityLabel)).toEqual([
      'Remise en service · Mme Petit · Lyon 3',
      'Remise en service · M. Garnier · Bron',
      'Changer un module · M. Bernard · Écully',
    ]);

    expect(screen.getAllByText('Urgent · via alerte')).toHaveLength(2);
    expect(screen.getByText('Urgent · 2 j de retard')).toBeTruthy();
  });
});

describe('HomeScreen — health tiles', () => {
  it('shows "En panne · 2" and hides "À surveiller" once nothing needs watching', async () => {
    const demo = createDemoPort();
    await renderHome({
      demo: {
        ...demo,
        initialState: () => {
          const state = demo.initialState();
          return {
            ...state,
            alerts: state.alerts.map((a) =>
              a.id === 'al-durand' ? { ...a, resolvedAt: '2026-09-24T12:00:00Z' } : a,
            ),
          };
        },
      },
    });

    expect(screen.getByLabelText('En panne · 2')).toBeTruthy();
    expect(screen.queryByText('À surveiller')).toBeNull();
  });
});

describe('HomeScreen — Mon parc', () => {
  it('after triggerOutage(), shows the grouped "Coupure probable · Bron" row', async () => {
    const demo = createDemoPort();
    await renderHome({
      demo: { ...demo, initialState: () => demo.applyOutage(demo.initialState()) },
    });

    expect(screen.getByText('Coupure probable · Bron')).toBeTruthy();
    expect(screen.getByText('7 systèmes sans nouvelles depuis 02:05')).toBeTruthy();
  });

  it('searching "bron" surfaces M. Garnier and hides Mme Petit', async () => {
    await renderHome();

    const input = screen.getByLabelText(HOME_STRINGS.searchPlaceholder);
    await fireEvent.changeText(input, 'bron');

    const parkSection = within(screen.getByTestId('park-section'));
    expect(parkSection.getByText('M. Garnier · Bron')).toBeTruthy();
    expect(parkSection.queryByText('Mme Petit · Lyon 3')).toBeNull();
  });

  it('pressing "Clôturer" on Mme Petit routes to her closure screen', async () => {
    await renderHome();

    // Mme Petit's card is first; its "Clôturer" sits next to (not inside) the card's touchable body.
    expect(
      screen.getAllByRole('button', { name: 'Remise en service · Mme Petit · Lyon 3' }),
    ).toHaveLength(1);
    const [first] = screen.getAllByRole('button', { name: HOME_STRINGS.close });
    if (first === undefined) throw new Error('no Clôturer button');
    await fireEvent.press(first);

    expect(router.push).toHaveBeenCalledWith('/manip/mp-petit/close');
  });
});

describe('HomeScreen — connection', () => {
  it('offline shows "Hors ligne · données de 15:00"', async () => {
    await renderHome({
      network: {
        isOnline: () => false,
        setOffline: () => undefined,
        failNextSend: () => undefined,
      },
    });

    expect(screen.getByText('Hors ligne · données de 15:00')).toBeTruthy();
  });
});
