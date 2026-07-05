// Guest identity, persisted per-browser (PRD §6.3 privacy model).

const NAME_KEY = "pinmark:name";
const TOKEN_KEY = "pinmark:token";
const MINE_KEY = "pinmark:mine"; // ids of comments this browser posted

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (sandboxed iframe etc.), use session-only
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

// Review-link token, stored per project key so one browser can review
// multiple projects.
export function getReviewToken(key: string): string | null {
  return safeGet(`pinmark:rt:${key}`);
}

export function setReviewToken(key: string, token: string): void {
  safeSet(`pinmark:rt:${key}`, token);
}

export function clearReviewToken(key: string): void {
  try {
    localStorage.removeItem(`pinmark:rt:${key}`);
  } catch {
    /* ignore */
  }
}

let sessionToken: string | null = null;

export function getToken(): string {
  const stored = safeGet(TOKEN_KEY);
  if (stored) return stored;
  if (!sessionToken) {
    sessionToken = crypto.randomUUID();
    safeSet(TOKEN_KEY, sessionToken);
  }
  return sessionToken;
}

export function getName(): string | null {
  return safeGet(NAME_KEY);
}

export function setName(name: string): void {
  safeSet(NAME_KEY, name);
}

export function getMyCommentIds(): Set<string> {
  try {
    return new Set(JSON.parse(safeGet(MINE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function rememberMyComment(id: string): void {
  const ids = getMyCommentIds();
  ids.add(id);
  // cap so localStorage doesn't grow unbounded
  const arr = [...ids].slice(-200);
  safeSet(MINE_KEY, JSON.stringify(arr));
}
