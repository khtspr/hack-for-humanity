"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: "property" | "destination" | "stop" | "amenity";
  color: string;
  /** Short text drawn inside property/destination pins (e.g. "92%"). */
  label?: string;
  title: string;
  detail?: string;
  highlighted?: boolean;
};

export type MapViewProps = {
  markers: MapMarker[];
  circle?: { lat: number; lng: number; radius: number };
  height?: number;
  /** Marker kinds used to frame the initial view (defaults to every marker). */
  fitKinds?: MapMarker["kind"][];
  onMarkerClick?: (id: string) => void;
};

// divIcons are plain HTML, which sidesteps Leaflet's default PNG marker paths that break under bundlers.
function pinIcon(marker: MapMarker) {
  const size = marker.highlighted ? 44 : 36;
  return L.divIcon({
    className: "map-pin-wrapper",
    html: `<div class="map-pin${marker.highlighted ? " is-highlighted" : ""}" style="--pin:${marker.color};width:${size}px;height:${size}px">${marker.label ?? ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points, circle }: { points: [number, number][]; circle?: MapViewProps["circle"] }) {
  const map = useMap();
  const key = JSON.stringify(points) + JSON.stringify(circle);
  useEffect(() => {
    if (circle) map.fitBounds(L.latLng(circle.lat, circle.lng).toBounds(circle.radius * 2), { padding: [12, 12] });
    else if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function MapView({ markers, circle, height = 360, fitKinds, onMarkerClick }: MapViewProps) {
  const points = useMemo(() => markers.filter((m) => !fitKinds || fitKinds.includes(m.kind)).map((m) => [m.lat, m.lng] as [number, number]), [markers, fitKinds]);
  // Draw small markers first so pins stay on top.
  const dots = markers.filter((m) => m.kind === "stop" || m.kind === "amenity");
  const pins = markers.filter((m) => m.kind === "property" || m.kind === "destination");
  return (
    <div className="map-frame" style={{ height }}>
      <MapContainer center={[53.3498, -6.2603]} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        {circle && <Circle center={[circle.lat, circle.lng]} radius={circle.radius} pathOptions={{ color: "#185c3d", weight: 1, fillOpacity: 0.04, dashArray: "4 6" }} />}
        {dots.map((m) => (
          <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={m.kind === "stop" ? 5 : 6} pathOptions={{ color: "#fff", weight: 1.5, fillColor: m.color, fillOpacity: 0.95 }}>
            <Tooltip direction="top" offset={[0, -4]}><strong>{m.title}</strong>{m.detail && <><br />{m.detail}</>}</Tooltip>
          </CircleMarker>
        ))}
        {pins.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon(m)} zIndexOffset={m.highlighted ? 1000 : m.kind === "property" ? 500 : 0} eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : undefined}>
            <Popup><strong>{m.title}</strong>{m.detail && <><br />{m.detail}</>}</Popup>
          </Marker>
        ))}
        <FitBounds points={points} circle={circle} />
      </MapContainer>
    </div>
  );
}
