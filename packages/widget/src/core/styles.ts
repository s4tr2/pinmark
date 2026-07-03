// All widget styles live inside the shadow root. Nothing leaks out; host
// page CSS cannot reach in.
export const CSS = `
:host {
  all: initial;
}
* {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ---- theme ---- */
.root {
  --bg: #ffffff;
  --fg: #111111;
  --muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --pin: #f59e0b;
  --pin-fg: #111;
  --shadow: 0 4px 24px rgba(0,0,0,.18);
}
@media (prefers-color-scheme: dark) {
  .root {
    --bg: #1c1c1e;
    --fg: #f2f2f2;
    --muted: #9ca3af;
    --border: #3a3a3c;
    --shadow: 0 4px 24px rgba(0,0,0,.5);
  }
}

/* ---- bubble ---- */
.bubble {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--fg);
  color: var(--bg);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: var(--shadow);
  pointer-events: auto;
}
.bubble:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
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
  width: 200px;
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 6px;
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
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.menu button:hover { background: var(--border); }
.menu .brand {
  font-size: 11px;
  color: var(--muted);
  padding: 6px 10px 4px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
.menu .brand a { color: var(--muted); }

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
  background: var(--fg);
  color: var(--bg);
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  box-shadow: var(--shadow);
  pointer-events: none;
}

/* ---- pins ---- */
.pin {
  position: fixed;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50% 50% 50% 4px;
  background: var(--pin);
  color: var(--pin-fg);
  border: 2px solid #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,.3);
  pointer-events: auto;
  animation: pin-in .18s ease-out;
}
.pin.approx { opacity: .6; }
.pin:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@keyframes pin-in {
  from { transform: translateY(-6px) scale(.8); opacity: 0; }
  to { transform: none; opacity: 1; }
}

/* ---- popover (composer + thread) ---- */
.popover {
  position: fixed;
  width: 320px;
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
  font-size: 13px;
  font-weight: 600;
}
.popover input,
.popover textarea {
  width: 100%;
  font-size: 13px;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  resize: vertical;
}
.popover textarea { min-height: 60px; }
.popover .actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.popover .actions button {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
}
.popover .actions button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.popover .actions button:disabled { opacity: .5; cursor: default; }

.comment { margin-bottom: 10px; }
.comment .meta {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}
.comment .meta b { color: var(--fg); font-weight: 600; }
.comment .body {
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}
.error {
  color: #dc2626;
  font-size: 12px;
  margin: 0 0 8px;
}
.own-action {
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}
.own-action:hover { color: var(--fg); }

/* ---- region comments (Figma-style area selection) ---- */
.region {
  position: fixed;
  border: 2px dashed #3b82f6;
  border-radius: 2px;
  background: rgba(59, 130, 246, 0.06);
  pointer-events: none;
}
.region.approx { opacity: .6; }
`;
