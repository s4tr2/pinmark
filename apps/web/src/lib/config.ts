// Single source of truth for branding (PRD naming note: rename = one change here / in env)
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Pinmark";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ?? APP_URL;

export function snippetFor(publicKey: string): string {
  return `<script async src="${CDN_URL}/w.js" data-pinmark="${publicKey}"></script>`;
}
