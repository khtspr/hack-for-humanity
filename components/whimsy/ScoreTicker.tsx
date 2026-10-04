"use client";
import { useEffect, useRef, useState } from "react";

// Departure-board digit flip, played once the first time a score scrolls into view.
// Server render and first client render both show the final value (no hydration risk);
// screen readers get the .sr-only copy, the animated face is aria-hidden. Styles: globals.css section 8.

const TICK = 50; // ms per flip, shared with the DART easter egg
const STAGGER = 120; // digits settle left to right, the last one at `duration`

export interface ScoreTickerProps {
  /** Integer 0–100, rendered with String(value) (never locale-formatted). */
  value: number;
  /** Static text after the digits, e.g. "%". Never animated; included in the screen-reader text. */
  suffix?: string;
  /** Total run time in ms. */
  duration?: number;
  className?: string;
}

/** Digit shown in cell `i` at flip number `tick`: counts upward through 0–9 and lands exactly on the real digit. */
function cellAt(digit: string, i: number, count: number, tick: number, duration: number) {
  if (!/\d/.test(digit)) return digit;
  const flips = Math.floor((duration - (count - 1 - i) * STAGGER) / TICK);
  if (tick >= flips) return digit;
  return String((Number(digit) - ((flips - tick) % 10) + 10) % 10);
}

export default function ScoreTicker({ value, suffix = "", duration = 600, className }: ScoreTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(value);
  const played = useRef(false);
  // null = idle (final value). The run remembers which value it animates, so a later value change renders instantly.
  const [frame, setFrame] = useState<{ value: number; tick: number } | null>(null);

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || played.current) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      played.current = true;
      const runValue = valueRef.current;
      let start: number | null = null;
      let last = -1;
      // Time-based: the clock starts on the first painted frame, so a background tab starts when it becomes visible.
      const step = (now: number) => {
        if (start === null) start = now;
        const elapsed = now - start;
        if (elapsed >= duration) { raf = 0; setFrame(null); return; }
        const tick = Math.floor(elapsed / TICK);
        if (tick !== last) { last = tick; setFrame({ value: runValue, tick }); }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      // Never leave digits stuck mid-flip if the run is cut short.
      if (raf) { cancelAnimationFrame(raf); setFrame(null); }
    };
  }, [duration]);

  const digits = String(value);
  const tick = frame && frame.value === value ? frame.tick : null;
  return (
    <span ref={ref} className={className ? `ticker ${className}` : "ticker"}>
      <span className="sr-only">{digits}{suffix}</span>
      <span className="ticker-face" aria-hidden="true">
        {digits.split("").map((digit, i) => (
          <span className="ticker-cell" key={i}>{tick === null ? digit : cellAt(digit, i, digits.length, tick, duration)}</span>
        ))}
        {suffix}
      </span>
    </span>
  );
}
