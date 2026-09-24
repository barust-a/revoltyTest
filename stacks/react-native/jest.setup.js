// jest-expo (built against Jest 29's module-registry semantics) lazily
// installs WinterCG globals (`fetch`, `URL`, `structuredClone`, ...) via a
// Proxy getter that calls `require(...)` the first time the global is read.
// Jest 30 throws if that require happens between tests. Reading each global
// once here (while setup files load, safely "in test code") resolves the
// getter into a plain property so later reads never call require() again.
const EAGER_GLOBALS = [
  'fetch',
  'URL',
  'URLSearchParams',
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'DOMException',
  'structuredClone',
  '__ExpoImportMetaRegistry',
];

for (const name of EAGER_GLOBALS) {
  void globalThis[name];
}

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const Passthrough = (props) => React.createElement(View, props, props.children);
  return {
    __esModule: true,
    SafeAreaProvider: Passthrough,
    SafeAreaView: Passthrough,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  Stack: () => null,
}));
