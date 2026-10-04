// ─────────────────────────────────────────────────────────────
// DART LOADER — retro pixel-art Dublin DART running along the line.
// Adapted from the 21st.dev "rocket loader": the hero becomes an
// 8100-class DART (green/lime livery, yellow cab, red bumper), the
// speed lines and sparks reuse its fazer / lf keyframes, and the
// clouds, catenary poles and sleepers scroll past to sell the motion.
// Styles live in app/globals.css under "6. DART loader" (night-run
// palette); the train livery itself is unchanged.
// ─────────────────────────────────────────────────────────────

const C = {
  roof: "#8e9894",
  body: "#2f7a34",
  band: "#4f9a3c",
  stripe: "#cddc39",
  door: "#3e8a38",
  doorEdge: "#255f29",
  glass: "#1f2d33",
  glare: "#8fb9c7",
  cab: "#b5c91f",
  cabPanel: "#f2d21b",
  bumper: "#d32f2f",
  lamp: "#fff59d",
  sign: "#111",
  signLed: "#ff9800",
  frame: "#2c3133",
  bogie: "#3b3b3b",
  wheel: "#555",
  hub: "#8a8a8a",
  pantograph: "#3a3a3a",
}

const Window = ({ x, w = 7 }: { x: number; w?: number }) => (
  <>
    <rect x={x} y={12} width={w} height={9} fill={C.glass} />
    <rect x={x + 1} y={13} width={2} height={1} fill={C.glare} />
  </>
)

const Door = ({ x }: { x: number }) => (
  <>
    <rect x={x} y={11} width={10} height={25} fill={C.door} />
    <rect x={x} y={11} width={1} height={25} fill={C.doorEdge} />
    <rect x={x + 5} y={11} width={1} height={25} fill={C.doorEdge} />
    <rect x={x + 9} y={11} width={1} height={25} fill={C.doorEdge} />
    <rect x={x + 2} y={13} width={2} height={8} fill={C.glass} />
    <rect x={x + 7} y={13} width={2} height={8} fill={C.glass} />
  </>
)

const Bogie = ({ x }: { x: number }) => (
  <>
    <rect x={x} y={38} width={14} height={2} fill={C.bogie} />
    {[x + 1, x + 9].map((wx) => (
      <g key={wx}>
        <rect x={wx} y={40} width={4} height={4} fill={C.wheel} />
        <rect x={wx + 1} y={41} width={2} height={2} fill={C.hub} />
      </g>
    ))}
  </>
)

/** Carriage shell shared by both cars: roof, two-tone body, lime waist stripe, underframe. */
const Carriage = ({ x, w }: { x: number; w: number }) => (
  <>
    <rect x={x} y={7} width={w} height={2} fill={C.roof} />
    <rect x={x} y={9} width={w} height={27} fill={C.body} />
    <rect x={x} y={11} width={w} height={12} fill={C.band} />
    <rect x={x} y={23} width={w} height={2} fill={C.stripe} />
    <rect x={x} y={36} width={w} height={2} fill={C.frame} />
  </>
)

/** The pixel-art DART on its own (decorative, aria-hidden). Exported for reuse outside the loader. */
export function DartTrain() {
  return (
    <svg className="dart-train-svg" viewBox="0 0 124 44" shapeRendering="crispEdges" aria-hidden="true">
      {/* Rear car */}
      <Carriage x={2} w={56} />
      <Window x={5} />
      <Window x={14} />
      <Window x={23} />
      <Door x={33} />
      <Window x={46} />
      <Bogie x={6} />
      <Bogie x={40} />
      <rect x={58} y={30} width={3} height={3} fill={C.frame} />

      {/* Driving car */}
      <Carriage x={61} w={57} />
      <rect x={116} y={8} width={2} height={1} fill={C.roof} />
      <Window x={64} />
      <Window x={73} />
      <Door x={83} />
      <Window x={97} />
      <Bogie x={66} />
      <Bogie x={100} />

      {/* Cab: lime front, yellow panel, windscreen, destination sign, red bumper */}
      <rect x={108} y={9} width={12} height={27} fill={C.cab} />
      <rect x={120} y={11} width={2} height={23} fill={C.cab} />
      <rect x={108} y={25} width={14} height={8} fill={C.cabPanel} />
      <rect x={110} y={12} width={6} height={9} fill={C.glass} />
      <rect x={111} y={13} width={2} height={1} fill={C.glare} />
      <rect x={118} y={12} width={4} height={9} fill={C.glass} />
      <rect x={109} y={9} width={9} height={2} fill={C.sign} />
      {[110, 112, 114, 116].map((lx) => (
        <rect key={lx} x={lx} y={10} width={1} height={1} fill={C.signLed} />
      ))}
      <rect x={106} y={33} width={16} height={3} fill={C.bumper} />
      <rect x={120} y={29} width={2} height={2} fill={C.lamp} />
      <rect x={61} y={36} width={59} height={2} fill={C.frame} />

      {/* Pantograph reaching up to the overhead wire */}
      <rect x={82} y={6} width={9} height={1} fill={C.pantograph} />
      {[
        [83, 5], [84, 4], [85, 3], [86, 2],
        [89, 5], [88, 4], [87, 3],
      ].map(([px, py]) => (
        <rect key={`${px}-${py}`} x={px} y={py} width={1} height={1} fill={C.pantograph} />
      ))}
      <rect x={83} y={1} width={8} height={1} fill={C.pantograph} />
    </svg>
  )
}

export interface DartLoaderProps {
  title?: string
  detail?: string
}

export function DartLoader({
  title = "Next stop: homes that fit your life",
  detail = "Timing every journey on the Luas, DART and bus network",
}: DartLoaderProps) {
  return (
    <div className="dart-loader-card" role="status" aria-live="polite">
      <div className="dart-loader" aria-hidden="true">
        <div className="dart-clouds">
          <div className="dart-cloud dart-cloud1" />
          <div className="dart-cloud dart-cloud2" />
          <div className="dart-cloud dart-cloud3" />
          <div className="dart-cloud dart-cloud4" />
          <div className="dart-cloud dart-cloud5" />
        </div>
        <div className="dart-catenary" />
        <div className="dart-speedlines">
          <span /><span /><span /><span />
        </div>
        <div className="dart-train">
          <div className="dart-train-body">
            <DartTrain />
            <div className="dart-sparks">
              <span /><span /><span /><span />
            </div>
          </div>
        </div>
        <div className="dart-track" />
      </div>
      <p className="dart-loader-title">
        {title}
        <span className="dart-dots" />
      </p>
      <p className="muted dart-loader-detail">{detail}</p>
    </div>
  )
}

export default DartLoader
