/**
 * Normalize user-entered allowed-domain lists. Users paste full URLs
 * ("https://foo.vercel.app/some/path"); the allowlist matches hostnames.
 * Wildcards ("*.lovable.app") pass through untouched.
 */
export function parseDomains(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .map((d) => {
      if (d.startsWith("*.")) return d;
      try {
        return new URL(d.includes("://") ? d : `https://${d}`).hostname;
      } catch {
        return d;
      }
    });
}
