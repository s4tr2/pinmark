"use client";

import { useEffect } from "react";

// Synthesized tactile click for landing-page buttons: a ~35ms filtered tick
// via Web Audio, no audio files, no network. Created lazily inside a user
// gesture so autoplay policies never complain.
let ctx: AudioContext | null = null;

function playTick() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.02);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {
    /* audio unavailable — silence is a fine fallback */
  }
}

export function TactileClicks() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("button")) playTick();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return null;
}
