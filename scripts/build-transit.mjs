// Preprocesses the NTA static GTFS feed into compact JSON for the app.
// Usage: npm run build:transit   (Node >= 22.18 — imports lib/data.ts via native type stripping)
//
// Input:  data/gtfs/GTFS_Realtime.zip — NTA static timetable file (downloaded once; no API key or API calls).
// Output: data/generated/transit.json — stops + route patterns: which stops each line serves, in order.
//         Journey *times* come from OpenStreetMap routing at runtime; this file only says what connects.
import { createReadStream, existsSync, mkdirSync, writeFileSync, createWriteStream } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { properties } from "../lib/data.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gtfsDir = join(root, "data", "gtfs");
const extractDir = join(gtfsDir, "extracted");
const outDir = join(root, "data", "generated");
const zipPath = join(gtfsDir, "GTFS_Realtime.zip");
const FEED_URL = "https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip";

// Greater Dublin bounding box — everything outside is dropped to keep output small.
const BBOX = { minLat: 53.2, maxLat: 53.62, minLng: -6.55, maxLng: -6.0 };
const GTFS_FILES = ["agency.txt", "routes.txt", "stops.txt", "trips.txt", "calendar.txt", "calendar_dates.txt", "stop_times.txt"]; // shapes.txt (~300 MB) isn't needed

const inBox = (lat, lng) => lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng;
function haversine(aLat, aLng, bLat, bLng) {
  const r = Math.PI / 180, dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const toSec = (t) => { const [h, m, s] = t.split(":").map(Number); return h * 3600 + m * 60 + s; };
const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

async function ensureExtracted() {
  mkdirSync(gtfsDir, { recursive: true });
  if (!existsSync(zipPath)) {
    console.log(`Downloading ${FEED_URL} …`);
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`GTFS download failed: ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
  }
  if (existsSync(join(extractDir, "stop_times.txt"))) return;
  mkdirSync(extractDir, { recursive: true });
  console.log("Extracting GTFS zip …");
  // Native tools stream to disk; adm-zip buffers whole entries (stop_times is ~450 MB) so it's the last resort.
  // GNU tar (e.g. Git Bash's) can't read zips, hence unzip first and Windows' bundled bsdtar by absolute path.
  const attempts = [
    ["unzip", ["-o", "-q", zipPath, ...GTFS_FILES, "-d", extractDir]],
    [join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"), ["-xf", zipPath, "-C", extractDir, ...GTFS_FILES]],
    ["tar", ["-xf", zipPath, "-C", extractDir, ...GTFS_FILES]],
  ];
  for (const [cmd, args] of attempts) {
    try { execFileSync(cmd, args, { stdio: "ignore" }); if (existsSync(join(extractDir, "stop_times.txt"))) return; } catch {}
  }
  const { default: AdmZip } = await import("adm-zip");
  const zip = new AdmZip(zipPath);
  for (const file of GTFS_FILES) if (zip.getEntry(file)) zip.extractEntryTo(file, extractDir, false, true);
}

async function eachRow(file, onRow) {
  const path = join(extractDir, file);
  if (!existsSync(path)) return 0;
  let count = 0;
  const parser = createReadStream(path).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, relax_column_count: true, trim: true }));
  for await (const row of parser) { onRow(row); count++; }
  return count;
}

async function main() {
  await ensureExtracted();

  const agencies = new Map();
  await eachRow("agency.txt", (r) => agencies.set(r.agency_id, r.agency_name));

  const routes = new Map();
  await eachRow("routes.txt", (r) => routes.set(r.route_id, { name: r.route_short_name || r.route_long_name, longName: r.route_long_name, type: Number(r.route_type), agency: agencies.get(r.agency_id) ?? r.agency_id }));
  const typeCounts = {};
  for (const route of routes.values()) typeCounts[route.type] = (typeCounts[route.type] ?? 0) + 1;
  console.log(`routes: ${routes.size}  by route_type:`, typeCounts);

  const stops = new Map();
  await eachRow("stops.txt", (r) => { const lat = Number(r.stop_lat), lng = Number(r.stop_lon); if (inBox(lat, lng)) stops.set(r.stop_id, { name: r.stop_name, lat, lng }); });
  console.log(`Dublin-area stops: ${stops.size}`);

  const trips = new Map();
  await eachRow("trips.txt", (r) => trips.set(r.trip_id, { routeId: r.route_id, serviceId: r.service_id, dir: r.direction_id || "0", headsign: r.trip_headsign }));

  // Calendar → which service_ids run on which date.
  const calendar = new Map();
  await eachRow("calendar.txt", (r) => calendar.set(r.service_id, { days: [r.sunday, r.monday, r.tuesday, r.wednesday, r.thursday, r.friday, r.saturday].map((v) => v === "1"), start: r.start_date, end: r.end_date }));
  const exceptions = new Map(); // date -> Map(serviceId -> 1 added | 2 removed)
  let feedStart = "99999999", feedEnd = "00000000";
  for (const c of calendar.values()) { if (c.start < feedStart) feedStart = c.start; if (c.end > feedEnd) feedEnd = c.end; }
  await eachRow("calendar_dates.txt", (r) => { if (!exceptions.has(r.date)) exceptions.set(r.date, new Map()); exceptions.get(r.date).set(r.service_id, Number(r.exception_type)); });
  const activeOn = (serviceId, date) => {
    const ex = exceptions.get(ymd(date))?.get(serviceId);
    if (ex === 1) return true;
    if (ex === 2) return false;
    const c = calendar.get(serviceId);
    const key = ymd(date);
    return !!c && key >= c.start && key <= c.end && c.days[date.getUTCDay()];
  };

  // A representative weekday (Tue–Thu) inside the feed window, used for peak headways and pattern timings.
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  let refDay = new Date(today);
  while (![2, 3, 4].includes(refDay.getUTCDay())) refDay = new Date(refDay.getTime() + 86400000);
  console.log(`Reference weekday for headways: ${ymd(refDay)}  (feed ${feedStart}–${feedEnd})`);
  const refActive = new Map();
  const isRefActive = (sid) => { if (!refActive.has(sid)) refActive.set(sid, activeOn(sid, refDay)); return refActive.get(sid); };

  // Stream stop_times, closing out each trip when trip_id changes (GTFS feeds are grouped by trip).
  const patterns = new Map(); // key -> { routeId, dir, headsign, stops, cum, peakTrips, hasRef }
  let current = null, rows = [], tripCount = 0, unsortedWarnings = 0;
  const seenTrips = new Set();

  const flush = () => {
    if (!current) return;
    const trip = trips.get(current);
    current = null;
    if (!trip) return;
    rows.sort((a, b) => a.seq - b.seq);
    const dublin = rows.filter((r) => stops.has(r.stopId));
    if (dublin.length >= 2) {
      const key = `${trip.routeId}|${trip.dir}|${dublin.map((r) => r.stopId).join(",")}`;
      let pattern = patterns.get(key);
      const ref = isRefActive(trip.serviceId);
      if (!pattern) { pattern = { routeId: trip.routeId, dir: trip.dir, headsign: trip.headsign, stops: dublin.map((r) => r.stopId), cum: null, peakTrips: 0, hasRef: false }; patterns.set(key, pattern); }
      if (!pattern.cum || (ref && !pattern.hasRef)) { pattern.cum = dublin.map((r) => Math.round((r.dep - dublin[0].dep) / 6) / 10); pattern.hasRef = ref; }
      if (ref && dublin[0].dep >= 7 * 3600 && dublin[0].dep < 10 * 3600) pattern.peakTrips++;
    }
    tripCount++;
  };

  console.log("Streaming stop_times.txt (this takes a minute) …");
  await eachRow("stop_times.txt", (r) => {
    if (r.trip_id !== current) {
      flush();
      if (seenTrips.has(r.trip_id) && unsortedWarnings++ < 3) console.warn(`stop_times not grouped by trip (${r.trip_id} reappeared) — patterns may be split`);
      seenTrips.add(r.trip_id);
      current = r.trip_id;
      rows = [];
    }
    const time = r.departure_time || r.arrival_time;
    if (time) rows.push({ stopId: r.stop_id, seq: Number(r.stop_sequence), dep: toSec(time) });
  });
  flush();
  console.log(`trips processed: ${tripCount}  patterns: ${patterns.size}`);

  // Compact output: routes and stops are referenced by index.
  const usedRoutes = [...new Set([...patterns.values()].map((p) => p.routeId))];
  const routeIdx = new Map(usedRoutes.map((id, i) => [id, i]));
  const stopRoutes = new Map();
  for (const p of patterns.values()) for (const s of p.stops) { if (!stopRoutes.has(s)) stopRoutes.set(s, new Set()); stopRoutes.get(s).add(routeIdx.get(p.routeId)); }
  const usedStops = [...stopRoutes.keys()];
  const stopIdx = new Map(usedStops.map((id, i) => [id, i]));

  const transit = {
    generatedAt: new Date().toISOString(),
    feed: { start: feedStart, end: feedEnd, referenceWeekday: ymd(refDay) },
    routes: usedRoutes.map((id) => { const r = routes.get(id); return { id, name: r.name, longName: r.longName, type: r.type, agency: r.agency }; }),
    stops: usedStops.map((id) => { const s = stops.get(id); return { id, name: s.name, lat: s.lat, lng: s.lng, r: [...stopRoutes.get(id)] }; }),
    patterns: [...patterns.values()].map((p) => ({ r: routeIdx.get(p.routeId), h: p.headsign, s: p.stops.map((s) => stopIdx.get(s)), t: p.cum, hw: p.peakTrips ? Math.max(3, Math.round(180 / p.peakTrips)) : null })),
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "transit.json"), JSON.stringify(transit));
  const outTypes = {};
  for (const r of transit.routes) outTypes[r.type] = (outTypes[r.type] ?? 0) + 1;
  console.log(`wrote transit.json (${transit.stops.length} stops, ${transit.patterns.length} patterns, routes by type ${JSON.stringify(outTypes)})`);
  for (const p of properties) {
    const near = transit.stops.map((s) => ({ s, d: haversine(p.lat, p.lng, s.lat, s.lng) })).filter((x) => x.d <= 500).sort((a, b) => a.d - b.d);
    const names = [...new Set(near.flatMap((x) => x.s.r.map((i) => transit.routes[i].name)))];
    console.log(`  ${p.id.padEnd(22)} ${String(near.length).padStart(3)} stops ≤500 m  routes: ${names.slice(0, 14).join(", ")}${names.length > 14 ? " …" : ""}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
