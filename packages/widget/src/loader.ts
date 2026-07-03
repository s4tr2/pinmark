// Loader stub (w.js). Budget: < 3 KB gzipped.
// Deliberately shows no UI: whether anything renders is the core's decision
// (review_link projects must look widget-free to normal visitors), so the
// loader just records config and lazy-loads the core on idle.

interface PinmarkGlobal {
  key: string;
  base: string;
  mounted?: boolean;
}

declare global {
  interface Window {
    __pinmark?: PinmarkGlobal;
  }
}

(() => {
  if (window.__pinmark) return; // idempotency: second tag is a no-op

  const script = document.currentScript as HTMLScriptElement | null;
  const key = script?.getAttribute("data-pinmark");
  if (!script || !key) {
    console.warn("[pinmark] script tag is missing the data-pinmark key");
    return;
  }

  let base: string;
  try {
    base = new URL(script.src).origin;
  } catch {
    console.warn("[pinmark] could not resolve widget origin");
    return;
  }

  window.__pinmark = { key, base };

  const loadCore = () => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = base + "/widget.core.js";
    s.onerror = () => console.warn("[pinmark] failed to load widget core");
    document.head.appendChild(s);
  };

  const schedule = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadCore, { timeout: 1500 });
    } else {
      setTimeout(loadCore, 300);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
})();

export {};
