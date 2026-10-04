import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Page not found | HomeMatch" };

export default function NotFound() {
  return <div className="shell"><SiteHeader actions={<Link className="back" href="/preferences">Find a home</Link>} /><main id="main-content" tabIndex={-1}><section className="state-panel is-404" aria-labelledby="state-title"><div className="state-art" aria-hidden="true" /><p className="state-code" aria-hidden="true">404</p><p className="eyebrow">404 · Not in service</p><h1 id="state-title">This stop isn’t on the line</h1><p className="state-text">The page may have moved, or the link has a typo. Hop back on at the start, or head to your matches.</p><div className="state-actions"><Link className="button" href="/">Go to homepage</Link><Link className="button secondary" href="/results">See your matches</Link></div></section></main></div>;
}
