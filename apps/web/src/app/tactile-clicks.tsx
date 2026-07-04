"use client";

import { useEffect } from "react";

// Synthesized "thock" for landing-page buttons — the mechanical-keyboard
// school, not the electronic-beep school. Two layers: a filtered noise
// transient (the click your ear expects from a physical mechanism) plus a
// low sine thump for body. No audio files, no network; the AudioContext is
// created lazily inside the user gesture so autoplay policies never object.
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function playThock() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;

    // slight per-click variation so rapid clicks don't sound machine-gunned
    const vary = 0.92 + Math.random() * 0.16;

    // layer 1: 12ms noise transient through a lowpass — the "click"
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.012, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 3200 * vary;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(t);

    // layer 2: low sine thump with a fast pitch drop — the "body"
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(170 * vary, t);
    thump.frequency.exponentialRampToValueAtTime(85, t + 0.05);
    thumpGain.gain.setValueAtTime(0.11, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
    thump.connect(thumpGain).connect(ctx.destination);
    thump.start(t);
    thump.stop(t + 0.08);
  } catch {
    /* audio unavailable — silence is a fine fallback */
  }
}

export function TactileClicks() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest("button")) playThock();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return null;
}
