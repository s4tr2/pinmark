export type CommentingScope = "all" | "include" | "exclude";

const MAX_PATTERNS = 100;
const MAX_PATTERN_LENGTH = 200;

function normalizePath(value: string): string {
  let path = value.trim();

  if (path.includes("://")) {
    try {
      path = new URL(path).pathname;
    } catch {
      throw new Error(`Invalid page path: ${value}`);
    }
  }

  path = path.split(/[?#]/, 1)[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

/**
 * Parses the dashboard's newline/comma-separated path rules.
 * Exact paths and a trailing `/*` are supported. Query strings and hashes
 * are intentionally ignored because commenting access is page-based.
 */
export function parseCommentingPaths(raw: string): string[] {
  const entries = raw
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length > MAX_PATTERNS)
    throw new Error(`Use at most ${MAX_PATTERNS} page paths`);

  const patterns = entries.map((entry) => {
    const wildcard = entry.split(/[?#]/, 1)[0].endsWith("/*");
    const withoutWildcard = wildcard
      ? entry.split(/[?#]/, 1)[0].slice(0, -2)
      : entry;
    const path = normalizePath(withoutWildcard);

    if (path.includes("*"))
      throw new Error("Wildcards are only supported as /* at the end");

    const pattern = wildcard
      ? path === "/"
        ? "/*"
        : `${path}/*`
      : path;

    if (pattern.length > MAX_PATTERN_LENGTH)
      throw new Error(`Page paths must be ${MAX_PATTERN_LENGTH} characters or fewer`);
    if (/\s/.test(pattern))
      throw new Error(`Page paths cannot contain spaces: ${entry}`);

    return pattern;
  });

  return [...new Set(patterns)];
}

export function routeMatchesPattern(route: string, pattern: string): boolean {
  let pathname: string;
  let normalizedPattern: string;
  try {
    pathname = normalizePath(route);
    normalizedPattern = pattern.endsWith("/*")
      ? pattern === "/*"
        ? "/*"
        : `${normalizePath(pattern.slice(0, -2))}/*`
      : normalizePath(pattern);
  } catch {
    return false;
  }

  if (normalizedPattern === "/*") return true;
  if (!normalizedPattern.endsWith("/*"))
    return pathname === normalizedPattern;

  const base = normalizedPattern.slice(0, -2);
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function commentingEnabledOnRoute(
  route: string,
  scope: CommentingScope,
  patterns: string[]
): boolean {
  if (scope === "all") return true;

  const matches = patterns.some((pattern) =>
    routeMatchesPattern(route, pattern)
  );
  return scope === "include" ? matches : !matches;
}
