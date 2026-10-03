import { getCommute, properties } from "./data";
import type { Destination, Preferences, Property } from "./types";

export type DestinationMatch = Destination & { commute: ReturnType<typeof getCommute> };
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
};

const importanceWeight = { low: 1, medium: 2, high: 3 } as const;

export function matchProperties(preferences: Preferences): MatchResult[] {
  const results = properties.filter((property) => property.listingType === preferences.listingType).map((property) => scoreProperty(property, preferences)).sort((a, b) => b.score - a.score);
  return results.map((result, index) => {
    const isMeaningfullyCheaper = result.property.price <= preferences.budget - 300;
    const hasCommuteTradeoff = result.tradeoffs.some((tradeoff) => tradeoff.includes("longer than your target"));
    const category = index === 0 ? "best-overall" : isMeaningfullyCheaper && hasCommuteTradeoff ? "worth-considering" : index === 1 ? "best-value" : index === 2 ? "best-commute" : "worth-considering";
    return { ...result, category };
  });
}

function scoreProperty(property: Property, preferences: Preferences): Omit<MatchResult, "category"> {
  const destinations = preferences.destinations.length ? preferences.destinations : [{ id: "default-work", name: "your main destination", type: "work" as const, visitsPerWeek: 5, importance: "high" as const }];
  const destinationMatches = destinations.map((destination) => ({ ...destination, commute: getCommute(property.id, destination.type, preferences.transportModes) }));
  const totalWeight = destinations.reduce((sum, destination) => sum + importanceWeight[destination.importance] * Math.max(destination.visitsPerWeek, 1), 0);
  const weightedCommute = destinationMatches.reduce((sum, destination) => sum + commuteScore(destination.commute.minutes, preferences.maxCommute) * importanceWeight[destination.importance] * Math.max(destination.visitsPerWeek, 1), 0) / totalWeight;
  const affordabilityScore = affordability(property.price, preferences.budget);
  const commuteScoreValue = Math.round(weightedCommute);
  const transportScore = property.transportQuality === "Excellent" ? 100 : property.transportQuality === "Good" ? 78 : 45;
  const propertyScore = property.bedrooms >= preferences.bedrooms ? 100 : 15;
  const score = Math.round(affordabilityScore * .35 + commuteScoreValue * .30 + transportScore * .15 + propertyScore * .10 + 75 * .10);
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
  const highPriority = destinationMatches.filter((destination) => destination.importance === "high").slice(0, 2);
  const commuteSentence = highPriority.length ? `It keeps ${highPriority.map((destination) => `${destination.name} within ${destination.commute.minutes} minutes`).join(" and ")}.` : "It keeps your regular destinations within reach.";
  const explanation = `This property gives you a strong balance of affordability and everyday travel. ${property.price <= preferences.budget ? `It is €${preferences.budget - property.price} below your budget.` : `It is €${property.price - preferences.budget} above your budget, which is the main compromise.`} ${commuteSentence}`;
  return { property, score, destinationMatches, strengths, tradeoffs, explanation, affordabilityScore, commuteScore: commuteScoreValue, transportScore, propertyScore };
}

function affordability(price: number, budget: number) {
  if (price <= budget) return Math.min(100, 85 + ((budget - price) / budget) * 15);
  return Math.max(0, 100 - ((price - budget) / budget) * 250);
}

function commuteScore(minutes: number, target: number) { return Math.max(0, Math.min(100, 100 - Math.max(0, minutes - target) * 3)); }
export function annualSavings(monthlySavings: number) { return monthlySavings * 12; }