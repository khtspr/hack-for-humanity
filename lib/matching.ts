import { getCommute, properties } from "./data";
import type { Preferences, Property } from "./types";

export function matchProperties(preferences: Preferences) {
  return propertiesWithScores(preferences).sort((a, b) => b.score - a.score);
}

function propertiesWithScores(preferences: Preferences) {
  return properties.map((property) => {
    const commute = getCommute(property.id, preferences.transportModes);
    const affordability = Math.max(0, Math.min(100, 100 - Math.max(0, property.price - preferences.budget) / preferences.budget * 250));
    const commuteScore = Math.max(0, Math.min(100, 100 - Math.max(0, commute.minutes - preferences.maxCommute) * 3));
    const bedroomScore = property.bedrooms >= preferences.bedrooms ? 100 : 0;
    const score = Math.round(affordability * .35 + commuteScore * .35 + bedroomScore * .2 + (property.area.toLowerCase().includes(preferences.destination.toLowerCase()) ? 100 : 70) * .1);
    const strengths = [property.price <= preferences.budget ? `€${preferences.budget - property.price} below your budget` : "Strong location and transport options", `${commute.minutes}-minute ${commute.mode} commute`, `${property.bedrooms} bedroom${property.bedrooms === 1 ? "" : "s"}`];
    const tradeoffs = [property.price > preferences.budget ? `€${property.price - preferences.budget} above your budget` : "", commute.minutes > preferences.maxCommute ? `${commute.minutes - preferences.maxCommute} minutes over your commute target` : ""].filter(Boolean);
    return { property, commute, score, strengths, tradeoffs };
  });
}