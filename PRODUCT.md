# Product

## Register

product

## Users

Two audiences. Authors: indie builders, product designers, and PMs who deployed a coded prototype (Vercel, Lovable, Replit) and want contextual feedback on it; they use the dashboard briefly, for triage, between other work. Reviewers: teammates, stakeholders, clients who open a prototype link and leave pinned comments with zero setup; they never see the dashboard. Both are tool-literate people who value speed and dislike ceremony.

## Product Purpose

Figma-style commenting for any deployed prototype via one script tag. The product's entire promise is frictionlessness: no accounts for reviewers, one paste for authors, pins that land exactly where feedback belongs. Success = feedback arrives on the prototype instead of in vague chat messages and screenshots.

## Brand Personality

Precise, calm, craftsmanlike. The voice of a well-made tool: quiet surfaces, sharp typography, confidence without marketing noise. Primary reference: Linear (dark-friendly, dense, keyboard-first). The widget must feel like a native part of whatever page hosts it; the web app must feel like it was built by the same hands that built the widget.

## Anti-references

- Generic SaaS template: gradient heroes, emoji-heavy feature grids, purple-blue startup look.
- Heavy enterprise UI: dense chrome, toolbars, Jira/Salesforce weight.
- Playful consumer app: rounded-everything, bouncy animations, illustration-heavy.

## Design Principles

1. **The tool defers to the work.** On prototypes the widget stays out of the way; in the dashboard the user's comments and projects are the content, chrome stays minimal.
2. **Keyboard-first is a feature, teach it.** Shortcuts (C, Esc) are the product's speed; surfaces should quietly advertise them (kbd styling, hints), never hide them in menus.
3. **Density with air.** Linear-style: compact type, tight lists, but generous whitespace at section boundaries. Rhythm over uniform padding.
4. **Every state explains itself.** Empty states, errors, and dormant modes say why and what to do next; a silent failure is a design bug.
5. **One accent, spent carefully.** Restrained color strategy; the accent marks interaction and state, never decoration.

## Accessibility & Inclusion

WCAG AA contrast. Full keyboard reachability (widget popovers focus-trapped, pins tabbable, aria-labels on controls, per PRD §10). Respect prefers-color-scheme and prefers-reduced-motion. No color-only state signaling.
