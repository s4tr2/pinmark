import { beforeEach, describe, expect, it } from "vitest";
import {
  buildAnchor,
  buildRegionAnchor,
  generateSelector,
  resolveAnchor,
  resolveRegion,
} from "./anchor";

// jsdom has no layout engine: every rect is 0x0 unless we say otherwise.
// Tests assign explicit geometry so the engine's math is exercised for real.
function setRect(
  el: Element,
  rect: { left: number; top: number; width: number; height: number }
) {
  (el as HTMLElement).getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function setViewport(w: number, h: number) {
  Object.defineProperty(window, "innerWidth", { value: w, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: h, configurable: true });
}

function setPageSize(w: number, h: number) {
  Object.defineProperty(document.documentElement, "scrollWidth", {
    value: w,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: h,
    configurable: true,
  });
}

beforeEach(() => {
  document.body.innerHTML = "";
  setViewport(1280, 800);
  setPageSize(1280, 2000);
});

describe("generateSelector — stability ladder (PRD §5.3)", () => {
  it("prefers the element's own stable id", () => {
    document.body.innerHTML = `<button id="pay-button">Pay</button>`;
    const el = document.getElementById("pay-button")!;
    setRect(el, { left: 100, top: 100, width: 120, height: 40 });
    const res = generateSelector(el);
    expect(res.selector).toBe("#pay-button");
    expect(res.confidence).toBe("high");
    expect(res.el).toBe(el);
  });

  it.each([
    ["radix id", "radix-42"],
    ["headlessui id", "headlessui-menu-1"],
    ["react useId style", ":r1:"],
    ["3+ digit id", "item-12345"],
  ])("rejects auto-generated-looking ids (%s)", (_label, id) => {
    document.body.innerHTML = `<div><button id="${id}">X</button></div>`;
    const el = document.getElementById(id)!;
    setRect(el, { left: 10, top: 10, width: 50, height: 20 });
    const res = generateSelector(el);
    expect(res.selector ?? "").not.toContain(id);
  });

  it("uses data-testid when there is no stable id", () => {
    document.body.innerHTML = `<div data-testid="card-alpha">Alpha</div>`;
    const el = document.querySelector("[data-testid]")!;
    setRect(el, { left: 0, top: 0, width: 200, height: 100 });
    const res = generateSelector(el);
    expect(res.selector).toBe('[data-testid="card-alpha"]');
    expect(res.confidence).toBe("high");
  });

  it("never anchors directly to framework mount nodes (#root)", () => {
    document.body.innerHTML = `<div id="root"><main><button>Go</button></main></div>`;
    const root = document.getElementById("root")!;
    setRect(root, { left: 0, top: 0, width: 1280, height: 800 }); // full viewport
    const res = generateSelector(root);
    expect(res.selector).not.toBe("#root");
  });

  it("uses #root as a semantic path ROOT for a precise child", () => {
    document.body.innerHTML = `<div id="root"><main><section></section><section><button>Buy</button></section></main></div>`;
    const root = document.getElementById("root")!;
    setRect(root, { left: 0, top: 0, width: 1280, height: 800 });
    const btn = document.querySelector("button")!;
    setRect(btn, { left: 50, top: 60, width: 80, height: 30 });
    const res = generateSelector(btn);
    expect(res.selector).toContain("#root >");
    expect(res.selector).toContain("button:nth-of-type(1)");
    expect(res.confidence).toBe("medium");
    expect(document.querySelector(res.selector!)).toBe(btn);
  });

  it("builds body-rooted nth-of-type paths in hook-less DOMs", () => {
    document.body.innerHTML = `<main><div></div><div><p>a</p><p>b</p></div></main>`;
    const target = document.querySelectorAll("p")[1];
    setRect(target, { left: 0, top: 0, width: 100, height: 20 });
    const res = generateSelector(target);
    expect(res.selector).toBeTruthy();
    expect(document.querySelector(res.selector!)).toBe(target);
  });

  it("returns null selector beyond max path depth with no stable hooks", () => {
    // 12 nested anonymous divs > MAX_PATH_DEPTH (10)
    let html = "<span>deep</span>";
    for (let i = 0; i < 12; i++) html = `<div>${html}</div>`;
    document.body.innerHTML = html;
    const target = document.querySelector("span")!;
    setRect(target, { left: 5, top: 5, width: 40, height: 12 });
    const res = generateSelector(target);
    expect(res.selector).toBeNull();
    expect(res.confidence).toBe("none");
  });

  it("never uses class names, even when present", () => {
    document.body.innerHTML = `<div class="tw-abc123 hashed-xyz"><button class="btn-primary">Go</button></div>`;
    const btn = document.querySelector("button")!;
    setRect(btn, { left: 0, top: 0, width: 50, height: 20 });
    const res = generateSelector(btn);
    expect(res.selector ?? "").not.toContain("btn-primary");
    expect(res.selector ?? "").not.toContain("tw-abc123");
  });
});

describe("buildAnchor — layered anchor construction", () => {
  it("stores element offset + page fallback for anchored clicks", () => {
    document.body.innerHTML = `<button id="cta">Go</button>`;
    const el = document.getElementById("cta")!;
    setRect(el, { left: 100, top: 200, width: 200, height: 50 });
    const a = buildAnchor("/pricing", 150, 225, el); // click at 25%, 50% of el
    expect(a.selector).toBe("#cta");
    expect(a.offset_pct).toEqual({ x: 0.25, y: 0.5 });
    expect(a.page_pct.x).toBeCloseTo(150 / 1280);
    expect(a.page_pct.y).toBeCloseTo(225 / 2000);
    expect(a.route).toBe("/pricing");
  });

  it("falls back to page_pct only when there is no target", () => {
    const a = buildAnchor("/", 640, 1000, null);
    expect(a.selector).toBeNull();
    expect(a.selector_confidence).toBe("none");
    expect(a.offset_pct).toBeNull();
    expect(a.page_pct).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe("resolveAnchor — layered resolution", () => {
  it("positions by element rect when the selector resolves", () => {
    document.body.innerHTML = `<button id="cta">Go</button>`;
    const el = document.getElementById("cta")!;
    setRect(el, { left: 300, top: 400, width: 100, height: 40 });
    const pos = resolveAnchor({
      route: "/",
      selector: "#cta",
      selector_confidence: "high",
      offset_pct: { x: 0.5, y: 0.5 },
      page_pct: { x: 0.1, y: 0.1 },
      viewport: { w: 1280, h: 800 },
    });
    expect(pos.el).toBe(el);
    expect(pos.approximate).toBe(false);
    expect(pos.x).toBe(350);
    expect(pos.y).toBe(420);
  });

  it("degrades to approximate page_pct when the element is gone", () => {
    const pos = resolveAnchor({
      route: "/",
      selector: "#deleted-element",
      selector_confidence: "high",
      offset_pct: { x: 0.5, y: 0.5 },
      page_pct: { x: 0.25, y: 0.5 },
      viewport: { w: 1280, h: 800 },
    });
    expect(pos.el).toBeNull();
    expect(pos.approximate).toBe(true); // visible but honest — never wrong element
    expect(pos.x).toBeCloseTo(0.25 * 1280);
    expect(pos.y).toBeCloseTo(0.5 * 2000);
  });

  it("is NOT approximate when there never was a selector", () => {
    const pos = resolveAnchor({
      route: "/",
      selector: null,
      selector_confidence: "none",
      offset_pct: null,
      page_pct: { x: 0.5, y: 0.5 },
      viewport: { w: 1280, h: 800 },
    });
    expect(pos.approximate).toBe(false);
  });

  it("survives an invalid selector without throwing", () => {
    const pos = resolveAnchor({
      route: "/",
      selector: ":::garbage[",
      selector_confidence: "high",
      offset_pct: { x: 0, y: 0 },
      page_pct: { x: 0.1, y: 0.1 },
      viewport: { w: 1280, h: 800 },
    });
    expect(pos.el).toBeNull();
  });
});

describe("region anchors (area comments)", () => {
  it("stores element-relative and page-relative extents", () => {
    document.body.innerHTML = `<section id="hero"></section>`;
    const el = document.getElementById("hero")!;
    setRect(el, { left: 100, top: 100, width: 400, height: 200 });
    const a = buildRegionAnchor(
      "/",
      { left: 200, top: 150, width: 100, height: 50 },
      el
    );
    expect(a.selector).toBe("#hero");
    expect(a.region_offset_pct).toEqual({ x: 0.25, y: 0.25, w: 0.25, h: 0.25 });
    expect(a.region_page_pct!.w).toBeCloseTo(100 / 1280);
  });

  it("resolves the region back through the element when present", () => {
    document.body.innerHTML = `<section id="hero"></section>`;
    const el = document.getElementById("hero")!;
    setRect(el, { left: 100, top: 100, width: 400, height: 200 });
    const a = buildRegionAnchor(
      "/",
      { left: 200, top: 150, width: 100, height: 50 },
      el
    );
    const pos = resolveAnchor(a);
    const region = resolveRegion(a, pos)!;
    expect(region).toEqual({ x: 200, y: 150, w: 100, h: 50 });
  });

  it("falls back to page-relative region when the element is gone", () => {
    const a = buildRegionAnchor(
      "/",
      { left: 128, top: 200, width: 128, height: 100 },
      null
    );
    const pos = resolveAnchor(a);
    const region = resolveRegion(a, pos)!;
    expect(region.x).toBeCloseTo(128);
    expect(region.w).toBeCloseTo(128);
  });
});
