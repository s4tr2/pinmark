"use client";

import { useState } from "react";

// Dev-only hero-font chooser: sets data-hero-font on <html>; globals.css
// maps each key to its font variable. Never rendered in production.
const OPTIONS = [
  { key: "fraunces", label: "Fraunces (current)" },
  { key: "gloock", label: "Gloock — didone drama" },
  { key: "young", label: "Young Serif — warm letterpress" },
  { key: "newsreader", label: "Newsreader — literary" },
  { key: "bricolage", label: "Bricolage — expressive grotesque" },
  { key: "hedvig", label: "Hedvig — quiet quirk" },
];

export function FontPicker() {
  const [current, setCurrent] = useState("fraunces");
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 2147483001,
        background: "var(--bg)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "8px 10px",
        boxShadow: "0 8px 24px oklch(0 0 0 / 0.12)",
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 4, color: "var(--muted)", fontWeight: 500 }}>
        Hero font (dev)
      </div>
      <select
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value);
          document.documentElement.dataset.heroFont = e.target.value;
        }}
        style={{ font: "inherit", padding: "3px 6px", borderRadius: 6 }}
      >
        {OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
