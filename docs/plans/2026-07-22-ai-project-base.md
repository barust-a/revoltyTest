# ai-project-base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ai-project-base` private GitHub template repo: generic AI-agent contract + runnable Expo/RN skeleton with all guardrails, then publish it flagged as a template with green CI.

**Architecture:** Repo root = generic socle (AGENTS.md/CLAUDE.md/INIT.md, `.claude/skills`, `docs/templates`, CI). `stacks/react-native/` = minimal Expo SDK 57 app with layered `src/` (core→ports→adapters/state/features→app), architecture enforced by ESLint + a guard test, one tested example per layer.

**Tech Stack:** Expo ~57 / RN 0.86 / React 19.2.3, expo-router, zustand, zod v4, TypeScript ~6 strict, vitest (pure TS), jest-expo + @testing-library/react-native (components), eslint-config-expo flat, prettier, lint-staged + git hooksPath hooks, GitHub Actions.

## Global Constraints

- Never commit anything to `universalVideoGameTranslator`; all work in `/Users/balu/Documents/ai-project-base`.
- All template docs in English.
- Dependency versions pinned to gibberlate's known-good set (Expo ~57.0.1, RN 0.86.0, React 19.2.3, zod ^4.4.3, zustand ^5.0.14, jest-expo ^57, vitest ^4.1.9, typescript ~6.0.3, `overrides: {"jest-environment-node": "^30.4.1"}`, `.npmrc` `legacy-peer-deps=true`).
- Prettier: `{ "singleQuote": true, "trailingComma": "all", "printWidth": 100 }`.
- tsconfig: extends `expo/tsconfig.base`, `strict`, `noUncheckedIndexedAccess`, `@/*` path alias.
- App-name placeholder everywhere: `__APP_NAME__` only in `app.json` + README/INIT instructions; package name `rn-skeleton`.
- Pre-commit gates: lint-staged (eslint --fix --max-warnings=0, prettier, `vitest related --run --passWithNoTests`) + `tsc --noEmit`. Never `--no-verify`.
- TDD for every code example in the skeleton: failing test first, then minimal implementation.

---

### Task 1: Root socle files

**Files:** Create `.gitignore`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `INIT.md` at repo root.

- [x] `.gitignore`: `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`, `*.log`, `.DS_Store`.
- [x] `AGENTS.md` — full generic contract per spec §4 (clean code, mandatory TDD, zod at boundaries, spec→plan→smoke-test workflow with exact paths/naming, git hygiene, stack routing table).
- [x] `CLAUDE.md` — 5 lines max: "Follow AGENTS.md. For RN work also follow `.claude/skills/rn-app-practices`."
- [x] `INIT.md` — numbered new-project checklist per spec §4.
- [x] `README.md` — what/why/how to use the template; `CHANGELOG.md` seeded with `0.1.0`.
- [x] Commit: `feat: root socle (AGENTS/CLAUDE/INIT/README)`.

### Task 2: Claude skills

**Files:** Create `.claude/skills/project-practices/SKILL.md`, `.claude/skills/rn-app-practices/SKILL.md`.

- [x] `project-practices`: actionable generic rules (mirrors AGENTS.md; frontmatter `name`/`description` triggering on any code change).
- [x] Read gibberlate's `.claude/skills/rn-offline-app-practices/SKILL.md`; rewrite generalized: keep layering/ports/zod-first/determinism/testing/TS-hygiene/new-feature checklist; move offline-only + audio + worlds-registry rules into an "Optional modules" section marked as adopt-per-project.
- [x] Commit: `feat: claude skills (generic + RN practices)`.

### Task 3: Doc templates

**Files:** Create `docs/templates/spec-template.md`, `docs/templates/plan-template.md`, `docs/templates/smoke-test-template.md`; `docs/README.md` explaining the workflow.

- [x] Spec template: header (`# <Title> — Design`, Date/Status/Repo) + numbered sections (Purpose, Scope, Structure/Architecture, Error handling, Testing).
- [x] Plan template: superpowers plan header (agentic-workers callout, Goal/Architecture/Tech Stack/Global Constraints) + example task with TDD checkbox steps.
- [x] Smoke-test template: Branch/commit header, `## 0. Launch` exact commands, numbered manual steps with input → exact-expected-output tables, Edge cases, Regression, Pass criteria (exact test counts).
- [x] Commit: `feat: doc templates (spec/plan/smoke-test)`.

### Task 4: RN skeleton configs

**Files:** Create under `stacks/react-native/`: `package.json`, `app.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.npmrc`, `vitest.config.ts`, `jest.setup.js`, `.gitignore`.

- [x] `package.json`: name `rn-skeleton`, main `expo-router/entry`; deps: expo ~57.0.1, expo-constants, expo-linking, expo-router ~57.0.2, expo-splash-screen, expo-status-bar, expo-sqlite (storage), react 19.2.3, react-dom, react-native 0.86.0, react-native-safe-area-context ~5.7.0, react-native-screens 4.25.2, react-native-web ~0.21.0, zod ^4.4.3, zustand ^5.0.14; devDeps: @react-native/jest-preset 0.86.0, @testing-library/react-native ^14, @types/jest ^30, @types/react ~19.2.2, eslint ^9, eslint-config-expo ~57, jest ^30.4.2, jest-expo ^57, lint-staged ^17, prettier ^3.9.4, typescript ~6.0.3, vitest ^4.1.9; scripts start/android/ios/web/test/test:watch/test:native/typecheck/lint + `prepare: git -C ../.. config core.hooksPath .husky`; jest + lint-staged blocks copied from gibberlate.
- [x] `eslint.config.js`: copy gibberlate's flat config verbatim minus the `phrases.ts` exception (no such file in skeleton).
- [x] `vitest.config.ts` (src `*.test.ts`, exclude `*.native.test.ts`, node env), `app.json` minimal (`__APP_NAME__`, expo-router plugin, scheme, newArchEnabled), other configs per Global Constraints.
- [x] `npm install`; expect clean install with legacy-peer-deps note.
- [x] Commit: `feat(rn): skeleton configs`.

### Task 5: Example layers (TDD)

**Files:** Create under `stacks/react-native/`: `src/core/hash.ts` + `.test.ts`, `src/core/greeting.ts` + `.test.ts`, `src/core/architecture.test.ts`, `src/ports/storage.ts`, `src/ports/services.ts`, `src/adapters/storageMemory.ts` + `src/adapters/storage.contract.test.ts`, `src/adapters/storageKv.ts`, `src/adapters/wiring.ts`, `src/state/appStore.ts` + `.test.ts`, `src/ui/theme.ts`, `src/ui/Button.tsx`, `src/features/home/HomeScreen.tsx` + `HomeScreen.test.tsx`, `src/features/AppProvider.tsx`, `app/_layout.tsx`, `app/index.tsx`.

For each unit: write failing test → run (`npm test` / `npm run test:native`) → minimal implementation → run green → next.

- [x] `hash.ts`: `hash32(text: string): number` FNV-1a (deterministic; tests: same input → same output, different inputs differ, empty string ok).
- [x] `greeting.ts`: `buildGreeting(name: string, seed: number): Greeting` — zod-schema'd result, deterministic via `hash32`, trims/validates input (the copyable "core function" example).
- [x] `architecture.test.ts`: greps `src/core` sources for `react`/`expo` imports and `Math.random`/`Date.now` (mirrors gibberlate guard).
- [x] `storage.ts`: `StoragePort = { get(key): Promise<string|null>; set(key,value): Promise<void>; delete(key): Promise<void> }`; contract test runs against memory adapter.
- [x] `appStore.ts`: zustand store with one persisted pref (`userName`), zod-validated rehydration through `StoragePort`.
- [x] `HomeScreen.tsx`: reads store, calls `buildGreeting`, renders via `ui/Button` + theme tokens; native test asserts greeting text after press (awaited `fireEvent`).
- [x] `AppProvider.tsx` + `wiring.ts`: context providing ports; `app/_layout.tsx` wraps router in provider; `app/index.tsx` renders HomeScreen.
- [x] All gates: `npm test`, `npm run test:native`, `npm run typecheck`, `npm run lint` → all pass.
- [x] Commit: `feat(rn): example layers with tests`.

### Task 6: Git hooks

**Files:** Create `.husky/pre-commit` at repo root.

- [x] `pre-commit`: `cd stacks/react-native && npx lint-staged && npx tsc --noEmit`.
- [x] Verify: `git config core.hooksPath` returns `.husky` (set by `prepare`), make a whitespace change, commit, observe hook run.
- [x] Commit: `feat: pre-commit gates (lint-staged + typecheck)`.

### Task 7: CI

**Files:** Create `.github/workflows/ci.yml`.

- [x] Workflow: on push/PR; ubuntu-latest; setup-node 22 with npm cache (`stacks/react-native/package-lock.json`); `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:native` in `stacks/react-native`.
- [x] Commit: `ci: lint + typecheck + vitest + jest`.

### Task 8: Publish

- [x] `gh repo create barust-a/ai-project-base --private --source . --push`.
- [x] `gh repo edit barust-a/ai-project-base --template`.
- [x] Watch CI: `gh run watch` → green; fix-forward if red.

### Task 9: Smoke-test guide

**Files:** Create `docs/smoke-tests/2026-07-22-template-bootstrap-smoke-test.md`; copy (adapted) to `universalVideoGameTranslator/docs/superpowers/2026-07-22-ai-project-base-smoke-test.md` (untracked, never committed there).

- [x] Guide: create a repo from the template on GitHub, clone, follow INIT.md, exact commands + exact expected outputs (test counts, lint clean, app boots to Home screen with greeting text).
- [x] Commit (template repo only): `docs: bootstrap smoke-test guide`.
