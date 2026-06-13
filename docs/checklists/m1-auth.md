# M1 — Auth + app shells: fidelity checklist

| Frame | Reference | Status | Pixelmatch % (tripwire baseline) |
| --- | --- | --- | --- |
| Web · Login | references/marketing-auth--web-login.png | approved 2026-06-12 | 0.27% |
| Mobile · Login | references/marketing-auth--mobile-login.png | pending (Task 16) | n/a (size mismatch — see decisions.md) |

Pinned simulator: TBD (set at Task 16).

Web baseline notes: remaining diff is apostrophe glyph choice (typographic in
strings.ts vs the board's straight quotes — sanctioned in the plan), one
anti-aliased lede line, and a ~1px weirdness-track offset. Captured via
`pnpm -C tools/design-fidelity capture:web` against dev servers.
