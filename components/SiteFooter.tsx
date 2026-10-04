import Link from "next/link";
import TramEasterEgg from "@/components/whimsy/TramEasterEgg";

// Server component, rendered once from app/layout.tsx on every route.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        {/* Decorative route line, styled in globals.css section 8 (Stage 3b). */}
        <div className="route-line route-line--footer" aria-hidden="true" />
        <div className="footer-brand">
          <Link className="brand" href="/">Home<span>Match</span></Link>
          <p className="footer-tagline">Next stop: your new home.</p>
        </div>
        {/* Easter egg (client component): ring the bell, or type the Konami code anywhere on the site. */}
        <div className="footer-egg-slot"><TramEasterEgg /></div>
        <ul className="footer-credits" aria-label="Data sources">
          <li>Map © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</li>
          <li>Timetables: NTA GTFS</li>
          <li>Routing: OSRM</li>
        </ul>
      </div>
    </footer>
  );
}
