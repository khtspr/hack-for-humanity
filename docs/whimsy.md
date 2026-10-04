# HomeMatch whimsy spec

Stage 3a output, implemented by Stage 3b. This is a spec only, so no code has changed yet.
Scope: plan §4. Tokens such as `--yellow`, `--yellow-press`, `--green`, `--green-text`, `--bg`, `--board`, `--font-mono` and `--control` come from plan §1 and `docs/design-system.md`.

**Ground rules for Stage 3b**
- No new dependencies.
- Don't change the hero's scroll logic. In `luas-door-hero.tsx`, only the `HERO_CSS` string may change.
- All whimsy CSS goes in `globals.css` §8, including its own reduced-motion and forced-colors blocks at the end of §8.
- Nothing whimsical may delay navigation, block input or move focus.

---

## 0. At a glance

| # | Element | Files | Trigger | Motion | Reduced motion |
|---|---|---|---|---|---|
| 1 | ScoreTicker | `components/whimsy/ScoreTicker.tsx` (new), used by home, results cards, `YourCommutes` | A score enters the viewport for the first time | 600 ms digit flips at a 50 ms tick | No animation; the final value is shown |
| 2 | Boarding buttons | §8 CSS, plus `HERO_CSS` `.ldh-cta` | Hover / press | 140 ms lift, 60 ms sink | States apply instantly, with no transition |
| 3 | Doors closing… | `app/preferences/page.tsx` | Valid form submit | None (label swap only) | Same |
| 4 | Luas route line | §8 CSS (pseudo-elements), plus one footer `<div>` | Static | None | Same |
| 5 | DART easter egg | `components/whimsy/TramEasterEgg.tsx` (new), mounted in `SiteFooter` | Konami code or 🔔 button | 2800 ms stepped pass | Fades in and out in place (1950 ms) |
| 6 | Favicon | `app/icon.svg` (new, optional) | n/a | n/a | n/a |

**Shared motion constants.** Put these in their own `:root` block at the top of §8. If `design-system.md` already defines equivalent motion tokens, alias these names to them.

```css
:root {
  --w-tick: 50ms;                         /* departure-board cadence: ticker flips, egg steps */
  --w-press: 60ms;                        /* button sink: must feel instant */
  --w-lift: 140ms;                        /* hover lift and release */
  --w-ease-out: cubic-bezier(.2, .8, .2, 1);
  --w-ring: 450ms;                        /* bell swing */
  --stop-size: 18px; --stop-ring: 4px; --track: 4px;  /* route line */
}
```

Everything that ticks uses 50 ms, so the ticker and the egg share one rhythm, like a real departure board.

---

## 1. Brand personality framework

### Voice: a friendly Dublin transit announcer
The voice is warm, brief and calm, and never sarcastic. It sounds like the person on the platform who tells you what's happening and what to do next. Finding a home in Dublin is stressful, so the voice is never cute about money, rejection or scarcity.

| Context | How it shows up | Example |
|---|---|---|
| Professional (forms, prices, scores, trade-offs) | No personality. Literal words only. | "Maximum monthly rent (€)", "Note: …" |
| Casual (loading, helper text, footer) | A light transit metaphor | "Checking the timetable…" |
| Error | Own the problem, give one literal next step, never blame the user | "Signal failure on the line" + "Try again" |
| Success / discovery | Understated. The only exclamation mark on the site is "Ding ding!" | "Ding ding! A DART just passed by." |

### Where personality goes, and where it doesn't
- **Yes:** loading, empty, error and 404 states; helper text; the footer tagline; pending labels; the easter egg.
- **No:** form labels and legends; primary and secondary button labels (only the pending state of submit changes); nav links; prices, scores and units; "Note:" trade-offs; data credits; accessible names (the egg is the only exception).

### Writing rules
1. **Metaphor, then literal meaning, then literal action.** The metaphor sits in the headline. The body says plainly what happened, and the button says plainly what to do. Many users are new to Dublin, so every message must still make sense to someone who doesn't know what the Luas or the DART is.
2. Headlines are 6 words or fewer, and bodies are 2 sentences or fewer. Use sentence case.
3. Use a real ellipsis `…` for anything in progress. Use no emoji in copy; the 🔔 button is decorative and `aria-hidden`.
4. **Words to use:** next stop, line, timetable, signal failure, service update, not in service, terminus, doors closing, ding ding.
5. **Words to avoid:**
   - London-isms: "Mind the gap", "Tube", and the roundel with a bar, which is a TfL trademark.
   - Stage-Irish clichés: craic, shamrocks, leprechauns.
   - Irish-language words that newcomers can't parse.
   - Jokes about rent, affordability or rejection.
6. **Inclusive:** use "you" and "your places", not "your commute to the office". Don't assume a car, a job or a partner.

### Whimsy taxonomy
- **Subtle:** route lines, boarding buttons.
- **Interactive:** ScoreTicker, Doors closing….
- **Discovery:** the DART egg (Konami code), with the 🔔 button as the discoverable path for touch users.
- **Contextual:** the microcopy in §3.

**Budget:** apart from the functional DART loader, only one moving whimsy element may be on screen at a time. Nothing that starts on its own runs longer than 600 ms.

---

## 2. Elements

### 2.1 ScoreTicker: departure-board digit flip
**File:** `components/whimsy/ScoreTicker.tsx` (`"use client"`, default export).

```ts
interface ScoreTickerProps {
  value: number;      // integer 0–100, rendered with String(value), never toLocaleString
  suffix?: string;    // e.g. "%"; static, never animated, included in the SR text. Default ""
  duration?: number;  // ms, default 600
  className?: string;
}
```

**DOM.** The server render and the first client render are identical and show the final value.

```html
<span class="ticker {className}">
  <span class="sr-only">92%</span>                    <!-- value + suffix: what screen readers get -->
  <span class="ticker-face" aria-hidden="true">
    <span class="ticker-cell">9</span><span class="ticker-cell">2</span>%
  </span>
</span>
```

**Usage.** Replace the number inside the tile, and keep surrounding words outside the ticker.
- **Home:** `<span className="score-tile"><ScoreTicker value={92} suffix="%" /> match</span>`, and the same for 87.
- **Results card:** `<ScoreTicker value={result.score} suffix="%" />` followed by the `<small> LIFE MATCH</small>`.
- **`YourCommutes`:** `<ScoreTicker value={result.score} suffix="%" /> Life Match`.
- **Not used for:** the comparison panel (the user has already seen those numbers) and map pins (Leaflet HTML).

**Behaviour**
- In `useEffect`, bail out if `matchMedia("(prefers-reduced-motion: reduce)").matches` is true or `IntersectionObserver` isn't available.
- Otherwise observe the wrapper with `{ threshold: 0.6 }`. On the first intersection, disconnect and start the animation. It runs once per mount.
- **Timing:** the animation is time-based, using `requestAnimationFrame`. The start time is the timestamp of the first rAF frame, so a hidden tab starts the animation when it becomes visible.
  ```
  TICK = 50, STAGGER = 120, n = digits.length
  lockAt(i) = duration - (n - 1 - i) * STAGGER     // left-to-right settle; last digit at `duration`
  flips(i)  = floor(lockAt(i) / TICK)
  tick      = floor(elapsed / TICK)
  cell(i)   = elapsed >= lockAt(i) ? final[i] : (final[i] - (flips(i) - tick) % 10 + 10) % 10
  ```
- Each cell counts upward through digits in order, like a split-flap board, and lands exactly on the real digit. Nothing is random, so `Math.random` isn't needed.
- **State:** `const [tick, setTick] = useState<number | null>(null)`. `null` means idle and shows the final value. Call `setTick` only when the tick number changes, which means 13 renders or fewer per run. Set it back to `null` when `elapsed >= duration`.
- **Cleanup:** cancel the rAF and disconnect the observer on unmount.
- **Value changes after mount:** render the new value immediately, with no animation.

**CSS (§8)**
```css
.ticker { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ticker-face { user-select: none; }          /* copying the text gives "92%" once, from the sr-only span */
.ticker-cell { display: inline-block; min-width: 1ch; text-align: center; }
```
The number of cells is always `String(value).length`, so the width never changes.

**Failure modes to avoid**
- Using `useLayoutEffect` (it triggers an SSR warning).
- Reading `matchMedia` or `window` during render.
- Writing `textContent` into nodes that React owns.
- Re-triggering on hover re-renders (the results parent re-renders on `highlightId`).
- Formatting with locale APIs.
- Animating the `.sr-only` copy.

### 2.2 "Boarding" buttons (CSS only)
**Model.** The step shadow is the platform edge, and it stays fixed 4 px below the resting button in every state.
- **Hover:** the button lifts 2 px and the shadow grows to 6 px.
- **Press:** the button sinks 4 px and the shadow drops to 0.

```css
.button { position: relative; transition: transform var(--w-lift) var(--w-ease-out), box-shadow var(--w-lift) var(--w-ease-out); }
/* Hit-slop: the button moves under the pointer, so extend the hit area upward.
   Otherwise a press on the top 4px misses the click. */
.button::after { content: ""; position: absolute; inset: -6px 0 0; }
@media (hover: hover) {
  .button:not(.secondary):not(:disabled):not([aria-disabled="true"]):hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--yellow-press); }
  .button:hover > span[aria-hidden="true"] { transform: translateX(3px); }
}
.button > span[aria-hidden="true"] { display: inline-block; transition: transform var(--w-lift) var(--w-ease-out); }
.button:not(.secondary):active,
.button[data-state="closing"] { transform: translateY(4px); box-shadow: 0 0 0 var(--yellow-press); transition-duration: var(--w-press); }
.button.secondary:active { transform: translateY(2px); transition-duration: var(--w-press); }
```

**Before editing, check Stage 2's `.button`.** If Stage 2 already uses `::after` on `.button`, use `::before` for the hit-slop instead.
- The resting `box-shadow` stays `var(--shadow-step)` (Stage 2).
- Secondary buttons have no step shadow and no hover lift; their colour change on hover is enough.

**Hero `.ldh-cta`.** Edit `HERO_CSS` lines 82–85 only, keeping the template string and `dangerouslySetInnerHTML`. Keep the existing soft shadow and add the step layer.
```
.ldh-cta { …existing…; position: relative; box-shadow: 0 4px 0 var(--yellow-press, #b98a0c), 0 10px 30px rgba(0,0,0,0.35);
           transition: transform 140ms cubic-bezier(.2,.8,.2,1), box-shadow 140ms cubic-bezier(.2,.8,.2,1); }
.ldh-cta::after { content: ""; position: absolute; inset: -6px 0 0; }
@media (hover: hover) { .ldh-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--yellow-press, #b98a0c), 0 14px 36px rgba(0,0,0,0.45); } }
.ldh-cta:active { transform: translateY(4px); box-shadow: 0 0 0 var(--yellow-press, #b98a0c), 0 4px 12px rgba(0,0,0,0.35); transition-duration: 60ms; }
@media (prefers-reduced-motion: reduce) { .ldh-cta, .ldh-cta span { transition: none; } }
```
The existing `.ldh-cta:hover span` arrow nudge stays.

**Reduced motion (§8):** `.button, .button > span { transition: none; }`. The states still apply, but instantly; the press feedback is useful in its own right.

**Forced colours:** box-shadows disappear in forced-colours mode. Make sure `.button` keeps a `ButtonText` border (Stage 2 §9). The press offset still gives feedback.

**Failure modes to avoid**
- Missed clicks on the top edge (the hit-slop above prevents this).
- Sticky hover lift on touch devices (the `(hover: hover)` guard prevents this).
- Lowering opacity on the closing state, which would drop contrast.
- Animating `top` or `margin` instead of `transform`.

### 2.3 "Doors closing…" submit
**File:** `app/preferences/page.tsx`.
- **Idle label:** "Show my life matches →" (unchanged).
- **Pending label:** "Doors closing…".

**Behaviour**
- `const [closing, setClosing] = useState(false)`.
- In `submit()`, after `event.preventDefault()`:
  1. `if (closing) return;` This blocks double submits from repeat clicks and from Enter in a field.
  2. `setClosing(true)`.
  3. Write to `localStorage`, then call `router.push("/results")` in the same tick.
- There's no artificial delay. On fast machines the label flashes for a moment, which is fine; on slow route loads it reassures.
- The label changes only in `onSubmit`, never `onClick`, so invalid forms (native `required` validation) never show it.
- **Safety reset:** a `useEffect` keyed on `closing` sets a 8000 ms timeout that calls `setClosing(false)`, and clears it on cleanup. This covers a navigation that fails silently.
- **Optional:** `useEffect(() => router.prefetch("/results"), [])` so the push is instant.

**DOM and ARIA.** Both labels sit in one grid cell, so the button keeps its width and there's no layout shift.
```tsx
<button className="button" type="submit" aria-disabled={closing || undefined} data-state={closing ? "closing" : undefined}>
  <span className="btn-labels">
    <span data-active={!closing}>Show my life matches <span aria-hidden="true">→</span></span>
    <span data-active={closing}>Doors closing…</span>
  </span>
</button>
```
```css
.btn-labels { display: inline-grid; }
.btn-labels > span { grid-area: 1 / 1; }
.btn-labels > [data-active="false"] { visibility: hidden; }   /* also removes it from the accessibility tree */
.button[data-state="closing"] { cursor: progress; }
```
- Use `aria-disabled`, not `disabled`. A disabled button drops focus to `<body>`, while `aria-disabled` keeps focus and context.
- Add no extra live region. The results page's DART loader (`role="status"`) announces the next step.
- The sunk visual comes from §2.2. The button stays pressed down, like a door button that's been pushed.

**Failure modes to avoid:** a stuck "Doors closing…" state (the 8 s reset prevents it); the width jumping; changing the idle label; using `disabled`.

### 2.4 Luas route line (CSS only, static)
This uses no animation, so it needs no reduced-motion handling.
- **Track:** yellow, `var(--track)` thick.
- **Stops:** hollow roundels, `var(--stop-size)` wide, made of a `var(--stop-ring)` yellow border on a transparent fill.
- **Segments:** each runs from the outer edge of one roundel to the outer edge of the next, so a hole never needs to match the background colour.
- **Pseudo-elements:** always `content: ""`, never a glyph, because screen readers read pseudo-element text.

**a) Home steps: `<ol id="how-it-works" class="steps">`, three `<li>` elements**

Desktop: the line runs horizontally across the top.
```css
.steps { --route-gap: 20px; column-gap: var(--route-gap); border-top: 0; list-style: none; padding-left: 0; }
.steps > li { position: relative; padding-top: 36px; border-right: 0; }
.steps > li::before {          /* stop roundel */
  content: ""; position: absolute; top: 0; left: 0; box-sizing: border-box;
  width: var(--stop-size); height: var(--stop-size); border-radius: 50%;
  border: var(--stop-ring) solid var(--yellow); background: transparent; }
.steps > li:not(:last-child)::after {   /* segment to the next stop */
  content: ""; position: absolute; top: calc((var(--stop-size) - var(--track)) / 2);
  left: var(--stop-size); width: calc(100% + var(--route-gap) - var(--stop-size));
  height: var(--track); border-radius: 2px; background: var(--yellow); }
.steps > li:last-child::before {   /* terminus: green, slightly larger */
  width: 22px; height: 22px; top: -2px; left: -2px; background: var(--green); border-color: var(--green-text); }
```
The route line replaces the old `border-top` and `border-right` dividers. The `--route-gap` variable drives both the grid gap and the segment width, so the two can't drift apart.

Mobile (≤760px): the line runs vertically on the left. Set `.steps { row-gap: var(--route-gap) }`, then:
- `li`: `padding: 2px 0 0 40px; border-bottom: 0`.
- Roundel: unchanged, at `top: 0; left: 0`.
- Segment:
  ```
  top: var(--stop-size);
  left: calc((var(--stop-size) - var(--track)) / 2);
  width: var(--track);
  height: calc(100% + var(--route-gap) - var(--stop-size));
  ```

Step eyebrows read "Stop 01 / 02 / 03" in the source text, and CSS uppercases them. The `<ol>` gives screen readers the order.

**b) Preferences destinations: `.destination-route > .destination-editor` (always vertical)**
```css
.destination-route { --route-gap: 18px; }
.destination-route > .destination-editor { position: relative; margin: var(--route-gap) 0 var(--route-gap) 32px; }
.destination-route > .destination-editor::before {     /* roundel level with the "Work" heading */
  content: ""; position: absolute; left: -32px; top: 20px; box-sizing: border-box;
  width: var(--stop-size); height: var(--stop-size); border-radius: 50%; border: var(--stop-ring) solid var(--yellow); }
.destination-route > .destination-editor:not(:last-child)::after {
  content: ""; position: absolute; left: calc(-32px + (var(--stop-size) - var(--track)) / 2);
  top: calc(20px + var(--stop-size)); width: var(--track);
  height: calc(100% + var(--route-gap) - var(--stop-size)); background: var(--yellow); }
.destination-route::after {   /* dashed stub: "extend the line", pointing at "+ Add another destination" */
  content: ""; display: block; width: var(--track); height: 20px; margin-left: calc((var(--stop-size) - var(--track)) / 2);
  background: repeating-linear-gradient(var(--yellow) 0 4px, transparent 4px 8px); opacity: .6; }
```
- There's no terminus here; green is reserved for "home". Adding or removing a stop updates the line through CSS alone.
- At ≤520px, use a 24px left offset instead of 32px.
- Vertical margins between editors collapse, so the space between them equals `--route-gap`.

**c) Footer**

Stage 2's `SiteFooter` renders `<div className="route-line route-line--footer" aria-hidden="true" />` above the tagline. If Stage 2 used a different class name, rename it in one place.
```css
.route-line--footer {
  --route-hole: var(--bg);                 /* set to the footer's background if it isn't --bg */
  position: relative; height: 14px; margin-right: 11px;
  background:
    radial-gradient(circle, var(--route-hole) 0 3px, var(--yellow) 3.5px 7px, transparent 7.5px) 0 50% / 25% 14px repeat-x,
    linear-gradient(var(--yellow), var(--yellow)) 0 50% / 100% 3px no-repeat; }
.route-line--footer::after {               /* green terminus at the right end */
  content: ""; position: absolute; right: -11px; top: 50%; transform: translateY(-50%); box-sizing: border-box;
  width: 22px; height: 22px; border-radius: 50%; background: var(--green); border: 3px solid var(--green-text); }
@media (max-width: 760px) { .route-line--footer { background-size: 50% 14px, 100% 3px; } }   /* 2 stops */
```
The footer line stays horizontal on mobile, because a vertical decorative strip would waste space. The terminus sits next to "Next stop: your new home."

**Forced colours (§8):** apply `forced-color-adjust: none` to the route-line pseudo-elements and the footer line. Draw the track and rings in `CanvasText` and the terminus in `Highlight`. The footer gradient may simply disappear, which is acceptable because it's decorative.

**Failure modes to avoid**
- Glyphs in `content`.
- Segments that don't meet the next roundel because the gap value drifted (use one `--route-gap`).
- Old dividers still showing.
- A line in the footer that captures clicks (it's a non-interactive `div`).

### 2.5 DART easter egg
**File:** `components/whimsy/TramEasterEgg.tsx` (`"use client"`, default export, no props). The name follows the plan; the vehicle is the DART.
- Stage 2's `SiteFooter` mounts it once, in the egg slot.
- Because the footer lives in the layout, the egg works on every page and keeps running across client-side navigation.

**Server render:** only the bell button and an empty live region. The overlay mounts on the client only, after a trigger, through `createPortal(…, document.body)`. Using `body` means no transformed ancestor can break `position: fixed`.

```tsx
<button type="button" className="egg-bell" aria-label="Ring the bell" onClick={trigger} data-ringing={running || undefined}>
  <span aria-hidden="true">🔔</span>
</button>
<span className="sr-only" role="status" aria-live="polite">{announcement}</span>
{running && createPortal(
  <div className={`egg-run${still ? " egg-run--still" : ""}`} aria-hidden="true">
    <div className="egg-train">
      <span className="egg-chip">Ding ding!</span>
      <div className="egg-train-body"><DartTrain /></div>   {/* import { DartTrain } from "@/components/ui/dart-loader" */}
    </div>
  </div>, document.body)}
```

**Triggers**

1. **Konami code.** Add one `window` `keydown` listener in `useEffect` and remove it on cleanup. Keep a rolling buffer of the last 10 normalised keys and match it against:
   ```
   ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"]
   ```
   - Normalise keys with `e.key.toLowerCase()`.
   - **Skip the key:** if `e.repeat`, `altKey`, `ctrlKey` or `metaKey` is set.
   - **Clear the buffer:** if the target is editable, or is inside `.leaflet-container`, where arrow keys pan the map.
     ```ts
     // editable target
     el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
     ```
     Copy this 3-line helper; don't import it from the hero.
   - Never call `preventDefault`.
   - Don't check `e.defaultPrevented`, because the home hero calls `preventDefault` on arrow keys while it's pinned. Arrow keys will also scrub the hero intro, which is fine.
2. **🔔 button click.**

**Run behaviour**
- **While running:** ignore new triggers; runs don't stack, and the button stays enabled so focus isn't lost.
- **Mode:** read `still = matchMedia("(prefers-reduced-motion: reduce)").matches` when the egg is triggered.
- **Announcement:** set it to "Ding ding! A DART just passed by.", then clear it to `""` 1000 ms after the run ends. Clearing it means the next ring announces again.
- **End of run:** a `setTimeout` is the source of truth, not `animationend`, which can fail to fire in hidden tabs.
  - Unmount the overlay at **2850 ms** (normal) or **1950 ms** (still).
  - Clear all timers on unmount.

**Timeline (normal).** Everything is pointer-events-free and over within 3 s.

| Time | What happens |
|---|---|
| 0 ms | The overlay fades in (`opacity` 0→1, 150 ms, `ease-out`). The rail and wire appear. |
| 0–2800 ms | The train moves from off-screen left to off-screen right with `steps(56, end)`, so each 50 ms step matches the board tick. It rumbles with the existing `dart-rumble .32s steps(2) infinite`. |
| 2600–2800 ms | The overlay fades out (200 ms, `ease-in`, delay 2600 ms). |
| 2850 ms | The overlay unmounts. |

**CSS (§8)**
```css
.egg-run { --egg-scale: 2; --egg-w: calc(124px * var(--egg-scale)); position: fixed; left: 0; right: 0;
  bottom: env(safe-area-inset-bottom, 0px); height: calc(44px * var(--egg-scale) + 26px); z-index: 60;  /* 22px chip headroom + 4px rail */
  overflow: hidden; pointer-events: none;
  animation: egg-fade-in 150ms ease-out both, egg-fade-out 200ms ease-in 2600ms forwards; }
.egg-run::before { content: ""; position: absolute; left: 0; right: 0; top: calc(22px + var(--egg-scale) * 1px); height: 1px; background: #7d8596; }  /* catenary wire at pantograph height */
.egg-run::after  { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--line-strong); }   /* rail */
.egg-train { position: absolute; bottom: 4px; left: calc(-1 * var(--egg-w)); width: var(--egg-w);
  forced-color-adjust: none; will-change: transform;
  animation: egg-pass 2800ms steps(56, end) forwards; }
.egg-train-body { animation: dart-rumble .32s steps(2) infinite; }
.egg-chip { position: absolute; right: 0; bottom: 100%; margin-bottom: 2px; padding: 2px 6px; background: var(--board);
  color: var(--yellow); font: 700 12px/1.2 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
@keyframes egg-pass { to { transform: translateX(calc(100vw + var(--egg-w))); } }
@keyframes egg-fade-in { from { opacity: 0; } }
@keyframes egg-fade-out { to { opacity: 0; } }
@media (max-width: 520px) { .egg-run { --egg-scale: 1; } }   /* integer scales only, so the pixel art stays crisp */
```
- **Chip placement:** the chip rides above the cab, inside the 22px headroom that is already part of the strip's height. The wire is drawn behind it.
- **Bell:**
  ```css
  .egg-bell { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; border-radius: 999px;
    border: 1px solid var(--control); background: transparent; cursor: pointer; }
  .egg-bell:hover { border-color: var(--yellow); }
  ```
  Focus uses the global yellow ring.
- **Bell swing:** `.egg-bell[data-ringing] > span` runs `egg-ring var(--w-ring) cubic-bezier(.36,.07,.19,.97)` with `transform-origin: 50% 10%`.
  ```
  @keyframes egg-ring: 0% rotate(0), 20% rotate(14deg), 40% rotate(-10deg), 60% rotate(6deg), 80% rotate(-3deg), 100% rotate(0)
  ```

**Reduced motion: `.egg-run--still`, also guarded by an `@media (prefers-reduced-motion: reduce)` block**
- The train doesn't move or rumble: `.egg-train { left: 50%; transform: translateX(-50%); animation: none; }` and `.egg-train-body { animation: none; }`.
- The overlay animation becomes `egg-fade-in 200ms ease-out both, egg-fade-out 300ms ease-in 1600ms forwards`. Unmount at 1950 ms.
- The bell doesn't swing.
- If Stage 2's §9 uses a universal `* { animation-duration: .01ms !important }` kill switch, add `!important` to the `.egg-run--still` animation declaration. The class selector then beats `*`, and the fade survives; opacity changes aren't motion.

**Not included:** sound, confetti, persistence or a counter. The egg is a 3-second wink.

**Failure modes to avoid**
- Swallowing keys.
- Triggering while the user types an address.
- Stacked runs.
- Horizontal scrollbars (prevented by `overflow: hidden` on the fixed strip).
- The overlay intercepting clicks.
- Rendering the overlay on the server.
- Relying on `animationend`.
- An unchanged live text that doesn't re-announce.

### 2.6 Favicon (optional): `app/icon.svg`
Next 14 picks this file up automatically. It's a route-stop marker: a yellow ring with a green "home" centre. There's deliberately no horizontal bar, to avoid the TfL roundel. It's legible on both light and dark tab strips.
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#05070d"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="#f5b919" stroke-width="5"/>
  <circle cx="16" cy="16" r="3.5" fill="#6cc24a"/>
</svg>
```

---

## 3. Microcopy

Line numbers refer to the files before Stage 2. Find each string by its current text, because Stage 2 may have moved it. "New" means the string doesn't exist yet.

| # | File · element | Current | New | Notes |
|---|---|---|---|---|
| 1 | `components/ui/dart-loader.tsx:131`, `title` default | Finding homes that fit your life | **Next stop: homes that fit your life** | The animated `.dart-dots` stay after it. The card is already `role="status"`. |
| 2 | `dart-loader.tsx:132`, `detail` default | Checking routes on the Dublin transport network | **Timing every journey on the Luas, DART and bus network** | |
| 3 | `app/results/page.tsx` loading branch, *optional* | (none) | **Still on the line — searches with lots of places take a little longer** | Pass as `detail` after 8000 ms (a timer in the loading branch). It's announced once by the status region. |
| 4 | `results/page.tsx:47` error `.state-panel`, board chip / eyebrow | (none) | **Service update** | |
| 5 | Error heading (`h1`) | Sorry, we couldn’t calculate your matches ({error}). | **Signal failure on the line** | Wrap the heading and body in `role="alert"`. |
| 6 | Error body | (none) | **We couldn’t work out your matches just now. Your preferences are saved, so trying again usually gets things moving.** | This is true: the preferences live in localStorage. |
| 7 | Error technical line | (inside the sentence above) | **Details: {error}** | `<small>`, mono, muted |
| 8 | Error primary button | (none) | **Try again** | Prefer re-running the fetch (reset `error` so the DART loader shows again) over a full reload. |
| 9 | Error secondary link | Back to preferences | Back to preferences (unchanged) | |
| 10 | Results empty state (new, `results.length === 0`), board chip | (none) | **0 homes** | Mono |
| 11 | Empty heading (`h1`) | (none) | **No homes on this line yet** | Wrap the heading and body in `role="status"`. |
| 12 | Empty body | (none) | **Nothing matched all of your preferences this time. Try a higher budget, a longer journey time or another way to travel — small changes can open up whole new areas.** | |
| 13 | Empty button | (none) | **Edit life preferences** → `/preferences` | Matches the existing nav label |
| 14 | `results/page.tsx:53` compare hint `<span className="muted">` | Select two to compare | 0 selected: **Select two to compare**<br>1 selected: **Pick one more to compare**<br>2 selected: **Comparison ready.** plus link **Jump to it ↑** (`href="#comparison-title"`, arrow `aria-hidden`) | Add `aria-live="polite"` to the span. It must exist on first render (it does). The panel opens above the list, so without the link it could open off-screen. |
| 15 | `components/YourCommutes.tsx:21`, loading | Working out your journeys… | **Checking the timetable…** | Add `role="status"` |
| 16 | `YourCommutes.tsx:22`, failure | We couldn’t calculate journeys for this home. | **Signal failure — we couldn’t work out journeys for this home. Refresh the page to try again.** | Add `role="status"` |
| 17 | `components/Map.tsx:10`, loading placeholder | Loading map… | **Unfolding the map…** | No ARIA (several maps would chatter) |
| 18 | `app/not-found.tsx` (new), board chip | (none) | **404 · Not in service** | Mono, yellow on `--board` |
| 19 | 404 heading (`h1`) | (none) | **This stop isn’t on the line** | |
| 20 | 404 body | (none) | **The page may have moved, or the link has a typo. Hop back on at the start, or head to your matches.** | |
| 21 | 404 primary button | (none) | **Go to homepage** → `/` | |
| 22 | 404 secondary button | (none) | **See your matches** → `/results` | |
| 23 | `components/SiteFooter.tsx` (new), tagline | (none) | **Next stop: your new home.** | |
| 24 | `TramEasterEgg`, bell accessible name | (none) | **Ring the bell** | `aria-label`; the emoji is `aria-hidden` |
| 25 | `TramEasterEgg`, live region | (none) | **Ding ding! A DART just passed by.** | Cleared after the run |
| 26 | `TramEasterEgg`, visible chip | (none) | **Ding ding!** | `aria-hidden` (CSS uppercases it) |
| 27 | `app/preferences/page.tsx:24`, submit (pending state only) | Show my life matches → | Idle: unchanged<br>Pending: **Doors closing…** | See §2.3 |
| 28 | `preferences/page.tsx:24`, `.help-text` under "Where does your life happen?" | Add the places you regularly need to reach. We’ll weight frequent, important journeys more heavily. | **Add the places you travel to regularly — they’re the stops on your line. We’ll give frequent, important journeys more weight.** | Ties into the route line |
| 29 | `app/page.tsx:10`, step eyebrows | 01 / 02 / 03 | **Stop 01 / Stop 02 / Stop 03** | Written in sentence case in the source; CSS uppercases it |

**Unchanged on purpose:**
- the hero title and CTA, all form labels and legends, and all button and nav labels;
- "Note:" trade-offs, prices, scores and units;
- data credits;
- the amenity developer message (`npm run build:amenities`);
- the comparison note, the side-card "A lower score does not mean a bad home…", and the home footnote.

Use typographic apostrophes (’) to match the existing copy.

---

## 4. Accessibility and performance checklist

**Accessibility**
- [ ] Every CSS animation and transition in §8 has a `prefers-reduced-motion` guard: ticker (in JS), buttons, bell swing, and the egg (still mode). The `HERO_CSS` press has its own guard. JS reads `matchMedia` only inside effects or handlers, never during render.
- [ ] Screen readers get real values. The ticker's `.sr-only` copy contains value plus suffix and its face is `aria-hidden`. The egg overlay, route lines and emoji are all `aria-hidden`, or `content: ""`.
- [ ] Live regions (the egg status and the compare hint) exist in the server HTML. They're polite, one sentence each, and never `assertive`. The error panel uses `role="alert"` once.
- [ ] No whimsy moves focus or traps it. Submit uses `aria-disabled`, so focus stays on it. The bell stays enabled while running.
- [ ] The Konami listener never calls `preventDefault`. It ignores inputs, textareas, selects, contentEditable, the Leaflet map, modifier keys and key repeats. Typing "b" and "a" into an address field never fires it.
- [ ] Moving content is user-initiated and lasts 5 s or less (the egg runs for 2.85 s), which satisfies WCAG 2.2.2. The ticker's 20 Hz digit changes cover a small area with no luminance flash, which satisfies WCAG 2.3.1.
- [ ] Contrast:
  - yellow on `--bg`: about 11.3:1
  - `--on-yellow` on yellow: about 10.6:1
  - the egg chip (yellow on `#000`): about 11.8:1
  - the bell border uses `--control`: 3:1 or more
  - the closing state keeps full opacity
- [ ] The bell is at least 44×44 px. The button hit-slop compensates for the 4 px sink.
- [ ] Forced colours: buttons keep borders, route lines fall back to `CanvasText` and `Highlight` (or are hidden), and the egg train is `forced-color-adjust: none` because it's an illustration.
- [ ] Copy follows the pattern of metaphor, then literal meaning, then literal action, and it still makes sense to someone who has never heard of the Luas or the DART.

**Performance**
- [ ] No new dependencies, images or fonts. The egg reuses the inline `DartTrain` SVG.
- [ ] Only `transform` and `opacity` animate; the button `box-shadow` is a single small element. `will-change` is set only on `.egg-train`, which exists only while the egg runs.
- [ ] The ticker causes 13 renders or fewer per instance, starts only when visible, runs once, and disconnects its observer. The egg uses one keydown listener, and its overlay is mounted only for under 3 s.
- [ ] No layout shift: the ticker has a fixed cell count with `tabular-nums`; the submit button stacks both labels in one grid cell; route lines are pseudo-elements on existing boxes.
- [ ] No hydration risk: server HTML equals the first client render everywhere. Nothing random, time-based or `window`-based is rendered, and the portal is client-only after a trigger.
- [ ] Nothing waits on whimsy: `router.push` runs in the same tick as "Doors closing…", and every overlay is `pointer-events: none`.
- [ ] Verify with `npx tsc --noEmit`, `npm run build` (stop the preview first), then confirm the browser console shows no hydration warnings on `/`, `/preferences`, `/results`, `/properties/dawson-house-d8` and `/properties/nope`.
