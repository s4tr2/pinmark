# Architecture

## Current shape

Pinmark is a single pnpm monorepo:

```
apps/web/           Next.js App Router: landing, docs, playground, auth,
                     dashboard, API routes, and the widget's static assets
                     (public/w.js, public/widget.core.js, built from
                     packages/widget)
packages/widget/     Framework-free commenting widget (Vite, Shadow DOM)
supabase/migrations/ Schema (Postgres, RLS)
```

One Vercel project, root directory `apps/web`, one build command
(`pnpm --filter widget build && next build`, see `apps/web/vercel.json`).
Every page (marketing and product alike) renders its own `<SiteNav>`
directly; there is no shared layout wrapping route groups. Self-hosted mode
(`NEXT_PUBLIC_SELF_HOSTED=true`, see `apps/web/src/lib/config.ts`) hides the
marketing surface at render time within this same app rather than by
deploying a different one.

## Why a real app split is deferred

A clean `apps/site` (landing, docs, playground) / `apps/app` (auth,
dashboard, API, widget delivery) split was considered for this task and
rejected for now, not because it is a bad idea, but because it cannot be
verified safely without deploying, which was explicitly out of scope here.
Specifically:

1. **Shared surface is bigger than it looks.** `SiteNav`, `ScrollReveal`,
   `PinmarkLogo`, `apps/web/src/lib/config.ts` (branding, URLs, the
   self-hosted flag), and most of `globals.css`'s base layer (color tokens,
   type scale, buttons, forms, `.card`, `.tag`) are used by marketing pages
   and product pages alike. Splitting today means either duplicating all of
   it or extracting a shared package first, an untested refactor of its own.
2. **Docs don't sort cleanly into either side.** This task requires
   self-hosted mode to keep `/docs` reachable while hiding the landing page
   and playground. But the split proposed groups docs with the marketing
   app. If `apps/site` and `apps/app` become separate deployments, a
   self-hoster running only `apps/app` would lose `/docs` entirely unless
   docs move to `apps/app`, or the two apps are deployed together, or docs
   are duplicated. This has to be decided deliberately, not incidentally.
3. **Auth and routing need a real decision, not a guess.** Today, cookies
   and `middleware.ts` operate on one domain. A split needs either
   path-based rewrites on a single domain (marketing paths routed to one
   deployment, product paths to another) or two subdomains with Supabase
   auth redirect URLs and cookie scope reconfigured accordingly. Either is
   fine, but it changes what self-hosters must configure, and it is not
   something to get wrong silently.
4. **Vercel and CI both assume one app today.** `apps/web/vercel.json`'s
   `buildCommand` builds the widget before `next build` in a single project;
   a split needs either two Vercel projects (each with their own root
   directory and build command) or a build matrix, and CI needs to build and
   test both independently. None of this can be validated without an actual
   deploy.

Given all of that, the safe interim boundary is `NEXT_PUBLIC_SELF_HOSTED`:
self-hosters get "product only" today, entirely at render time, with zero
deployment-topology risk.

## What the future split would actually look like

```
apps/site/     page.tsx (landing), docs/*, playground/*, scroll-reveal.tsx,
               tactile-clicks.tsx; the marketing-only slice of globals.css
apps/app/      login/*, dashboard/*, p/[id]/*, api/*, middleware.ts,
               auth/callback/*, public/w.js + widget.core.js, and all of
               lib/* (actions, api/guard, api/ratelimit, api/validate,
               config, domains, notify, page-rules, supabase clients)
packages/ui/   NEW. SiteNav, PinmarkLogo, and the shared design-token layer
               of globals.css, imported by both apps
packages/widget/  unchanged
supabase/         unchanged; only apps/app talks to it once split
```

Note that `apps/site` would end up with no server-side Supabase dependency
at all once docs and playground no longer need a live demo key check at
request time, a nice property, but only if the docs-ownership question
above is resolved first.

## Checklist before attempting the split for real

1. Extract `packages/ui` (SiteNav, PinmarkLogo, shared tokens) and update
   the still-single app to import from it. Ship and verify that refactor
   completely on its own before touching directory boundaries.
2. Decide where `/docs` lives, and confirm self-hosted-mode deployments
   (whichever app(s) they run) still serve it.
3. Decide the domain/routing strategy (path rewrites on one domain vs. two
   subdomains) and prove Supabase auth redirect URLs and cookies work under
   it in a throwaway project.
4. Stand up two Vercel projects (or a build matrix in one), each with the
   correct root directory and build command, including widget-before-`next
   build` ordering for `apps/app`.
5. Update CI to build and test both apps and `packages/ui` independently,
   alongside the existing widget build.
6. Rewrite the self-hosting docs for a two-deployment setup, this is a
   bigger documentation change than anything in this task.
7. Only cut over after all of the above is proven on a branch, never as
   part of an otherwise-unrelated change.
