# Contributing to Pinmark

## Setup

```sh
pnpm install
supabase start                       # local stack (Docker + Supabase CLI)
cp .env.example apps/web/.env.local  # then paste the keys `supabase start` prints
pnpm dev                             # web app on :3000
```

No Docker? A free Supabase cloud project works: run the SQL in
`supabase/migrations/` (filename order) in its SQL Editor and point
`.env.local` at it. Magic-link emails in local dev land in Inbucket
(http://127.0.0.1:54324), not a real inbox.

## Layout

```
apps/web/           Next.js app: dashboard, guest API routes, docs, landing
packages/widget/    Vanilla-TS widget (loader + core), Vite, shadow DOM
supabase/           SQL migrations (schema + RLS)
e2e/                Playwright widget tests
```

## Rules that will come up in review

1. **Tests lead changes to the guard and the anchor engine.** See
   [TESTING.md](TESTING.md). PRs touching `guard.ts`, `validate.ts`, or
   `anchor.ts` without accompanying tests will be asked to add them.
2. **Bundle budgets are hard limits**: loader ≤ 3 KB gzip, core ≤ 40 KB gzip.
   The widget build fails over budget. No React/framework code in the widget.
3. **Never render guest content as HTML.** `textContent` in the widget,
   JSX text in the dashboard, plain-text email. No `innerHTML` with user
   data, ever — the only `innerHTML` in the codebase is a static SVG string.
4. **`author_token` never leaves the server** on read paths. Guests prove
   ownership on writes; the widget tracks its own comment ids locally.
5. **The widget must never break a host page**: no globals beyond
   `window.__pinmark`, no thrown errors, one namespaced console warning max,
   all styles inside the closed shadow root.
6. **Secrets stay in `.env.local`** (gitignored). `.env.example` is a
   template — placeholder values only.

## License

By contributing, you agree your changes are licensed under the project's
[MIT license](README.md#license).

## Checks before pushing

```sh
pnpm typecheck && pnpm test && pnpm --filter widget build && pnpm e2e
```

CI runs the same on every PR.
