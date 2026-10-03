export type TransportMode = "car" | "train" | "bus" | "bike" | "walk";

export type DestinationType = "work" | "partner-work" | "university" | "school" | "family" | "other";

export type Destination = {
  id: string;
  name: string;
  type: DestinationType;
  visitsPerWeek: number;
  importance: "low" | "medium" | "high";
};

export type Preferences = {
  listingType: "rent" | "buy";
  budget: number;
  bedrooms: number;
  maxCommute: number;
  transportModes: TransportMode[];
  destinations: Destination[];
};

export type TransportQuality = "Limited" | "Good" | "Excellent";

export type Property = {
  id: string;
  title: string;
  area: string;
  address: string;
  listingType: "rent" | "buy";
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  description: string;
  parking: boolean;
  furnished: boolean;
  facilities: string[];
  ber?: string;
  daftUrl?: string;
  lat: number;
  lng: number;
  /** Fallback text; replaced by GTFS-derived connectivity when transit data is available. */
  nearbyTransport: string;
  /** Fallback rating; replaced by GTFS-derived connectivity when transit data is available. */
  transportQuality: TransportQuality;
  image: string;
};

export type LatLng = { lat: number; lng: number };

export type Commute = {
  mode: TransportMode;
  minutes: number;
  summary: string;
  transportQuality: TransportQuality;
  /** "osm" when every leg was routed on OpenStreetMap, "estimate" if any part was approximated, "mock" for the hand-written fallback table. */
  source: "osm" | "estimate" | "mock";
};

export type AmenityCategory = "kindergarten" | "school" | "grocery";

export type Amenity = { name: string; category: AmenityCategory; lat: number; lng: number; distanceM: number };

export type RouteType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 11 | 12;

export type NearbyStop = { id: string; name: string; lat: number; lng: number; distanceM: number; routes: { name: string; type: number }[] };

export type Connectivity = { quality: TransportQuality; summary: string; score: number; stops: NearbyStop[] };
