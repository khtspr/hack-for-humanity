// Street-network travel times from OpenStreetMap, via the OSRM servers run by FOSSGIS (routing.openstreetmap.de).
// Uses the `table` service so a whole results page costs one request per profile instead of one per journey.
import type { LatLng } from "../types";

export type Profile = "foot" | "bike" | "car";

const BASE: Record<Profile, string> = {
  foot: "https://routing.openstreetmap.de/routed-foot",
  bike: "https://routing.openstreetmap.de/routed-bike",
  car: "https://routing.openstreetmap.de/routed-car",
};
const MAX_COORDS_PER_REQUEST = 90; // stay under the public server's table size limit
const TIMEOUT_MS = 20_000;
const GAP_MS = 400; // pause between requests on the same profile
const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Kept on globalThis so dev hot-reloads don't throw away routes we've already paid for.
const state = ((globalThis as any).__homematchOsrm ??= { cache: new Map<string, number | null>(), queues: {} }) as { cache: Map<string, number | null>; queues: Partial<Record<Profile, Promise<unknown>>> };

const coord = (p: LatLng) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`;
const pairKey = (profile: Profile, a: LatLng, b: LatLng) => `${profile}|${coord(a)}|${coord(b)}`;

/** One request at a time per profile (the FOSSGIS servers are a shared community resource); profiles run in parallel. */
function enqueue<T>(profile: Profile, task: () => Promise<T>): Promise<T> {
  const prev = state.queues[profile] ?? Promise.resolve();
  const run = prev.then(task, task);
  state.queues[profile] = run.catch(() => undefined);
  return run;
}

async function table(profile: Profile, sources: LatLng[], destinations: LatLng[]): Promise<(number | null)[][] | null> {
  const points = [...sources, ...destinations];
  const url = `${BASE[profile]}/table/v1/driving/${points.map(coord).join(";")}?sources=${sources.map((_, i) => i).join(";")}&destinations=${destinations.map((_, i) => i + sources.length).join(";")}&annotations=duration`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "HomeMatch-hackathon/0.1" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status === 429 && attempt < MAX_RETRIES) {
        // Rate limited: honour Retry-After when given, otherwise back off exponentially.
        await sleep((Number(res.headers.get("retry-after")) || 2 ** attempt) * 1000);
        continue;
      }
      if (!res.ok) { console.warn(`[osrm] ${profile} HTTP ${res.status}`); return null; }
      const body = (await res.json()) as { code: string; durations?: (number | null)[][] };
      return body.code === "Ok" && body.durations ? body.durations : null;
    } catch (err) {
      console.warn(`[osrm] ${profile} failed: ${(err as Error).message}`);
      return null;
    } finally {
      await sleep(GAP_MS); // spacing between requests on this profile's queue
    }
  }
}

/**
 * Travel time in seconds for each [from, to] pair, or null where OSM routing was unavailable.
 * Pairs are grouped by origin so each request is a compact sources × destinations matrix.
 */
export async function durations(profile: Profile, pairs: [LatLng, LatLng][]): Promise<(number | null)[]> {
  const missing = pairs.filter(([a, b]) => !state.cache.has(pairKey(profile, a, b)));
  if (missing.length) {
    const sources = new Map<string, LatLng>(), dests = new Map<string, LatLng>();
    for (const [a, b] of missing) { sources.set(coord(a), a); dests.set(coord(b), b); }
    const destList = [...dests.values()];
    const sourceList = [...sources.values()];
    // Chunk destinations and sources so each request stays under the coordinate limit.
    const destChunk = Math.min(destList.length, Math.floor(MAX_COORDS_PER_REQUEST * 0.7));
    const sourceChunk = Math.max(1, MAX_COORDS_PER_REQUEST - destChunk);
    for (let d = 0; d < destList.length; d += destChunk) {
      const ds = destList.slice(d, d + destChunk);
      for (let s = 0; s < sourceList.length; s += sourceChunk) {
        const ss = sourceList.slice(s, s + sourceChunk);
        const matrix = await enqueue(profile, () => table(profile, ss, ds));
        if (!matrix) continue; // leave uncached so a later request retries
        ss.forEach((a, i) => ds.forEach((b, j) => state.cache.set(pairKey(profile, a, b), matrix[i]?.[j] ?? null)));
      }
    }
  }
  return pairs.map(([a, b]) => state.cache.get(pairKey(profile, a, b)) ?? null);
}
