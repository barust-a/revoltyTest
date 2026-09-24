---
name: rn-app-practices
description: Good practices for Expo/React Native apps built from ai-project-base. Use whenever writing, reviewing, or refactoring RN code — components, adapters, state, tests, or configs. Enforces the layered architecture, zod-first typing, purity of core/, and testing conventions.
---

# RN App — Good Practices Skill

Generalized from the gibberlate app (proven over ~16 shipped features). Applies on top of
`project-practices`.

## Architecture (non-negotiable)

- Layers: `core/` → `ports/` → `adapters/` + `state/` + `features/` → `app/`.
  Dependencies point INWARD only.
- `src/core/**` is pure TypeScript. It must NEVER import `react`, `react-native`, `expo*`,
  or any adapter. If core needs a capability (audio, storage, network), it describes it as
  data; an outer layer performs it.
- Ports are the boundary: features get ports from `AppProvider` context. If you're typing
  `import { someAdapter }` inside `features/`, stop and use the port.
- `app/` route files stay thin: compose features, no business logic, no styles beyond layout.
- ESLint enforces all of this (`eslint.config.js`) and `src/core/architecture.test.ts`
  guards it in the test suite. Keep both green — they are the cheapest guardrails in the repo.
- Extending a registry-style domain (new theme, new entity type) should be one new file in
  `core/` + one line in a registry. If it requires touching anything else, the abstraction
  leaked — fix the leak, not the entry.

## Zod-first typing

- Every shape crossing a boundary (storage, bundled JSON, persisted zustand state, configs)
  has a zod schema. The TS type is ALWAYS `z.infer<typeof XSchema>` — never a hand-written
  duplicate interface.
- Reads are validated with `safeParse`. On failure: return null/default + `console.warn` in
  dev. Never let invalid persisted data crash the app; never silently trust it either.
- Schemas live next to their domain (`core/types.ts` for domain shapes, adapter files for
  adapter-only shapes).
- Use `.brand<>()` for IDs that must not be mixed, and `z.enum` over string unions when the
  set is closed.

## Determinism in core

- Inside `src/core/**`: NEVER `Math.random()`, `Date.now()`, or locale-dependent APIs.
  All variation derives from `hash32` (`core/hash.ts`) on the input. Same input →
  byte-identical output. ESLint bans it; `architecture.test.ts` double-checks.
- UI-only randomness (visual jitter, particle effects) lives in components, applied at
  render time — never baked into core results.

## State (zustand)

- One store, sliced by concern; selectors everywhere (`useAppStore(s => s.userName)`) —
  never subscribe to the whole store in a component.
- Persist ONLY user preferences via `StoragePort`. Never persist derived data.
- Rehydrated state passes through zod before use.
- Actions live in the store; components call actions, they don't setState business data.

## Components & UI

- Dumb components in `ui/` take props only — no store access, no ports. Feature components
  may use the store via selectors.
- Style with `StyleSheet.create` + tokens from `ui/theme.ts`. No inline hex colors, no magic
  numbers for spacing.
- Animations: reanimated worklets, transform/opacity only; never animate via setState loops.
- Accessibility: every touchable has `accessibilityLabel`/`accessibilityRole`.
- User-facing text centralized in a strings module — no hardcoded literals inside JSX.

## Testing

- **Vitest** owns everything pure: `src/core`, `scripts/`, logic driven by fake ports +
  fake timers. **jest-expo + @testing-library/react-native** owns components and adapter
  contract tests with mocked natives — don't unit-test expo internals.
- Edge-case set for text-processing functions: `""`, `"a"`, `"!!!"`, emoji, 200-char word.
- Component tests: `await` interactions (`fireEvent` on new-arch RN needs awaiting) and
  assert exact on-screen text.
- Port contract tests run against the in-memory adapter; native adapters get thin contract
  tests with mocked natives.

## TypeScript & hygiene

- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; if truly unknown, use
  `unknown` + zod parse.
- No default exports except expo-router route files (the router requires them).
- Errors: throw typed errors in core, catch at the feature boundary, show a friendly
  toast — never a raw error message to the user.
- Before committing: eslint, `tsc --noEmit`, and the changed tests all pass (hooks enforce;
  never bypass with `--no-verify`).
- New native module or config-plugin change ⇒ dev-build rebuild (`npx expo run:ios`) —
  Metro reload is not enough.

## Optional modules (adopt per project, document the choice in AGENTS.md)

- **Offline-only app:** no `fetch`, no analytics SDK, no remote config, no CDN assets —
  everything bundled via static `require`; no permissions beyond defaults; add an ESLint
  ban on `fetch` if adopted.
- **Audio synthesis:** one shared lazily-created `AudioContext`; schedule consecutive synth
  units in ONE pass on the AudioContext clock; ramps via `linearRampToValueAtTime`, never
  setInterval; clamp params in adapters (speech pitch [0.5, 2.0], oscillator freq
  [40, 8000]); one `AbortController` per playback plan; race native completion callbacks
  against a duration-based timeout.
- **Generated assets:** codegen scripts in `scripts/` are pure TS/ESM, deterministic, and
  tested with vitest like any core code; generated files carry a `.generated.ts` suffix and
  a header comment naming the generator.
