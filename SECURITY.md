# Security

Pinmark's widget runs on other people's pages and handles unauthenticated
guest input, so the security boundary matters more than usual for a project
this size.

## In scope

- Domain allowlist / guard bypass (`apps/web/src/lib/api/guard.ts`, `domains.ts`)
- Anything that lets guest input execute as HTML/JS (XSS) in the widget,
  dashboard, or notification emails
- Leaking `author_token` or any guest-identifying data through a public API
  response
- Rate-limit bypass that enables abuse of a project's comment volume
- Review-link mode (`access_mode`) being bypassed without the token

## Not in scope

- The widget being visible/inspectable in a host page's DOM — that's by
  design, not a vulnerability
- Missing features, or the self-hosted deploy lacking docker-compose

## Reporting

Please report privately rather than opening a public issue: open a
[private GitHub security advisory](https://github.com/s4tr2/pinmark/security/advisories/new)
for this repo.

Include what you found, how to reproduce it, and impact if known. This is a
solo-maintained project — expect an initial response within a few days, not
hours. No bug bounty program exists today.
