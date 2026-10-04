import Link from "next/link";
import type { ReactNode } from "react";

// Server component (no "use client", no hooks). Client pages can render it too.
export type SiteHeaderProps = {
  /** "overlay" sits over the home hero photo (pass it as the hero's children). */
  variant?: "solid" | "overlay";
  /** Right-hand nav content: links (use className="back") or a plain status span. */
  actions?: ReactNode;
};

export default function SiteHeader({ variant = "solid", actions }: SiteHeaderProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={variant === "overlay" ? "site-header site-header--overlay" : "site-header"}>
        <Link className="brand" href="/">Home<span>Match</span></Link>
        {actions && <nav className="site-nav" aria-label="Main navigation">{actions}</nav>}
      </header>
    </>
  );
}
