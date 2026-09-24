/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { Button, ChoiceButton } from './Button';
import { HealthPill } from './HealthBadge';
import { SyncBadge } from './SyncBadge';

describe('HealthPill', () => {
  it.each([
    ['en_panne', 'En panne'],
    ['sans_nouvelles', 'Sans nouvelles'],
    ['a_surveiller', 'À surveiller'],
    ['ok', 'OK'],
  ] as const)('never relies on color alone for %s', async (status, label) => {
    await render(<HealthPill status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
    expect(
      screen.getByTestId(`health-icon-${status}`, { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});

describe('Button', () => {
  it('exposes the disabled state and ignores presses', async () => {
    const onPress = jest.fn();
    await render(<Button label="Clôturer" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Clôturer' });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Clôturer" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Clôturer' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ChoiceButton', () => {
  it('reports its selected state', async () => {
    await render(
      <ChoiceButton label="Résolu" icon="check-circle" tone="ok" selected onPress={jest.fn()} />,
    );
    expect(screen.getByRole('radio', { name: 'Résolu' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});

describe('SyncBadge', () => {
  it.each([
    ['en_attente', "En attente d'envoi"],
    ['envoi', 'Envoi…'],
    ['envoyee', 'Envoyé ✓'],
  ] as const)('labels %s', async (sync, label) => {
    await render(<SyncBadge sync={sync} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('offers a retry on failure', async () => {
    const onRetry = jest.fn();
    await render(<SyncBadge sync="echec" onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Échec · Réessayer' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
