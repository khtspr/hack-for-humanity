// Plain module (no "use client") so server components can use these values too.
// Mirrors --map-* in app/globals.css. Hex only: Leaflet writes these into SVG attributes, which can't resolve var().
export const mapColors = {
  property: "#6cc24a",     // = --green-text (a home that fits)
  propertyAlt: "#ffa94d",  // = --warning ("Worth considering"; always paired with the dashed .is-alt ring)
  destination: "#f2f4f8",  // = --text (★ your places)
  home: "#6cc24a",         // = property (⌂ on the detail page)
  bus: "#5aa9ff",
  luas: "#f5b919",         // = --yellow
  rail: "#6cc24a",         // = --green-text (DART / rail)
  kindergarten: "#d8b4fe",
  school: "#fb923c",
  grocery: "#2dd4bf",
  radius: "#f5b919",       // 1 km walk circle (dashed)
  halo: "#05070d",         // = --bg, stroke around every dot
} as const;

export const stopColor = (types: number[]) => (types.includes(0) ? mapColors.luas : types.some((t) => t === 1 || t === 2) ? mapColors.rail : mapColors.bus);
