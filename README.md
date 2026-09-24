# ai-project-base

Private GitHub **template repository** — the starting point for AI-built projects.
Extracted and generalized from the `gibberlate` workspace practices.

## What you get

- **AGENTS.md** — a contract every AI agent follows: mandatory TDD, clean-code rules,
  schema-first boundaries, spec → plan → implement → smoke-test workflow, git hygiene.
- **`.claude/skills/`** — `project-practices` (generic) and `rn-app-practices`
  (React Native / Expo, layered architecture).
- **`docs/templates/`** — ready-to-fill spec, implementation-plan, and smoke-test templates.
- **`stacks/react-native/`** — a runnable Expo SDK 57 skeleton: layered
  `core → ports → adapters/state/features → app`, architecture enforced by ESLint and a
  guard test, one tested example per layer, vitest + jest-expo, pre-commit gates.
- **CI** — lint + typecheck + both test suites on every push.

## Using it

1. GitHub → **Use this template** → create your project repo.
2. Follow **INIT.md** step by step (rename the stack, replace placeholders, wire hooks).
3. Build features via the AGENTS.md workflow.

## Evolving it

Better practices discovered in downstream projects flow back here via PR + CHANGELOG entry.
Downstream projects adopt updates manually — the template is the reference, not a dependency.
