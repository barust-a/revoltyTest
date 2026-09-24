/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { createTestServices } from '../../adapters/testServices';
import { AppProvider } from '../AppProvider';
import { DataScreen } from './DataScreen';

// jest-expo doesn't transform these ESM-only packages; the real geometry is covered by
// dataView.test.ts (vitest). Here we only need something that renders without crashing.
jest.mock('react-native-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't close over module-scope imports.
  const RN = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RNCore = require('react');
  const Stub = (props: { children?: unknown }) =>
    RNCore.createElement(RN.View, props, props.children);
  return {
    __esModule: true,
    Svg: Stub,
    Path: Stub,
    Line: Stub,
    Rect: Stub,
    Defs: Stub,
    Pattern: Stub,
    G: Stub,
    default: Stub,
  };
});

jest.mock('d3-shape', () => {
  function shapeGenerator() {
    let isDefined: (d: unknown, i: number) => boolean = () => true;
    const generator = (data: unknown[]) => {
      const runs: number[] = [];
      let runLength = 0;
      data.forEach((d, i) => {
        if (isDefined(d, i)) {
          runLength += 1;
        } else if (runLength > 0) {
          runs.push(runLength);
          runLength = 0;
        }
      });
      if (runLength > 0) runs.push(runLength);
      return runs.map((len) => `M${len}`).join('');
    };
    generator.defined = (fn: (d: unknown, i: number) => boolean) => {
      isDefined = fn;
      return generator;
    };
    generator.x = () => generator;
    generator.y = () => generator;
    generator.y0 = () => generator;
    generator.y1 = () => generator;
    return generator;
  }
  return { area: shapeGenerator, line: shapeGenerator };
});

describe('DataScreen', () => {
  it("shows Mme Petit's abnormal verdict and its onset", async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <DataScreen systemId="sys-petit" />
      </AppProvider>,
    );

    expect(
      screen.getByText('La batterie ne se charge plus alors que les panneaux produisent'),
    ).toBeTruthy();
    expect(screen.getAllByText('Anormal depuis lun. 21 sept.').length).toBeGreaterThan(0);
  });

  it("flags today's data as incomplete for M. Roux and legends the wait band", async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <DataScreen systemId="sys-roux" />
      </AppProvider>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'jeu. 24' }));

    expect(screen.getByText('incomplet')).toBeTruthy();
    expect(screen.getByText('En attente de remontée')).toBeTruthy();
  });

  it('changes the day title when another strip day is touched', async () => {
    const { services } = createTestServices();
    await render(
      <AppProvider services={services} tickMs={0}>
        <DataScreen systemId="sys-lefevre" />
      </AppProvider>,
    );

    expect(screen.getByText('Hier · mer. 23 sept.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'lun. 21' }));
    expect(screen.getByText('lun. 21 sept.')).toBeTruthy();
  });
});
