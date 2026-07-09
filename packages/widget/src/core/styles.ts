// All widget styles live inside the shadow root. Nothing leaks out; host
// page CSS cannot reach in. Theme class (.light/.dark) is set at mount from
// the host page's own background, so the widget looks native to the page
// rather than following the OS while the page does its own thing.
export const CSS = `
:host {
  all: initial;
}
* {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Helvetica, Arial, sans-serif;
}

.root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

.root.light {
  --bg: oklch(1 0.002 262);
  --bg-subtle: oklch(0.96 0.004 262);
  --fg: oklch(0.24 0.01 262);
  --muted: oklch(0.52 0.015 262);
  --border: oklch(0.9 0.006 262);
  --accent: oklch(0.52 0.17 262);
  --accent-soft: oklch(0.52 0.17 262 / 0.08);
  --on-accent: #fff;
  --shadow: 0 1px 2px oklch(0 0 0 / 0.06), 0 8px 28px oklch(0 0 0 / 0.12);
  --danger: oklch(0.55 0.19 25);
}
.root.dark {
  --bg: oklch(0.23 0.01 262);
  --bg-subtle: oklch(0.28 0.012 262);
  --fg: oklch(0.94 0.005 262);
  --muted: oklch(0.68 0.012 262);
  --border: oklch(0.36 0.012 262);
  --accent: oklch(0.72 0.14 262);
  --accent-soft: oklch(0.72 0.14 262 / 0.12);
  --on-accent: oklch(0.16 0.01 262);
  --shadow: 0 1px 2px oklch(0 0 0 / 0.3), 0 12px 32px oklch(0 0 0 / 0.45);
  --danger: oklch(0.7 0.16 25);
}

/* ---- bubble ---- */
.bubble {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
  pointer-events: auto;
  transition: transform 160ms var(--ease-out);
}
.bubble:active { transform: scale(0.97); transition-duration: 100ms; }
.bubble:focus-visible:active { transform: none; }
.bubble:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.bubble svg { width: 20px; height: 20px; display: block; }
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---- menu ---- */
.menu {
  position: fixed;
  right: 16px;
  bottom: 68px;
  width: 210px;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 5px;
  pointer-events: auto;
  opacity: 1;
  transform: translateY(0) scale(1);
  transform-origin: bottom right;
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out);
}
.menu button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--fg);
  font-size: 13px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    transform 140ms var(--ease-out);
}
.menu button:active { transform: scale(0.98); transition-duration: 90ms; }
.menu button:focus-visible:active { transform: none; }
.menu .brand {
  font-size: 11px;
  padding: 7px 10px 5px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
.menu .brand a { color: var(--muted); text-decoration: none; }
.menu .brand a:hover { color: var(--fg); }

/* ---- comment-mode overlay ---- */
.capture {
  position: fixed;
  inset: 0;
  cursor: crosshair;
  pointer-events: auto;
  background: transparent;
}
.mode-hint {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  font-size: 12.5px;
  padding: 7px 14px;
  border-radius: 999px;
  box-shadow: var(--shadow);
  pointer-events: none;
}

/* ---- pins ---- */
.pin {
  position: fixed;
  width: 26px;
  height: 26px;
  margin: -26px 0 0 0;
  border-radius: 50% 50% 50% 4px;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  font-size: 11.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow);
  pointer-events: auto;
  transition: transform 160ms var(--ease-out);
}
.pin:active { transform: scale(0.97); transition-duration: 100ms; }
.pin:focus-visible:active { transform: none; }
.pin.approx { opacity: 0.55; border-style: dashed; }
.pin:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pin.entering { animation: pin-in 180ms var(--ease-out); }
@keyframes pin-in {
  from { transform: translateY(-4px) scale(0.94); opacity: 0; }
  to { transform: none; opacity: 1; }
}

/* ---- region (area comments) ---- */
.region {
  position: fixed;
  border: 1.5px dashed var(--accent);
  border-radius: 6px;
  background: var(--accent-soft);
  pointer-events: none;
}
.region.approx { opacity: 0.55; }

/* ---- popover (composer + thread) ---- */
.popover {
  position: fixed;
  width: 300px;
  max-height: 420px;
  overflow-y: auto;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 12px;
  pointer-events: auto;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}
.popover h3 {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
  text-transform: none;
}
.popover input,
.popover textarea {
  width: 100%;
  font-size: 13px;
  color: var(--fg);
  background: var(--bg-subtle);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  resize: vertical;
  transition: border-color 150ms ease, background-color 150ms ease;
}
.popover input:focus,
.popover textarea:focus {
  outline: none;
  background: var(--bg);
  border-color: var(--accent);
}
.popover input::placeholder,
.popover textarea::placeholder { color: var(--muted); }
.popover textarea { min-height: 56px; }
.popover .actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.popover .actions button {
  font-size: 13px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  transition:
    background-color 140ms ease,
    transform 140ms var(--ease-out);
}
.popover .actions button:active { transform: scale(0.97); transition-duration: 90ms; }
.popover .actions button:focus-visible:active { transform: none; }
/* chunky charcoal pill: top-lit gradient + inner highlight, arrow nudges on hover */
.popover .actions button.primary {
  font-weight: 600;
  border: none;
  color: #fff;
  background: linear-gradient(180deg, oklch(0.36 0.012 262) 0%, oklch(0.24 0.01 262) 100%);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.14), 0 1px 3px oklch(0 0 0 / 0.25);
}
.root.dark .popover .actions button.primary {
  background: linear-gradient(180deg, oklch(0.42 0.014 262) 0%, oklch(0.3 0.012 262) 100%);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.16), 0 1px 3px oklch(0 0 0 / 0.45);
}
.popover .actions button.primary::after {
  content: "→";
  display: inline-block;
  margin-left: 6px;
  transition: transform 160ms var(--ease-out);
}
.popover .actions button.primary:active { filter: brightness(0.95); }
.popover .actions button:disabled {
  opacity: 0.5;
  cursor: default;
  filter: none;
  transform: none;
}
.popover .actions button.is-loading::after { display: none; }
.spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  margin-right: 6px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  opacity: 0.8;
  vertical-align: -1px;
  animation: pinmark-spin 0.6s linear infinite;
}
@keyframes pinmark-spin {
  to { transform: rotate(360deg); }
}

.comment { margin-bottom: 10px; }
.comment .meta {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}
.comment .meta b { color: var(--fg); font-weight: 600; }
.comment .body {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.error {
  color: var(--danger);
  font-size: 12px;
  margin: 0 0 8px;
}
.own-action {
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.own-action:hover { color: var(--fg); }
.own-action.is-loading { pointer-events: none; opacity: 0.6; }

/* ---- all-threads panel ---- */
.panel {
  position: fixed;
  right: 16px;
  bottom: 68px;
  width: 300px;
  max-height: min(60vh, 480px);
  overflow-y: auto;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 10px;
  pointer-events: auto;
  opacity: 1;
  transform: translateY(0) scale(1);
  transform-origin: bottom right;
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}
.panel h3 {
  margin: 8px 4px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.02em;
}
.panel h3:first-child { margin-top: 2px; }
.panel .thread-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 7px 8px;
  cursor: pointer;
  color: var(--fg);
  transition:
    background-color 140ms ease,
    transform 140ms var(--ease-out);
}
.panel .thread-item:active { transform: scale(0.985); transition-duration: 90ms; }
.panel .thread-item:focus-visible:active { transform: none; }
.panel .thread-item .who {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.panel .thread-item .who .done {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 6px;
}
.panel .thread-item .excerpt {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel .empty {
  font-size: 12.5px;
  color: var(--muted);
  padding: 8px;
}

/* resolved pins (shown via menu toggle) */
.pin.resolved {
  opacity: 0.55;
  background: var(--bg-subtle);
}

/* navigate-to-pin pulse: the ring animates independently so the pin keeps
   its press/hover transform and only compositor-friendly properties move. */
.pin.pulse::after {
  content: "";
  position: absolute;
  inset: -2px;
  border: 2px solid var(--accent);
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.88);
  animation: pin-pulse 280ms var(--ease-out) 2;
}
@keyframes pin-pulse {
  0% { opacity: 0.7; transform: scale(0.88); }
  70%, 100% { opacity: 0; transform: scale(1.75); }
}

.menu.no-enter,
.popover.no-enter,
.panel.no-enter {
  transition: none;
}

@starting-style {
  .menu {
    opacity: 0;
    transform: translateY(4px) scale(0.97);
  }
  .popover {
    opacity: 0;
    transform: translateY(4px) scale(0.97);
  }
  .panel {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
  .menu.no-enter,
  .popover.no-enter,
  .panel.no-enter {
    opacity: 1;
    transform: none;
  }
}

@media (hover: hover) and (pointer: fine) {
  .bubble:hover { transform: scale(1.05); }
  .pin:hover { transform: scale(1.1); }
  .menu button:hover,
  .popover .actions button:hover,
  .panel .thread-item:hover { background: var(--bg-subtle); }
  .popover .actions button.primary:hover {
    background: linear-gradient(180deg, oklch(0.36 0.012 262) 0%, oklch(0.24 0.01 262) 100%);
    filter: brightness(1.12);
  }
  .root.dark .popover .actions button.primary:hover {
    background: linear-gradient(180deg, oklch(0.42 0.014 262) 0%, oklch(0.3 0.012 262) 100%);
  }
  .popover .actions button.primary:hover::after { transform: translateX(2px); }
}

@media (prefers-reduced-motion: reduce) {
  .pin.entering,
  .pin.pulse::after {
    animation: none;
  }
  .bubble,
  .pin {
    transition: none;
  }
  .menu,
  .popover,
  .panel {
    transform: none;
    transition: opacity 120ms ease;
  }
  .menu button,
  .popover .actions button,
  .panel .thread-item,
  .popover .actions button.primary::after {
    transition: background-color 120ms ease, filter 120ms ease;
  }
  .bubble:hover,
  .bubble:active,
  .pin:hover,
  .pin:active,
  .menu button:active,
  .popover .actions button:active,
  .panel .thread-item:active,
  .popover .actions button.primary:hover::after {
    transform: none;
  }
  @starting-style {
    .menu,
    .popover,
    .panel {
      opacity: 0;
      transform: none;
    }
  }
}
`;

// Static markup, never user content
export const BUBBLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
