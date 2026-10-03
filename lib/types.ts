export type TransportMode = "car" | "train" | "bus" | "bike" | "walk";

export type Preferences = {
  listingType: "rent" | "buy";
  budget: number;
  bedrooms: number;
  destination: string;
  maxCommute: number;
  transportModes: TransportMode[];
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
  image: string;
};

export type Commute = { mode: TransportMode; minutes: number; summary: string };