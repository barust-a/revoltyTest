# INIT.md — Bootstrapping a new project from this template

Run through this checklist once, right after creating a repo via **Use this template**.
Delete this file at the end.

## 1. Clone and pick your stack

- [ ] Clone your new repo locally.
- [ ] **React Native project:** rename `stacks/react-native/` to your app name
      (e.g. `git mv stacks/react-native myapp`), then delete the now-empty `stacks/`.
- [ ] **Other stack:** delete `stacks/` entirely; follow AGENTS.md §5 to bring in (or
      contribute) the right profile.

## 2. Replace placeholders (RN)

- [ ] In `<app>/app.json`: replace `__APP_NAME__` (name, slug, scheme — scheme must be
      lowercase letters only).
- [ ] In `<app>/package.json`: set `"name"` to your app name; **fix the `prepare` script
      path** — it assumes the app folder is one level below the repo root
      (`git -C .. config core.hooksPath .husky`).
- [ ] In `.husky/pre-commit`: replace `stacks/react-native` with your app folder name.
- [ ] In `.github/workflows/ci.yml`: replace `stacks/react-native` with your app folder name.
- [ ] In `CLAUDE.md` / `AGENTS.md`: adjust the stack-routing row to your folder name.

## 3. Install and wire the guardrails

- [ ] `cd <app> && npm install` — this also runs `prepare`, which points git hooks at
      `.husky/` (verify: `git config core.hooksPath` prints `.husky`).
- [ ] Run all gates and confirm green:
      `npm test && npm run test:native && npm run typecheck && npm run lint`

## 4. Project identity

- [ ] Rewrite `README.md` for the actual project (keep the "created from ai-project-base"
      line so future-you knows where the practices come from).
- [ ] Reset `CHANGELOG.md` to `0.1.0 — bootstrapped from ai-project-base`.
- [ ] Empty `docs/specs/`, `docs/plans/`, `docs/smoke-tests/` (keep `docs/templates/`).
- [ ] Add a LICENSE if the project needs one.

## 5. First commit

- [ ] `git add -A && git commit -m "chore: bootstrap from ai-project-base"` — the pre-commit
      hook must run (lint-staged + typecheck). If it doesn't, revisit step 3.
- [ ] Delete `INIT.md`, commit, push.
