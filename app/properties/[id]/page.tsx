import Link from "next/link";
import { notFound } from "next/navigation";
import HomeMap, { type MapMarker } from "../../../components/Map";
import MapLegend from "../../../components/MapLegend";
import { mapColors, stopColor } from "../../../components/mapColors";
import SiteHeader from "../../../components/SiteHeader";
import YourCommutes from "../../../components/YourCommutes";
import { amenityLabels, getAmenities, nearestByCategory } from "../../../lib/amenities";
import { getProperty } from "../../../lib/data";
import { withConnectivity } from "../../../lib/matching";
import { walkMinutes } from "../../../lib/transit/geo";
import type { AmenityCategory } from "../../../lib/types";

export const dynamic = "force-dynamic"; // reads generated data from disk at request time

const walk = (m: number) => `${Math.max(1, Math.round(walkMinutes(m)))} min walk`;
// Bus-only stops draw smaller than Luas/rail stops, so size backs up the colour difference.
const isRailStop = (types: number[]) => types.some((t) => t === 0 || t === 1 || t === 2);

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = getProperty((await params).id);
  if (!raw) notFound();
  const { property, connectivity } = withConnectivity(raw);
  const amenities = getAmenities(property.id);
  const nearest = nearestByCategory(amenities);

  const markers: MapMarker[] = [
    ...(connectivity?.stops ?? []).map((s): MapMarker => ({ id: `stop-${s.id}`, lat: s.lat, lng: s.lng, kind: "stop", color: stopColor(s.routes.map((r) => r.type)), radius: isRailStop(s.routes.map((r) => r.type)) ? 6 : 4, title: s.name, detail: `${walk(s.distanceM)} · ${[...new Set(s.routes.map((r) => r.name))].slice(0, 10).join(", ")}` })),
    ...amenities.map((a, i): MapMarker => ({ id: `amenity-${i}`, lat: a.lat, lng: a.lng, kind: "amenity", color: mapColors[a.category], title: a.name, detail: `${amenityLabels[a.category]} · ${walk(a.distanceM)}` })),
    { id: property.id, lat: property.lat, lng: property.lng, kind: "property", color: mapColors.home, label: "⌂", title: property.title, detail: property.address },
  ];
  const lines = [...new Set((connectivity?.stops ?? []).flatMap((s) => s.routes.filter((r) => r.type !== 3).map((r) => r.name)))];
  const busRoutes = new Set((connectivity?.stops ?? []).filter((s) => s.distanceM <= 500).flatMap((s) => s.routes.filter((r) => r.type === 3).map((r) => r.name)));

  return <div className="shell"><SiteHeader actions={<Link className="back" href="/results"><span aria-hidden="true">←</span> Back to matches</Link>} /><main id="main-content" tabIndex={-1}><section className="detail"><div className="detail-panel">
    <div className="detail-emoji" aria-hidden="true">{property.image}</div>
    <div className="eyebrow">{property.area} · {property.type}</div>
    <h1>{property.title}</h1>
    <p className="muted">{property.address}</p>
    <div className="price">€{property.price.toLocaleString()}<small className="muted">{property.listingType === "rent" ? "/month" : ""}</small></div>
    <p className="lede">{property.description}</p>
    <div className="tags"><span className="tag">{property.bedrooms} bedroom{property.bedrooms === 1 ? "" : "s"}</span><span className="tag">{property.bathrooms} bathroom{property.bathrooms === 1 ? "" : "s"}</span><span className="tag">{property.furnished ? "Furnished" : "Unfurnished"}</span>{property.ber && <span className="tag">BER {property.ber}</span>}<span className="tag">{property.parking ? "Parking included" : "No private parking"}</span>{property.facilities.filter((f) => f !== "Parking").map((f) => <span className="tag" key={f}>{f}</span>)}</div>
    {property.daftUrl && <p><a className="back" href={property.daftUrl} target="_blank" rel="noopener noreferrer">View the original listing on Daft.ie ↗</a></p>}

    <hr />
    <h2>Your everyday journeys</h2>
    <YourCommutes propertyId={property.id} />

    <hr />
    <h2>The neighbourhood</h2>
    <HomeMap markers={markers} circle={{ lat: property.lat, lng: property.lng, radius: 1000 }} height={420} />
    <MapLegend items={[
      { shape: "pin", color: mapColors.home, label: "This home" },
      { shape: "dot-sm", color: mapColors.bus, label: "Bus" },
      { shape: "dot", color: mapColors.luas, label: "Luas" },
      { shape: "dot", color: mapColors.rail, label: "Rail/DART" },
      { shape: "dot", color: mapColors.grocery, label: "Grocery" },
      { shape: "dot", color: mapColors.school, label: "School" },
      { shape: "dot", color: mapColors.kindergarten, label: "Childcare" },
      { shape: "ring", color: mapColors.radius, label: "1 km walk" },
    ]} />

    <h3>Public transport</h3>
    <p className="reason">{property.transportQuality} connectivity: {property.nearbyTransport}</p>
    {lines.length > 0 && <p className="reason">Rail within 800 m: {lines.join(", ")}</p>}
    {busRoutes.size > 0 && <p className="reason">Bus routes within 500 m: {[...busRoutes].slice(0, 24).join(", ")}{busRoutes.size > 24 ? "…" : ""}</p>}

    <h3>Everyday amenities</h3>
    {amenities.length === 0 ? <p className="muted">Amenity data not generated yet — run <code>npm run build:amenities</code>.</p> : (
      <ul className="amenity-list">
        {(Object.keys(amenityLabels) as AmenityCategory[]).map((category) => {
          const count = amenities.filter((a) => a.category === category).length;
          const n = nearest[category];
          return <li key={category}><span className="amenity-dot" style={{ background: mapColors[category] }} aria-hidden="true" /><span><strong>{amenityLabels[category]}</strong><span className="muted">{n ? `Nearest: ${n.name} · ${walk(n.distanceM)} (${n.distanceM} m)` : "None within 1 km"}{count > 1 ? ` · ${count}${count >= 15 ? "+" : ""} within 1 km` : ""}</span></span></li>;
        })}
      </ul>
    )}
    <p className="source-note">Map data and tiles © OpenStreetMap contributors. Journey times: OSRM routing on OpenStreetMap. Stop locations: NTA GTFS timetable file.</p>
    <div className="detail-cta"><p className="muted">See how this home compares with your other matches.</p><Link className="button" href="/results">Compare with other homes <span aria-hidden="true">→</span></Link></div>
  </div></section></main></div>;
}
