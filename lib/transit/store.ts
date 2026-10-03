// Server-only loaders for the JSON produced by scripts/build-transit.mjs and scripts/fetch-amenities.mjs.
// Read lazily from disk (not `import`ed) so the multi-MB files never end up in a client bundle.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Amenity, LatLng } from "../types";
import { distanceM } from "./geo";

export type TransitRoute = { id: string; name: string; longName: string; type: number; agency: string };
export type TransitStop = { id: string; name: string; lat: number; lng: number; r: number[] };
export type TransitPattern = { r: number; h: string; s: number[]; t: number[]; hw: number | null };
export type TransitData = {
  feed: { start: string; end: string; referenceWeekday: string };
  routes: TransitRoute[];
  stops: TransitStop[];
  patterns: TransitPattern[];
  /** For each stop index: the [patternIndex, positionInPattern] pairs that serve it. */
  stopPatterns: [number, number][][];
};

const generatedDir = join(process.cwd(), "data", "generated");
const cache = new Map<string, unknown>();

function loadJson<T>(file: string): T | null {
  if (cache.has(file)) return cache.get(file) as T | null;
  const path = join(generatedDir, file);
  const data = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null;
  if (!data) console.warn(`[transit] ${file} missing — run \`npm run prepare-data\`. Falling back to mock data.`);
  cache.set(file, data);
  return data;
}

export function getTransit(): TransitData | null {
  const cached = cache.get("transit:indexed") as TransitData | undefined;
  if (cached) return cached;
  const raw = loadJson<Omit<TransitData, "stopPatterns">>("transit.json");
  if (!raw) return null;
  const stopPatterns: [number, number][][] = raw.stops.map(() => []);
  raw.patterns.forEach((pattern, p) => pattern.s.forEach((stop, i) => stopPatterns[stop].push([p, i])));
  const indexed = { ...raw, stopPatterns };
  cache.set("transit:indexed", indexed);
  return indexed;
}

export const getAmenityData = () => loadJson<Record<string, Amenity[]>>("amenities.json");

/** Linear scan is fine: ~5k Dublin stops is well under a millisecond. */
export function nearbyStops(point: LatLng, radiusM: number) {
  const transit = getTransit();
  if (!transit) return [];
  const result: { index: number; stop: TransitStop; distanceM: number }[] = [];
  transit.stops.forEach((stop, index) => {
    const d = distanceM(point, stop);
    if (d <= radiusM) result.push({ index, stop, distanceM: Math.round(d) });
  });
  return result.sort((a, b) => a.distanceM - b.distanceM);
}

/** Luas lines read better as "Luas Red"; Irish Rail's short names are generic ("rail", "Commuter") so use the line name. */
export function routeLabel(route: { name: string; longName?: string; type: number }) {
  if (route.type === 0) return `Luas ${route.name}`;
  if ((route.name === "rail" || route.name === "Commuter") && route.longName) return route.longName;
  return route.name;
}

export const modeForRouteType = (type: number) => (type === 3 ? "bus" : "train") as "bus" | "train";
