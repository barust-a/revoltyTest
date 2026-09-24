/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createMemoryStorage } from '../../adapters/storageMemory';
import { AppProvider } from '../AppProvider';
import { HomeScreen } from './HomeScreen';
import { STRINGS } from './strings';

// Gotcha: on RN's new architecture, render/fireEvent are async — always await them.
async function renderHome() {
  await render(
    <AppProvider services={{ storage: createMemoryStorage() }}>
      <HomeScreen />
    </AppProvider>,
  );
}

describe('HomeScreen', () => {
  it('greets the typed name with the exact core output', async () => {
    await renderHome();
    await fireEvent.changeText(screen.getByPlaceholderText(STRINGS.namePlaceholder), 'Ada');
    await fireEvent.press(screen.getByRole('button', { name: STRINGS.greetButton }));
    expect(await screen.findByText('Hello, Ada!')).toBeTruthy();
  });

  it('greets "stranger" when the input is empty', async () => {
    await renderHome();
    await fireEvent.press(screen.getByRole('button', { name: STRINGS.greetButton }));
    expect(await screen.findByText('Hello, stranger!')).toBeTruthy();
  });
});
