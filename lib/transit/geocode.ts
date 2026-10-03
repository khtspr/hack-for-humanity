import type { LatLng } from "../types";

// Pre-seeded so the default demo destinations work offline and don't spend Nominatim requests.
const KNOWN: { match: RegExp; point: LatLng }[] = [
  { match: /google|barrow street/i, point: { lat: 53.3398, lng: -6.2361 } },
  { match: /trinity college/i, point: { lat: 53.3438, lng: -6.2546 } },
  { match: /d[uú]n laoghaire/i, point: { lat: 53.2945, lng: -6.1339 } },
];

const cache = new Map<string, LatLng | null>();
let queue: Promise<unknown> = Promise.resolve();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nominatim usage policy: max 1 request/second and an identifying User-Agent. Requests are serialised through `queue`. */
function nominatim(q: string): Promise<LatLng | null> {
  const run = queue.then(async () => {
    const params = new URLSearchParams({ q, format: "jsonv2", limit: "1", countrycodes: "ie", viewbox: "-6.55,53.62,-6.0,53.2", bounded: "1" });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": "HomeMatch-hackathon/0.1", "Accept-Language": "en" }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const [hit] = (await res.json()) as { lat: string; lon: string }[];
      return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    } catch {
      return null;
    } finally {
      await sleep(1100);
    }
  });
  queue = run;
  return run;
}

export async function geocode(name: string): Promise<LatLng | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  const known = KNOWN.find((k) => k.match.test(key))?.point;
  const point = known ?? (await nominatim(name)) ?? (/dublin/i.test(name) ? null : await nominatim(`${name}, Dublin`));
  cache.set(key, point);
  return point;
}
