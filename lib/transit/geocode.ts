import type { LatLng } from "../types";

// Pre-seeded so the default demo destinations work offline and don't spend Nominatim requests.
const KNOWN: { match: RegExp; point: LatLng }[] = [
  { match: /google|barrow street/i, point: { lat: 53.3398, lng: -6.2361 } },
  { match: /trinity college/i, point: { lat: 53.3438, lng: -6.2546 } },
  { match: /d[uú]n laoghaire/i, point: { lat: 53.2945, lng: -6.1339 } },
];

export const USER_AGENT = "HomeMatch/0.1 (+https://github.com/khtspr/hack-for-humanity)";
const MAX_CACHED = 2000;
// Lookups run one per second, so a long queue makes every visitor wait behind it. Past this many, skip instead.
const MAX_QUEUED = 10;

const cache = new Map<string, LatLng | null>();
let queue: Promise<unknown> = Promise.resolve();
let queued = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Nominatim usage policy: max 1 request/second and an identifying User-Agent. Requests are serialised through `queue`.
 * Resolves to null when Nominatim has no match, or undefined when it couldn't be asked (queue full, HTTP error, timeout).
 */
function nominatim(q: string): Promise<LatLng | null | undefined> {
  if (queued >= MAX_QUEUED) return Promise.resolve(undefined);
  queued++;
  const run = queue.then(async () => {
    const params = new URLSearchParams({ q, format: "jsonv2", limit: "1", countrycodes: "ie", viewbox: "-6.55,53.62,-6.0,53.2", bounded: "1" });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return undefined;
      const [hit] = (await res.json()) as { lat: string; lon: string }[];
      return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    } catch {
      return undefined;
    } finally {
      await sleep(1100);
      queued--;
    }
  });
  queue = run;
  return run;
}

export async function geocode(name: string): Promise<LatLng | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  let point = KNOWN.find((k) => k.match.test(key))?.point ?? (await nominatim(name));
  if (point === null && !/dublin/i.test(name)) point = await nominatim(`${name}, Dublin`);
  if (point === undefined) return null; // not cached, so a later request retries
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
  cache.set(key, point);
  return point;
}
