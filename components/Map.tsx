"use client";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { MapViewProps } from "./MapView";

export type { MapMarker } from "./MapView";

// Leaflet touches `window` at import time, so it must never render on the server.
// The placeholder reads --map-h from the wrapper below, so it is exactly as tall as the map.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map-frame map-loading">Unfolding the map…</div>,
});

/** Reserves the map's height while Leaflet loads, so nothing shifts when it appears. */
export default function HomeMap(props: MapViewProps) {
  const height = props.height ?? 360;
  return (
    <div style={{ minHeight: height, "--map-h": `${height}px` } as CSSProperties}>
      <MapView {...props} height={height} />
    </div>
  );
}
