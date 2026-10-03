"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MatchResult } from "../lib/matching";
import { loadPreferences } from "../lib/defaults";

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

  if (result === undefined) return <p className="muted">Working out your journeys…</p>;
  if (!result) return <p className="muted">We couldn’t calculate journeys for this home.</p>;
  return (
    <>
      <p className="score">{result.score}% Life Match</p>
      <ul className="commute-list">
        {result.destinationMatches.map((d) => (
          <li key={d.id}><span aria-hidden="true">{modeIcons[d.commute.mode]}</span><strong>{d.commute.minutes} min</strong> to {d.name}<span className="commute-route">{d.commute.summary}{d.commute.source !== "osm" ? " · estimate" : ""}</span></li>
        ))}
      </ul>
      {result.tradeoffs.map((t) => <p className="reason tradeoff" key={t}>{t}</p>)}
      <p className="muted"><Link className="back" href="/preferences">Change your destinations →</Link></p>
    </>
  );
}
