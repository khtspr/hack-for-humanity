"use client";
import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

export type { MapMarker } from "./MapView";

// Leaflet touches `window` at import time, so it must never render on the server.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-frame map-loading">Loading map…</div>,
});

export default function HomeMap(props: MapViewProps) { return <MapView {...props} />; }
