"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import HomeMap, { type MapMarker } from "../../components/Map";
import MapLegend, { type LegendItem } from "../../components/MapLegend";
import { mapColors } from "../../components/mapColors";
import SiteHeader from "@/components/SiteHeader";
import { DartLoader } from "@/components/ui/dart-loader";
import ScoreTicker from "@/components/whimsy/ScoreTicker";
import { loadPreferences } from "../../lib/defaults";
import type { MatchResult } from "../../lib/matching";
import type { Destination, Preferences } from "../../lib/types";

const labels = { low:"Low", medium:"Medium", high:"High" };
const modeIcons = { car:"🚗", train:"🚆", bus:"🚌", bike:"🚲", walk:"🚶" } as const;
const annualSavings = (monthlySavings: number) => monthlySavings * 12;
const SLOW_SEARCH_MS = 8000;
const compareHints = ["Select two to compare", "Pick one more to compare"];
const header = <SiteHeader actions={<Link className="back" href="/preferences">Edit life preferences</Link>} />;

function destinationLabel(destination: Destination) { return `${destination.name} (${labels[destination.importance]} priority)`; }

function Comparison({ first, second, onClose }: { first: MatchResult; second: MatchResult; onClose: () => void }) {
  const commuteFor = (result: MatchResult, id: string) => result.destinationMatches.find((destination) => destination.id === id)?.commute.minutes ?? 60;
  // Rows: title, Life Match, price, one per destination, public transport. The CSS grid lines every row up across the three columns.
  const rows = 4 + first.destinationMatches.length;
  return <section className="comparison-panel" aria-labelledby="comparison-title"><div className="mini-top"><div><div className="eyebrow">Side-by-side</div><h2 id="comparison-title">Compare these homes</h2></div><button className="text-button" type="button" onClick={onClose}>Close comparison</button></div><div className="comparison-grid" role="region" aria-label="Comparison table" tabIndex={0} style={{ "--rows": rows } as CSSProperties}><div className="comparison-labels"><span className="comparison-corner" aria-hidden="true" /><strong>Life Match</strong><strong>Price</strong>{first.destinationMatches.map((destination) => <strong key={destination.id}>{destination.name}</strong>)}<strong>Public transport</strong></div><div><h3>{first.property.title}</h3><p className="score">{first.score}%</p><p className="mono">€{first.property.price.toLocaleString()}/month</p>{first.destinationMatches.map((destination) => <p className="mono" key={destination.id}>{destination.commute.minutes} min</p>)}<p>{first.property.transportQuality}</p></div><div><h3>{second.property.title}</h3><p className="score">{second.score}%</p><p className="mono">€{second.property.price.toLocaleString()}/month</p>{first.destinationMatches.map((destination) => <p className="mono" key={destination.id}>{commuteFor(second, destination.id)} min</p>)}<p>{second.property.transportQuality}</p></div></div><p className="comparison-note">Neither home is objectively better. One may save money while the other gives you more time back each week.</p></section>;
}

export default function ResultsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to re-run the match without a full reload
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    // Matching runs on the server: it geocodes destinations and routes them over the NTA timetable.
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: prefs }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setResults)
      .catch((err) => setError(String(err)));
  }, [attempt]);

  // Long searches: after 8 s the loader explains the wait once (its role="status" announces it).
  const loading = !results && !error;
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_SEARCH_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);
  const retry = () => { setError(null); setResults(null); setSlow(false); setAttempt((n) => n + 1); };

  const markers = useMemo<MapMarker[]>(() => {
    if (!results) return [];
    const homes: MapMarker[] = results.map((result) => ({ id: result.property.id, lat: result.property.lat, lng: result.property.lng, kind: "property", color: result.category === "worth-considering" ? mapColors.propertyAlt : mapColors.property, variant: result.category === "worth-considering" ? "alt" : undefined, label: `${result.score}`, title: `${result.score}% · ${result.property.title}`, detail: `€${result.property.price.toLocaleString()} · ${result.property.area}`, highlighted: result.property.id === highlightId }));
    const destinations: MapMarker[] = (results[0]?.destinationMatches ?? []).filter((d) => d.location).map((d) => ({ id: `dest-${d.id}`, lat: d.location!.lat, lng: d.location!.lng, kind: "destination", color: mapColors.destination, label: "★", title: d.name, detail: `${d.visitsPerWeek}×/week · ${labels[d.importance]} priority` }));
    return [...homes, ...destinations];
  }, [results, highlightId]);

  if (!preferences || (!results && !error)) return <div className="shell">{header}<main id="main-content" tabIndex={-1}><DartLoader detail={slow ? "Still on the line — searches with lots of places take a little longer" : undefined} /></main></div>;
  if (error || !results) return <div className="shell">{header}<main id="main-content" tabIndex={-1}><section className="state-panel is-error" role="alert" aria-labelledby="state-title"><div className="state-art" aria-hidden="true" /><p className="eyebrow is-danger">Service update</p><h1 id="state-title">Signal failure on the line</h1><p className="state-text">We couldn’t work out your matches just now. Your preferences are saved, so trying again usually gets things moving.</p><div className="state-actions"><button className="button" type="button" onClick={retry}>Try again</button><Link className="button secondary" href="/preferences">Edit preferences</Link></div>{error && <p className="state-detail">Details: {error}</p>}</section></main></div>;
  if (results.length === 0) return <div className="shell">{header}<main id="main-content" tabIndex={-1}><section className="state-panel is-empty" role="status" aria-labelledby="state-title"><div className="state-art" aria-hidden="true" /><p className="eyebrow">0 homes</p><h1 id="state-title">No homes on this line yet</h1><p className="state-text">Nothing matched all of your preferences this time. Try a higher budget, a longer journey time or another way to travel — small changes can open up whole new areas.</p><div className="state-actions"><Link className="button" href="/preferences">Edit life preferences</Link></div></section></main></div>;

  const compare = results.filter((result) => comparisonIds.includes(result.property.id));
  const toggleComparison = (id: string) => setComparisonIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  const focusCard = (id: string) => { setHighlightId(id); const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); };
  const legend: LegendItem[] = [{ shape: "pin", color: mapColors.property, label: "Home (Life Match %)" }, ...(results.some((result) => result.category === "worth-considering") ? [{ shape: "pin-alt", color: mapColors.propertyAlt, label: "Worth considering" } as LegendItem] : []), { shape: "star", color: mapColors.destination, label: "Your destinations" }];
  const destinationCount = preferences.destinations.length;

  return <div className="shell">{header}<main id="main-content" tabIndex={-1}><div className="results-header"><div className="eyebrow">Search by your life, not by location</div><h1>Homes that work for your everyday</h1><p className="lede">We considered {destinationCount} important destinations, your €{preferences.budget.toLocaleString()} budget, and journeys of roughly {preferences.maxCommute} minutes.</p><ul className="board" aria-label="Your search"><li className="board-label">Now showing</li><li className="board-chip is-green">{results.length} home{results.length === 1 ? "" : "s"}</li><li className="board-chip">€{preferences.budget.toLocaleString()} max</li><li className="board-chip">≤ {preferences.maxCommute} min</li><li className="board-chip">{destinationCount} stop{destinationCount === 1 ? "" : "s"}</li><li className="board-chip">{preferences.listingType === "rent" ? "Rent" : "Buy"}</li></ul></div>{compare.length === 2 && <Comparison first={compare[0]} second={compare[1]} onClose={() => setComparisonIds([])} />}<div className="results-layout"><section className="cards" aria-label="Life match recommendations"><div className="results-intro"><strong>{results.length} homes compared by Life Match</strong><span className="muted" aria-live="polite">{compare.length === 2 ? <>Comparison ready. <a href="#comparison-title">Jump to it <span aria-hidden="true">↑</span></a></> : compareHints[compare.length]}</span></div>{results.map((result) => <article id={`card-${result.property.id}`} className={`property-card ${result.category === "worth-considering" ? "alternative-card" : ""} ${highlightId === result.property.id ? "is-highlighted" : ""}`} key={result.property.id} onMouseEnter={() => setHighlightId(result.property.id)} onMouseLeave={() => setHighlightId((current) => current === result.property.id ? null : current)}><div className="mini-top"><span className={`eyebrow ${result.category === "worth-considering" ? "is-warning" : "is-green"}`}>{result.category === "best-overall" ? "Best overall fit" : result.category === "best-value" ? "Best value" : result.category === "best-commute" ? "Best commute" : "Worth considering"}</span><p className="score-tile"><span className="score-tile-value" data-value={result.score}><ScoreTicker value={result.score} /><span className="score-tile-unit">%</span></span><span className="score-tile-label">Life match</span></p></div><h2>{result.property.image} {result.property.title}</h2><div className="muted">{result.property.area} · {result.property.bedrooms} bedroom{result.property.bedrooms === 1 ? "" : "s"} · {result.property.bathrooms} bath · {result.property.type}{result.property.furnished ? " · Furnished" : ""}</div><div className="price-line">€{result.property.price.toLocaleString()}<small>{preferences.listingType === "rent" ? "/month" : " purchase price"}</small></div><ul className="commute-list" aria-label="Commute to your destinations">{result.destinationMatches.map((destination) => <li key={destination.id}><span aria-hidden="true">{modeIcons[destination.commute.mode]}</span><span><strong>{destination.commute.minutes} min</strong> to {destination.name}<span className="commute-route">{destination.commute.summary}</span></span></li>)}</ul><div className="tags"><span className="tag">{result.property.transportQuality} public transport</span><span className="tag">{result.property.nearbyTransport}</span><span className="tag">{result.property.parking ? "Parking" : "No car needed"}</span>{result.amenityHighlights.map((highlight) => <span className="tag tag-amenity" key={highlight}>{highlight}</span>)}</div><h3>How it fits your life</h3><div aria-label="Recommendation strengths and compromises">{result.strengths.map((reason) => <p className="reason" key={reason}>{reason}</p>)}{result.tradeoffs.map((reason) => <p className="reason tradeoff" key={reason}>{reason}</p>)}</div><div className="explanation"><strong>Why we picked this</strong><p>{result.explanation}</p></div>{result.category === "worth-considering" && result.tradeoffs.length > 0 && <div className="tradeoff-callout"><strong>Worth considering</strong><p>{result.property.price < preferences.budget ? `This home is €${preferences.budget - result.property.price} cheaper each month — €${annualSavings(preferences.budget - result.property.price).toLocaleString()} saved over a year — in exchange for a longer journey on some routes.` : "This home misses one preference, but performs well across the rest of your life match."}</p></div>}<div className="card-actions"><Link className="button secondary" href={`/properties/${result.property.id}`}>See property details <span aria-hidden="true">→</span></Link>{result.property.daftUrl && <a className="back" href={result.property.daftUrl} target="_blank" rel="noopener noreferrer">View on Daft.ie ↗</a>}<label className="compare-choice"><input type="checkbox" checked={comparisonIds.includes(result.property.id)} onChange={() => toggleComparison(result.property.id)} /> Compare</label></div></article>)}</section><aside className="side-card side-card-map"><HomeMap markers={markers} height={320} onMarkerClick={(id) => !id.startsWith("dest-") && focusCard(id)} /><MapLegend items={legend} /><strong>Your life priorities</strong><ul className="priority-list">{preferences.destinations.map((destination) => <li key={destination.id}><strong>{destination.name}</strong><span>{destination.visitsPerWeek} day{destination.visitsPerWeek === 1 ? "" : "s"}/week · {destinationLabel(destination)}</span></li>)}</ul><p className="muted">A lower score does not mean a bad home. It shows the compromise clearly so you can decide what works for you.</p><Link href="/preferences" className="back">Change priorities <span aria-hidden="true">→</span></Link></aside></div></main></div>;
}
