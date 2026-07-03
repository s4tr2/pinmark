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
  transition: transform 0.15s ease-out;
}
.bubble:hover { transform: scale(1.05); }
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
}
.menu button:hover { background: var(--bg-subtle); }
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
  transition: transform 0.15s ease-out;
  animation: pin-in 0.18s ease-out;
}
.pin:hover { transform: scale(1.12); }
.pin.approx { opacity: 0.55; border-style: dashed; }
.pin:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@keyframes pin-in {
  from { transform: translateY(-6px) scale(0.85); opacity: 0; }
  to { transform: none; opacity: 1; }
}

/* ---- region (area comments) ---- */
.region {
  position: fixed;
  border: 1.5px solid var(--accent);
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
  transition: border-color 0.15s ease-out, background 0.15s ease-out;
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
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
}
.popover .actions button:hover { background: var(--bg-subtle); }
.popover .actions button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
.popover .actions button.primary:hover { opacity: 0.9; background: var(--accent); }
.popover .actions button:disabled { opacity: 0.5; cursor: default; }

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

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
`;

// Static markup, never user content
export const BUBBLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
