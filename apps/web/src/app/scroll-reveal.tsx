"use client";

import { useEffect } from "react";

export function ScrollReveal({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    const sections = Array.from(
      root?.querySelectorAll<HTMLElement>("[data-scroll-reveal]") ?? [],
    );

    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    root.classList.add("scroll-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.1,
      },
    );

    const frame = requestAnimationFrame(() => {
      sections.forEach((section) => observer.observe(section));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.classList.remove("scroll-reveal-ready");
    };
  }, [rootId]);

  return null;
}
