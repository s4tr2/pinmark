# Testing

## Commands

```sh
pnpm test          # unit tests (Vitest) — both packages
pnpm test:watch    # watch mode for TDD
pnpm e2e           # Playwright widget e2e (hermetic, no infra needed)
pnpm --filter widget build   # includes the HARD bundle-size gate
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push and PR.

## What is tested, and why these things

The suites protect the two places where a silent regression hurts most:

**Security invariants** (`apps/web/src/lib/api/guard.test.ts`, `validate.test.ts`, `domains.test.ts`)
- Allowlist semantics: dot-anchored wildcards (`notlovable.app` must never
  match `*.lovable.app`), localhost rules, hostile inputs. A failure here is
  an allowlist bypass, not a style issue.
- Write validation matrix: body/name lengths, UUID shapes, anchor rules.
- `PUBLIC_COLUMNS` must never contain `author_token` — the guest identity
  token is write-proof-only, never readable.
- Domain input normalization, including the 2026-07-03 production incident
  (full URL pasted into the allowlist → widget silently invisible) as a
  permanent regression test.

**The anchoring engine** (`packages/widget/src/core/anchor.test.ts`)
- The full stability ladder from PRD §5.3: own id → testid/aria → semantic
  path rooted at a stable ancestor → page percentage.
- Rejection rules: auto-generated ids (`radix-*`, `:r1:`, 3+ digits),
  framework mount nodes (`#root`) and near-viewport containers as direct
  anchors, class names always.
- Degradation: missing elements go *approximate*, never wrong-element.
- Region (area comment) math, element-relative and page-relative.

jsdom has no layout engine, so tests assign explicit geometry via a
`setRect` helper — positioning math runs against real numbers.

**Widget e2e** (`e2e/widget.spec.ts`, Playwright)
Fixtures in `apps/web/public/` are served statically; `/api/v1/*` is
intercepted with an in-memory fake per test. No database, no Next server —
hermetic and fast — while the widget itself runs for real: loader, closed
shadow DOM, keyboard-driven composer, persistence.

Covered acceptance criteria: pin survives reload; XSS payloads stay inert;
the widget mounts and works on `hostile.html` (a `* { all: unset }` reset
page); no key → completely dormant.

The closed shadow root is deliberately impenetrable to Playwright, so the
widget exposes one observable — `window.__pinmark.pins` — for assertions.

## The TDD rule for this repo

Two areas must never change without a test leading the change:

1. `hostnameAllowed` / `guardGuestRequest` (security boundary)
2. `anchor.ts` (the product promise)

The loop: write the failing test that describes the new behavior → watch it
fail → implement → watch it pass → refactor. For bug fixes, reproduce the
bug as a failing test *first*; the domains suite shows the pattern.

## Gaps, honestly

- No real-stack e2e (live Supabase + Next API): arrives with docker-compose
  self-host verification. The API is unit-tested at the validation layer and
  its DB queries are thin.
- No `fixtures/spa-demo` React-router fixture yet; SPA route tracking is
  covered indirectly and manually.
- Dashboard server actions rely on RLS (verified manually via the API
  sweeps); RLS policy tests need a live database.
