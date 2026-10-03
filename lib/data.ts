import type { Commute, DestinationType, Property, TransportMode } from "./types";

export const properties: Property[] = [
  { id:"dublin-8-canal", title:"Bright canal-side apartment", area:"Dublin 8", listingType:"rent", price:1650, bedrooms:2, bathrooms:1, type:"Apartment", description:"A bright two-bedroom home close to the Luas and local cafés.", parking:false, nearbyTransport:"4 min walk to the Luas", transportQuality:"Excellent", image:"🏠" },
  { id:"dublin-2-street", title:"Central one-bedroom apartment", area:"Dublin 2", listingType:"rent", price:1950, bedrooms:1, bathrooms:1, type:"Apartment", description:"A compact, furnished apartment in the heart of the city.", parking:false, nearbyTransport:"7 min walk to Tara Street", transportQuality:"Good", image:"🏙️" },
  { id:"clontarf-garden", title:"Garden-level coastal home", area:"Clontarf", listingType:"rent", price:1850, bedrooms:2, bathrooms:1, type:"House", description:"A quiet two-bedroom home with a private garden and excellent bus links.", parking:true, nearbyTransport:"8 min walk to coastal cycle route", transportQuality:"Good", image:"🌿" },
  { id:"tallaght-station", title:"Spacious station-side apartment", area:"Tallaght", listingType:"rent", price:1425, bedrooms:2, bathrooms:2, type:"Apartment", description:"More space for less money, directly beside a Red Line stop.", parking:true, nearbyTransport:"2 min walk to the Luas", transportQuality:"Excellent", image:"🚉" },
  { id:"dublin-6-victorian", title:"Renovated Victorian terrace", area:"Dublin 6", listingType:"rent", price:2100, bedrooms:2, bathrooms:1, type:"House", description:"Characterful home with a quick cycle to the city centre.", parking:false, nearbyTransport:"On quiet cycling routes", transportQuality:"Good", image:"🏡" },
  { id:"dublin-12-family", title:"Family home near the green line", area:"Dublin 12", listingType:"buy", price:425000, bedrooms:3, bathrooms:2, type:"House", description:"A practical three-bedroom home with a garden and straightforward city access.", parking:true, nearbyTransport:"10 min walk to the Luas", transportQuality:"Good", image:"🏘️" },
  { id:"swords-commuter", title:"Modern commuter apartment", area:"Swords", listingType:"buy", price:315000, bedrooms:2, bathrooms:2, type:"Apartment", description:"A modern apartment with generous space and a direct bus connection into Dublin.", parking:true, nearbyTransport:"3 min walk to frequent bus routes", transportQuality:"Good", image:"🏢" },
];

const commuteMinutes: Record<string, Record<DestinationType, Partial<Record<TransportMode, number>>>> = {
  "dublin-8-canal": { work:{ bike:18, bus:24, train:22 }, "partner-work":{ bike:22, bus:28, train:25 }, family:{ bike:34, bus:42, train:38 }, university:{ bike:20, bus:25 }, school:{ bike:20, bus:25 }, other:{ bike:24, bus:30 } },
  "dublin-2-street": { work:{ bike:12, bus:16, train:15 }, "partner-work":{ bike:17, bus:21, train:19 }, family:{ bike:29, bus:35, train:30 }, university:{ bike:10, bus:15 }, school:{ bike:15, bus:20 }, other:{ bike:18, bus:22 } },
  "clontarf-garden": { work:{ bike:25, bus:29, train:31 }, "partner-work":{ bike:21, bus:27, train:24 }, family:{ bike:22, bus:28, train:25 }, university:{ bike:27, bus:32 }, school:{ bike:20, bus:25 }, other:{ bike:25, bus:30 } },
  "tallaght-station": { work:{ train:27, bus:38, bike:45 }, "partner-work":{ train:35, bus:42, bike:49 }, family:{ train:48, bus:55, bike:58 }, university:{ train:30, bus:40 }, school:{ bus:30, bike:35 }, other:{ train:35, bus:45 } },
  "dublin-6-victorian": { work:{ bike:14, bus:19 }, "partner-work":{ bike:15, bus:20 }, family:{ bike:25, bus:31 }, university:{ bike:16, bus:22 }, school:{ bike:15, bus:20 }, other:{ bike:18, bus:24 } },
  "dublin-12-family": { work:{ bike:22, bus:31, train:28 }, "partner-work":{ bike:26, bus:34, train:31 }, family:{ bike:28, bus:36, train:32 }, university:{ bike:24, bus:30 }, school:{ bike:15, bus:20 }, other:{ bike:28, bus:35 } },
  "swords-commuter": { work:{ bus:34, bike:52 }, "partner-work":{ bus:38, bike:56 }, family:{ bus:45, bike:65 }, university:{ bus:40, bike:58 }, school:{ bus:25, bike:35 }, other:{ bus:40, bike:58 } },
};

export function getCommute(propertyId: string, destinationType: DestinationType, modes: TransportMode[]): Commute {
  const options = commuteMinutes[propertyId]?.[destinationType] ?? {};
  const available = modes.map((mode) => ({ mode, minutes: options[mode] })).filter((item): item is { mode: TransportMode; minutes: number } => item.minutes !== undefined);
  const best = available.sort((a, b) => a.minutes - b.minutes)[0] ?? { mode: "bus" as TransportMode, minutes: 60 };
  const labels: Record<TransportMode, string> = { car:"Driving", train:"Train", bus:"Bus", bike:"Cycling", walk:"Walking" };
  const property = properties.find((item) => item.id === propertyId);
  return { ...best, summary: `${labels[best.mode]} route to this destination`, transportQuality: property?.transportQuality ?? "Limited" };
}