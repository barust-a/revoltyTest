/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import { createTestServices } from '../../adapters/testServices';
import { AppProvider } from '../AppProvider';
import { DemoScreen } from './DemoScreen';
import { DEMO_STRINGS } from './strings';

async function renderDemo() {
  const { services } = createTestServices();
  await render(
    <AppProvider services={services} tickMs={0}>
      <DemoScreen />
    </AppProvider>,
  );
  return { services };
}

describe('DemoScreen', () => {
  it('shows the title, the explanation and the current connection state', async () => {
    await renderDemo();

    expect(screen.getByText(DEMO_STRINGS.title)).toBeTruthy();
    expect(screen.getByText(DEMO_STRINGS.intro)).toBeTruthy();
    expect(screen.getByText(DEMO_STRINGS.toggleOfflineOff)).toBeTruthy();
  });

  it('back button returns to the previous screen', async () => {
    await renderDemo();

    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('"Coupure à Bron" triggers the outage and goes back to the home screen', async () => {
    await renderDemo();

    await fireEvent.press(screen.getByRole('button', { name: DEMO_STRINGS.outage }));
    expect(router.back).toHaveBeenCalled();
  });

  it('"Réinitialiser la démo" resets and replaces the route with the home screen', async () => {
    await renderDemo();

    await fireEvent.press(screen.getByRole('button', { name: DEMO_STRINGS.reset }));
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
