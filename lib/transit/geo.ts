import type { LatLng } from "../types";

export function distanceM(a: LatLng, b: LatLng) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Straight-line distances are inflated by a detour factor to approximate the street network.
export const walkMinutes = (m: number) => (m * 1.3) / 80; // 4.8 km/h
export const bikeMinutes = (m: number) => (m * 1.3) / 250; // 15 km/h
export const carMinutes = (m: number) => (m * 1.4) / 417 + 5; // 25 km/h urban average + parking
