import { Api, type Anchor, type Comment } from "./api";
import {
  buildAnchor,
  buildRegionAnchor,
  resolveAnchor,
  resolveRegion,
  type ResolvedPosition,
} from "./anchor";
import { BUBBLE_ICON, CSS } from "./styles";
import {
  clearReviewToken,
  getMyCommentIds,
  getName,
  getReviewToken,
  getToken,
  rememberMyComment,
  setName,
  setReviewToken,
} from "./store";

interface PinmarkGlobal {
  key: string;
  base: string;
  mounted?: boolean;
  // Observable state for e2e tests: the closed shadow root is intentionally
  // impenetrable, so tests (and debugging) read this instead.
  pins?: number;
}

declare global {
  interface Window {
    __pinmark?: PinmarkGlobal;
  }
}

const cfg = window.__pinmark;
if (cfg && !cfg.mounted) {
  cfg.mounted = true;
  mount(cfg);
}

function currentRoute(): string {
  return location.pathname + location.search;
}

function relTime(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Review-link capture: a share link like https://proto.app/#pinmark=rt_xxx
 * unlocks review mode in this browser. The token is stored per project key
 * and stripped from the URL so the host app's routing never sees it.
 */
function captureReviewToken(key: string): string | null {
  const match = location.hash.match(/pinmark=([\w-]+)/);
  if (match) {
    setReviewToken(key, match[1]);
    const cleaned = location.hash
      .replace(/[#&]pinmark=[\w-]+/, "")
      .replace(/^&/, "#");
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search + (cleaned === "#" ? "" : cleaned)
    );
    return match[1];
  }
  return getReviewToken(key);
}

/**
 * Theme from the host page's own background, not the OS: a dark popover on
 * a light page (or vice versa) is what makes an embed feel bolted-on.
 * Falls back to prefers-color-scheme when the page never paints a bg.
 */
function detectTheme(): "light" | "dark" {
  // Normalize ANY css color (rgb, oklch, lab, named…) by painting it on a
  // 1x1 canvas and reading the pixel — string-parsing computed colors
  // breaks on modern color spaces.
  const ctx = document.createElement("canvas").getContext("2d");
  const luminanceOf = (color: string): { lum: number; alpha: number } | null => {
    if (!ctx) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return {
      lum: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
      alpha: a / 255,
    };
  };

  let node: Element | null = document.body;
  while (node) {
    const res = luminanceOf(getComputedStyle(node).backgroundColor);
    if (res && res.alpha > 0.1) {
      return res.lum < 0.45 ? "dark" : "light";
    }
    node = node.parentElement;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function mount(cfg: PinmarkGlobal) {
  const reviewToken = captureReviewToken(cfg.key);
  const api = new Api(cfg.base, cfg.key, reviewToken);

  // ---- shadow mount ----
  if (!customElements.get("pinmark-root")) {
    customElements.define("pinmark-root", class extends HTMLElement {});
  }
  const host = document.createElement("pinmark-root");
  // Inline defense on the host itself; everything inside is shadow-isolated.
  host.style.cssText =
    "all:initial;position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:block";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = CSS;
  shadow.appendChild(style);

  const root = el("div", `root ${detectTheme()}`);
  root.style.pointerEvents = "none";
  shadow.appendChild(root);
  document.body.appendChild(host);

  // ---- state ----
  let comments: Comment[] = [];
  let route = currentRoute();
  let counts: Record<string, number> = {};
  let pinsVisible = true;
  let showResolved = false;
  let commentMode = false;
  let menuOpen = false;
  let panelOpen = false;
  let panelData: Comment[] | null = null; // all-routes threads, fetched on open
  // popover: composer (new pin) or thread (existing pin)
  let popover:
    | { kind: "composer"; anchor: Anchor; vx: number; vy: number }
    | { kind: "thread"; pinId: string; vx: number; vy: number }
    | null = null;

  const myIds = getMyCommentIds();

  // ---- layers ----
  const pinLayer = el("div");
  const regionLayer = el("div"); // persistent: single reusable region rect
  const uiLayer = el("div");
  root.append(regionLayer, pinLayer, uiLayer);

  const regionEl = el("div", "region");
  regionEl.style.display = "none";
  regionLayer.appendChild(regionEl);
  let hoveredPinId: string | null = null;

  // ---- data ----
  function snapshotOf(list: Comment[], c: Record<string, number>): string {
    return (
      list.map((x) => `${x.id}:${x.resolved ? 1 : 0}:${x.body.length}`).join("|") +
      "#" +
      JSON.stringify(c)
    );
  }
  let lastSnapshot = "";

  async function refresh() {
    try {
      const res = await api.fetchComments(route);
      comments = res.comments;
      counts = res.counts;
      lastSnapshot = snapshotOf(comments, counts);
      renderAll();
      consumeGotoTarget(); // cross-route panel navigation lands here
    } catch (e) {
      const code = (e as Error).message;
      if (code === "review_token_required") {
        // Project is review-link gated and this visitor has no (valid) link:
        // stay completely dormant. Drop any stale token (e.g. regenerated).
        if (reviewToken) clearReviewToken(cfg.key);
        host.remove();
        return;
      }
      // Single namespaced warning; never throw into the host page (PRD §5.1)
      const hints: Record<string, string> = {
        domain_not_allowed: `this page's domain (${location.hostname}) is not in the project's allowed domains — add it in the dashboard`,
        invalid_key: "the data-pinmark key doesn't match any project — check the snippet against the dashboard",
        rate_limited: "rate limit reached — try again shortly",
      };
      console.warn("[pinmark] could not load comments:", hints[code] ?? code);
    }
  }

  function topLevelPins(): Comment[] {
    return comments.filter(
      (c) =>
        !c.parent_id && c.route === route && (!c.resolved || showResolved)
    );
  }

  function repliesFor(pinId: string): Comment[] {
    return comments.filter((c) => c.parent_id === pinId);
  }

  // ---- pin geometry (PRD §5.3 layered resolution) ----
  // querySelector runs only on renders / mutations / route changes; scroll
  // frames reuse the cached element and just read its rect.
  const pinPositions = new Map<string, ResolvedPosition>();
  const resizeObserver = new ResizeObserver(() => scheduleReposition());

  function resolveAllPins() {
    pinPositions.clear();
    resizeObserver.disconnect();
    for (const pin of topLevelPins()) {
      if (!pin.anchor) continue;
      const pos = resolveAnchor(pin.anchor);
      pinPositions.set(pin.id, pos);
      if (pos.el) resizeObserver.observe(pos.el);
    }
  }

  function currentPos(pin: Comment): ResolvedPosition | null {
    const cached = pinPositions.get(pin.id);
    if (!cached || !pin.anchor) return cached ?? null;
    if (cached.el && cached.el.isConnected) {
      const rect = cached.el.getBoundingClientRect();
      const off = pin.anchor.offset_pct ?? { x: 0.5, y: 0.5 };
      cached.x = rect.left + off.x * rect.width;
      cached.y = rect.top + off.y * rect.height;
    } else if (cached.el) {
      // anchor element left the DOM since last resolve — degrade now,
      // MutationObserver will attempt re-resolution
      const doc = document.documentElement;
      cached.el = null;
      cached.approximate = true;
      cached.x = pin.anchor.page_pct.x * doc.scrollWidth - window.scrollX;
      cached.y = pin.anchor.page_pct.y * doc.scrollHeight - window.scrollY;
    } else {
      const doc = document.documentElement;
      cached.x = pin.anchor.page_pct.x * doc.scrollWidth - window.scrollX;
      cached.y = pin.anchor.page_pct.y * doc.scrollHeight - window.scrollY;
    }
    return cached;
  }

  // ---- region display (shown for hovered pin, open thread, or composer) ----
  function updateRegionDisplay() {
    let anchor: Anchor | null = null;
    let resolved: ResolvedPosition | null = null;

    if (popover?.kind === "composer" && popover.anchor.region_page_pct) {
      anchor = popover.anchor;
      resolved = resolveAnchor(anchor);
    } else {
      const pinId =
        popover?.kind === "thread" ? popover.pinId : hoveredPinId;
      if (pinId) {
        const pin = comments.find((c) => c.id === pinId);
        if (pin?.anchor?.region_page_pct) {
          anchor = pin.anchor;
          resolved = pinPositions.get(pinId) ?? resolveAnchor(pin.anchor);
        }
      }
    }

    if (!anchor || !resolved) {
      regionEl.style.display = "none";
      return;
    }
    const r = resolveRegion(anchor, resolved);
    if (!r) {
      regionEl.style.display = "none";
      return;
    }
    regionEl.style.display = "";
    regionEl.classList.toggle("approx", resolved.approximate);
    regionEl.style.left = `${r.x}px`;
    regionEl.style.top = `${r.y}px`;
    regionEl.style.width = `${r.w}px`;
    regionEl.style.height = `${r.h}px`;
  }

  // ---- rendering ----
  function renderAll() {
    resolveAllPins();
    renderPins();
    renderBubble();
    renderPopover();
  }

  function renderPins() {
    pinLayer.replaceChildren();
    if (!pinsVisible) return;
    topLevelPins().forEach((pin, i) => {
      if (!pin.anchor) return;
      const pos = currentPos(pin);
      if (!pos) return;
      const btn = el("button", "pin", String(i + 1));
      btn.dataset.pin = pin.id;
      if (pos.approximate) btn.classList.add("approx");
      if (pin.resolved) btn.classList.add("resolved");
      btn.style.left = `${pos.x}px`;
      btn.style.top = `${pos.y}px`;
      btn.setAttribute(
        "aria-label",
        `Comment thread ${i + 1}${pos.approximate ? " (approximate position)" : ""}`
      );
      if (pos.approximate) btn.title = "Approximate position";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = currentPos(pin);
        popover = { kind: "thread", pinId: pin.id, vx: p?.x ?? 0, vy: p?.y ?? 0 };
        renderPopover();
      });
      btn.addEventListener("mouseenter", () => {
        hoveredPinId = pin.id;
        updateRegionDisplay();
      });
      btn.addEventListener("mouseleave", () => {
        hoveredPinId = null;
        updateRegionDisplay();
      });
      pinLayer.appendChild(btn);
    });
    updateRegionDisplay();
    cfg.pins = pinLayer.children.length;
  }

  function repositionPins() {
    const pins = topLevelPins();
    for (const pin of pins) {
      const node = pinLayer.querySelector<HTMLElement>(
        `[data-pin="${pin.id}"]`
      );
      if (!node) continue;
      const pos = currentPos(pin);
      if (!pos) continue;
      node.style.left = `${pos.x}px`;
      node.style.top = `${pos.y}px`;
      node.classList.toggle("approx", pos.approximate);
    }
    updateRegionDisplay();
  }

  function renderBubble() {
    uiLayer.replaceChildren();

    if (commentMode) {
      const capture = el("div", "capture");
      attachCaptureHandlers(capture);
      const hint = el(
        "div",
        "mode-hint",
        "Click to pin a comment, or drag to comment on an area — Esc to cancel"
      );
      uiLayer.append(capture, hint);
      return;
    }

    const bubble = el("button", "bubble");
    bubble.innerHTML = BUBBLE_ICON; // static markup constant, never user content
    bubble.setAttribute("aria-label", "Comments menu");
    bubble.addEventListener("click", (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      renderBubble();
    });
    const open = counts[route] ?? 0;
    if (open > 0) {
      const badge = el("span", "badge", String(open));
      bubble.appendChild(badge);
    }
    uiLayer.appendChild(bubble);

    if (menuOpen) {
      const menu = el("div", "menu");
      const add = el("button", "", "Add comment (C)");
      add.addEventListener("click", () => {
        menuOpen = false;
        setCommentMode(true);
      });
      const threads = el("button", "", "All threads");
      threads.addEventListener("click", (e) => {
        e.stopPropagation();
        menuOpen = false;
        openPanel();
      });
      const toggle = el(
        "button",
        "",
        pinsVisible ? "Hide pins" : "Show pins"
      );
      toggle.addEventListener("click", () => {
        pinsVisible = !pinsVisible;
        menuOpen = false;
        renderAll();
      });
      const resolvedToggle = el(
        "button",
        "",
        showResolved ? "Hide resolved" : "Show resolved"
      );
      resolvedToggle.addEventListener("click", () => {
        showResolved = !showResolved;
        menuOpen = false;
        renderAll();
      });
      const brand = el("div", "brand");
      const link = el("a", "", "Powered by Pinmark");
      (link as HTMLAnchorElement).href = cfg.base;
      (link as HTMLAnchorElement).target = "_blank";
      brand.appendChild(link);
      menu.append(add, threads, toggle, resolvedToggle, brand);
      uiLayer.appendChild(menu);
    }

    if (panelOpen) renderPanel();
  }

  // ---- all-threads panel (PRD §4.3): grouped by route, click navigates ----
  function openPanel() {
    panelOpen = true;
    panelData = null;
    renderBubble();
    api
      .fetchComments(route, true)
      .then((res) => {
        panelData = res.comments;
        if (panelOpen) renderBubble();
      })
      .catch(() => {
        panelData = [];
        if (panelOpen) renderBubble();
      });
  }

  function renderPanel() {
    const panel = el("div", "panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "All comment threads");
    panel.addEventListener("click", (e) => e.stopPropagation());

    if (panelData === null) {
      panel.appendChild(el("p", "empty", "Loading…"));
    } else {
      const pins = panelData.filter((c) => !c.parent_id);
      if (pins.length === 0) {
        panel.appendChild(el("p", "empty", "No comments yet."));
      } else {
        const byRoute = new Map<string, Comment[]>();
        for (const pin of pins) {
          byRoute.set(pin.route, [...(byRoute.get(pin.route) ?? []), pin]);
        }
        for (const [threadRoute, routePins] of byRoute) {
          panel.appendChild(el("h3", "", threadRoute));
          for (const pin of routePins) {
            const item = el("button", "thread-item");
            const who = el("div", "who");
            who.append(pin.author_name, ` · ${relTime(pin.created_at)}`);
            if (pin.resolved) who.appendChild(el("span", "done", "resolved"));
            const excerpt = el("div", "excerpt", pin.body);
            item.append(who, excerpt);
            item.addEventListener("click", () => goToPin(pin));
            panel.appendChild(item);
          }
        }
      }
    }

    trapFocus(panel);
    uiLayer.appendChild(panel);
  }

  function goToPin(pin: Comment) {
    if (pin.route === route) {
      panelOpen = false;
      renderBubble();
      pulsePin(pin.id);
    } else {
      // cross-route: remember the target, navigate, pulse after reload/render
      try {
        sessionStorage.setItem("pinmark:goto", pin.id);
      } catch {
        /* ignore */
      }
      location.assign(pin.route);
    }
  }

  function pulsePin(id: string) {
    const pin = comments.find((c) => c.id === id);
    if (pin?.resolved && !showResolved) {
      showResolved = true; // target is resolved and hidden — reveal it
      renderAll();
    }
    const pos = pinPositions.get(id) ?? (pin?.anchor ? resolveAnchor(pin.anchor) : null);
    if (pos) {
      window.scrollTo({
        top: Math.max(0, pos.y + window.scrollY - innerHeight / 2),
        behavior: "smooth",
      });
    }
    // let the scroll settle before pulsing so the ring is seen
    setTimeout(() => {
      repositionPins();
      const node = pinLayer.querySelector(`[data-pin="${id}"]`);
      node?.classList.add("pulse");
      setTimeout(() => node?.classList.remove("pulse"), 2200);
    }, 350);
  }

  function consumeGotoTarget() {
    try {
      const id = sessionStorage.getItem("pinmark:goto");
      if (id && comments.some((c) => c.id === id)) {
        sessionStorage.removeItem("pinmark:goto");
        pulsePin(id);
      }
    } catch {
      /* ignore */
    }
  }

  // ---- focus trap (PRD §10 accessibility): Tab cycles inside the surface
  function trapFocus(container: HTMLElement) {
    container.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusables = container.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = shadow.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function popoverPosition(vx: number, vy: number): { x: number; y: number } {
    const W = 320;
    let x = vx + 18;
    let y = vy - 10;
    if (x + W > innerWidth - 8) x = vx - W - 18; // flip left
    x = Math.max(8, x);
    y = Math.min(Math.max(8, y), innerHeight - 200);
    return { x, y };
  }

  function renderPopover() {
    shadow.querySelectorAll(".popover").forEach((n) => n.remove());
    updateRegionDisplay();
    if (!popover) return;

    const card = el("div", "popover");
    const { x, y } = popoverPosition(popover.vx, popover.vy);
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.addEventListener("click", (e) => e.stopPropagation());

    if (popover.kind === "composer") buildComposer(card, popover.anchor);
    else buildThread(card, popover.pinId);

    trapFocus(card);
    uiLayer.appendChild(card);
    const first = card.querySelector<HTMLElement>("input, textarea");
    first?.focus();
  }

  function buildComposer(card: HTMLElement, anchor: Anchor) {
    card.appendChild(el("h3", "", "New comment"));

    const errorLine = el("p", "error");
    errorLine.style.display = "none";
    card.appendChild(errorLine);

    let nameInput: HTMLInputElement | null = null;
    if (!getName()) {
      nameInput = el("input") as HTMLInputElement;
      nameInput.placeholder = "Your name";
      nameInput.maxLength = 100;
      nameInput.setAttribute("aria-label", "Your name");
      card.appendChild(nameInput);
    }

    const textarea = el("textarea") as HTMLTextAreaElement;
    textarea.placeholder = "Leave a comment…";
    textarea.maxLength = 4000;
    textarea.setAttribute("aria-label", "Comment text");
    card.appendChild(textarea);

    const actions = el("div", "actions");
    const cancel = el("button", "", "Cancel");
    cancel.addEventListener("click", closePopover);
    const post = el("button", "primary", "Post");
    actions.append(cancel, post);
    card.appendChild(actions);

    post.addEventListener("click", async () => {
      const name = (nameInput?.value ?? getName() ?? "").trim();
      const body = textarea.value.trim();
      if (!name || !body) {
        errorLine.textContent = !name
          ? "Please enter your name."
          : "Comment can't be empty.";
        errorLine.style.display = "";
        return;
      }
      post.disabled = true;
      try {
        const created = await api.postComment({
          route,
          anchor,
          parent_id: null,
          author_name: name,
          author_token: getToken(),
          body,
        });
        if (nameInput) setName(name);
        rememberMyComment(created.id);
        myIds.add(created.id);
        comments.push(created);
        counts[route] = (counts[route] ?? 0) + 1;
        lastSnapshot = snapshotOf(comments, counts);
        popover = null;
        setCommentMode(false); // auto-exit after posting (PRD §4.2)
      } catch (e) {
        post.disabled = false;
        errorLine.textContent = friendlyError((e as Error).message);
        errorLine.style.display = "";
      }
    });
  }

  function buildThread(card: HTMLElement, pinId: string) {
    const pin = comments.find((c) => c.id === pinId);
    if (!pin) {
      closePopover();
      return;
    }
    const thread = [pin, ...repliesFor(pinId)];

    const EDIT_WINDOW_MS = 5 * 60 * 1000;
    for (const c of thread) {
      const item = el("div", "comment");
      const meta = el("div", "meta");
      const author = el("b", "", c.author_name);
      meta.append(author, ` · ${relTime(c.created_at)}`);
      const body = el("div", "body", c.body); // textContent — never innerHTML
      item.append(meta, body);

      // Guest self-edit/delete: own comments, first 5 minutes (PRD §6.1)
      const mine =
        myIds.has(c.id) &&
        Date.now() - new Date(c.created_at).getTime() < EDIT_WINDOW_MS;
      if (mine) {
        const edit = el("a", "own-action", "Edit");
        const del = el("a", "own-action", "Delete");
        edit.addEventListener("click", () => {
          const ta = el("textarea") as HTMLTextAreaElement;
          ta.value = c.body;
          ta.maxLength = 4000;
          const save = el("button", "primary", "Save");
          save.style.marginTop = "4px";
          body.replaceWith(ta);
          edit.replaceWith(save);
          del.remove();
          ta.focus();
          save.addEventListener("click", async () => {
            const next = ta.value.trim();
            if (!next) return;
            save.disabled = true;
            try {
              await api.editComment(c.id, getToken(), next);
              c.body = next;
              lastSnapshot = snapshotOf(comments, counts);
              renderPopover();
            } catch {
              save.disabled = false;
            }
          });
        });
        del.addEventListener("click", async () => {
          try {
            await api.deleteComment(c.id, getToken());
            comments = comments.filter(
              (x) => x.id !== c.id && x.parent_id !== c.id
            );
            lastSnapshot = snapshotOf(comments, counts);
            if (c.id === pinId) {
              if (!c.parent_id) counts[route] = Math.max(0, (counts[route] ?? 1) - 1);
              popover = null;
              renderAll();
            } else {
              renderPopover();
            }
          } catch {
            /* window expired or network — leave as is */
          }
        });
        const actionsRow = el("div", "meta");
        actionsRow.append(edit, " · ", del);
        item.appendChild(actionsRow);
      }
      card.appendChild(item);
    }

    const errorLine = el("p", "error");
    errorLine.style.display = "none";
    card.appendChild(errorLine);

    let nameInput: HTMLInputElement | null = null;
    if (!getName()) {
      nameInput = el("input") as HTMLInputElement;
      nameInput.placeholder = "Your name";
      nameInput.maxLength = 100;
      card.appendChild(nameInput);
    }
    const reply = el("textarea") as HTMLTextAreaElement;
    reply.placeholder = "Reply…";
    reply.maxLength = 4000;
    reply.setAttribute("aria-label", "Reply text");
    card.appendChild(reply);

    const actions = el("div", "actions");
    const send = el("button", "primary", "Reply");
    actions.appendChild(send);
    card.appendChild(actions);

    send.addEventListener("click", async () => {
      const name = (nameInput?.value ?? getName() ?? "").trim();
      const body = reply.value.trim();
      if (!name || !body) {
        errorLine.textContent = !name
          ? "Please enter your name."
          : "Reply can't be empty.";
        errorLine.style.display = "";
        return;
      }
      send.disabled = true;
      try {
        const created = await api.postComment({
          route,
          anchor: null,
          parent_id: pinId,
          author_name: name,
          author_token: getToken(),
          body,
        });
        if (nameInput) setName(name);
        rememberMyComment(created.id);
        comments.push(created);
        lastSnapshot = snapshotOf(comments, counts);
        renderPopover(); // re-render thread with new reply
      } catch (e) {
        send.disabled = false;
        errorLine.textContent = friendlyError((e as Error).message);
        errorLine.style.display = "";
      }
    });
  }

  function friendlyError(code: string): string {
    if (code === "domain_not_allowed")
      return "This domain isn't on the project's allowlist.";
    if (code === "invalid_key") return "Invalid project key.";
    if (code.startsWith("fetch_failed") || code.startsWith("post_failed"))
      return "Network error — try again.";
    return "Couldn't post — try again.";
  }

  function closePopover() {
    popover = null;
    renderPopover();
  }

  // ---- comment mode ----
  function setCommentMode(on: boolean) {
    commentMode = on;
    if (!on && popover?.kind === "composer") popover = null;
    renderAll();
  }

  // Hide the capture overlay from hit-testing so we can find the host-page
  // element under a point for selector generation.
  function targetAt(capture: HTMLElement, x: number, y: number): Element | null {
    capture.style.pointerEvents = "none";
    const target = document.elementFromPoint(x, y);
    capture.style.pointerEvents = "";
    return target === host ? null : target;
  }

  const DRAG_THRESHOLD = 6; // px before a press becomes a marquee

  function attachCaptureHandlers(capture: HTMLElement) {
    let start: { x: number; y: number } | null = null;
    let dragging = false;

    const marqueeRect = (e: MouseEvent) => ({
      left: Math.min(start!.x, e.clientX),
      top: Math.min(start!.y, e.clientY),
      width: Math.abs(e.clientX - start!.x),
      height: Math.abs(e.clientY - start!.y),
    });

    capture.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      start = { x: e.clientX, y: e.clientY };
      dragging = false;
    });

    capture.addEventListener("mousemove", (e) => {
      if (!start) return;
      if (
        !dragging &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_THRESHOLD
      ) {
        dragging = true;
      }
      if (dragging) {
        const r = marqueeRect(e);
        regionEl.style.display = "";
        regionEl.classList.remove("approx");
        regionEl.style.left = `${r.left}px`;
        regionEl.style.top = `${r.top}px`;
        regionEl.style.width = `${r.width}px`;
        regionEl.style.height = `${r.height}px`;
      }
    });

    capture.addEventListener("mouseup", (e) => {
      if (!start) return;
      e.preventDefault();
      e.stopPropagation();

      if (dragging) {
        const r = marqueeRect(e);
        // pick the anchor element at the region's center
        const target = targetAt(
          capture,
          r.left + r.width / 2,
          r.top + r.height / 2
        );
        const anchor = buildRegionAnchor(route, r, target);
        commentMode = false;
        // composer sits at the region's bottom-right corner, Figma-style
        popover = {
          kind: "composer",
          anchor,
          vx: r.left + r.width,
          vy: r.top + r.height,
        };
      } else {
        const target = targetAt(capture, e.clientX, e.clientY);
        const anchor = buildAnchor(route, e.clientX, e.clientY, target);
        commentMode = false;
        popover = { kind: "composer", anchor, vx: e.clientX, vy: e.clientY };
      }
      start = null;
      dragging = false;
      renderAll();
    });
  }

  // ---- keyboard ----
  function isTyping(): boolean {
    const active = document.activeElement;
    if (!active) return false;
    if (active === host) {
      const inner = shadow.activeElement;
      return (
        !!inner &&
        (inner.tagName === "INPUT" || inner.tagName === "TEXTAREA")
      );
    }
    return (
      active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      (active as HTMLElement).isContentEditable
    );
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (popover) closePopover();
      else if (commentMode) setCommentMode(false);
      else if (panelOpen) {
        panelOpen = false;
        renderBubble();
      } else if (menuOpen) {
        menuOpen = false;
        renderBubble();
      }
      return;
    }
    if (
      (e.key === "c" || e.key === "C") &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !isTyping()
    ) {
      setCommentMode(!commentMode);
    }
  });

  // Click outside closes menu/popovers (host page clicks pass through our
  // pointer-events:none layers, so listen on document)
  document.addEventListener("click", () => {
    if (menuOpen || popover || panelOpen) {
      menuOpen = false;
      panelOpen = false;
      popover = null;
      renderAll();
    }
  });

  // ---- scroll/resize repositioning (single rAF, PRD §5.3) ----
  let rafPending = false;
  function scheduleReposition() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      repositionPins();
      if (popover) renderPopover();
    });
  }
  window.addEventListener("scroll", scheduleReposition, {
    passive: true,
    capture: true,
  });
  window.addEventListener("resize", scheduleReposition, { passive: true });

  // ---- SPA route tracking (PRD §5.4) ----
  // Patch pushState/replaceState once, then re-resolve after a settle delay
  // so the new route's DOM has a chance to render.
  const NAV_EVENT = "pinmark:nav";
  for (const fn of ["pushState", "replaceState"] as const) {
    const orig = history[fn].bind(history);
    history[fn] = (...args: Parameters<History["pushState"]>) => {
      const ret = orig(...args);
      window.dispatchEvent(new Event(NAV_EVENT));
      return ret;
    };
  }

  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  function onNavigation() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const next = currentRoute();
      if (next !== route) {
        route = next;
        popover = null;
        menuOpen = false;
        if (commentMode) commentMode = false;
        refresh(); // hides other routes' pins, fetches + resolves this route's
      } else {
        renderAll(); // same route (e.g. hash-only) — still re-resolve anchors
      }
    }, 300);
  }
  window.addEventListener("popstate", onNavigation);
  window.addEventListener("hashchange", onNavigation);
  window.addEventListener(NAV_EVENT, onNavigation);

  // ---- live updates (PRD §5.5, meets the "visible within 5s" criterion) ----
  // Visibility-gated polling through the guarded API instead of a direct
  // Supabase websocket: the security model has no anon policies, so guests
  // must not talk to the database directly. Transport can be swapped for
  // broadcast channels later without touching this model.
  const POLL_MS = 4000;

  function applyRemoteUpdate(next: { comments: Comment[]; counts: Record<string, number> }) {
    comments = next.comments;
    counts = next.counts;
    resolveAllPins();
    renderPins();

    // Never clobber in-progress input: skip UI-layer rebuilds while the
    // composer is open, comment mode is armed, or the user is typing.
    const typingInWidget =
      shadow.activeElement?.tagName === "INPUT" ||
      shadow.activeElement?.tagName === "TEXTAREA";
    if (commentMode || popover?.kind === "composer" || typingInWidget) return;

    renderBubble();
    if (popover?.kind === "thread") renderPopover(); // live replies/resolves
  }

  async function pollTick() {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await api.fetchComments(route);
      const next = snapshotOf(res.comments, res.counts);
      if (next !== lastSnapshot) {
        lastSnapshot = next;
        applyRemoteUpdate(res);
      }
    } catch {
      /* transient failures are fine; next tick retries */
    }
  }
  // ±20% jitter so a crowd landing on the same page doesn't poll in lockstep
  function scheduleNextPoll() {
    setTimeout(
      async () => {
        await pollTick();
        scheduleNextPoll();
      },
      POLL_MS * (0.8 + Math.random() * 0.4)
    );
  }
  scheduleNextPoll();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pollTick(); // catch up fast
  });

  // ---- DOM mutation re-resolution (PRD §5.3, debounced 250 ms) ----
  // Re-resolves when pins are degraded (anchor element missing) or when the
  // page re-renders under them; cheap because resolution caches elements.
  let mutationTimer: ReturnType<typeof setTimeout> | undefined;
  const mutationObserver = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      resolveAllPins();
      repositionPins();
    }, 250);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  refresh();
}

export {};
