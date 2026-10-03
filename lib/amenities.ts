import type { Amenity, AmenityCategory } from "./types";
import { walkMinutes } from "./transit/geo";
import { getAmenityData } from "./transit/store";

export const amenityLabels: Record<AmenityCategory, string> = { kindergarten: "Childcare / kindergarten", school: "School", grocery: "Grocery shop" };

export function getAmenities(propertyId: string): Amenity[] { return getAmenityData()?.[propertyId] ?? []; }

export function nearestByCategory(amenities: Amenity[]) {
  const nearest: Partial<Record<AmenityCategory, Amenity>> = {};
  for (const a of amenities) if (!nearest[a.category] || a.distanceM < nearest[a.category]!.distanceM) nearest[a.category] = a;
  return nearest;
}

/** Lifestyle score (0–100) for the 10% "lifestyle" slice of the Life Match: everyday errands within walking distance. */
export function amenityScore(amenities: Amenity[]) {
  if (!amenities.length) return { score: 75, highlights: [] as string[] }; // no data → neutral, as before
  const nearest = nearestByCategory(amenities);
  const grocery = nearest.grocery?.distanceM ?? Infinity;
  const school = nearest.school?.distanceM ?? Infinity;
  const kinder = nearest.kindergarten?.distanceM ?? Infinity;
  const score = (grocery <= 500 ? 40 : grocery <= 1000 ? 20 : 0) + (school <= 1000 ? 30 : 0) + (kinder <= 1000 ? 30 : 0);
  const highlights: string[] = [];
  if (nearest.grocery && grocery <= 500) highlights.push(`${nearest.grocery.name} ${Math.max(1, Math.round(walkMinutes(grocery)))} min walk`);
  if (nearest.kindergarten && kinder <= 1000) highlights.push(`Childcare ${Math.max(1, Math.round(walkMinutes(kinder)))} min walk`);
  if (nearest.school && school <= 1000) highlights.push(`School ${Math.max(1, Math.round(walkMinutes(school)))} min walk`);
  return { score, highlights };
}
