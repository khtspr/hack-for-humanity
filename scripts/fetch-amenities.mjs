// Fetches kindergartens, schools and grocery shops within 1 km of each listing from OpenStreetMap (Overpass API).
// Usage: npm run build:amenities   (Node >= 22.18 — imports lib/data.ts via native type stripping)
// Output: data/generated/amenities.json  { [propertyId]: Amenity[] }
// Precomputed rather than fetched live: public Overpass servers are rate-limited and can be slow mid-demo.
// Progress is saved after every listing, so a re-run resumes where a timeout stopped it (pass --refresh to refetch all).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { properties } from "../lib/data.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data", "generated");
const outFile = join(outDir, "amenities.json");
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const RADIUS_M = 1000;
const MAX_PER_CATEGORY = 15;
const CATEGORIES = ["kindergarten", "school", "grocery"];
const FALLBACK_NAMES = { kindergarten: "Childcare centre", school: "School", grocery: "Shop" };

function haversine(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180, dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function categorize(tags) {
  if (tags.amenity === "kindergarten" || tags.amenity === "childcare") return "kindergarten";
  if (tags.amenity === "school") return "school";
  if (["supermarket", "convenience", "greengrocer"].includes(tags.shop)) return "grocery";
  return null;
}

function query(lat, lng) {
  const around = `(around:${RADIUS_M},${lat},${lng})`;
  return `[out:json][timeout:60];
(
  nwr["amenity"~"^(kindergarten|childcare|school)$"]${around};
  nwr["shop"~"^(supermarket|convenience|greengrocer)$"]${around};
);
out center tags;`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(q) {
  let lastError;
  for (let attempt = 0; attempt < 2 * ENDPOINTS.length; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: q }), headers: { "User-Agent": "HomeMatch-hackathon/0.1 (amenity precompute)" }, signal: AbortSignal.timeout(90_000) });
      if (res.ok) return await res.json();
      lastError = new Error(`${url} → HTTP ${res.status}`);
    } catch (err) { lastError = err; }
    const wait = 5000 * 2 ** Math.floor(attempt / ENDPOINTS.length);
    console.warn(`  ${lastError.message}; retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw lastError;
}

function toAmenities(property, elements) {
  const seen = new Set();
  const amenities = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (!category || lat === undefined) continue;
    const name = tags.name || tags.brand || FALLBACK_NAMES[category];
    const key = `${category}|${name}|${Math.round(lat * 2000)}|${Math.round(lng * 2000)}`; // same place mapped as node + building
    if (seen.has(key)) continue;
    seen.add(key);
    amenities.push({ name, category, lat, lng, distanceM: Math.round(haversine(property.lat, property.lng, lat, lng)) });
  }
  amenities.sort((a, b) => a.distanceM - b.distanceM);
  return CATEGORIES.flatMap((c) => amenities.filter((a) => a.category === c).slice(0, MAX_PER_CATEGORY));
}

const refresh = process.argv.includes("--refresh");
const result = !refresh && existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
mkdirSync(outDir, { recursive: true });
const failed = [];

for (const property of properties) {
  if (result[property.id]) { console.log(`${property.id.padEnd(22)} cached`); continue; }
  let data;
  try { data = await overpass(query(property.lat, property.lng)); }
  catch (err) { failed.push(property.id); console.warn(`${property.id.padEnd(22)} FAILED (${err.message}) — re-run later to fill it in`); continue; }
  result[property.id] = toAmenities(property, data.elements);
  writeFileSync(outFile, JSON.stringify(result));
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, result[property.id].filter((a) => a.category === c).length]));
  console.log(`${property.id.padEnd(22)} ${JSON.stringify(counts)}  nearest grocery ${result[property.id].find((a) => a.category === "grocery")?.distanceM ?? "—"} m`);
  await sleep(2000); // be polite to the shared Overpass server
}
console.log(failed.length ? `wrote data/generated/amenities.json — ${failed.length} listing(s) failed: ${failed.join(", ")}. Run again to retry just those.` : "wrote data/generated/amenities.json");
if (failed.length) process.exitCode = 1;
