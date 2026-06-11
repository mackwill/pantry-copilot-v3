# Pantry CoPilot v3

Greenfield rewrite of Pantry CoPilot, built to exactly match the Kitchen OS design board.

## Resuming work

1. **Read the roadmap first:** `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md` — it holds all settled decisions, the milestone breakdown, engineering standards, and a **Status table** showing the current milestone.
2. The current milestone's detailed task plan is in `docs/superpowers/plans/` (linked from the Status table). Execute it task-by-task (superpowers:executing-plans), checking off steps in the plan file as you go.
3. When a milestone completes: mark it done in the roadmap Status table, write the next milestone's detailed plan with superpowers:writing-plans (the roadmap section for that milestone is the spec), link it in Status, commit.

## Non-negotiables (see roadmap "Engineering standards" for full list)

- Design bible: `/Users/mackmindenhall/Documents/pantry-copilot-v2/claudeDesignOutput/All Screens.html`. Screens must match it; verification is screenshot comparison via `tools/design-fidelity`. Where the board is silent, compose from existing primitives only and log the call in `docs/decisions.md`.
- v2 (`/Users/mackmindenhall/Documents/pantry-copilot-v2`) is **reference-only — consult, never copy files wholesale.**
- No `eslint-disable` comments. No `any`. `--max-warnings 0`. Components ≤300 lines (target 200); route files composition-only.
- User-facing strings live in per-feature `strings.ts` modules — never inline JSX literals.
- TDD; every slice ships with tests (web slices without tests do not merge); frequent commits.
- Pin exact dependency versions (`.npmrc` has `save-exact=true`); upgrade only at milestone boundaries.

## Commands

- `pnpm install` — install workspace deps
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — repo-wide gates (run all three before any commit that claims completion)
- `pnpm -r build` — build all workspaces
