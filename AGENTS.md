# AGENTS.md — Contract for AI agents working in this repo

This repository was created from the **ai-project-base** template. Every AI agent (Claude,
Codex, Copilot, …) working here MUST follow this contract. `CLAUDE.md` points here — this
file is the single source of truth.

## 1. Workflow: spec → plan → implement → smoke-test

No feature goes straight to code. For any non-trivial change:

1. **Spec** — brainstorm with the user, then write the approved design to
   `docs/specs/YYYY-MM-DD-<topic>-design.md` (template: `docs/templates/spec-template.md`).
2. **Plan** — break the spec into bite-sized TDD tasks in
   `docs/plans/YYYY-MM-DD-<topic>.md` (template: `docs/templates/plan-template.md`).
3. **Implement** — execute the plan task by task on a `feat/<topic>` branch.
4. **Smoke-test guide** — at PR time, write a manual validation guide to
   `docs/smoke-tests/YYYY-MM-DD-<feature>-smoke-test.md`
   (template: `docs/templates/smoke-test-template.md`). It must contain concrete seed data,
   exact click-through steps, and the **exact expected on-screen text/values** — not a
   generic checklist.

Trivial changes (typo, comment, config value) may skip 1–2 but never skip tests.

## 2. TDD is mandatory

- Red → green → refactor. **Never write implementation code without a failing test first.**
- Write the test, run it, watch it fail for the right reason, then write the minimal
  implementation, then watch it pass.
- Every bug fix starts with a test reproducing the bug.
- Tests live next to the code they test (`foo.ts` / `foo.test.ts`).
- Keep architecture guard tests (see stack profiles) green at all times.

## 3. Clean code rules

- **Small, single-purpose units.** One file = one responsibility. If a file grows past
  ~300 lines, that is a signal it does too much — split it.
- **Strict typing.** `strict` + `noUncheckedIndexedAccess` on. `any` is forbidden; if you
  must interface with untyped code, wrap it behind a typed boundary and validate.
- **Schema-first boundaries.** Every shape crossing a boundary (storage, network, IPC,
  process args, file formats) has a zod schema (or the stack's equivalent). The TS type is
  always `z.infer<typeof Schema>` — never a hand-written twin. Reads are validated with
  `safeParse`; on failure, warn and fall back to a safe default.
- **No default exports** (framework router files excepted).
- Typed errors are caught at the feature boundary, never swallowed silently.
- YAGNI: build what the spec asks, nothing speculative. DRY only when the duplication is
  real (three strikes rule).
- Comments state constraints the code cannot express — never narrate what the next line does.

## 4. Git hygiene

- Work on `feat/<topic>` (or `fix/`, `chore/`) branches; never directly on `main` once the
  project is bootstrapped.
- Small, frequent commits with conventional-commit messages (`feat:`, `fix:`, `test:`,
  `docs:`, `chore:`, scoped like `feat(rn): …`).
- **Pre-commit gates are law.** `--no-verify` is forbidden. If a hook fails, fix the cause.
- Before claiming work is done: run the full gate set (lint, typecheck, all test suites) and
  report the actual output — evidence before assertions.

## 5. Stack routing

Pick the profile matching the project, then follow its skill *in addition to* this file:

| Stack | Where | Skill |
|-------|-------|-------|
| React Native / Expo | `stacks/react-native/` (rename to your app) | `.claude/skills/rn-app-practices` |
| Web (React/Next) | not yet in template | add a `stacks/web/` profile via PR to ai-project-base |
| Backend (Node API) | not yet in template | add a `stacks/backend/` profile via PR to ai-project-base |

A new stack profile must provide: a runnable skeleton, architecture-as-lint config, test
setup (unit + component/integration), pre-commit wiring, one tested example per layer, and
a `SKILL.md`.

## 6. Template evolution

Improvements to practices discovered in a project should flow back to the
**ai-project-base** template repo via PR, with a `CHANGELOG.md` entry. Existing projects
adopt updates manually.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **revoltyTest** (455 symbols, 892 relationships, 37 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/revoltyTest/context` | Codebase overview, check index freshness |
| `gitnexus://repo/revoltyTest/clusters` | All functional areas |
| `gitnexus://repo/revoltyTest/processes` | All execution flows |
| `gitnexus://repo/revoltyTest/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
