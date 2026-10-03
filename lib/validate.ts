// Parses the untrusted /api/match body. Only whitelisted fields survive, so nothing extra is echoed back to the client
// and each request's work (geocoding + OSM routing on shared community servers) stays bounded.
import type { Destination, DestinationType, Preferences, TransportMode } from "./types";

export const MAX_DESTINATIONS = 8;
export const MAX_NAME_LENGTH = 120;

const modes: TransportMode[] = ["car", "train", "bus", "bike", "walk"];
const types: DestinationType[] = ["work", "partner-work", "university", "school", "family", "other"];
const importances: Destination["importance"][] = ["low", "medium", "high"];

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T => (options.includes(value as T) ? (value as T) : fallback);
const clamp = (value: unknown, min: number, max: number) => {
  const n = typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

/** Clean preferences, or an error message describing what was malformed. */
export function parsePreferences(input: unknown): Preferences | string {
  const p = input as Record<string, unknown> | null;
  if (!p || typeof p !== "object" || !Array.isArray(p.destinations) || !Array.isArray(p.transportModes)) return "Expected { preferences }";
  if (p.destinations.length > MAX_DESTINATIONS) return `At most ${MAX_DESTINATIONS} destinations`;
  const budget = clamp(p.budget, 1, 100_000_000), bedrooms = clamp(p.bedrooms, 0, 10), maxCommute = clamp(p.maxCommute, 1, 240);
  if (budget === null || bedrooms === null || maxCommute === null) return "budget, bedrooms and maxCommute must be numbers";

  const destinations: Destination[] = [];
  for (const [i, raw] of (p.destinations as unknown[]).entries()) {
    const d = raw as Record<string, unknown> | null;
    const name = typeof d?.name === "string" ? d.name.trim() : "";
    if (!name || name.length > MAX_NAME_LENGTH) return `Each destination needs a name of 1–${MAX_NAME_LENGTH} characters`;
    destinations.push({
      id: typeof d?.id === "string" && d.id.length <= 64 ? d.id : `destination-${i}`,
      name,
      type: oneOf(types, d?.type, "other"),
      visitsPerWeek: clamp(d?.visitsPerWeek, 0, 7) ?? 1,
      importance: oneOf(importances, d?.importance, "medium"),
    });
  }
  return {
    listingType: oneOf(["rent", "buy"] as const, p.listingType, "rent"),
    budget, bedrooms, maxCommute,
    transportModes: modes.filter((mode) => (p.transportModes as unknown[]).includes(mode)),
    destinations,
  };
}
