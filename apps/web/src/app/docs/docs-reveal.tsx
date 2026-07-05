"use client";

import { useEffect } from "react";

export function DocsReveal() {
  useEffect(() => {
    const root = document.getElementById("install-guide");
    const sections = Array.from(
      root?.querySelectorAll<HTMLElement>("[data-doc-reveal]") ?? [],
    );

    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    root.classList.add("docs-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    const frame = requestAnimationFrame(() => {
      sections.forEach((section) => observer.observe(section));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.classList.remove("docs-reveal-ready");
    };
  }, []);

  return null;
}
