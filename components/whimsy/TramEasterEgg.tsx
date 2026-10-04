"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DartTrain } from "@/components/ui/dart-loader";

// DART easter egg: the Konami code or the footer bell sends a pixel DART across the bottom of the screen.
// Mounted once from SiteFooter (in the root layout), so it survives client-side navigation.
// The server renders only the bell and an empty live region; the overlay is a client-only portal.
// Styles: globals.css section 8.

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
const ANNOUNCEMENT = "Ding ding! A DART just passed by.";
const RUN_MS = 2850; // matches the egg-pass + egg-fade-out timings
const STILL_RUN_MS = 1950; // reduced motion: fade in place

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

export default function TramEasterEgg() {
  const [run, setRun] = useState<{ still: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const running = useRef(false);
  const timers = useRef<number[]>([]); // one array for the component's lifetime, emptied in place

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const trigger = useCallback(() => {
    if (running.current) return; // runs never stack
    running.current = true;
    timers.current.splice(0).forEach((id) => window.clearTimeout(id));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const end = still ? STILL_RUN_MS : RUN_MS;
    setRun({ still });
    // Empty first, then the sentence, so a quick second ring is announced again.
    setAnnouncement("");
    later(() => setAnnouncement(ANNOUNCEMENT), 100);
    // A timer, not animationend, ends the run: animationend can fail to fire in background tabs.
    later(() => { setRun(null); running.current = false; }, end);
    later(() => setAnnouncement(""), end + 1000);
  }, []);

  useEffect(() => {
    let keys: string[] = [];
    const onKeyDown = (event: KeyboardEvent) => {
      // Never preventDefault: the egg only listens.
      if (typeof event.key !== "string" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (isEditable(target) || (target instanceof Element && target.closest(".leaflet-container"))) { keys = []; return; }
      keys = [...keys, event.key.toLowerCase()].slice(-KONAMI.length);
      if (keys.length === KONAMI.length && keys.every((key, i) => key === KONAMI[i])) { keys = []; trigger(); }
    };
    window.addEventListener("keydown", onKeyDown);
    const pending = timers.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      pending.splice(0).forEach((id) => window.clearTimeout(id));
      running.current = false;
    };
  }, [trigger]);

  return (
    <>
      <button type="button" className="footer-egg" aria-label="Ring the bell" onClick={trigger} data-ringing={run ? "" : undefined}>
        <span aria-hidden="true">🔔</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
      {run && createPortal(
        <div className={run.still ? "egg-run egg-run--still" : "egg-run"} aria-hidden="true">
          <div className="egg-train">
            <span className="egg-chip">Ding ding!</span>
            <div className="egg-train-body"><DartTrain /></div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
