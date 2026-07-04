// Deterministic aurora-gradient avatars for guests. Mirror of
// apps/web/src/lib/avatar.ts — keep the two in sync.

function hashName(name: string): number {
  let h = 5381;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function avatarBackground(name: string): string {
  const h = hashName(name);
  const h1 = h % 360;
  const h2 = (h1 + 70 + ((h >> 8) % 110)) % 360;
  const angle = (h >> 4) % 360;
  return (
    `radial-gradient(120% 120% at 30% 25%, oklch(0.86 0.1 ${h1}), transparent 60%), ` +
    `radial-gradient(130% 130% at 75% 80%, oklch(0.7 0.13 ${h2}), transparent 65%), ` +
    `linear-gradient(${angle}deg, oklch(0.8 0.09 ${h1}), oklch(0.66 0.12 ${h2}))`
  );
}

export function avatarInk(name: string): string {
  const h = hashName(name);
  const h2 = ((h % 360) + 70 + ((h >> 8) % 110)) % 360;
  return `oklch(0.24 0.04 ${h2} / 0.85)`;
}

export function avatarInitial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}
