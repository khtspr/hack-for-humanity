import type { Commute, Property, TransportMode } from "./types";

export const properties: Property[] = [
  { id:"dublin-8-canal", title:"Bright canal-side apartment", area:"Dublin 8", listingType:"rent", price:1650, bedrooms:2, bathrooms:1, type:"Apartment", description:"A bright two-bedroom home close to the Luas and local cafés.", parking:false, nearbyTransport:"4 min walk to the Luas", image:"🏠" },
  { id:"dublin-2-street", title:"Central one-bedroom apartment", area:"Dublin 2", listingType:"rent", price:1950, bedrooms:1, bathrooms:1, type:"Apartment", description:"A compact, furnished apartment in the heart of the city.", parking:false, nearbyTransport:"7 min walk to Tara Street", image:"🏙️" },
  { id:"clontarf-garden", title:"Garden-level coastal home", area:"Clontarf", listingType:"rent", price:1850, bedrooms:2, bathrooms:1, type:"House", description:"A quiet two-bedroom home with a private garden and excellent bus links.", parking:true, nearbyTransport:"8 min walk to coastal cycle route", image:"🌿" },
  { id:"tallaght-station", title:"Spacious station-side apartment", area:"Tallaght", listingType:"rent", price:1425, bedrooms:2, bathrooms:2, type:"Apartment", description:"More space for less money, directly beside a Red Line stop.", parking:true, nearbyTransport:"2 min walk to the Luas", image:"🚉" },
  { id:"dublin-6-victorian", title:"Renovated Victorian terrace", area:"Dublin 6", listingType:"rent", price:2100, bedrooms:2, bathrooms:1, type:"House", description:"Characterful home with a quick cycle to the city centre.", parking:false, nearbyTransport:"On quiet cycling routes", image:"🏡" },
  { id:"dublin-12-family", title:"Family home near the green line", area:"Dublin 12", listingType:"buy", price:425000, bedrooms:3, bathrooms:2, type:"House", description:"A practical three-bedroom home with a garden and straightforward city access.", parking:true, nearbyTransport:"10 min walk to the Luas", image:"🏘️" },
  { id:"swords-commuter", title:"Modern commuter apartment", area:"Swords", listingType:"buy", price:315000, bedrooms:2, bathrooms:2, type:"Apartment", description:"A modern apartment with generous space and a direct bus connection into Dublin.", parking:true, nearbyTransport:"3 min walk to frequent bus routes", image:"🏢" },
];

const commuteMinutes: Record<string, Partial<Record<TransportMode, number>>> = {
  "dublin-8-canal": { bike:18, bus:24, train:22, walk:42 },
  "dublin-2-street": { bike:12, bus:16, train:15, walk:20 },
  "clontarf-garden": { bike:25, bus:29, train:31 },
  "tallaght-station": { train:27, bus:38, bike:45 },
  "dublin-6-victorian": { bike:14, bus:19, walk:48 },
  "dublin-12-family": { bike:22, bus:31, train:28 },
  "swords-commuter": { bus:34, bike:52 },
};

export function getCommute(propertyId: string, modes: TransportMode[]): Commute {
  const options = commuteMinutes[propertyId] ?? {};
  const available = modes.map((mode) => ({ mode, minutes: options[mode] })).filter((item): item is { mode: TransportMode; minutes: number } => item.minutes !== undefined);
  const best = available.sort((a, b) => a.minutes - b.minutes)[0] ?? { mode: "bus" as TransportMode, minutes: 60 };
  const labels: Record<TransportMode, string> = { car:"Driving", train:"Train", bus:"Bus", bike:"Cycling", walk:"Walking" };
  return { ...best, summary: `${labels[best.mode]} route to your destination` };
}