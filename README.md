# Pinmark

Figma-style commenting for any coded prototype. Paste one script tag into a deployed prototype (Vercel, Lovable, Replit, anywhere) and anyone with the link can pin comments directly on the UI — no account, no install.

> **Status: live.** Widget (drag-to-pin, region comments, resolve/reply, live updates), dashboard (projects, moderation, md/docx export), access control (open or review-link only), email notifications, and DB-backed rate limiting are all shipped. See [PRODUCT.md](PRODUCT.md) and [TESTING.md](TESTING.md) for what's covered.

## Layout

```
apps/web/           Next.js (App Router): auth, dashboard, API routes, landing/docs
packages/widget/    Vanilla TS widget (loader + core), shadow DOM, no framework
supabase/           Migrations (schema + RLS)
```

## Local development

Prereqs: Node ≥ 20, pnpm ≥ 8, [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`), Docker (the local Supabase stack runs in containers).

```sh
pnpm install
supabase start                 # boots local Postgres/auth/etc, applies migrations
cp .env.example apps/web/.env.local
# paste the anon key + service_role key printed by `supabase start` into .env.local
pnpm dev                       # web app on http://localhost:3000
```

Magic-link emails in local dev are captured by Inbucket at http://127.0.0.1:54324 — no real email is sent.

No Docker? Create a free [Supabase cloud](https://supabase.com) project instead, run the SQL in `supabase/migrations/` against it, and point `.env.local` at the project's URL and keys.

## Self-hosting

Pinmark is designed to run on your own infrastructure: bring your own Supabase
project (cloud free tier, or [self-hosted Supabase](https://supabase.com/docs/guides/self-hosting) via its own docker-compose) and deploy `apps/web`
anywhere Node runs — Vercel, Fly, Render, a VPS. See [DEPLOY.md](DEPLOY.md)
for the full walkthrough (env vars, auth redirect URLs, smoke test). A
turnkey docker-compose for the whole stack is on the roadmap but not built
yet — today, self-hosting means running the two pieces (your Supabase, your
Next.js deploy) yourself.

## Testing

```sh
pnpm test    # unit: security invariants + anchoring engine (Vitest)
pnpm e2e     # widget end-to-end, hermetic (Playwright)
```

CI enforces typecheck, both suites, and hard bundle-size budgets (loader
≤ 3 KB gzip, core ≤ 40 KB gzip) on every push. See [TESTING.md](TESTING.md)
for the philosophy and [CONTRIBUTING.md](CONTRIBUTING.md) for the rules.

## Guest privacy

Reviewers never create accounts. Server-side, a guest comment stores only a display name and a random per-browser token (used for the 5-minute self-edit window and never exposed via public API responses). IPs are used transiently for rate limiting and never stored on comment rows. Client-side: name + token in localStorage. No emails, no cookies, no tracking.

## License

[MIT](LICENSE).

See [SECURITY.md](SECURITY.md) to report a vulnerability.
