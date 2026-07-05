# Deploying Pinmark

This covers both the hosted-style deploy (your own Vercel project, your own
Supabase project) and running Pinmark as a self-hosted instance. They are
the same deploy with one extra environment variable
(`NEXT_PUBLIC_SELF_HOSTED=true`); see [Self-hosted mode](#self-hosted-mode)
for exactly what that changes.

## What ships in this repo, what you provide

**Ships in the repo:** the Next.js app (`apps/web`), the widget source
(`packages/widget`), and the database schema as migrations
(`supabase/migrations`).

**You provide:** a Supabase project (managed or self-hosted, see below), a
place to run the Next.js app (Vercel is the tested path), and, optionally,
an email provider if you want notification emails.

**Not included:** any production data, and no dependency on Pinmark's own
hosted infrastructure. A self-hosted instance never calls
`pinmark-gamma.vercel.app` or any other Pinmark-operated endpoint.

**Not built yet:** a turnkey full-stack Docker deployment (one command that
brings up Postgres, auth, and the app together). Today you run the app and
Supabase as two separate pieces. Tracked as future work.

## 0. Choose your Supabase path

**Managed Supabase (recommended, easy path).** Create a free project at
[supabase.com](https://supabase.com). No infrastructure to run yourself;
this is what the hosted Pinmark instance uses.

**Fully self-hosted Supabase (advanced path).** Run Supabase's own
[self-hosting stack](https://supabase.com/docs/guides/self-hosting)
(Postgres, GoTrue, PostgREST, Realtime, Storage, behind Kong) on your own
infrastructure. This repo does not provide or test that stack; follow
Supabase's own docs for it. Once it is up, everything below is identical,
point `NEXT_PUBLIC_SUPABASE_URL` at your own instance instead of
`*.supabase.co`.

## 1. Apply the database migrations

Five migrations exist today, in `supabase/migrations/`, and must be applied
**in filename order**:

1. `20260702000000_init.sql`, tables and RLS
2. `20260703000000_access_control.sql`, `access_mode` + `review_token`
3. `20260703010000_rate_limits.sql`, rate-limit counters and function
4. `20260703020000_ratelimit_cleanup.sql`, probabilistic cleanup of expired rate-limit rows
5. `20260704000000_page_commenting_rules.sql`, per-project page rules (`commenting_scope`, `commenting_paths`)

Two ways to apply them:

- **Guided:** `pnpm setup:self-host` links your Supabase project via the
  CLI, shows you the pending migrations, and applies them after you
  confirm. Run `pnpm setup:self-host --dry-run` first to see exactly what
  it would do without changing anything. See
  [Migration procedure](#migration-procedure) for the ongoing (not just
  first-time) version of this.
- **Manual:** open your Supabase project's SQL Editor and paste the
  contents of each file, in the order above.

## 2. Deploy the app to Vercel

Click **Deploy with Vercel** in [README.md](README.md), or set up manually:

1. Push this repo to GitHub (if you have not already).
2. Vercel -> New Project -> import the repo.
3. **Root Directory must be set to `apps/web`.** Vercel does not detect
   this automatically for a pnpm monorepo; set it explicitly in the import
   screen, or later under Project Settings -> General -> Root Directory.
   The build command itself (`pnpm --filter widget build && next build`,
   which builds the widget before the Next.js app) lives in
   `apps/web/vercel.json`, not a root-level `vercel.json`, and is picked up
   automatically once the root directory is correct.
4. Set environment variables (Production). Required:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**rotate it first** if it was ever shared, see [Rotating exposed keys](#rotating-exposed-keys)) |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` (or custom domain) |
   | `NEXT_PUBLIC_CDN_URL` | same as `NEXT_PUBLIC_APP_URL` |
   | `NEXT_PUBLIC_BRAND_NAME` | `Pinmark`, or your own name |
   | `NEXT_PUBLIC_SELF_HOSTED` | `true` for a self-hosted instance, `false` (or unset) otherwise |

   Optional:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_DEMO_KEY` | see [Playground](#playground) below |
   | `MAILER` | `resend`, `smtp`, or unset to disable email |
   | `RESEND_API_KEY` | from resend.com, if `MAILER=resend` |
   | `SMTP_URL` | if `MAILER=smtp` |
   | `NOTIFY_FROM_EMAIL` | verified sender, for example `notify@yourdomain` |

5. Deploy.

### Self-hosted mode

Setting `NEXT_PUBLIC_SELF_HOSTED=true`:

- Redirects `/` to `/login` (or `/dashboard` if already signed in) instead
  of serving the landing page.
- Hides the "Playground" and "Open source" links from navigation, and the
  playground route itself shows a short explanatory message instead of the
  live demo, regardless of `NEXT_PUBLIC_DEMO_KEY`.
- Shows a small "Self-hosted" tag next to the wordmark once signed in.
- Does not change the dashboard, authentication, API routes, exports,
  widget delivery (`w.js`, `widget.core.js`), or project settings; all of
  that works identically in both modes.
- `/docs` stays reachable in both modes.

Leaving it unset or `false` reproduces the hosted experience exactly as it
was before this option existed.

### Other hosts (Fly, Render, a VPS)

Vercel is the only target this repo tests and documents in depth. Running
`apps/web` anywhere else that runs Node 20+ should work in principle
(`pnpm --filter widget build && pnpm --filter web build && pnpm --filter web start`,
with the same environment variables, behind your own reverse proxy and
TLS), but it is untested here. Treat it as "should work," not "verified."

## 3. Configure Supabase auth URLs

Authentication -> URL Configuration:
- Site URL: `https://<your-app>.vercel.app`
- Redirect URLs: add `https://<your-app>.vercel.app/auth/callback`
  (keep the localhost entries for local dev)

## 4. Playground

`/playground` is a live demo of the widget on a fake marketing page,
powered by a real Pinmark project referenced by `NEXT_PUBLIC_DEMO_KEY`.

- **To enable it:** create a project in your own dashboard, allow the
  `localhost` and your app's domain, and set `NEXT_PUBLIC_DEMO_KEY` to its
  public key.
- **To disable it:** leave `NEXT_PUBLIC_DEMO_KEY` unset. The route shows a
  short "not connected" message instead of loading the widget.
- Self-hosted instances never load the demo widget on `/playground`
  regardless of this variable, since the playground exists to demo the
  hosted product.

## 5. Optional email notifications

Leave `MAILER` unset to disable notification emails entirely (nothing
breaks; comments still work, no email is sent). To enable, set `MAILER` to
`resend` (with `RESEND_API_KEY`) or `smtp` (with `SMTP_URL`), and set
`NOTIFY_FROM_EMAIL` to a sender address you have verified with that
provider.

## 6. Re-snippet your prototypes

Every prototype needs the **production** snippet (localhost ones stop being
useful the moment your dev server stops):

```html
<script async src="https://<your-app>.vercel.app/w.js" data-pinmark="pk_live_…"></script>
```

Copy it from each project's page in the dashboard, it uses
`NEXT_PUBLIC_CDN_URL` automatically.

## 7. Verify the deploy

Check `GET https://<your-app>.vercel.app/api/health` first: it reports
(without ever returning a secret, token, or raw error) whether the app is
running, Supabase is reachable, required environment variables are
present, the database schema matches what the deployed code expects,
mail is configured, and whether the instance is in hosted or self-hosted
mode. A 200 means healthy; 503 means something above needs attention.

Then a manual smoke test (5 min):

- [ ] Sign in via magic link on the production URL
- [ ] Project page loads, snippet shows production URL
- [ ] Paste snippet into a prototype, redeploy it, bubble appears
- [ ] Drop a pin from a different browser/incognito (name-only, no account)
- [ ] Pin sticks to its element when the window is resized
- [ ] Thread list on the project page shows the comment; resolve + delete work
- [ ] Review-link mode: widget invisible in incognito without the link, visible with it
- [ ] If self-hosted: `/` redirects to `/login`, "Playground" and "Open source" are not in the nav
- [ ] If mail configured: email arrives on a new top-level comment

## Upgrading Pinmark

1. **Back up first.** See [Backup procedure](#backup-procedure).
2. Pull the latest code (`git pull`, or update your fork).
3. Check for new migrations: `supabase migration list` (or
   `pnpm setup:self-host --dry-run`) shows anything not yet applied to your
   project.
4. Apply them the same way as [step 1](#1-apply-the-database-migrations):
   `pnpm setup:self-host` or manual SQL Editor, in filename order.
5. Redeploy the app (Vercel redeploys automatically on push if connected
   to your repo).
6. Re-run the smoke test above.

## Migration procedure

Same tools every time, first deploy or the fiftieth:

```sh
supabase login
supabase link --project-ref <your-project-ref>
supabase migration list      # shows what is pending
supabase db push             # applies pending migrations
```

Never hand-edit tables in the Supabase dashboard as a substitute for a
migration; changes made that way are not tracked, not reproducible, and
will not exist the next time you run `db push` on a fresh clone.

## Backup procedure

Before applying new migrations, take a backup:

```sh
supabase db dump --project-ref <your-project-ref> -f backup-$(date +%Y%m%d).sql
```

Managed Supabase projects also take automatic daily backups (see your
project's Database -> Backups page); a manual dump before upgrading is a
second, faster-to-restore safety net, not a replacement for those.

## Rollback limitations

There is no automatic migration rollback. Schema changes here are additive
by design (new columns, new tables, new functions), which makes rolling
**forward** low-risk, but rolling a database **back** to an earlier schema
means restoring your own backup, there is no `supabase migration down`
tooling provided or recommended. Rolling the **application** back is
simpler: redeploy a previous Vercel deployment (or `git revert` and push).
If a migration and an app version are both rolled back together, make sure
they are a version pair that actually shipped together.

## Rotating exposed keys

If `SUPABASE_SERVICE_ROLE_KEY` (or any key) is ever committed, pasted
somewhere public, or otherwise exposed:

1. Supabase dashboard -> Project Settings -> API -> regenerate the
   service_role key (and the anon key, if that was exposed too).
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel's environment variables
   and redeploy.
3. Existing Pinmark project public keys (`pk_live_...`) are unrelated to
   this and do not need rotation unless a specific project's key was
   itself exposed, in which case regenerate it from that project's
   dashboard page (this immediately invalidates the old snippet everywhere
   it is embedded).
