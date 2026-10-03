import type { Connectivity, LatLng, NearbyStop, TransportQuality } from "../types";
import { walkMinutes } from "./geo";
import { getTransit, nearbyStops, routeLabel } from "./store";

const RADIUS_M = 800;
const CORE_RADIUS_M = 500;

/** Rates how well-connected a location is, from the stops and route patterns around it. */
export function getConnectivity(point: LatLng): Connectivity | null {
  const transit = getTransit();
  if (!transit) return null;
  const near = nearbyStops(point, RADIUS_M);
  const stops: NearbyStop[] = near.map(({ stop, distanceM }) => ({
    id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng, distanceM,
    routes: stop.r.map((i) => ({ name: routeLabel(transit.routes[i]), type: transit.routes[i].type })),
  }));

  const core = near.filter((s) => s.distanceM <= CORE_RADIUS_M);
  const coreRoutes = new Set(core.flatMap((s) => s.stop.r));
  const bestHeadway = Math.min(Infinity, ...core.flatMap((s) => transit.stopPatterns[s.index].map(([p]) => transit.patterns[p].hw ?? Infinity)));
  const rail = stops.find((s) => s.distanceM <= 600 && s.routes.some((r) => r.type !== 3));

  const quality: TransportQuality = rail || (coreRoutes.size >= 5 && bestHeadway <= 10) ? "Excellent" : coreRoutes.size >= 2 ? "Good" : "Limited";
  const score = Math.min(100, 40 + coreRoutes.size * 4 + (rail ? 25 : 0) + (bestHeadway <= 10 ? 10 : 0));

  const describe = (s: NearbyStop) => `${Math.max(1, Math.round(walkMinutes(s.distanceM)))} min walk to ${s.name}`;
  const busCount = [...coreRoutes].filter((i) => transit.routes[i].type === 3).length;
  let summary: string;
  if (rail) {
    const lines = [...new Set(rail.routes.filter((r) => r.type !== 3).map((r) => r.name))].join(", ");
    summary = `${describe(rail)} (${lines})${busCount ? ` · ${busCount} bus routes within ${CORE_RADIUS_M} m` : ""}`;
  } else if (stops.length) {
    summary = `${describe(stops[0])} · ${busCount} bus route${busCount === 1 ? "" : "s"} within ${CORE_RADIUS_M} m`;
  } else {
    summary = "No public transport stops within 800 m";
  }
  return { quality, summary, score, stops };
}
