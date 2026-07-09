# pinmark (draft, unpublished)

An `npm install` alternative to pasting the `<script data-pinmark>` tag by
hand, for projects with a real JS build (Next.js, Vite, plain React, etc.).

```ts
import { initPinmark } from "pinmark";

initPinmark("pk_live_...");
```

This does exactly what the manual snippet does: injects the same loader
script, pointed at the same hosted (or self-hosted, via `cdnUrl`) backend.
Same project key, same allowed-domains configuration in the dashboard. It
is not a different product or a different management model, just a
different way to get the same script tag onto the page.

## Why this can't replace the `<script>` tag

Most of Pinmark's supported platforms (Webflow, Framer, Lovable, Wix,
Squarespace, Bolt, v0, plain HTML) have no npm install step at all, that
is the entire reason the script-tag install exists in the first place. The
`<script>` tag in `/docs` remains the universal, required install path.
This package only helps the subset of users on a real bundler.

## Status: not published

`private: true` on purpose. This is a draft scaffold built to react to,
not a shipped package. Before it can actually be `npm install`-able,
someone with npm publish access needs to:

1. Confirm the package name (`pinmark` may not be available on the public
   registry; this was not checked).
2. Decide the deeper-design question: this version is the thin wrapper
   (imports the same runtime `w.js`, so widget updates still roll out to
   every install automatically, same as the script tag does today). The
   alternative, bundling the actual widget core into the npm package
   instead of fetching it at runtime, trades one network request for
   every consuming app needing its own rebuild/redeploy to pick up widget
   updates. Not built here; flagged for a decision first.
3. Actually run `npm publish` from an authenticated account. Nothing in
   this repo does that automatically.
