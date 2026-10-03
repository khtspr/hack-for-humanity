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

export type Property = {
  id: string;
  title: string;
  area: string;
  listingType: "rent" | "buy";
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  description: string;
  parking: boolean;
  nearbyTransport: string;
  transportQuality: "Limited" | "Good" | "Excellent";
  image: string;
};

export type Commute = { mode: TransportMode; minutes: number; summary: string; transportQuality: Property["transportQuality"] };