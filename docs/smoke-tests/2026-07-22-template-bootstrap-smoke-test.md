# Template bootstrap — Smoke Test

Feature: creating a new project from the ai-project-base template, with all guardrails live.
Repo: `barust-a/ai-project-base` @ main
Date: 2026-07-22

## 0. Create a project from the template

1. GitHub → `barust-a/ai-project-base` → **Use this template** → **Create a new repository**
   (e.g. `smoke-demo`, private).
2. `git clone git@github.com:barust-a/smoke-demo.git && cd smoke-demo`

Expected: the repo contains `AGENTS.md`, `CLAUDE.md`, `INIT.md`, `.claude/skills/`,
`docs/templates/`, `.husky/pre-commit`, `.github/workflows/ci.yml`, `stacks/react-native/`.

## 1. Install & gates

```bash
cd stacks/react-native
npm install
git config core.hooksPath        # → must print: .husky
npm test                          # → Test Files 5 passed, Tests 22 passed
npm run test:native               # → Test Suites: 1 passed, Tests: 2 passed
npm run typecheck                 # → exits clean, no output after the tsc line
npm run lint                      # → exits clean, no errors
```

## 2. App boots (dev build)

```bash
npx expo run:ios   # first run is slow (native build)
```

| Step | Action | Expected (EXACT on-screen text) |
|------|--------|----------------------------------|
| 2.1 | App opens | Dark screen, header `Home`, input with placeholder `Your name`, button `Greet` |
| 2.2 | Type `Ada`, tap `Greet` | `Hello, Ada!` appears under the button |
| 2.3 | Clear input to empty, tap `Greet` | `Hello, stranger!` |
| 2.4 | Kill app, relaunch, type nothing, tap `Greet` twice | still `Hello, stranger!`, no crash (persisted prefs rehydrate through zod) |

## 3. Guardrails actually block bad code

| Check | How | Expected |
|-------|-----|----------|
| Core purity (lint) | add `import React from 'react';` to `src/core/greeting.ts`, run `npm run lint` | error: `src/core is pure TypeScript — no React/RN/Expo imports.` |
| Determinism (lint) | add `Math.random()` inside `buildGreeting`, run `npm run lint` | error: `Math.random is forbidden in core — derive variation from hash32.` |
| Adapter ban | add `import { createKvStorage } from '../../adapters/storageKv';` to `HomeScreen.tsx`, lint | error: `Use ports via AppProvider, never adapters directly.` |
| Pre-commit gate | keep one of the above errors, `git commit` | commit REFUSED by `.husky/pre-commit` (lint-staged fails) |
| Guard test | same react import in core, `npm test` | `src/core architecture guards` test fails |

Revert all experiments afterwards (`git checkout -- .`).

## 4. INIT.md flow (rename)

Follow `INIT.md` §1–2: `git mv stacks/react-native myapp`, update `.husky/pre-commit`,
`.github/workflows/ci.yml`, `app.json` placeholders. Re-run §1 gates from `myapp/` — same
counts expected.

## Pass criteria

- §1: vitest `22 passed`, jest `2 passed`, typecheck + lint clean.
- §2: exact greeting strings above.
- §3: every guardrail blocks with the exact quoted message; commit refused.
- CI on the new repo's first push is green.
