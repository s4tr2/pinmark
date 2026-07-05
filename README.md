# Pinmark

Figma-style commenting for any coded prototype. Paste one script tag into a deployed prototype (Vercel, Lovable, Replit, anywhere) and anyone with the link can pin comments directly on the UI: no account, no install.

> **Status: live.** Widget (drag-to-pin, region comments, resolve/reply, live updates), dashboard (projects, moderation, md/docx export), access control (open or review-link only), email notifications, and DB-backed rate limiting are all shipped. See [PRODUCT.md](PRODUCT.md) and [TESTING.md](TESTING.md) for what's covered.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/s4tr2/pinmark&root-directory=apps/web&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL,NEXT_PUBLIC_CDN_URL,NEXT_PUBLIC_BRAND_NAME,NEXT_PUBLIC_SELF_HOSTED&envDescription=See%20DEPLOY.md%20for%20where%20each%20value%20comes%20from&envLink=https://github.com/s4tr2/pinmark/blob/main/DEPLOY.md&project-name=pinmark&repository-name=pinmark)

This is a **guided** deploy, not a one-click one: Vercel clones the repo and
prompts you to fill in each environment variable yourself (nothing is ever
put in the deploy URL), but provisioning the database is a separate step
you do first. In order:

1. Create a Supabase project (managed, free tier is fine, or your own
   self-hosted Supabase, see [DEPLOY.md](DEPLOY.md#0-choose-your-supabase-path)).
2. Apply the database migrations: `pnpm setup:self-host` (guided, shows
   you what it will do before doing it) or paste the SQL manually. See
   [DEPLOY.md](DEPLOY.md#1-apply-the-database-migrations).
3. Click the button above and fill in the prompted values. Set
   `NEXT_PUBLIC_SELF_HOSTED=true` if you want the product only, no
   marketing landing page or playground; see
   [DEPLOY.md](DEPLOY.md#self-hosted-mode) for exactly what that changes.
4. Set your Supabase auth redirect URLs. See
   [DEPLOY.md](DEPLOY.md#3-configure-supabase-auth-urls).

Full walkthrough, including the managed-vs-self-hosted-Supabase split,
upgrading, backups, and key rotation, is in [DEPLOY.md](DEPLOY.md).

## Layout

```
apps/web/           Next.js (App Router): auth, dashboard, API routes, landing/docs
packages/widget/    Vanilla TS widget (loader + core), shadow DOM, no framework
supabase/           Migrations (schema + RLS)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for why this is one app today and
what a future split into separate marketing/product apps would take.

## Local development

Prereqs: Node ≥ 20, pnpm ≥ 8, [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`), Docker (the local Supabase stack runs in containers).

```sh
pnpm install
supabase start                 # boots local Postgres/auth/etc, applies migrations
cp .env.example apps/web/.env.local
# paste the anon key + service_role key printed by `supabase start` into .env.local
pnpm dev                       # web app on http://localhost:3000
```

Magic-link emails in local dev are captured by Inbucket at http://127.0.0.1:54324, no real email is sent.

No Docker? Create a free [Supabase cloud](https://supabase.com) project instead, run the SQL in `supabase/migrations/` against it, and point `.env.local` at the project's URL and keys.

## Self-hosting

Pinmark is designed to run on your own infrastructure: bring your own Supabase project and deploy `apps/web` yourself. See [DEPLOY.md](DEPLOY.md) for the full walkthrough (choosing managed vs. self-hosted Supabase, env vars, self-hosted mode, auth redirect URLs, upgrading, backups, key rotation) and [`pnpm setup:self-host`](DEPLOY.md#1-apply-the-database-migrations) for a guided first deploy.

Set `NEXT_PUBLIC_SELF_HOSTED=true` to serve only the product (dashboard, auth, API, widget delivery): no landing page, no playground, no hosted-service messaging, and no dependency on Pinmark's own hosted infrastructure. Vercel is the only deployment target this repo tests in depth; other Node 20+ hosts should work but are untested here (see [DEPLOY.md](DEPLOY.md#other-hosts-fly-render-a-vps)). A turnkey full-stack Docker deployment is not built yet; today, self-hosting means running the two pieces (your Supabase, your Next.js deploy) yourself.

## Testing

```sh
pnpm test    # unit: security invariants + anchoring engine (Vitest)
pnpm e2e     # widget end-to-end, hermetic (Playwright)
```

CI enforces typecheck, both suites, hard bundle-size budgets (loader
≤ 3 KB gzip, core ≤ 40 KB gzip), and that both hosted-mode and
self-hosted-mode builds succeed, on every push. See [TESTING.md](TESTING.md)
for the philosophy and [CONTRIBUTING.md](CONTRIBUTING.md) for the rules.

## Guest privacy

Reviewers never create accounts. Server-side, a guest comment stores only a display name and a random per-browser token (used for the 5-minute self-edit window and never exposed via public API responses). IPs are used transiently for rate limiting and never stored on comment rows. Client-side: name + token in localStorage. No emails, no cookies, no tracking.

## Versioning and support

Pinmark follows [semantic versioning](https://semver.org/); notable changes
are published as [GitHub Releases](https://github.com/s4tr2/pinmark/releases).
Community self-hosting support is best-effort through GitHub issues, not an
SLA, see [SECURITY.md](SECURITY.md) for vulnerability reporting
specifically. Upgrade, backup, and rollback procedures are in
[DEPLOY.md](DEPLOY.md#upgrading-pinmark).

## License

[MIT](LICENSE).

See [SECURITY.md](SECURITY.md) to report a vulnerability.
