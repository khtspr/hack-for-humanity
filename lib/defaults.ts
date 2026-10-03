import type { Preferences } from "./types";

/** Demo profile used when the visitor hasn't filled in their preferences yet. */
export const defaultPreferences: Preferences = { listingType:"rent", budget:1900, bedrooms:1, maxCommute:30, transportModes:["bike", "train"], destinations:[{ id:"work", name:"Google, Barrow Street", type:"work", visitsPerWeek:5, importance:"high" }, { id:"partner", name:"Trinity College", type:"partner-work", visitsPerWeek:4, importance:"high" }, { id:"family", name:"Dún Laoghaire", type:"family", visitsPerWeek:1, importance:"low" }] };

export function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem("homematch-preferences") ?? "null");
    return saved?.destinations?.length ? saved : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}
