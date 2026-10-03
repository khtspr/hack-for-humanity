import type { Commute, LatLng, TransportMode, TransportQuality } from "../types";
import { bikeMinutes, carMinutes, distanceM, walkMinutes } from "./geo";
import { durations, type Profile } from "./osrm";
import { getTransit, modeForRouteType, nearbyStops, routeLabel } from "./store";

// Journey times come from OpenStreetMap routing (OSRM). The offline stop file only answers "which line connects
// a stop near home to a stop near the destination"; no timetable times or NTA API calls are used.

const ACCESS_RADIUS_M = 800; // max walk to/from a stop
const DEFAULT_HEADWAY_MIN = 30; // lines with no morning-peak service (night/weekend-only routes)
const MAX_WAIT_MIN = 15;
const CAR_TRAFFIC_FACTOR = 1.4; // OSRM car times assume empty roads
const PARKING_MIN = 5;
// In-vehicle time = OSM free-flow driving time between the stops × factor (stops, boarding, bus lanes vs traffic).
const RIDE_FACTOR = { bus: 1.6, tram: 1.3 };
const RAIL_SPEED_M_PER_MIN = 500; // DART/commuter rail doesn't follow roads: 30 km/h straight-line average incl. stops and curves
const TRANSFER_OVERHEAD_MIN = 20; // one-change estimate: first wait, transfer wait, final walk

/** One part of a journey whose time comes from OSM routing; `fallback` is used if OSRM is unreachable. */
type Leg = { profile: Profile; from: LatLng; to: LatLng; factor: number; fallback: number };
type Plan = { mode: TransportMode; fixedMin: number; legs: Leg[]; describe: (legMin: number[]) => string; estimate?: boolean };

const foot = (from: LatLng, to: LatLng): Leg => ({ profile: "foot", from, to, factor: 1, fallback: walkMinutes(distanceM(from, to)) });
const round = (n: number) => Math.max(1, Math.round(n));

/** Candidate journeys for one home → destination trip, across the modes the user selected. */
export function planCommute(home: LatLng, dest: LatLng, modes: TransportMode[]): Plan[] {
  const straight = distanceM(home, dest);
  const plans: Plan[] = [];

  if (modes.includes("walk")) plans.push({ mode: "walk", fixedMin: 0, legs: [foot(home, dest)], describe: () => "Walk the whole way" });
  if (modes.includes("bike")) plans.push({ mode: "bike", fixedMin: 0, legs: [{ profile: "bike", from: home, to: dest, factor: 1, fallback: bikeMinutes(straight) }], describe: () => "Cycle (OpenStreetMap bike route)" });
  if (modes.includes("car")) plans.push({ mode: "car", fixedMin: PARKING_MIN, legs: [{ profile: "car", from: home, to: dest, factor: CAR_TRAFFIC_FACTOR, fallback: carMinutes(straight) - PARKING_MIN }], describe: (m) => `Drive ~${round(m[0])} min in traffic + parking` });

  const allowedTypes = new Set<number>();
  if (modes.includes("bus")) allowedTypes.add(3);
  if (modes.includes("train")) [0, 1, 2].forEach((t) => allowedTypes.add(t));
  if (allowedTypes.size) {
    const direct = directRidePlan(home, dest, allowedTypes);
    if (direct) plans.push(direct);
    const first = nearbyStops(home, ACCESS_RADIUS_M)[0];
    if (first && straight > 1200) {
      plans.push({
        mode: modes.includes("bus") ? "bus" : "train", fixedMin: TRANSFER_OVERHEAD_MIN,
        legs: [foot(home, first.stop), { profile: "car", from: home, to: dest, factor: RIDE_FACTOR.bus, fallback: (straight * 1.4) / 250 }],
        describe: () => `Public transport with 1 change (estimate) from ${first.stop.name}`, estimate: true,
      });
    }
    // Walking is always open to a transit user, and beats a long walk to a short ride.
    if (straight <= 2500 && !modes.includes("walk")) plans.push({ mode: "walk", fixedMin: 0, legs: [foot(home, dest)], describe: () => "Walk — quicker than waiting for transport" });
  }
  return plans;
}

/**
 * Picks the line to use: stops within walking distance of both ends that the same route pattern serves in order.
 * Candidates are ranked with a cheap straight-line proxy; only the winner's legs are sent to OSM routing.
 */
function directRidePlan(home: LatLng, dest: LatLng, allowedTypes: Set<number>): Plan | null {
  const transit = getTransit();
  if (!transit) return null;
  const homeStops = nearbyStops(home, ACCESS_RADIUS_M);
  const destStops = nearbyStops(dest, ACCESS_RADIUS_M);
  const alighting = new Map<number, { pos: number; stop: (typeof destStops)[number] }[]>();
  for (const d of destStops) for (const [p, pos] of transit.stopPatterns[d.index]) {
    if (!allowedTypes.has(transit.routes[transit.patterns[p].r].type)) continue;
    alighting.set(p, [...(alighting.get(p) ?? []), { pos, stop: d }]);
  }

  let best: { proxy: number; plan: Plan } | null = null;
  for (const h of homeStops) for (const [p, pos] of transit.stopPatterns[h.index]) {
    const targets = alighting.get(p);
    if (!targets) continue;
    const pattern = transit.patterns[p];
    const route = transit.routes[pattern.r];
    const wait = Math.min(MAX_WAIT_MIN, (pattern.hw ?? DEFAULT_HEADWAY_MIN) / 2);
    for (const t of targets) {
      if (t.pos <= pos) continue; // must travel forwards along the line
      const rideM = distanceM(h.stop, t.stop.stop);
      const ride = rideLeg(route.type, h.stop, t.stop.stop, rideM);
      const proxy = walkMinutes(h.distanceM) + wait + ride.fallback + walkMinutes(t.stop.distanceM);
      if (best && proxy >= best.proxy) continue;
      const fromName = h.stop.name, toName = t.stop.stop.name, line = routeLabel(route);
      best = {
        proxy,
        plan: {
          mode: modeForRouteType(route.type), fixedMin: wait, estimate: route.type === 1 || route.type === 2, // rail time isn't from OSM roads
          legs: [foot(home, h.stop), ride, foot(t.stop.stop, dest)],
          describe: (m) => `Walk ${round(m[0])} min → ${line} from ${fromName} to ${toName} (~${round(m[1])} min, ~${Math.round(wait)} min wait) → walk ${round(m[2])} min`,
        },
      };
    }
  }
  return best?.plan ?? null;
}

function rideLeg(routeType: number, from: LatLng, to: LatLng, straightM: number): Leg {
  if (routeType === 1 || routeType === 2) {
    // Rail: no road leg — the fallback (distance at average rail speed) is the time. factor 0 → OSM time ignored.
    return { profile: "car", from, to, factor: 0, fallback: straightM / RAIL_SPEED_M_PER_MIN };
  }
  const factor = routeType === 0 ? RIDE_FACTOR.tram : RIDE_FACTOR.bus;
  return { profile: "car", from, to, factor, fallback: (straightM * 1.4) / (routeType === 0 ? 333 : 250) };
}

/** Resolves every plan's legs with batched OSM routing, then picks the fastest plan per trip. */
export async function resolveCommutes(trips: { plans: Plan[]; quality: TransportQuality }[]): Promise<(Commute | null)[]> {
  const byProfile: Record<Profile, Leg[]> = { foot: [], bike: [], car: [] };
  for (const trip of trips) for (const plan of trip.plans) for (const leg of plan.legs) if (leg.factor > 0) byProfile[leg.profile].push(leg);
  const minutes = new Map<Leg, number | null>();
  await Promise.all((Object.keys(byProfile) as Profile[]).map(async (profile) => {
    const legs = byProfile[profile];
    if (!legs.length) return;
    const secs = await durations(profile, legs.map((l) => [l.from, l.to]));
    legs.forEach((leg, i) => minutes.set(leg, secs[i] === null ? null : (secs[i]! / 60) * leg.factor));
  }));

  return trips.map(({ plans, quality }) => {
    let best: Commute | null = null;
    for (const plan of plans) {
      let fromOsm = true;
      const legMin = plan.legs.map((leg) => {
        if (leg.factor === 0) return leg.fallback;
        const m = minutes.get(leg);
        if (m === null || m === undefined) { fromOsm = false; return leg.fallback; }
        return m;
      });
      const total = plan.fixedMin + legMin.reduce((a, b) => a + b, 0);
      const isEstimate = !fromOsm || Boolean(plan.estimate);
      if (!best || total < best.minutes) best = { mode: plan.mode, minutes: round(total), summary: plan.describe(legMin), transportQuality: quality, source: isEstimate ? "estimate" : "osm" };
    }
    return best;
  });
}
