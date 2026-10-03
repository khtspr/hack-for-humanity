// Server-only: reads generated transit/amenity data from disk. Client components import types from here with `import type`.
import { getMockCommute, properties } from "./data";
import { amenityScore, getAmenities } from "./amenities";
import { planCommute, resolveCommutes } from "./transit/commute";
import { getConnectivity } from "./transit/connectivity";
import { geocode } from "./transit/geocode";
import type { Commute, Connectivity, Destination, LatLng, Preferences, Property } from "./types";

export type DestinationMatch = Destination & { commute: Commute; location: LatLng | null };
export type MatchResult = {
  property: Property;
  score: number;
  category: "best-overall" | "best-value" | "best-commute" | "worth-considering";
  destinationMatches: DestinationMatch[];
  strengths: string[];
  tradeoffs: string[];
  explanation: string;
  affordabilityScore: number;
  commuteScore: number;
  transportScore: number;
  propertyScore: number;
  lifestyleScore: number;
  amenityHighlights: string[];
};

const importanceWeight = { low: 1, medium: 2, high: 3 } as const;
const qualityScore = { Excellent: 100, Good: 78, Limited: 45 } as const;

export async function matchProperties(preferences: Preferences, onlyPropertyId?: string): Promise<MatchResult[]> {
  const destinations = preferences.destinations.length ? preferences.destinations : [{ id: "default-work", name: "your main destination", type: "work" as const, visitsPerWeek: 5, importance: "high" as const }];
  const locations = await Promise.all(destinations.map((d) => geocode(d.name)));
  const located = destinations.map((destination, i) => ({ destination, location: locations[i] }));
  const candidates = properties
    .filter((property) => (onlyPropertyId ? property.id === onlyPropertyId : property.listingType === preferences.listingType))
    .map((raw) => withConnectivity(raw));
  // Plan every home × destination journey first, then resolve them all with batched OpenStreetMap routing.
  const trips = candidates.flatMap(({ property }) => located.map(({ location }) => ({ plans: location ? planCommute(property, location, preferences.transportModes) : [], quality: property.transportQuality })));
  const commutes = await resolveCommutes(trips);
  const results = candidates
    .map(({ property, connectivity }, i) => scoreProperty(property, connectivity, preferences, located, commutes.slice(i * located.length, (i + 1) * located.length)))
    .sort((a, b) => b.score - a.score);
  return results.map((result, index) => {
    const isMeaningfullyCheaper = result.property.price <= preferences.budget - 300;
    const hasCommuteTradeoff = result.tradeoffs.some((tradeoff) => tradeoff.includes("longer than your target"));
    const category = index === 0 ? "best-overall" : isMeaningfullyCheaper && hasCommuteTradeoff ? "worth-considering" : index === 1 ? "best-value" : index === 2 ? "best-commute" : "worth-considering";
    return { ...result, category };
  });
}

/** Property with its transport fields replaced by GTFS-derived values (falls back to the hand-written ones). */
export function withConnectivity(property: Property): { property: Property; connectivity: Connectivity | null } {
  const connectivity = getConnectivity(property);
  if (!connectivity) return { property, connectivity };
  return { property: { ...property, transportQuality: connectivity.quality, nearbyTransport: connectivity.summary }, connectivity };
}

function scoreProperty(property: Property, connectivity: Connectivity | null, preferences: Preferences, destinations: { destination: Destination; location: LatLng | null }[], commutes: (Commute | null)[]): Omit<MatchResult, "category"> {
  const destinationMatches: DestinationMatch[] = destinations.map(({ destination, location }, i) => ({
    ...destination,
    location,
    commute: commutes[i] ?? getMockCommute(property.id, destination.type, preferences.transportModes),
  }));
  const totalWeight = destinationMatches.reduce((sum, destination) => sum + importanceWeight[destination.importance] * Math.max(destination.visitsPerWeek, 1), 0);
  const weightedCommute = destinationMatches.reduce((sum, destination) => sum + commuteScore(destination.commute.minutes, preferences.maxCommute) * importanceWeight[destination.importance] * Math.max(destination.visitsPerWeek, 1), 0) / totalWeight;
  const affordabilityScore = affordability(property.price, preferences.budget);
  const commuteScoreValue = Math.round(weightedCommute);
  const transportScore = connectivity?.score ?? qualityScore[property.transportQuality];
  const propertyScore = property.bedrooms >= preferences.bedrooms ? 100 : 15;
  const lifestyle = amenityScore(getAmenities(property.id));
  const score = Math.round(affordabilityScore * .35 + commuteScoreValue * .30 + transportScore * .15 + propertyScore * .10 + lifestyle.score * .10);
  const strengths: string[] = [];
  const tradeoffs: string[] = [];
  if (property.price <= preferences.budget) strengths.push(`€${preferences.budget - property.price} below your budget`);
  else tradeoffs.push(`€${property.price - preferences.budget} above your budget`);
  destinationMatches.forEach((destination) => {
    const prefix = destination.importance === "high" ? "Priority: " : "";
    if (destination.commute.minutes <= preferences.maxCommute) strengths.push(`${prefix}${destination.commute.minutes} min ${destination.commute.mode} to ${destination.name}`);
    else tradeoffs.push(`${destination.commute.minutes - preferences.maxCommute} min longer than your target to ${destination.name}`);
  });
  strengths.push(`${property.transportQuality} public transport`, `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`);
  if (preferences.transportModes.includes("car")) {
    if (property.parking) strengths.push("Parking included for your car");
    else tradeoffs.push("No private parking listed — you selected driving");
  }
  if (property.bedrooms < preferences.bedrooms) tradeoffs.push(`${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"} — fewer than the ${preferences.bedrooms} you asked for`);
  const highPriority = destinationMatches.filter((destination) => destination.importance === "high").slice(0, 2);
  const commuteSentence = highPriority.length ? `It keeps ${highPriority.map((destination) => `${destination.name} within ${destination.commute.minutes} minutes`).join(" and ")}.` : "It keeps your regular destinations within reach.";
  const explanation = `This property gives you a strong balance of affordability and everyday travel. ${property.price <= preferences.budget ? `It is €${preferences.budget - property.price} below your budget.` : `It is €${property.price - preferences.budget} above your budget, which is the main compromise.`} ${commuteSentence}`;
  return { property, score, destinationMatches, strengths, tradeoffs, explanation, affordabilityScore, commuteScore: commuteScoreValue, transportScore, propertyScore, lifestyleScore: lifestyle.score, amenityHighlights: lifestyle.highlights };
}

function affordability(price: number, budget: number) {
  if (price <= budget) return Math.min(100, 85 + ((budget - price) / budget) * 15);
  return Math.max(0, 100 - ((price - budget) / budget) * 250);
}

function commuteScore(minutes: number, target: number) { return Math.max(0, Math.min(100, 100 - Math.max(0, minutes - target) * 3)); }
