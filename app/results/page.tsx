"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HomeMap, { type MapMarker } from "../../components/Map";
import { mapColors } from "../../components/mapColors";
import { loadPreferences } from "../../lib/defaults";
import type { MatchResult } from "../../lib/matching";
import type { Destination, Preferences } from "../../lib/types";

const labels = { low:"Low", medium:"Medium", high:"High" };
const modeIcons = { car:"🚗", train:"🚆", bus:"🚌", bike:"🚲", walk:"🚶" } as const;
const annualSavings = (monthlySavings: number) => monthlySavings * 12;

function destinationLabel(destination: Destination) { return `${destination.name} (${labels[destination.importance]} priority)`; }

function Comparison({ first, second, onClose }: { first: MatchResult; second: MatchResult; onClose: () => void }) {
  const commuteFor = (result: MatchResult, id: string) => result.destinationMatches.find((destination) => destination.id === id)?.commute.minutes ?? 60;
  return <section className="comparison-panel" aria-labelledby="comparison-title"><div className="mini-top"><div><div className="eyebrow">Side-by-side</div><h2 id="comparison-title">Compare these homes</h2></div><button className="text-button" type="button" onClick={onClose}>Close comparison</button></div><div className="comparison-grid"><div className="comparison-labels"><strong>Life Match</strong><strong>Price</strong>{first.destinationMatches.map((destination) => <strong key={destination.id}>{destination.name}</strong>)}<strong>Public transport</strong></div><div><h3>{first.property.title}</h3><p className="score">{first.score}%</p><p>€{first.property.price.toLocaleString()}/month</p>{first.destinationMatches.map((destination) => <p key={destination.id}>{destination.commute.minutes} min</p>)}<p>{first.property.transportQuality}</p></div><div><h3>{second.property.title}</h3><p className="score">{second.score}%</p><p>€{second.property.price.toLocaleString()}/month</p>{first.destinationMatches.map((destination) => <p key={destination.id}>{commuteFor(second, destination.id)} min</p>)}<p>{second.property.transportQuality}</p></div></div><p className="comparison-note">Neither home is objectively better. One may save money while the other gives you more time back each week.</p></section>;
}

export default function ResultsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    // Matching runs on the server: it geocodes destinations and routes them over the NTA timetable.
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: prefs }) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(setResults)
      .catch((err) => setError(String(err)));
  }, []);

  const markers = useMemo<MapMarker[]>(() => {
    if (!results) return [];
    const homes: MapMarker[] = results.map((result) => ({ id: result.property.id, lat: result.property.lat, lng: result.property.lng, kind: "property", color: result.category === "worth-considering" ? mapColors.propertyAlt : mapColors.property, label: `${result.score}`, title: `${result.score}% · ${result.property.title}`, detail: `€${result.property.price.toLocaleString()} · ${result.property.area}`, highlighted: result.property.id === highlightId }));
    const destinations: MapMarker[] = (results[0]?.destinationMatches ?? []).filter((d) => d.location).map((d) => ({ id: `dest-${d.id}`, lat: d.location!.lat, lng: d.location!.lng, kind: "destination", color: mapColors.destination, label: "★", title: d.name, detail: `${d.visitsPerWeek}×/week · ${labels[d.importance]} priority` }));
    return [...homes, ...destinations];
  }, [results, highlightId]);

  if (!preferences || (!results && !error)) return <main className="shell"><p>Finding homes that fit your life — checking routes on the Dublin transport network…</p></main>;
  if (error || !results) return <main className="shell"><p>Sorry, we couldn’t calculate your matches ({error}).</p><Link className="back" href="/preferences">Back to preferences</Link></main>;

  const compare = results.filter((result) => comparisonIds.includes(result.property.id));
  const toggleComparison = (id: string) => setComparisonIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  const focusCard = (id: string) => { setHighlightId(id); document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  return <main className="shell"><nav className="nav" aria-label="Main navigation"><Link className="brand" href="/">Home<span>Match</span></Link><Link className="back" href="/preferences">Edit life preferences</Link></nav><div className="results-header"><div className="eyebrow">Search by your life, not by location</div><h1 style={{fontSize: "clamp(36px, 5vw, 56px)"}}>Homes that work for your everyday</h1><p className="lede">We considered {preferences.destinations.length} important destinations, your €{preferences.budget.toLocaleString()} budget, and journeys of roughly {preferences.maxCommute} minutes.</p></div>{compare.length === 2 && <Comparison first={compare[0]} second={compare[1]} onClose={() => setComparisonIds([])} />}<div className="results-layout"><section className="cards" aria-label="Life match recommendations"><div className="results-intro"><strong>{results.length} homes compared by Life Match</strong><span className="muted">Select two to compare</span></div>{results.map((result) => <article id={`card-${result.property.id}`} className={`property-card ${result.category === "worth-considering" ? "alternative-card" : ""} ${highlightId === result.property.id ? "is-highlighted" : ""}`} key={result.property.id} onMouseEnter={() => setHighlightId(result.property.id)} onMouseLeave={() => setHighlightId((current) => current === result.property.id ? null : current)}><div className="mini-top"><span className="eyebrow">{result.category === "best-overall" ? "Best overall fit" : result.category === "best-value" ? "Best value" : result.category === "best-commute" ? "Best commute" : "Worth considering"}</span><span className="score score-large">{result.score}%<small> LIFE MATCH</small></span></div><h2>{result.property.image} {result.property.title}</h2><div className="muted">{result.property.area} · {result.property.bedrooms} bedroom{result.property.bedrooms === 1 ? "" : "s"} · {result.property.bathrooms} bath · {result.property.type}{result.property.furnished ? " · Furnished" : ""}</div><div className="price-line">€{result.property.price.toLocaleString()}<small>{preferences.listingType === "rent" ? "/month" : " purchase price"}</small></div><ul className="commute-list" aria-label="Commute to your destinations">{result.destinationMatches.map((destination) => <li key={destination.id}><span aria-hidden="true">{modeIcons[destination.commute.mode]}</span><strong>{destination.commute.minutes} min</strong> to {destination.name}<span className="commute-route">{destination.commute.summary}</span></li>)}</ul><div className="tags"><span className="tag">{result.property.transportQuality} public transport</span><span className="tag">{result.property.nearbyTransport}</span><span className="tag">{result.property.parking ? "Parking" : "No car needed"}</span>{result.amenityHighlights.map((highlight) => <span className="tag tag-amenity" key={highlight}>{highlight}</span>)}</div><h3>How it fits your life</h3><div aria-label="Recommendation strengths and compromises">{result.strengths.map((reason) => <p className="reason" key={reason}>{reason}</p>)}{result.tradeoffs.map((reason) => <p className="reason tradeoff" key={reason}>{reason}</p>)}</div><div className="explanation"><strong>Why we picked this</strong><p>{result.explanation}</p></div>{result.category === "worth-considering" && result.tradeoffs.length > 0 && <div className="tradeoff-callout"><strong>Worth considering</strong><p>{result.property.price < preferences.budget ? `This home is €${preferences.budget - result.property.price} cheaper each month — €${annualSavings(preferences.budget - result.property.price).toLocaleString()} saved over a year — in exchange for a longer journey on some routes.` : "This home misses one preference, but performs well across the rest of your life match."}</p></div>}<div className="card-actions"><Link className="button secondary" href={`/properties/${result.property.id}`}>See property details <span aria-hidden="true">→</span></Link>{result.property.daftUrl && <a className="back" href={result.property.daftUrl} target="_blank" rel="noopener noreferrer">View on Daft.ie ↗</a>}<label className="compare-choice"><input type="checkbox" checked={comparisonIds.includes(result.property.id)} onChange={() => toggleComparison(result.property.id)} /> Compare</label></div></article>)}</section><aside className="side-card side-card-map"><HomeMap markers={markers} height={320} onMarkerClick={(id) => !id.startsWith("dest-") && focusCard(id)} /><p className="map-legend"><span style={{ color: mapColors.property }}>●</span> Home (Life Match %) <span style={{ color: mapColors.destination }}>★</span> Your destinations</p><strong>Your life priorities</strong><ul className="priority-list">{preferences.destinations.map((destination) => <li key={destination.id}><strong>{destination.name}</strong><span>{destination.visitsPerWeek} day{destination.visitsPerWeek === 1 ? "" : "s"}/week · {destinationLabel(destination)}</span></li>)}</ul><p className="muted">A lower score does not mean a bad home. It shows the compromise clearly so you can decide what works for you.</p><Link href="/preferences" className="back">Change priorities <span aria-hidden="true">→</span></Link></aside></div></main>;
}
