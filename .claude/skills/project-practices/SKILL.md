---
name: project-practices
description: Generic engineering practices for this project (from ai-project-base). Use whenever writing, reviewing, or refactoring ANY code — enforces TDD, clean code, schema-first boundaries, the spec→plan→smoke-test workflow, and git hygiene.
---

# Project Practices (generic)

The actionable version of `AGENTS.md`. When a stack-specific skill exists (e.g.
`rn-app-practices`), apply both — stack rules refine, never replace, these.

## Workflow

- Non-trivial change? Spec first (`docs/specs/YYYY-MM-DD-<topic>-design.md`), then plan
  (`docs/plans/`), then implement, then smoke-test guide (`docs/smoke-tests/`) with exact
  expected on-screen text/values. Templates in `docs/templates/`.
- Work on `feat/<topic>` branches. Small conventional commits.

## TDD (non-negotiable)

1. Write the failing test next to the code (`foo.ts` / `foo.test.ts`).
2. Run it — it must fail for the RIGHT reason (missing impl, not a typo).
3. Write the minimal implementation to pass.
4. Run green, refactor, repeat.
- Bug fix = reproduction test first.
- Never claim done without pasting real gate output (lint, typecheck, all suites).

## Clean code

- One file = one responsibility; ~300 lines is the "split me" signal.
- `strict` + `noUncheckedIndexedAccess`; `any` forbidden — use `unknown` + schema parse.
- Every boundary-crossing shape has a zod schema; the type is `z.infer<...>`, never a
  hand-written twin. Reads use `safeParse` → warn + safe default on failure.
- `.brand<>()` for IDs that must not mix; `z.enum` for closed sets.
- No default exports (framework router files excepted).
- Typed errors thrown deep, caught at the feature boundary, shown as friendly messages.
- YAGNI; DRY on the third duplication, not the first.
- A test needing more than one mock to compile usually means a dependency points the wrong
  way — refactor, don't mock harder.

## Git

- Pre-commit gates are law; `--no-verify` is forbidden.
- Before PR: full gate set green, smoke-test guide written, docs updated.
- Practice improvements flow back to the ai-project-base template via PR + CHANGELOG entry.
