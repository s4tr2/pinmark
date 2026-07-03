import type { Anchor, RegionRect } from "./api";

// Auto-generated-looking ids are unstable across builds (PRD §5.3)
const UNSTABLE_ID = /\d{3,}|^:|^radix-|^headlessui-/;
const TESTID_ATTRS = ["data-testid", "data-test", "data-cy"];
const MAX_ANCESTORS = 5;
const MAX_PATH_DEPTH = 5;

function cssEscape(v: string): string {
  return CSS?.escape ? CSS.escape(v) : v.replace(/[^\w-]/g, "\\$&");
}

/** Is this selector unique in the document right now? */
function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function selectorFor(el: Element): { selector: string; confidence: Anchor["selector_confidence"] } | null {
  if (el.id && !UNSTABLE_ID.test(el.id)) {
    const s = `#${cssEscape(el.id)}`;
    if (isUnique(s)) return { selector: s, confidence: "high" };
  }
  for (const attr of TESTID_ATTRS) {
    const v = el.getAttribute(attr);
    if (v) {
      const s = `[${attr}="${cssEscape(v)}"]`;
      if (isUnique(s)) return { selector: s, confidence: "high" };
    }
  }
  const aria = el.getAttribute("aria-label");
  if (aria && aria.length <= 80) {
    const s = `${el.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`;
    if (isUnique(s)) return { selector: s, confidence: "medium" };
  }
  return null;
}

function nthOfType(el: Element): number {
  let n = 1;
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.tagName === el.tagName) n++;
    sib = sib.previousElementSibling;
  }
  return n;
}

/**
 * Semantic path: tag + nth-of-type segments, max depth 5, rooted at body or
 * the nearest stable-id ancestor. Never class names (PRD §5.3).
 */
function semanticPath(el: Element): string | null {
  const segments: string[] = [];
  let node: Element | null = el;

  for (let depth = 0; node && depth < MAX_PATH_DEPTH; depth++) {
    if (node === document.body || node === document.documentElement) break;

    const parent: Element | null = node.parentElement;
    const stable = selectorFor(node);
    if (stable && depth > 0) {
      segments.unshift(stable.selector);
      const s = segments.join(" > ");
      return isUnique(s) ? s : null;
    }

    segments.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${nthOfType(node)})`);
    node = parent;
  }

  if (!node || node === document.body) {
    const s = "body > " + segments.join(" > ");
    return isUnique(s) ? s : null;
  }
  return null;
}

/**
 * Selector generation at pin time (PRD §5.3): walk up from the clicked
 * element looking for the most stable anchor.
 */
export function generateSelector(target: Element): {
  el: Element;
  selector: string | null;
  confidence: Anchor["selector_confidence"];
} {
  let node: Element | null = target;
  for (let i = 0; node && i < MAX_ANCESTORS; i++) {
    const found = selectorFor(node);
    if (found) return { el: node, selector: found.selector, confidence: found.confidence };
    node = node.parentElement;
  }

  const path = semanticPath(target);
  if (path) return { el: target, selector: path, confidence: "low" };

  return { el: target, selector: null, confidence: "none" };
}

export function buildAnchor(
  route: string,
  clientX: number,
  clientY: number,
  target: Element | null
): Anchor {
  const doc = document.documentElement;
  const pageX = clientX + window.scrollX;
  const pageY = clientY + window.scrollY;

  const base: Anchor = {
    route,
    selector: null,
    selector_confidence: "none",
    offset_pct: null,
    page_pct: { x: pageX / doc.scrollWidth, y: pageY / doc.scrollHeight },
    viewport: { w: innerWidth, h: innerHeight },
  };

  if (!target) return base;

  const { el, selector, confidence } = generateSelector(target);
  if (!selector) return base;

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return base;

  base.selector = selector;
  base.selector_confidence = confidence;
  base.offset_pct = {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
  return base;
}

/**
 * Region anchor (Figma-style area comment). `client` is the dragged marquee
 * in viewport coords; the pin's point anchor is the region's top-left corner
 * and the extent is stored element-relative + page-relative.
 */
export function buildRegionAnchor(
  route: string,
  client: { left: number; top: number; width: number; height: number },
  target: Element | null
): Anchor {
  const anchor = buildAnchor(route, client.left, client.top, target);
  const doc = document.documentElement;

  anchor.region_page_pct = {
    x: (client.left + window.scrollX) / doc.scrollWidth,
    y: (client.top + window.scrollY) / doc.scrollHeight,
    w: client.width / doc.scrollWidth,
    h: client.height / doc.scrollHeight,
  };

  if (anchor.selector && anchor.offset_pct) {
    // buildAnchor picked a stable element; express the region in its space
    const el = document.querySelector(anchor.selector);
    const rect = el?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      anchor.region_offset_pct = {
        x: (client.left - rect.left) / rect.width,
        y: (client.top - rect.top) / rect.height,
        w: client.width / rect.width,
        h: client.height / rect.height,
      };
    }
  }
  return anchor;
}

/** Viewport rect for a region anchor, using the already-resolved pin position. */
export function resolveRegion(
  anchor: Anchor,
  resolved: ResolvedPosition
): RegionRect | null {
  if (resolved.el && anchor.region_offset_pct) {
    const rect = resolved.el.getBoundingClientRect();
    const r = anchor.region_offset_pct;
    return {
      x: rect.left + r.x * rect.width,
      y: rect.top + r.y * rect.height,
      w: r.w * rect.width,
      h: r.h * rect.height,
    };
  }
  if (anchor.region_page_pct) {
    const doc = document.documentElement;
    const r = anchor.region_page_pct;
    return {
      x: r.x * doc.scrollWidth - window.scrollX,
      y: r.y * doc.scrollHeight - window.scrollY,
      w: r.w * doc.scrollWidth,
      h: r.h * doc.scrollHeight,
    };
  }
  return null;
}

export interface ResolvedPosition {
  x: number; // viewport coords
  y: number;
  el: Element | null; // resolved anchor element (null = page_pct fallback)
  approximate: boolean;
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

/**
 * Layered resolution (PRD §5.3): selector → element rect × offset_pct;
 * missing/hidden element → page_pct at 60% opacity ("approximate").
 */
export function resolveAnchor(anchor: Anchor): ResolvedPosition {
  if (anchor.selector && anchor.offset_pct) {
    let el: Element | null = null;
    try {
      el = document.querySelector(anchor.selector);
    } catch {
      /* invalid selector — fall through */
    }
    if (el && isVisible(el)) {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + anchor.offset_pct.x * rect.width,
        y: rect.top + anchor.offset_pct.y * rect.height,
        el,
        approximate: false,
      };
    }
  }

  const doc = document.documentElement;
  return {
    x: anchor.page_pct.x * doc.scrollWidth - window.scrollX,
    y: anchor.page_pct.y * doc.scrollHeight - window.scrollY,
    el: null,
    // only "approximate" if a selector existed but failed to resolve
    approximate: anchor.selector !== null,
  };
}
