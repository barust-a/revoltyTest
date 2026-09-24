# ai-project-base — Design

Date: 2026-07-22
Status: Approved
Repo: barust-a/ai-project-base (private, GitHub template)

## 1. Purpose

A private GitHub **template repository** that serves as the starting point for all future
AI-built projects. "Idempotent" here means: every new project starts via **Use this template**
with the same bL'aspect me convient, cependant je veux que tu fasses une deep research sur internet afin de voir les applications similaires existantes et voir leur fonctionnement pour voir s'il y a quelque chose de bon à prendre ou s'il faut de manière générale se caler sur leur fonctionnement car elles ont un standard.est practices, doc conventions, and guardrails already in place — nothing is
recreated by hand. Extracted and generalized from the `universalVideoGameTranslator` /
`gibberlate` workspace.

## 2. Scope

- **Generic core** (repo root): agent instructions, clean-code + TDD contract, spec → plan →
  implement → smoke-test workflow, doc templates, Claude skills, CI.
- **One stack profile**: a runnable Expo / React Native skeleton in `stacks/react-native/`
  carrying gibberlate's proven practices, stripped of domain specifics.
- Other stacks (web, backend) are out of scope for v1; `AGENTS.md` reserves a routing section
  for them.
- No sync script (plain template); template evolves via PRs + `CHANGELOG.md`, existing
  projects pick up improvements manually.

## 3. Repository structure

```
ai-project-base/
├─ AGENTS.md                  ← single source of truth for AI agents (generic contract)
├─ CLAUDE.md                  ← thin pointer to AGENTS.md
├─ INIT.md                    ← new-project checklist (rename, pick stack, placeholders, hooks)
├─ README.md                  ← what this template is, how to use it
├─ CHANGELOG.md
├─ .gitignore
├─ .claude/skills/
│   ├─ project-practices/SKILL.md   ← generic, actionable version of AGENTS.md
│   └─ rn-app-practices/SKILL.md    ← generalized from gibberlate's rn-offline-app-practices
├─ docs/
│   ├─ specs/                 ← this design doc lives here
│   ├─ plans/                 ← implementation plans
│   ├─ smoke-tests/           ← manual validation guides
│   └─ templates/             ← spec-template.md, plan-template.md, smoke-test-template.md
├─ .github/workflows/ci.yml   ← lint + typecheck + vitest + jest on the RN skeleton
└─ stacks/react-native/       ← runnable Expo app skeleton
    ├─ package.json           ← Expo SDK 57 pinned like gibberlate, domain deps removed
    ├─ app.json, tsconfig.json, eslint.config.js, .prettierrc, .npmrc
    ├─ vitest.config.ts, jest.setup.js
    ├─ app/                   ← expo-router: _layout.tsx (AppProvider), index.tsx
    └─ src/
        ├─ core/              ← pure TS: hash.ts, greeting.ts (example), architecture.test.ts
        ├─ ports/             ← storage.ts (StoragePort), services.ts
        ├─ adapters/          ← storageMemory.ts, storageKv.ts, wiring.ts
        ├─ state/             ← appStore.ts (zustand, zod-validated persistence)
        ├─ features/home/     ← HomeScreen.tsx + native test
        └─ ui/                ← theme.ts tokens, Button.tsx (dumb component)
```

## 4. Generic core content

**AGENTS.md** (English, like all template docs) covers:
- Clean code: small single-purpose units, strict TS, no `any`, no hand-written twins of
  inferred types, no default exports (router files excepted).
- **TDD mandatory**: red → green → refactor; no implementation without a failing test first.
- Zod (or equivalent) validation at every boundary; types via `z.infer`.
- Workflow: `docs/specs/YYYY-MM-DD-<topic>-design.md` → `docs/plans/YYYY-MM-DD-<topic>.md` →
  implementation → `docs/smoke-tests/YYYY-MM-DD-<feature>-smoke-test.md` with exact
  input → expected-output tables.
- Git hygiene: `feat/` branches, pre-commit gates never bypassed (`--no-verify` forbidden),
  small frequent commits.
- Stack routing: React Native → `stacks/react-native/` + `rn-app-practices` skill; other
  stacks TBD-by-addition (section exists, lists what a new stack profile must provide).

**INIT.md**: use template → clone → rename/move stack folder (or delete for non-RN) →
replace `__APP_NAME__` placeholders → `npm install` (wires hooks via `prepare`) → run all
gates → first commit.

## 5. RN skeleton principles (generalized from gibberlate)

- Layered architecture with dependencies pointing inward: `core → ports → adapters/state/features → app`.
- **Architecture-as-lint**: ESLint forbids React/Expo/outer-layer imports in `src/core`,
  `Math.random`/`Date.now` in core, and `adapters` imports from `features`/`ui`.
  Backed by `src/core/architecture.test.ts` guard test.
- One trivial, tested example per layer so the pattern is copyable, not just described.
- Vitest owns pure TS; jest-expo owns components/adapters; husky + lint-staged pre-commit
  runs eslint --fix, prettier, related vitest, and `tsc --noEmit`.
- Gibberlate-specific rules (offline-only, audio scheduling, worlds registry) become an
  optional "modules" section in the skill, not baked into the skeleton.

## 6. Delivery & verification

Built locally at `~/Documents/ai-project-base`, then `gh repo create barust-a/ai-project-base
--private`, push, `gh repo edit --template`. Done means: vitest + jest + typecheck + lint all
pass locally and in CI (green run on main), repo flagged as template, smoke-test guide written.
