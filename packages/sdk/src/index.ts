// Thin wrapper around the same <script data-pinmark> tag documented in
// /docs. Same key, same allowed-domains config, same hosted backend
// (or your own self-hosted CDN_URL); this only changes install syntax
// for projects that would rather `import` than paste a <script> tag.
// The <script> tag itself remains required for platforms with no
// npm/build step (Webflow, Framer, Lovable, Wix, Squarespace, plain
// HTML): this package cannot reach those.

const DEFAULT_CDN_URL = "https://pinmark-gamma.vercel.app";

export type InitPinmarkOptions = {
  /** Override for self-hosted instances. Defaults to the managed, hosted CDN. */
  cdnUrl?: string;
};

/**
 * Mounts the Pinmark widget by injecting the same loader script the
 * manual snippet uses. Safe to call more than once (a second call is a
 * no-op); safe to call during server-side rendering (no-op, since there
 * is no document).
 */
export function initPinmark(key: string, options: InitPinmarkOptions = {}): void {
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-pinmark]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `${options.cdnUrl ?? DEFAULT_CDN_URL}/w.js`;
  script.setAttribute("data-pinmark", key);
  document.head.appendChild(script);
}
