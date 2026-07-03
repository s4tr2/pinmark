# Deploying Pinmark (hosted instance)

## 0. One-time Supabase SQL (if not already run)

Run every file in `supabase/migrations/` **in filename order** in the Supabase
SQL Editor. Currently:

1. `20260702000000_init.sql` — tables + RLS (already run if the app works)
2. `20260703000000_access_control.sql` — access_mode + review_token
3. `20260703010000_rate_limits.sql` — rate-limit counters + function

## 1. Vercel project

1. Push this repo to GitHub.
2. Vercel → New Project → import the repo. `vercel.json` at the root handles
   the monorepo build (widget bundles build before the web app).
3. Set environment variables (Production):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**rotate it first** if it was ever shared) |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` (or custom domain) |
   | `NEXT_PUBLIC_CDN_URL` | same as `NEXT_PUBLIC_APP_URL` |
   | `NEXT_PUBLIC_BRAND_NAME` | `Pinmark` |
   | `MAILER` | `resend` (or leave unset to disable email) |
   | `RESEND_API_KEY` | from resend.com (optional) |
   | `NOTIFY_FROM_EMAIL` | verified sender, e.g. `notify@yourdomain` |

4. Deploy.

## 2. Supabase auth URLs

Authentication → URL Configuration:
- Site URL: `https://<your-app>.vercel.app`
- Redirect URLs: add `https://<your-app>.vercel.app/auth/callback`
  (keep the localhost entries for local dev)

## 3. Re-snippet your prototypes

Every prototype needs the **production** snippet (localhost ones stop being
useful the moment your dev server stops):

```html
<script async src="https://<your-app>.vercel.app/w.js" data-pinmark="pk_live_…"></script>
```

Copy it from each project's page in the dashboard — it uses
`NEXT_PUBLIC_CDN_URL` automatically.

## 4. Smoke test (5 min)

- [ ] Sign in via magic link on the production URL
- [ ] Project page loads, snippet shows production URL
- [ ] Paste snippet into a prototype, redeploy it → bubble appears
- [ ] Drop a pin from a different browser/incognito (name-only, no account)
- [ ] Pin sticks to its element when the window is resized
- [ ] Thread list on the project page shows the comment; resolve + delete work
- [ ] Review-link mode: widget invisible in incognito without the link, visible with it
- [ ] If Resend configured: email arrives on a new top-level comment
