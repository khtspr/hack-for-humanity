import type { CSSProperties } from "react";

// Plain module (no "use client"): renders in server and client components alike.
export type LegendShape = "pin" | "pin-alt" | "star" | "dot" | "dot-sm" | "diamond" | "ring";
export type LegendItem = { label: string; color: string; shape: LegendShape };

/** Map key. Swatches are decorative; the text label carries the meaning (colour is never the only cue). */
export default function MapLegend({ items, label = "Map key" }: { items: LegendItem[]; label?: string }) {
  return (
    <ul className="map-legend" aria-label={label}>
      {items.map((item) => (
        <li key={item.label}>
          <span className="legend-swatch" data-shape={item.shape} style={{ "--swatch": item.color } as CSSProperties} aria-hidden="true">{item.shape === "star" ? "★" : null}</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
