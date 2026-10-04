"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MatchResult } from "../lib/matching";
import { loadPreferences } from "../lib/defaults";
import ScoreTicker from "./whimsy/ScoreTicker";

const modeIcons = { car: "🚗", train: "🚆", bus: "🚌", bike: "🚲", walk: "🚶" } as const;

/** Commutes from this home to the user's saved destinations (preferences live in localStorage, so this runs client-side). */
export default function YourCommutes({ propertyId }: { propertyId: string }) {
  const [result, setResult] = useState<MatchResult | null | undefined>(undefined);

  useEffect(() => {
    const preferences = loadPreferences();
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences, propertyId }) })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((results: MatchResult[]) => setResult(results[0] ?? null))
      .catch(() => setResult(null));
  }, [propertyId]);

  if (result === undefined) return <p className="muted" role="status">Checking the timetable…</p>;
  if (!result) return <p className="muted" role="status">Signal failure — we couldn’t work out journeys for this home. Refresh the page to try again.</p>;
  return (
    <>
      <p className="score-tile is-start"><span className="score-tile-value" data-value={result.score}><ScoreTicker value={result.score} /><span className="score-tile-unit">%</span></span><span className="score-tile-label">Life match</span></p>
      <ul className="commute-list">
        {result.destinationMatches.map((d) => (
          <li key={d.id}><span aria-hidden="true">{modeIcons[d.commute.mode]}</span><span><strong>{d.commute.minutes} min</strong> to {d.name}<span className="commute-route">{d.commute.summary}{d.commute.source !== "osm" ? " · estimate" : ""}</span></span></li>
        ))}
      </ul>
      {result.tradeoffs.map((t) => <p className="reason tradeoff" key={t}>{t}</p>)}
      <p className="muted"><Link className="back" href="/preferences">Change your destinations →</Link></p>
    </>
  );
}
