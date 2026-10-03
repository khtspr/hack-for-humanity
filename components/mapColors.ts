// Plain module (no "use client") so server components can use these values too.
export const mapColors = {
  property: "#185c3d",
  propertyAlt: "#b7791f",
  destination: "#1d2923",
  bus: "#2563eb",
  luas: "#9333ea",
  rail: "#0f766e",
  kindergarten: "#db2777",
  school: "#ea580c",
  grocery: "#16a34a",
} as const;

export const stopColor = (types: number[]) => (types.includes(0) ? mapColors.luas : types.some((t) => t === 1 || t === 2) ? mapColors.rail : mapColors.bus);
