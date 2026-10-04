# HomeMatch "Night Line" Design System

> **Stage 1 handoff (UI Designer → Frontend Developer).** This doc is the source of truth for the dark redesign on branch `new-look-interface`. Stage 2 implements §1–§8 in `app/globals.css` sections 0–7 and 9, plus the TSX changes listed in the plan. Stage 3b (Whimsy) owns globals section 8 and uses the hooks marked **🪝 hook**.
>
> All contrast ratios below are **measured** with the WCAG 2.x relative-luminance formula (sRGB → linear, `L = 0.2126R + 0.7152G + 0.0722B`, ratio `(L1+0.05)/(L2+0.05)`). They are not estimates.

---

## 0. TL;DR for Stage 2

1. Paste the `:root` block from **§9** over the current one at the top of `globals.css`.
2. Every class TSX already uses keeps its name. There are two renames: `.nav` becomes `.site-header`, and `.hero-nav` becomes `.site-header--overlay`.
3. New classes: `.site-footer`, `.board`, `.board-chip`, `.score-tile` (+ `-value`, `-unit`, `-label`, `.compact`), `.state-panel` (+ `.is-error`, `.is-empty`, `.is-404`), `.state-code`, `.detail-emoji`, `.detail-cta`, `.destination-route`, `.map-legend` / `.legend-swatch`, `.map-pin.is-alt`, `.map-dot`, `.mono`, `.num`, `.sr-only`.
4. Delete the unused "Departures board" block (current lines 126–138).
5. `components/mapColors.ts` takes the palette in **§6**. One value changed from the plan: `kindergarten` is now `#d8b4fe`.
6. Inline styles must go: the `h1` font sizes, `hr` margins, the `flex:1` fields, the detail emoji `fontSize:64` and the `<br />` before the detail CTA.

---

## 1. Design principles

| # | Principle | What it means in code |
|---|---|---|
| 1 | **Night line.** The site is one continuous late-evening tram ride. After the Luas doors open, nothing should look like you left the tram. | `body` uses the hero's `#05070d` exactly. Surfaces step up in small lightness increments (`--surface` → `--elevated` → `--elevated-2`). There are no light panels anywhere. |
| 2 | **Yellow means "act here".** Luas yellow marks things you can press or follow, plus wayfinding: primary buttons, links, focus rings, eyebrows and the selected state. | Never use yellow for success or match. Never put yellow text on large surfaces. There is at most **one** primary yellow button per view region. |
| 3 | **Green means "it fits".** DART green means match, success and arrival: scores, ✓ strengths, amenity highlights, the route terminus. | `--green-text` (`#6cc24a`) is for text and dots. `--green` (`#2f7a34`) is for fills only and is never used as text. |
| 4 | **Mono is data.** The DART-loader Courier New is the departure board. It's for numbers and short labels you scan: prices, scores, minutes, eyebrows, chips, credits. | Sentences and paragraphs always use `--font-sans`. Mono is always weight 700, never smaller than 12px, and always uses tabular numerals. |
| 5 | **Colour is never the only cue.** Yellow and green-text differ by only 1.25:1 in luminance, and green vs orange pins collapse for protanopes (ΔE 3.7). | Every colour difference carries a text, glyph, shape or dash difference as well (§8). |

---

## 2. Colour tokens

### 2.1 Final values

**No plan §1 colour value had to change.** Every text pair measures ≥ 4.5:1 and every UI-boundary pair measures ≥ 3:1 (see §2.3). The plan quoted its ratios against `--elevated`. The tables below give the ratio for every surface each colour actually sits on.

New tokens (the plan named these without values, or they're needed by components): `--board-flap`, `--map-bg`, `--yellow-tint-press`, `--warning-tint`, `--danger-tint`.

| Token | Hex | Role | Notes |
|---|---|---|---|
| `--bg` | `#05070d` | Page background | Same as the hero `COL_BG`, so there's no seam. |
| `--surface` | `#0b0e16` | Inputs, footer plate, explanation fallback | |
| `--elevated` | `#11141c` | Cards and panels | |
| `--elevated-2` | `#181c26` | Nested blocks (destination editor, tags, popups, emoji tile) | |
| `--board` | `#000000` | Departure-board strips, score tiles, 404 numeral | |
| `--board-flap` | `#0e1015` | **New.** Upper half of a split-flap tile | |
| `--map-bg` | `#0e0e0e` | **New.** Leaflet container and map placeholder | Matches the CARTO Dark Matter land colour, so tiles fade in without a flash. |
| `--line` | `#262b37` | Dividers, card borders | **Decorative only** (1.30:1 on `--elevated`). |
| `--line-strong` | `#3a4150` | Map frame, tag borders, popup borders | Decorative (1.80:1). |
| `--control` | `#6b7487` | Form-control borders, secondary button border | Non-text, ≥ 3:1 on every surface. **Never use as text** (4.11:1 on `--surface`). |
| `--text` | `#f2f4f8` | Primary text | |
| `--muted` | `#a7afbd` | Secondary text, help text, meta | |
| `--subtle` | `#8b93a3` | Placeholder, disabled text, fine print ≥ 14px | Don't use for mono text below 14px (see §3.4). |
| `--yellow` | `#f5b919` | Primary fill, links, eyebrows, focus | |
| `--yellow-hover` | `#ffc83d` | Hover fill and hover link | |
| `--yellow-press` | `#b98a0c` | Step shadow under the primary button | **Never put text on it** (`--text` scores 2.84:1). |
| `--on-yellow` | `#14110a` | Text on yellow | |
| `--yellow-tint` | `#1f1806` | Checked chip, secondary-button hover | |
| `--yellow-tint-press` | `#2a2108` | **New.** Secondary-button `:active` | |
| `--green` | `#2f7a34` | **Fills only:** terminus roundel, progress, DART body | Fails as text (3.79:1 on `--bg`, 3.47:1 on `--elevated`). |
| `--green-text` | `#6cc24a` | Score digits, ✓, amenity tags, property pins | |
| `--green-tint` | `#0f1f14` | Explanation box, amenity tag fill | |
| `--lime` | `#cddc39` | DART stripe accent, terminus ring | Use sparingly. Never the only cue next to yellow. |
| `--warning` | `#ffa94d` | Trade-offs, "Worth considering", alt pins | |
| `--warning-tint` | `#241806` | **New.** Trade-off callout fill | |
| `--danger` | `#ff6b6b` | Errors, invalid fields, Remove hover | |
| `--danger-tint` | `#2a0f12` | **New.** Error state fill | |
| `--focus` | `var(--yellow)` | Focus ring | |

### 2.2 Text contrast table (every pair in use)

AA requires 4.5:1 for normal text and 3:1 for text ≥ 24px, or ≥ 18.66px bold. ✅ means AA normal; AAA (≥ 7:1) is noted where met.

| Foreground → / Background ↓ | `--text` | `--muted` | `--subtle` | `--yellow` | `--green-text` | `--warning` | `--danger` |
|---|---|---|---|---|---|---|---|
| `--bg` `#05070d` | 18.29 AAA | 9.12 AAA | 6.52 ✅ | 11.35 AAA | 9.07 AAA | 10.58 AAA | 7.26 AAA |
| `--surface` `#0b0e16` | 17.52 AAA | 8.74 AAA | 6.25 ✅ | 10.87 AAA | 8.68 AAA | 10.14 AAA | 6.95 ✅ |
| `--elevated` `#11141c` | 16.72 AAA | 8.34 AAA | 5.96 ✅ | 10.38 AAA | 8.29 AAA | 9.67 AAA | 6.63 ✅ |
| `--elevated-2` `#181c26` | 15.47 AAA | 7.71 AAA | 5.52 ✅ | 9.60 AAA | 7.67 AAA | 8.95 AAA | 6.14 ✅ |
| `--board` `#000` | 19.07 AAA | 9.51 AAA | 6.80 ✅ | 11.84 AAA | 9.45 AAA | 11.03 AAA | 7.57 AAA |
| `--board-flap` `#0e1015` | 17.28 AAA | 8.62 AAA | — | 10.72 AAA | 8.57 AAA | — | — |
| `--yellow-tint` `#1f1806` | 16.01 AAA | 7.98 AAA | 5.71 ✅ | 9.93 AAA | — | — | — |
| `--yellow-tint-press` `#2a2108` | 14.45 AAA | 7.21 AAA | — | 8.97 AAA | — | — | — |
| `--green-tint` `#0f1f14` | 15.55 AAA | 7.75 AAA | 5.54 ✅ | — | 7.71 AAA | — | — |
| `--warning-tint` `#241806` | 15.78 AAA | 7.87 AAA | — | — | — | 9.13 AAA | — |
| `--danger-tint` `#2a0f12` | 16.22 AAA | 8.09 AAA | — | — | — | — | 6.44 ✅ |
| `--map-bg` `#0e0e0e` (map placeholder) | 17.53 AAA | 8.74 AAA | — | — | — | — | — |
| Leaflet attribution plate, `rgb(5 7 13 / .82)` over the lightest tile (#3c3c3c) → `#0f1115` | 17.16 AAA | 8.56 AAA | — | 10.65 AAA | — | — | — |

Text on fills:

| Pair | Ratio | Used for |
|---|---|---|
| `--on-yellow` on `--yellow` | **10.62** AAA | Primary button, skip link, `::selection` |
| `--on-yellow` on `--yellow-hover` | **12.19** AAA | Primary button hover |
| `--text` on `--green` | **4.82** ✅ | Terminus roundel label, any green fill with text |
| `--bg` on property pin `#6cc24a` | **9.07** AAA | Score inside a property pin |
| `--bg` on alt pin `#ffa94d` | **10.58** AAA | Score inside an alt pin |
| `--bg` on destination pin `#f2f4f8` | **18.29** AAA | ★ glyph |
| `--yellow-hover` on `--bg` / `--elevated` | 13.03 / 11.91 AAA | Link hover |
| `--lime` on `--board` | 13.89 AAA | Optional terminus / loader accent |

**Forbidden pairs (measured failures):**

| Pair | Ratio | Rule |
|---|---|---|
| `--green` as text on `--bg` / `--elevated` | 3.79 / 3.47 | ❌ Use `--green-text`. |
| `--control` as text on `--surface` | 4.11 | ❌ Borders only. Placeholder uses `--subtle`. |
| `--text` on `--yellow-press` | 2.84 | ❌ The shadow colour only. |
| `--on-yellow` or `--bg` on `--green` | 3.55 / 3.79 | ❌ Use `--text` on green fills. |
| `--yellow` vs `--text` (link in body copy) | 1.61 | Links **must be underlined** (WCAG 1.4.1). |
| `--yellow` vs `--green-text` / `--warning` | 1.25 / 1.07 | Never let these be the only difference between two states. |

### 2.3 Non-text contrast (WCAG 1.4.11, needs 3:1)

| Element | Pair | Ratio |
|---|---|---|
| Input / select / chip border (rest) | `--control` vs `--surface` / `--elevated` / `--elevated-2` | 4.11 / 3.92 / 3.63 ✅ |
| Input border (hover) | `--muted` vs `--surface` / `--elevated` | 8.74 / 8.34 ✅ |
| Focus ring | `--yellow` vs `--bg` / `--elevated` / `--elevated-2` | 11.35 / 10.38 / 9.60 ✅ |
| Checked chip border | `--yellow` vs `--surface` | 10.87 ✅ |
| Select chevron | `--muted` vs `--surface` | 8.74 ✅ |
| Green roundel / terminus fill | `--green` vs `--bg` | 3.79 ✅ |
| Map pins and dots | see §6.2 | ≥ 4.17 ✅ |
| Dividers `--line` / `--line-strong` | vs `--elevated` | 1.30 / 1.80. Decorative, exempt. Never the sole boundary of a control. |

---

## 3. Typography

### 3.1 Font stacks

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; /* = hero SANS */
--font-mono: "Courier New", "Liberation Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
```

- **Change vs plan:** `"Liberation Mono"` is inserted second. It's the metric-compatible open clone of Courier New that ships on most Linux distros, so mono widths and line breaks match Windows and macOS there. Nothing else moves.
- No web fonts are loaded. Both stacks are system fonts, so there's zero font CLS and no extra requests.
- **Mono readability rules.** Courier New's x-height is small (about 0.42em, so about 5px at 12px) and its strokes are thin even in Bold:
  - Always use `font-weight: 700`. Courier New has a true Bold, so there's no synthetic bolding.
  - **Minimum size 12px.** Use 13px for eyebrows, chips and tags, and 12px only for legends, credits and the score label.
  - Uppercase only for labels of ≤ 3 words, tracked +0.08em to +0.14em. Sentence case for longer chips (`.tag`).
  - Below 14px, mono text uses `--muted` or brighter, never `--subtle`, because thin strokes lower the effective contrast.
  - Mono roles set `-webkit-font-smoothing: auto`, overriding the body's `antialiased`, so macOS keeps stem darkening on the thin strokes.
  - **QA fallback:** if Courier New reads poorly at 12–13px on the 375px viewport, move `"Cascadia Mono", Consolas` ahead of `"Courier New"`. Only the token changes.
- **Numbers:** every mono role and every sans number in tables gets `font-variant-numeric: tabular-nums lining-nums;`. Utilities: `.mono` (mono role) and `.num` (sans + tabular-nums).
- Courier New covers `€`, `→`, `←`, `·`, `≤` and `%` (WGL4). All are safe in mono roles.

### 3.2 Type scale

`text-wrap: balance` goes on h1–h3. `text-wrap: pretty` goes on `.lede` and `p`. Global heading rules never use `!important`: the hero's inline h1 styles must win.

| Role | Selector(s) | Font | Size | Weight | Line-height | Letter-spacing | Case | Colour |
|---|---|---|---|---|---|---|---|---|
| Hero display | hero `h1` (inline, untouched) | sans | clamp(38px, 7vw, 104px) | 800 | 0.98 | -0.035em | as written | `--text` |
| Page title | `h1` (outside hero) | sans | `--fs-display` clamp(34px, 5vw, 56px) | 800 | 1.04 | -0.035em | Sentence | `--text` |
| Home section heading | `.hero-heading` | sans | clamp(32px, 4.4vw, 52px) | 800 | 1.06 | -0.035em | Sentence | `--text` |
| Section heading | `h2` | sans | `--fs-h2` clamp(26px, 3.2vw, 34px) | 800 | 1.12 | -0.025em | Sentence | `--text` |
| Card title | `.property-card h2`, `.comparison-grid h3` | sans | 24px | 800 | 1.15 | -0.02em | Sentence | `--text` |
| Sub-heading | `h3` | sans | 20px | 700 | 1.25 | -0.01em | Sentence | `--text` |
| Lede | `.lede` | sans | 18px | 400 | 1.6 | 0 | Sentence | `--muted`, max-width 62ch |
| Body | `body`, `p` | sans | 16px | 400 | 1.55 | 0 | — | `--text` |
| Fieldset legend | `legend` | sans | 17px | 800 | 1.3 | -0.01em | Sentence | `--text` |
| Label | `label` | sans | 15px | 700 | 1.35 | 0 | Sentence | `--text` |
| Help / meta | `.help-text`, `.muted`, `small` | sans | 14px | 400 | 1.45 | 0 | Sentence | `--muted` |
| Brand | `.brand` | sans | 21px | 800 | 1 | -0.035em | "Home**Match**" | `--text`, span `--yellow` |
| Button | `.button` | sans | 16px | 700 | 1.2 | 0.01em | Sentence | per §5.1 |
| Nav link | `.site-nav a`, `.back` | sans | 15px | 700 | 1.3 | 0 | Sentence | `--text` / `--yellow` |
| **Eyebrow** | `.eyebrow` | **mono** | 13px | 700 | 1.3 | 0.14em | UPPER | `--yellow` |
| **Board chip** | `.board-chip` | **mono** | 13px | 700 | 1 | 0.08em | UPPER | `--yellow` (`.is-green` → `--green-text`) |
| **Score digits** | `.score-tile-value` | **mono** | 30px (`.compact` 18px) | 700 | 1 | -0.02em | — | `--green-text` |
| **Score label** | `.score-tile-label` | **mono** | 12px | 700 | 1.2 | 0.12em | UPPER | `--muted` |
| **Inline score** | `.score` | **mono** | 15px | 700 | 1.3 | 0 | — | `--green-text` |
| **Price** | `.price`, `.price-line` | **mono** | 28px (≤520: 24px) | 700 | 1.1 | -0.02em | — | `--text` |
| Price unit | `.price small`, `.price-line small` | sans | 14px | 400 | — | 0 | — | `--muted` |
| **Commute minutes** | `.commute-list strong` | **mono** | 15px | 700 | 1.4 | 0 | — | `--text` |
| **Tag** | `.tag`, `.tag-amenity` | **mono** | 13px | 700 | 1.2 | 0 | Sentence | `--muted` / `--green-text` |
| **Stop number** | `.step .eyebrow` ("STOP 01") | **mono** | 13px | 700 | 1.3 | 0.14em | UPPER | `--yellow` |
| **Legend / credits** | `.map-legend`, `.source-note`, `.footer-credits` | **mono** | 12px | 700 | 1.6 | 0.02em | Sentence | `--muted` |
| **Number inputs** | `input[type="number"]` | **mono** | 16px | 700 | 1.3 | 0 | — | `--text` |
| **404 numeral** | `.state-code` | **mono** | `--fs-404` clamp(72px, 14vw, 132px) | 700 | 0.9 | -0.04em | — | `--yellow` on `--board` |
| **Loader title** | `.dart-loader-title` | **mono** | 15px (≤520: 12px) | 700 | 1.4 | 0.08em (≤520: 0.04em) | UPPER | `--yellow` |
| Code | `code` | **mono** | 13px | 700 | — | 0 | — | `--text` on `--elevated-2`, padding 1px 6px, radius 4px |

### 3.3 Mono role rule (single grouped selector)

```css
.eyebrow, .board-chip, .score, .score-tile-value, .score-tile-label, .price, .price-line,
.commute-list strong, .tag, .map-legend, .source-note, .footer-credits, .state-code,
.dart-loader-title, input[type="number"], code, .mono {
  font-family: var(--font-mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums lining-nums;
  -webkit-font-smoothing: auto;
}
/* units inside prices stay sans */
.price small, .price-line small { font-family: var(--font-sans); font-weight: 400; }
```

---

## 4. Spacing, radii, elevation and motion

### 4.1 Spacing (4px base)

| Token | px | Typical use |
|---|---|---|
| `--space-1` | 4 | Icon nudge, label-to-help gap |
| `--space-2` | 8 | Chip gap, eyebrow → heading |
| `--space-3` | 12 | Input padding-y, list-row padding |
| `--space-4` | 16 | Card inner gaps, ≤520 gutter |
| `--space-5` | 20 | Card padding (mobile), ≤760 gutter |
| `--space-6` | 24 | Card padding, field margin |
| `--space-7` | 32 | Desktop gutter, `hr` margin, section gap |
| `--space-8` | 40 | Form-card padding |
| `--space-9` | 48 | State-panel margin |
| `--space-10` | 64 | Page section spacing |
| `--space-11` | 80 | Bottom-of-page breathing room |

Layout tokens: `--max-width: 1120px`, `--gutter: 32px` (≤760: 20px, ≤520: 16px), `--header-h: 64px`, `--sidebar-w: 320px`, `--form-w: 760px`, `--detail-w: 820px`.

### 4.2 Radii

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 4 | Tags, board cells, score tile, `code` (squared, like a departure board) |
| `--radius-md` | 8 | Inputs, selects, destination editor, map frame, popups, board strip |
| `--radius-lg` | 12 | Cards (`.property-card`, `.side-card`, `.hero-card`, `.comparison-panel`), emoji tile |
| `--radius-xl` | 18 | Big panels (`.form-card`, `.detail-panel`, `.state-panel`) |
| `--radius-pill` | 999 | Buttons, choice chips, skip link, footer bell |

### 4.3 Elevation

On near-black, shadows barely read. **Elevation comes from surface lightness and a border first**, and shadow second.

| Level | Surface | Border | Shadow token |
|---|---|---|---|
| 0 page | `--bg` | — | — |
| 1 inset | `--surface` | `--control` (inputs) | — |
| 2 card | `--elevated` | 1px `--line` | `--shadow-card` |
| 3 nested | `--elevated-2` | 1px `--line` / `--line-strong` | — |
| 4 popover | `--elevated-2` | 1px `--line-strong` | `--shadow-pop` |

| Token | Value |
|---|---|
| `--shadow-card` | `inset 0 1px 0 rgb(255 255 255 / 0.04), 0 12px 32px rgb(0 0 0 / 0.45)` |
| `--shadow-pop` | `0 16px 40px rgb(0 0 0 / 0.6)` |
| `--shadow-step` | `0 4px 0 var(--yellow-press)` (primary button at rest) |
| `--shadow-step-lift` | `0 6px 0 var(--yellow-press)` (primary hover) |
| `--shadow-hard` | `6px 6px 0 var(--yellow)` (DART loader frame) |

### 4.4 Motion

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80ms | Button press (sink) |
| `--dur-fast` | 140ms | Colour, border and background hovers |
| `--dur-base` | 220ms | Lift, arrow nudge, card border |
| `--dur-slow` | 360ms | Panel reveal (comparison) |
| `--dur-ticker` | 600ms | 🪝 ScoreTicker total (Stage 3b) |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default for enter and hover |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Movement between two states |
| `--ease-flap` | `steps(6, end)` | 🪝 Split-flap / pixel motion |

Only `transform`, `opacity`, `color`, `background-color`, `border-color` and `box-shadow` are transitioned. Never `all`, never layout properties. Every keyframe needs a reduced-motion guard (§8.4).

---

## 5. Component specs

Each component lists **default / hover / active / focus-visible / disabled / checked** where it applies. "Ring" always means the **standard focus ring**:

```css
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
```

Contrast is ≥ 9.6:1 on every surface. Never remove it without a replacement.

### 5.1 `.button` (primary: yellow pill with a step shadow)

| State | Spec |
|---|---|
| Default | `display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:48px; padding:12px 24px; border:2px solid var(--yellow); border-radius:var(--radius-pill); background:var(--yellow); color:var(--on-yellow); font:700 16px/1.2 var(--font-sans); letter-spacing:.01em; box-shadow:var(--shadow-step); cursor:pointer; text-decoration:none; transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background-color var(--dur-fast) var(--ease-out);` |
| Hover | `background:var(--yellow-hover); border-color:var(--yellow-hover); transform:translateY(-2px); box-shadow:var(--shadow-step-lift);` The arrow `span[aria-hidden]` gets `transform:translateX(3px)`. |
| Active | `transform:translateY(4px); box-shadow:0 0 0 var(--yellow-press); transition-duration:var(--dur-instant);` The button "boards": it sinks onto its step. |
| Focus-visible | Ring with **`outline-offset: 6px`**, which clears the 4px step shadow. |
| Disabled (`:disabled:not([aria-busy="true"])`, `[aria-disabled="true"]`) | `background:var(--elevated-2); border-color:var(--line-strong); color:var(--subtle); box-shadow:none; transform:none; cursor:not-allowed;` Text measures 5.52:1. |
| Busy 🪝 (`[aria-busy="true"]`, for the "Doors closing…" submit) | Stays yellow. `transform:translateY(4px); box-shadow:none; cursor:progress;` Stage 3b owns the label and any animation. |
| Forced colours | `border:2px solid ButtonText`. The step shadow is dropped by the user agent, which is fine. |

On a `.form-card` at ≤520px, the submit button gets `width:100%`.

### 5.2 `.button.secondary`

| State | Spec |
|---|---|
| Default | Same box as primary, but `background:transparent; color:var(--text); border:2px solid var(--control); box-shadow:none;` |
| Hover | `border-color:var(--yellow); color:var(--yellow); background:var(--yellow-tint);` Yellow on tint measures 9.93:1. |
| Active | `background:var(--yellow-tint-press); transform:translateY(1px);` (8.97:1) |
| Focus-visible | Ring, offset 3px. |
| Disabled | `border-style:dashed; border-color:var(--line-strong); color:var(--subtle); background:transparent; cursor:not-allowed;` |

### 5.3 `.text-button` and `.back` (text links)

| State | Spec |
|---|---|
| Default | `display:inline-flex; align-items:center; gap:6px; min-height:44px; padding:0 2px; border:0; background:none; color:var(--yellow); font:700 15px/1.3 var(--font-sans); text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:.22em; cursor:pointer;` **Always underlined**, because yellow vs body text is only 1.61:1. |
| Hover | `color:var(--yellow-hover); text-decoration-thickness:2px;` |
| Active | `color:var(--yellow-press)`. Text on `--bg` measures 6.43:1. |
| Focus-visible | Ring, offset 3px, `border-radius:4px`. |
| Disabled | `color:var(--subtle); text-decoration-style:dotted; cursor:not-allowed;` |
| Destructive (`.text-button.danger`, the "Remove" stop button) | Default is the same as above. Hover uses `color:var(--danger)`. |

Inside running text (for example `p > .back`), `min-height` is harmless: inline-flex only makes that line taller.

### 5.4 Inputs, selects and number fields

| State | Spec |
|---|---|
| Default | `width:100%; min-height:48px; padding:12px 14px; border:1px solid var(--control); border-radius:var(--radius-md); background:var(--surface); color:var(--text); font:400 16px/1.3 var(--font-sans);` 16px stops iOS from zooming on focus. `accent-color:var(--yellow); caret-color:var(--yellow);` |
| Hover | `border-color:var(--muted);` |
| Focus-visible | Ring with offset 2px, plus `border-color:var(--yellow)`. |
| Invalid (`:user-invalid`) | `border-color:var(--danger);`. Pair it with a `.help-text` error line that starts with "Error:". |
| Disabled | `background:var(--elevated); border-style:dashed; border-color:var(--line-strong); color:var(--subtle); cursor:not-allowed;` |
| Placeholder | `color:var(--subtle); opacity:1;` (6.25:1) |
| `type="number"` | Mono role (§3.3). Native spinners pick up `color-scheme: dark`. |
| `select` | `appearance:none; padding-right:40px;` Chevron: `background: var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23a7afbd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 14px center / 12px 8px;` |
| `option` (Firefox) | `background:var(--surface); color:var(--text);` |
| Autofill | `input:-webkit-autofill { -webkit-text-fill-color:var(--text); caret-color:var(--text); box-shadow:0 0 0 1000px var(--surface) inset; transition: background-color 9999s; }` |

Labels follow §3.2 with `margin-bottom:8px`. `.help-text` is 14px `--muted` with `margin-top:6px`. `.field` has `margin:24px 0`, and `.row > .field` gets `flex:1`, replacing the inline styles.

### 5.5 `.choice` chips (radio and checkbox) and `.compare-choice`

| State | Spec |
|---|---|
| Default | `display:inline-flex; align-items:center; gap:10px; min-height:44px; margin:0; padding:10px 18px 10px 14px; border:1px solid var(--control); border-radius:var(--radius-pill); background:var(--surface); color:var(--text); font:700 15px/1.2 var(--font-sans); cursor:pointer; transition: border-color var(--dur-fast), background-color var(--dur-fast);` The `input` is `width:18px; height:18px; margin:0; accent-color:var(--yellow);` |
| Hover | `border-color:var(--muted);` |
| Checked (`:has(input:checked)`) | `border-color:var(--yellow); box-shadow: inset 0 0 0 1px var(--yellow); background:var(--yellow-tint);` This is 2px visually with no layout shift. Text measures 16.01:1. **Non-colour cue:** the native radio dot or checkbox tick. |
| Focus-visible | `.choice:has(input:focus-visible) { outline:3px solid var(--focus); outline-offset:3px; }` and `.choice input:focus-visible { outline:none; }`. The ring sits on the whole chip. |
| Active | `transform: translateY(1px);` |
| Disabled (`:has(input:disabled)`) | `border-style:dashed; color:var(--subtle); cursor:not-allowed;` |
| `.compare-choice` | The same chip, compact: `padding:8px 14px 8px 12px; font-size:14px;` 🪝 Stage 3b may switch the label to "Comparing" when checked. |

### 5.6 Cards

All cards share this base: `background:var(--elevated); border:1px solid var(--line); border-radius:var(--radius-lg); box-shadow:var(--shadow-card); color:var(--text);`

| Card | Extra spec |
|---|---|
| `.hero-card` | `padding:28px; border-top:4px solid var(--yellow);` (yellow top stripe). Its `.mini-result` rows: `padding:18px 0; border-bottom:1px solid var(--line)`; the last row has none. |
| `.form-card` | `max-width:var(--form-w); margin:32px auto var(--space-11); padding:40px 44px; border-radius:var(--radius-xl);` ≤760: `padding:28px 22px`. ≤520: `padding:22px 16px; border-radius:var(--radius-lg)`. |
| `.destination-editor` (inside `.form-card`) | `margin:16px 0; padding:18px 20px; background:var(--elevated-2); border:1px solid var(--line); border-radius:var(--radius-md); box-shadow:none;` Heading `strong` uses the mono role at 13px, uppercase, 0.1em tracking, `--yellow`. Its `select` / `input` borders measure 3.63:1 on `--elevated-2`. |
| `.property-card` | `padding:24px 28px; transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base);` **Hover:** `border-color:var(--line-strong)`. **`.is-highlighted`:** `border-color:var(--yellow); box-shadow: 0 0 0 1px var(--yellow), var(--shadow-card);` (linked to the map pin, which also grows, so it's not colour-only). **Focus-within:** no ring on the card; inner controls carry their own. |
| `.property-card.alternative-card` | `border-left:4px solid var(--warning);` The eyebrow turns `--warning`. The **text label "Worth considering"** is the real cue. |
| `.detail-panel` | `padding:40px; border-radius:var(--radius-xl);` ≤760: `28px 22px`. ≤520: `22px 16px`. |
| `.comparison-panel` | `margin:24px 0 8px; padding:24px; border:1px solid var(--line-strong); border-top:4px solid var(--yellow);` Reveal: `@keyframes` fade plus `translateY(8px)→0` over `--dur-slow`, guarded for reduced motion. See §5.6.1 for the grid. |
| `.side-card` | `padding:20px; border-top:4px solid var(--yellow); position:sticky; top:24px;` ≤760: `position:static`. `.side-card-map` has `padding-top:16px`. |
| `.state-panel` | §5.13 |

#### 5.6.1 `.comparison-grid`
- Columns: `grid-template-columns: minmax(130px,1.2fr) minmax(160px,1fr) minmax(160px,1fr); gap:0 16px; overflow-x:auto; scroll-snap-type:x proximity;`
- Stage 2 TSX: give the scroller `role="region" aria-label="Comparison table" tabindex="0"` so keyboard users can scroll it.
- Row cells (`p`, `strong`): `min-height:44px; margin:0; padding:10px 0; border-top:1px solid var(--line); display:flex; align-items:center;`
- Label column (`.comparison-labels strong`): 14px 700 sans, `--muted`.
- Values: `.score` (inline mono green). Price and minutes `<p>` get class `mono` in TSX. `transportQuality` stays sans.
- `h3`: card title size, `min-height:56px`.
- `.comparison-note`: 14px `--muted`, `margin-top:16px`.

### 5.7 `.eyebrow`
`display:block; margin:0 0 8px;` uses the mono role at 13px, 700, uppercase, 0.14em tracking, `color:var(--yellow)`.

Variants:
- `.eyebrow.is-green` → `--green-text` (match context, for example "Best overall fit").
- `.eyebrow.is-warning` → `--warning` (alternative card).
- `.eyebrow.is-danger` → `--danger` (error state).

The eyebrow's text always names the meaning; colour only echoes it.

### 5.8 `.board` and `.board-chip` (departure-board strip)

Markup (results summary row):

```html
<ul class="board" aria-label="Your search">
  <li class="board-label">Now showing</li>
  <li class="board-chip is-green">12 homes</li>
  <li class="board-chip">€1,900 max</li>
  <li class="board-chip">≤ 30 min</li>
  <li class="board-chip">3 stops</li>
  <li class="board-chip">Rent</li>
</ul>
```

| Part | Spec |
|---|---|
| `.board` | `display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin:20px 0 0; padding:8px; list-style:none; background:var(--board); border:1px solid var(--line); border-radius:var(--radius-md);` |
| `.board-label` | Mono role, 12px, uppercase, 0.12em tracking, `--muted`, `padding:0 6px 0 4px`. ≤520: hidden visually but kept in the accessibility tree (`.sr-only` pattern). |
| `.board-chip` | Mono role, 13px, uppercase, 0.08em tracking, `color:var(--yellow); background:var(--board-flap); padding:7px 10px 6px; border-radius:var(--radius-sm); box-shadow: inset 0 -1px 0 rgb(0 0 0 / .9);` That inset is a small flap seam. Yellow on the flap measures 10.72:1. |
| `.board-chip.is-green` | `color:var(--green-text)` (8.57:1). Used for the "N homes" result count. |
| States | Not interactive. No hover or focus. |

### 5.9 `.score-tile` (green split-flap digits on black)

Markup:

```html
<p class="score-tile">
  <span class="score-tile-value" data-value="92">92<span class="score-tile-unit">%</span></span>
  <span class="score-tile-label">Life match</span>
</p>
```

🪝 ScoreTicker (Stage 3b) wraps the contents of `.score-tile-value`. It keeps the real number in the DOM, puts the animated digits in an `aria-hidden` element, and may split them into `.flap` cells (`display:inline-block; width:1ch`).

| Part | Spec |
|---|---|
| `.score-tile` | `display:inline-grid; justify-items:end; gap:6px; margin:0;` |
| `.score-tile-value` | `position:relative; display:inline-block; padding:7px 10px 5px; border-radius:var(--radius-sm); background:linear-gradient(180deg, var(--board-flap) 0 50%, var(--board) 50% 100%); box-shadow: inset 0 0 0 1px var(--line); color:var(--green-text);` Mono role, 30px, line-height 1, -0.02em tracking. Digits measure 8.57:1 on the flap and 9.45:1 on the board. |
| Hinge line (`.score-tile-value::after`) | `content:""; position:absolute; left:0; right:0; top:50%; height:1px; background:rgb(0 0 0 / .85); box-shadow:0 1px 0 rgb(255 255 255 / .06); pointer-events:none;` |
| `.score-tile-unit` | `font-size:.6em; margin-left:1px;` |
| `.score-tile-label` | Mono role, 12px, uppercase, 0.12em tracking, `--muted`. |
| `.score-tile.compact` (hero-card mini results) | `grid-auto-flow:column; align-items:center; gap:8px;` The value is 18px with `padding:4px 7px 3px`. The label reads "match". |
| Placement | Property card: top-right of `.mini-top` (replaces `.score.score-large`). YourCommutes: above the list, left-aligned (`justify-items:start`). |
| Forced colours | Let it adapt (don't set `forced-color-adjust:none`). Add `border:1px solid CanvasText` and hide the hinge `::after`. |

`.score` (inline, for example in the comparison grid) uses the mono role at 15px, `--green-text`, `white-space:nowrap`.

### 5.10 `.tag` and `.tag-amenity`

| Variant | Spec |
|---|---|
| `.tags` | `display:flex; flex-wrap:wrap; gap:8px; margin:16px 0;` |
| `.tag` | Mono role, 13px, sentence case, line-height 1.2. `padding:5px 9px; color:var(--muted); background:var(--elevated-2); border:1px solid var(--line-strong); border-radius:var(--radius-sm);` (7.71:1) |
| `.tag-amenity` | `color:var(--green-text); background:var(--green-tint); border-color:rgb(108 194 74 / .35);` (7.71:1). 🪝 Stage 3b may prefix a walk glyph. |
| States | Not interactive. |

### 5.11 `.reason` and `.tradeoff`

| Class | Spec |
|---|---|
| `.reason` | `margin:6px 0; color:var(--muted); font-size:15px; line-height:1.5;` (8.34:1 on `--elevated`) |
| `.reason::before` | `content:"✓ "; color:var(--green-text); font-weight:800;` |
| `.reason.tradeoff` | `color:var(--text);` |
| `.tradeoff::before` | `content:"Note: "; color:var(--warning); font-weight:800;` **Keep the "Note:" prefix.** It's the non-colour cue. |

### 5.12 `.explanation` and `.tradeoff-callout`

| Class | Spec |
|---|---|
| `.explanation` | `margin:20px 0; padding:16px 18px; background:var(--green-tint); border-left:3px solid var(--green-text); border-radius:0 var(--radius-md) var(--radius-md) 0;` The `strong` is `--text` (15.55:1). The `p` is `--muted` (7.75:1) with `margin:6px 0 0`. |
| `.tradeoff-callout` | `margin:20px 0; padding:16px 18px; background:var(--warning-tint); border:1px solid rgb(255 169 77 / .4); border-radius:var(--radius-md);` The `strong` is `--warning` (9.13:1). The `p` is `--muted` (7.87:1). |

### 5.13 `.state-panel` (error, empty and 404)

```html
<section class="state-panel is-error" role="alert" aria-labelledby="state-title">
  <div class="state-art" aria-hidden="true"><!-- 🪝 Stage 3b illustration --></div>
  <p class="eyebrow is-danger">Signal failure</p>
  <h1 id="state-title">…</h1>
  <p class="state-text">…</p>
  <div class="state-actions"><button class="button" type="button">Try again</button><a class="button secondary" href="/preferences">Edit preferences</a></div>
  <p class="state-detail">HTTP 500</p>
</section>
```

| Part | Spec |
|---|---|
| `.state-panel` | `max-width:640px; margin:48px auto var(--space-11); padding:44px 32px 36px; text-align:center; background:var(--elevated); border:1px solid var(--line); border-top:4px solid var(--yellow); border-radius:var(--radius-xl); box-shadow:var(--shadow-card);` ≤520: `padding:32px 18px 28px; margin-top:24px`. |
| `.is-error` | `border-top-color:var(--danger);` The eyebrow uses `.is-danger`. `role="alert"`. |
| `.is-empty` | Yellow stripe (default). `role="status"`. |
| `.is-404` | Yellow stripe, with `.state-code` above the eyebrow. |
| `.state-code` | `display:inline-block; position:relative; margin:0 0 20px; padding:14px 22px 10px; background:linear-gradient(180deg, var(--board-flap) 0 50%, var(--board) 50%); border-radius:var(--radius-md); color:var(--yellow);` Mono role at `--fs-404`, line-height 0.9. It has the same hinge `::after` as the score tile. Decorative duplicate of the title, so `aria-hidden="true"`. |
| `h1` | `--fs-display`, but capped at 44px inside the panel (`font-size:clamp(30px,4.4vw,44px)`). |
| `.state-text` | `--muted`, 17px, max-width 46ch, centred (`margin-inline:auto`). |
| `.state-actions` | `display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:24px;` ≤520: buttons `width:100%`. |
| `.state-detail` | Mono role, 12px, `--muted`, `margin-top:20px; word-break:break-word;` |
| `.state-art` | 🪝 `min-height:0`. Stage 3b decides its contents. It must not shift layout when empty. |

### 5.14 Lists

| List | Spec |
|---|---|
| `.commute-list` | `margin:14px 0 0; padding:0; list-style:none;` Each `li`: `display:grid; grid-template-columns:28px 1fr; column-gap:4px; padding:10px 0; border-top:1px solid var(--line); font-size:15px;` The icon span sits in column 1. `strong` (minutes) uses the mono role at 15px. `.commute-route` goes in column 2, `display:block; color:var(--muted); font-size:13px; line-height:1.4`. |
| `.priority-list` | `margin:16px 0; padding:0; list-style:none;` Each `li`: `padding:12px 0; border-top:1px solid var(--line);` `strong` is `--text`. `span` is `display:block; color:var(--muted); font-size:13px;` |
| `.amenity-list` | Each `li`: `display:flex; gap:12px; align-items:flex-start; padding:10px 0; border-top:1px solid var(--line); font-size:15px;` `.amenity-dot` is a **diamond** to match the map (§6.3): `width:10px; height:10px; margin-top:6px; border-radius:2px; transform:rotate(45deg); background:var(--pin, currentColor);` |
| `.steps` (home) | §7.1 |

### 5.15 `.site-header` (solid and overlay) and the skip link

Markup (`components/SiteHeader.tsx`, a server component):

```html
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header [site-header--overlay]">
  <a class="brand" href="/">Home<span>Match</span></a>
  <nav class="site-nav" aria-label="Main navigation">{actions}</nav>
</header>
```

| Part | Spec |
|---|---|
| `.site-header` (solid) | `display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 20px; min-height:var(--header-h); padding:10px 0; margin-bottom:8px; border-bottom:1px solid var(--line);` Not sticky. It sits inside `.shell`. |
| `.brand` | §3.2. `display:inline-flex; align-items:center; min-height:44px; color:var(--text); text-decoration:none;` The span is `--yellow`. Hover: span `--yellow-hover`. Focus: ring, `border-radius:4px`. 🪝 Optional `.brand-mark` roundel before the text. |
| `.site-nav` | `display:flex; flex-wrap:wrap; gap:4px 20px; align-items:center;` Links use the `.back` style (§5.3). `[aria-current="page"]` gets `text-decoration-thickness:2px`. A plain status span such as "Your preferences" is `--muted`, 15px. |
| `.site-header--overlay` | `max-width:var(--max-width); margin:0 auto; padding:22px var(--gutter); border-bottom:0; text-shadow:0 1px 12px rgb(0 0 0 / .45);` Links are `--text` (not yellow) over the photo, turning `--yellow` on hover with the underline still present. It's rendered inside the hero's `children` slot (already absolutely positioned at top with z-index 3). |
| `.skip-link` | `position:absolute; left:16px; top:-80px; z-index:var(--z-skip); padding:10px 18px; border-radius:var(--radius-pill); background:var(--yellow); color:var(--on-yellow); font-weight:700; transition: top var(--dur-fast) var(--ease-out);` On `:focus`: `top:12px`, plus the ring with offset 3px. On the home page it **stays inside the hero children** (the hero's click handler only intercepts anchors inside the hero). |
| ≤520 | `.brand` is 19px. `.site-nav` links are 14px. The header wraps to two rows if needed. |

### 5.16 `.site-footer`

| Part | Spec |
|---|---|
| `.site-footer` | `margin-top:var(--space-10); background:var(--surface); border-top:1px solid var(--line); color:var(--muted);` The inner `.shell` has `display:grid; grid-template-columns:1fr auto; gap:24px 40px; align-items:start; padding-top:40px; padding-bottom:48px;` ≤760: one column. |
| Route line 🪝 | `.site-footer .route-line` is a decorative horizontal track across the top of the footer, owned by Stage 3b. Reserve `padding-top:40px` so it never overlaps text. |
| Brand block | `.brand` plus `.footer-tagline` "Next stop: your new home." (sans 18px 700 `--text`, `margin:8px 0 0`). |
| `.footer-credits` | `<ul>` with `list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:4px 16px;` Mono role, 12px, `--muted`. Items: "Map © OpenStreetMap contributors", "Tiles © CARTO", "Timetables: NTA GTFS", "Routing: OSRM". Links inside: `color:var(--muted); text-decoration:underline;`, hover `--yellow`. |
| `.footer-egg` 🪝 | `width:44px; height:44px; display:inline-grid; place-items:center; border:1px solid var(--control); border-radius:var(--radius-pill); background:transparent; color:var(--text); font-size:18px; cursor:pointer;` Hover: `border-color:var(--yellow); background:var(--yellow-tint)`. Focus: ring. It needs `aria-label` (Stage 3b copy). |

### 5.17 Map frame, pins, legend and Leaflet dark overrides

| Part | Spec |
|---|---|
| `.map-frame` | `position:relative; z-index:0; overflow:hidden; border:1px solid var(--line-strong); border-radius:var(--radius-md); background:var(--map-bg);` |
| `.map-loading` | `display:flex; align-items:center; justify-content:center; height:var(--map-h, 320px); color:var(--muted);` Mono role, 13px, 0.04em tracking. Stage 2: `Map.tsx` passes `style={{ "--map-h": height + "px" }}` (or `height`) so the placeholder **reserves the real height** (no CLS). 🪝 Copy: "Unfolding the map…". |
| `.map-pin-wrapper` | `background:none; border:0;` |
| `.map-pin` (property and destination, 36px; 44px when highlighted) | `display:flex; align-items:center; justify-content:center; border:2px solid var(--bg); border-radius:50%; background:var(--pin); color:var(--bg);` Mono role, 12px, line-height 1. `box-shadow:0 2px 8px rgb(0 0 0 / .6); transition: transform var(--dur-fast) var(--ease-out);` The dark halo guarantees separation from any tile pixel or overlapping pin. The destination `★` and home `⌂` glyphs are 16px. |
| `.map-pin.is-highlighted` | `outline:3px solid var(--yellow); outline-offset:0; transform:scale(1.08);` The yellow ring sits outside the dark halo, so it reads against the green fill (only 1.25:1 between them) by way of the halo gap. The size change (36→44) is the second cue. |
| `.map-pin.is-alt` (new `variant:"alt"`, "Worth considering") | `border:2px dashed var(--text); background-clip:padding-box;` The dash gaps show the dark tile, so it reads as **white dashes on a dark ring** around the orange fill. **Mandatory:** property green vs alt orange measures ΔE 3.7 under protanopia (indistinguishable). |
| `.map-dot` (amenities, new divIcon) | `width:12px; height:12px; border:1.5px solid var(--bg); border-radius:2px; transform:rotate(45deg); background:var(--pin); box-shadow:0 1px 4px rgb(0 0 0 / .6);` A diamond, so it's a different shape from transit stops (§6.3). |
| `.map-legend` (`components/MapLegend.tsx`) | `<ul class="map-legend" aria-label="Map key">` with `display:flex; flex-wrap:wrap; gap:6px 16px; margin:10px 0 18px; padding:0; list-style:none;` Mono role, 12px, `--muted`, line-height 1.6. Each `li` is `display:inline-flex; align-items:center; gap:6px;` |
| `.legend-swatch` | `--swatch` is set inline (hex from `mapColors`). Use `data-shape`: `pin` (12px circle in `--swatch` with a 2px `--bg` ring and `box-shadow:0 0 0 1px var(--line-strong)`), `pin-alt` (12px circle with a 1.5px dashed `--text` border), `star` (★ glyph, 14px, `color:var(--swatch)`), `dot` (10px circle), `dot-sm` (7px circle), `diamond` (9px rotated square), `ring` (12px circle, transparent, 1.5px dashed `--swatch` border). Swatches are `aria-hidden`; the text label carries the meaning. |

**Leaflet overrides.** Leaflet's CSS loads after `globals.css`, so every selector needs one more class than Leaflet's. Paste as-is:

```css
.map-frame .leaflet-container { background: var(--map-bg); color: var(--text); font: 400 14px/1.45 var(--font-sans); }
.map-frame .leaflet-container a { color: var(--yellow); }
/* Popups */
.map-frame .leaflet-popup-content-wrapper { background: var(--elevated-2); color: var(--text); border: 1px solid var(--line-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-pop); }
.map-frame .leaflet-popup-content { margin: 12px 36px 12px 14px; font-size: 14px; line-height: 1.45; }
.map-frame .leaflet-popup-tip { background: var(--elevated-2); border: 1px solid var(--line-strong); box-shadow: none; }
.map-frame .leaflet-container a.leaflet-popup-close-button { width: 32px; height: 32px; font: 400 22px/32px var(--font-sans); color: var(--muted); }
.map-frame .leaflet-container a.leaflet-popup-close-button:hover { color: var(--text); }
/* Tooltips */
.map-frame .leaflet-tooltip { background: var(--elevated-2); color: var(--text); border: 1px solid var(--line-strong); border-radius: 6px; box-shadow: var(--shadow-pop); padding: 6px 10px; font-size: 13px; line-height: 1.4; }
.map-frame .leaflet-tooltip-top::before { border-top-color: var(--line-strong); }
.map-frame .leaflet-tooltip-bottom::before { border-bottom-color: var(--line-strong); }
.map-frame .leaflet-tooltip-left::before { border-left-color: var(--line-strong); }
.map-frame .leaflet-tooltip-right::before { border-right-color: var(--line-strong); }
.map-frame .map-tip-detail { display: block; margin-top: 2px; color: var(--muted); font: 700 12px/1.4 var(--font-mono); }
/* Zoom bar */
.map-frame .leaflet-bar { border: 1px solid var(--line-strong); border-radius: var(--radius-md); box-shadow: var(--shadow-pop); overflow: hidden; }
.map-frame .leaflet-bar a, .map-frame .leaflet-touch .leaflet-bar a { width: 40px; height: 40px; line-height: 40px; background: var(--elevated-2); color: var(--text); border-bottom: 1px solid var(--line-strong); }
.map-frame .leaflet-bar a:last-child { border-bottom: 0; }
.map-frame .leaflet-bar a:hover, .map-frame .leaflet-bar a:focus { background: var(--elevated); color: var(--yellow); }
.map-frame .leaflet-bar a:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
.map-frame .leaflet-bar a.leaflet-disabled { background: var(--surface); color: var(--subtle); cursor: not-allowed; }
/* Attribution */
.map-frame .leaflet-container .leaflet-control-attribution { background: rgb(5 7 13 / .82); color: var(--muted); font: 400 12px/1.5 var(--font-sans); padding: 2px 8px; border-top-left-radius: 6px; }
.map-frame .leaflet-control-attribution a { color: var(--text); text-decoration: underline; }
.map-frame .leaflet-control-attribution a:hover { color: var(--yellow); }
```

Stage 2 TSX: wrap each popup and tooltip `detail` in `<span className="map-tip-detail">` instead of `<br />`. Attribution stays in sans because mono at 12px is too wide for the 256px side-card map. Its text measures 8.56:1 even over the lightest tile.

### 5.18 DART loader: "night run" restyle

The markup is unchanged. `DartTrain` gets exported. Only colours change:

| Element | Day (now) | Night (spec) |
|---|---|---|
| `.dart-loader` border | `3px solid var(--ink)` | `3px solid var(--yellow)` |
| `.dart-loader` shadow | `6px 6px 0 var(--ink)` | `var(--shadow-hard)` (6px 6px 0 yellow) |
| Sky | `#8fcbe4 → #c9e8f3 → #e9f5ee` | `linear-gradient(180deg, #0a1626 0%, #13243a 55%, #1d3349 100%)` |
| Clouds | `#fff` | Same pixels with **`.dart-cloud { opacity:.14 }`** (cloud vs sky measures 1.50:1, a soft haze) |
| Stars 🪝 | — | Optional `.dart-stars` layer (Stage 3b). Static under reduced motion. |
| Catenary wire | `#2e3338` | `#7d8596` (4.90:1 vs sky top, 3.49:1 vs bottom) |
| Catenary poles | `#6b7178` | `#5b6475` (3.05:1 vs sky top) |
| Speed lines | `rgb(255 255 255 / 85%)` | `rgb(242 244 248 / 35%)` |
| Sparks | `#ffe066` / glow `#fff3a0` | Unchanged (they glow nicely at night) |
| Track ballast | `#a39b8e` | `#1c2029` |
| Rail top / rail shadow | `#b9bec4` / `#5d6369` | `#8b93a3` / `#3a4150` |
| Sleepers | `#6d4c33` | `#3b2f26` |
| Stones | `#8c8478` / `#b8b0a3` | `#2a2f3a` / `#444b58` |
| `.dart-loader-title` | `"Courier New"` 15px | Mono role, 15px, uppercase, 0.08em tracking, **`--yellow`** (11.35:1) |
| `.dart-loader-detail` | `.muted` | `--muted`, 14px (9.12:1) |
| Train livery | DART greens, lime and yellow cab | Unchanged. The lime stripe (8.56:1 vs sky) and yellow cab carry the silhouette. |

`.dart-loader-card` has `max-width:760px; margin:40px auto var(--space-11); text-align:center;`. Keep `role="status" aria-live="polite"`.

---

## 6. Map palette (`components/mapColors.ts`)

### 6.1 Values (hex only, because Leaflet SVG attributes can't resolve `var()`)

```ts
// Plain module (no "use client") so server components can use these values too.
// Mirrors --map-* in globals.css. Hex only: Leaflet writes these into SVG attributes.
export const mapColors = {
  property: "#6cc24a",     // = --green-text (a home that fits)
  propertyAlt: "#ffa94d",  // = --warning   ("Worth considering"; ALWAYS paired with the dashed .is-alt ring)
  destination: "#f2f4f8",  // = --text      (★ your places)
  bus: "#5aa9ff",
  luas: "#f5b919",         // = --yellow    (Luas)
  rail: "#6cc24a",         // = --green-text (DART / rail)
  kindergarten: "#d8b4fe", // CHANGED from plan #f472b6, see 6.4
  school: "#fb923c",
  grocery: "#2dd4bf",
  radius: "#f5b919",       // 1 km walk circle (dashed)
  halo: "#05070d",         // = --bg, stroke around every pin and dot
} as const;

export const stopColor = (types: number[]) => (types.includes(0) ? mapColors.luas : types.some((t) => t === 1 || t === 2) ? mapColors.rail : mapColors.bus);
```

Keep the keys `grocery`, `kindergarten` and `school`: they're indexed by `AmenityCategory`.

### 6.2 Contrast against dark tiles

CARTO `dark_all` reference values are approximate, taken from the Dark Matter style: land ≈ `#0e0e0e`, water ≈ `#2c353c`, major roads ≈ `#3c3c3c` (the lightest common surface). **QA (Stage 4) should sample real tile pixels with `javascript_tool`** and confirm. Every value has margin above 3:1 even at the lightest surface.

| Key | Hex | vs halo `#05070d` | vs land | vs water | vs road (worst) | Dark label on fill |
|---|---|---|---|---|---|---|
| property | `#6cc24a` | 9.07 | 8.69 | 5.62 | 4.97 | 9.07 |
| propertyAlt | `#ffa94d` | 10.58 | 10.14 | 6.56 | 5.80 | 10.58 |
| destination | `#f2f4f8` | 18.29 | 17.53 | 11.34 | 10.02 | 18.29 |
| bus | `#5aa9ff` | 8.20 | 7.86 | 5.09 | 4.49 | — |
| luas / radius | `#f5b919` | 11.35 | 10.88 | 7.04 | 6.22 | — |
| rail | `#6cc24a` | 9.07 | 8.69 | 5.62 | 4.97 | — |
| grocery | `#2dd4bf` | 10.82 | 10.37 | 6.71 | 5.93 | — |
| kindergarten | `#d8b4fe` | 11.39 | 10.92 | 7.06 | 6.24 | — |
| school | `#fb923c` | 8.90 | 8.53 | 5.52 | 4.87 | — |

Legend swatches sit on `--elevated` and all measure ≥ 7.5:1 there.

### 6.3 Rendering rules (MapView, Stage 2)

| Layer | Shape | Size | Stroke / halo | Fill |
|---|---|---|---|---|
| Property pin | Circle divIcon `.map-pin`, mono score label | 36px (highlighted 44px) | 2px solid `--bg` | `property`, label `--bg` |
| Alt property pin | Circle divIcon `.map-pin.is-alt` | 36 / 44px | **2px dashed `--text`** | `propertyAlt`, label `--bg` |
| Destination | Circle divIcon with ★ | 36px | 2px solid `--bg` | `destination` |
| Home (detail page) | Circle divIcon with ⌂ | 36px | 2px solid `--bg` | `property` |
| Luas / rail stop | `CircleMarker` | **radius 6** | `color: halo, weight: 1.5` | `fillOpacity: 1` |
| Bus stop | `CircleMarker` | **radius 4** (smaller is the size cue) | same | same |
| Amenity | **Diamond** divIcon `.map-dot` (Marker with Tooltip child) | 12px | 1.5px `--bg` | category colour |
| Walk radius | `Circle` | 1000m | `color: radius, weight: 1.5, opacity: .9, dashArray: "4 6"` | `fillColor: radius, fillOpacity: .05` |
| Tiles | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, `subdomains="abcd"`, `maxZoom={20}` | | | Attribution: `&copy; OpenStreetMap contributors &copy; CARTO` (both linked) |

### 6.4 Colour-blind check (measured)

Simulated with Machado et al. (2009) severity-1.0 matrices in linear sRGB. Distances are CIE76 ΔE in Lab. Below ~10 is effectively the same colour; 20 or more is clearly distinct.

| Pair (same map) | Normal | Deutan | Protan | Tritan | Secondary cue |
|---|---|---|---|---|---|
| property / propertyAlt | 72.1 | 15.9 | **3.7 ❌** | 71.8 | **Dashed ring (mandatory)**, plus the card eyebrow text "Worth considering" |
| property / destination | 75.8 | 55.7 | 67.0 | 38.9 | ★ glyph vs number |
| bus / luas | 128.2 | 130.1 | 122.3 | 75.6 | — |
| bus / rail | 112.4 | 100.3 | 105.7 | 19.1 | Bus is smaller (r4 vs r6) |
| luas / rail | 63.6 | 31.0 | 16.8 | 64.7 | Tooltip names, plus the "Rail within 800 m" text list |
| grocery / kindergarten **(plan `#f472b6`)** | 103.8 | **5.9 ❌** | 34.1 | 106.0 | → fixed by the new colour |
| grocery / kindergarten **(new `#d8b4fe`)** | 78.4 | 25.9 | 38.6 | 55.6 | Diamond, plus the amenity list |
| kindergarten / school (plan → new) | 76.1 → 92.5 | 68.5 → 92.8 | 79.6 → 91.4 | **12.4** → 50.0 | |
| grocery / school | 100.2 | 67.3 | 54.2 | 100.8 | |

**Why `kindergarten` changed:** `#f472b6` pink and `#2dd4bf` teal collapse to ΔE 5.9 for deuteranopes, and pink vs school orange drops to ΔE 12.4 for tritanopes. Lavender `#d8b4fe` raises the worst case across all vision types to ΔE 13.6, and its tile contrast improves from 4.17 to 6.24:1 against the lightest road.

**Text alternatives (WCAG 1.4.1):** the map is supplementary. Every marker has a tooltip or popup with its name. The detail page repeats stops and amenities as text lists. `MapLegend` labels every swatch in words.

---

## 7. Page layouts

`.shell` is `max-width:var(--max-width); margin:0 auto; padding:24px var(--gutter);`. `body` is `background:var(--bg)` with no wrapper backgrounds, so the hero → page join is seamless. `<SiteFooter/>` renders from `app/layout.tsx` on every route.

### 7.1 Home `/` (below the hero)

```
[LuasDoorHero  (children: skip-link + SiteHeader variant="overlay")]
main#main-content.shell (tabIndex -1)
  section.hero.hero-grid ── 1.15fr | .85fr, gap 72px, padding 80px 0 72px
    left:  .eyebrow · h2.hero-heading · p.lede · a.button "Find my home →"
    right: .hero-card (yellow stripe) → .eyebrow · 2× .mini-result (.mini-top: strong + .score-tile.compact) · p.muted
  ol#how-it-works.steps 🪝(.route-line)
    3× li.step → .eyebrow "Stop 01/02/03" · strong (19px 800) · span.muted
[SiteFooter]
```

- The overlay header's "How it works" link points to `#how-it-works`.
- `.steps`: `display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin:0; padding:40px 0 var(--space-10); list-style:none; border-top:1px solid var(--line);`. `.step` has `padding:0 20px 0 0; border-right:1px solid var(--line)` (the last has none).
- 🪝 **Route line (Stage 3b):** a 4px `--yellow` track joining 18px roundels (4px `--yellow` border on a `--bg` fill) at each "STOP" eyebrow. The terminus roundel is `--green` fill with a `--lime` border. Horizontal ≥760, vertical ≤760. Stage 2 leaves `padding-top:40px` on `.steps` and `position:relative` on `.step` for it.
- ≤760: `.hero-grid` collapses to one column with gap 32px and `padding:48px 0 56px`. `.steps` is one column; each `.step` has `border-right:0; border-bottom:1px solid var(--line); padding:0 0 20px 36px` (left room for the vertical route line).
- ≤520: `.hero-card` padding is 20px. The `.button` is `width:100%`.

### 7.2 Preferences `/preferences`

```
.shell
  SiteHeader (solid) — actions: span.muted "Your preferences"
  main#main-content (tabIndex -1)
    .form-card (max 760, radius xl)
      .eyebrow · h1 · p.lede
      form
        fieldset rent/buy → .choice-grid of .choice (radio)
        .field budget (number, mono)
        fieldset destinations → p.help-text · .destination-route 🪝 → n× .destination-editor · button.button.secondary "+ Add another destination"
        fieldset modes → .choice-grid of .choice (checkbox)
        .row → 2× .field (commute number | bedrooms select)
        button.button[type=submit] 🪝(aria-busy "Doors closing…")
```

- `.choice-grid` is `display:flex; flex-wrap:wrap; gap:10px`.
- `.destination-grid` is `grid-template-columns: 2fr 1fr 1fr 1fr; gap:12px`. Labels inside are 14px.
- `.destination-heading` is flex, space-between, with `margin-bottom:12px`. The type label uses the mono eyebrow style; Remove is `.text-button.danger`.
- `.destination-route` 🪝 has `position:relative; padding-left:0` (≥760). Stage 3b may add a left-hand track. At ≤760, reserve `padding-left:28px`.
- `fieldset` has `margin:28px 0; padding:0; border:0;` and `legend` has `margin-bottom:10px`.
- Submit: `margin-top:12px`.
- ≤760: `.row` stacks (`flex-direction:column; gap:0`). `.destination-grid` becomes `1fr 1fr`.
- ≤520: `.destination-grid` is `1fr`. The submit and the "+ Add" button are `width:100%`.

### 7.3 Results `/results`

```
.shell
  SiteHeader (solid) — actions: a.back "Edit life preferences"
  main#main-content
    [loading]  DartLoader (night run)
    [error]    .state-panel.is-error (Try again = reload, Edit preferences)
    [empty]    .state-panel.is-empty (results.length === 0)
    [ok]
      .results-header → .eyebrow · h1 · p.lede · ul.board (summary chips)
      Comparison → section.comparison-panel (when 2 selected)
      .results-layout ── minmax(0,1fr) | var(--sidebar-w), gap 28px, padding-top 28px
        section.cards (gap 20px)
          .results-intro → strong + span.muted 🪝(aria-live compare hint)
          n× article.property-card[.alternative-card][.is-highlighted]
            .mini-top → .eyebrow(.is-green | .is-warning) + .score-tile
            h2 (emoji + title) · .muted meta · .price-line
            ul.commute-list · .tags · h3 · .reason/.tradeoff · .explanation · [.tradeoff-callout]
            .card-actions → a.button.secondary · a.back (Daft ↗) · label.compare-choice
        aside.side-card.side-card-map (sticky)
          HomeMap 320px · MapLegend (pin, pin-alt, star) · strong · ul.priority-list · p.muted · a.back
```

- `.results-header` has `padding:24px 0 24px; border-bottom:1px solid var(--line)`.
- `.results-intro` is flex, space-between, baseline, with `margin-bottom:4px`.
- `.card-actions` is `display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; margin-top:20px; padding-top:20px; border-top:1px solid var(--line)`.
- `.price-line` has `margin:18px 0 4px`.
- `focusCard`: `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`.
- ≤760: `.results-layout` is one column. The aside moves **below** the cards (DOM order kept) and `.side-card` becomes static. `.results-intro` stacks. `.comparison-grid` keeps 3 columns and scrolls horizontally.
- ≤520: `.property-card` padding is `20px 16px`. In `.card-actions`, the secondary button is `width:100%`. `.board-label` becomes visually hidden. `.price-line` is 24px.

### 7.4 Property detail `/properties/[id]`

```
.shell
  SiteHeader (solid) — actions: a.back "← Back to matches"
  main#main-content > section.detail (max 820, margin 16px auto 80px)
    .detail-panel
      .detail-emoji (aria-hidden) · .eyebrow (area · type) · h1 · p.muted address · .price · p.lede · .tags · p > a.back (Daft ↗)
      hr
      h2 "Your everyday journeys" · YourCommutes → .score-tile + ul.commute-list + .reason.tradeoff + a.back
      hr
      h2 "The neighbourhood" · HomeMap 420px · MapLegend (dot-sm bus, dot luas, dot rail, diamond ×3, pin home, ring 1 km)
      h3 Public transport · .reason ×n
      h3 Everyday amenities · ul.amenity-list (diamond dots)
      p.source-note (adds "Map tiles © CARTO")
      .detail-cta → p.muted + a.button "Compare with other homes →"
```

- `.detail-emoji`: `display:grid; place-items:center; width:88px; height:88px; margin:0 0 20px; background:var(--elevated-2); border:1px solid var(--line-strong); border-radius:var(--radius-lg); font-size:48px; line-height:1;`. ≤520: 64px box, 36px glyph.
- `hr`: `border:0; border-top:1px solid var(--line); margin:var(--space-7) 0;` (replaces the inline 28px).
- `.price`: `margin:12px 0 4px`.
- `.detail-cta`: `display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-top:32px; padding-top:24px; border-top:1px solid var(--line);`. ≤520: the button is `width:100%`. Remove the `<br />`.
- YourCommutes loading and error lines are `p.muted` (🪝 copy "Checking the timetable…").

### 7.5 404 (`app/not-found.tsx`)

```
.shell
  SiteHeader (solid) — actions: a.back "Find a home"
  main#main-content
    section.state-panel.is-404 (role not needed; it's the page)
      .state-code "404" (aria-hidden) · .eyebrow "Platform 404" · h1 🪝 copy · p.state-text · .state-actions (a.button "Back to home" · a.button.secondary "Start a search")
```

`<title>` is "Page not found | HomeMatch".

### 7.6 Breakpoint summary

| Token / rule | > 760px | ≤ 760px | ≤ 520px |
|---|---|---|---|
| `--gutter` | 32px | 20px | 16px |
| `.hero-grid`, `.results-layout` | 2 columns | 1 column | 1 column |
| `.steps` | 3 columns, horizontal route | 1 column, vertical route | same |
| `.side-card` | sticky | static, below cards | static |
| `.form-card` / `.detail-panel` padding | 40/44px | 28/22px | 22/16px |
| `.destination-grid` | 2fr 1fr 1fr 1fr | 1fr 1fr | 1fr |
| `.row` | flex row | stacked | stacked |
| Primary / submit / card-action buttons | auto width | auto | **100%** |
| `.price`, `.price-line` | 28px | 28px | 24px |
| `.dart-loader` `--train-w` | 372px | 372px | 252px (existing) |
| `.site-footer` grid | 2 columns | 1 column | 1 column |

There must be no horizontal page scroll at 375px. Only `.comparison-grid` scrolls, inside its own region.

---

## 8. Accessibility

### 8.1 Focus
- Global: `:focus-visible { outline:3px solid var(--focus); outline-offset:3px; }` and `:focus:not(:focus-visible) { outline:none; }`.
- Contrast is ≥ 9.6:1 on every surface. On `.button` (primary) the offset is **6px**, which clears the step shadow.
- Chips put the ring on the chip (`:has(input:focus-visible)`). Leaflet zoom uses an inset ring (`outline-offset:-3px`, since the bar clips overflow).
- `#main-content:focus { outline:none; }`. It's a programmatic target only.
- The hero keeps its own ring (yellow 3px, offset 4px plus a 4px `--bg` gap). That matches.

### 8.2 Touch targets
At least 44×44px for buttons (48), inputs (48), chips (44), `.text-button` / `.back` (44 min-height), header links (44), `.footer-egg` (44) and the skip link.

Exceptions:
- Leaflet zoom is 40px. That's above WCAG 2.5.8's 24px minimum and inside the map.
- The popup close button is 32px.

### 8.3 Forced colours (`@media (forced-colors: active)`)
- `.button`, `.button.secondary` and `.choice` get `border:2px solid ButtonText`. Checked chip: `outline:2px solid Highlight; outline-offset:2px`.
- `.board`, `.score-tile-value`, `.state-code` and `.tag` get `border:1px solid CanvasText` (backgrounds are dropped).
- `.hero-card`, `.side-card`, `.comparison-panel` and `.state-panel` stripes become `border-top-color: CanvasText` automatically. No action needed.
- `.map-pin`, `.map-dot` and `.legend-swatch` get `forced-color-adjust:none`. They're colour-coded data, and the halo keeps them legible.
- `:focus-visible` gets `outline-color: Highlight`.
- Decorative route lines and the hinge `::after` get `display:none`.

### 8.4 Reduced motion (`@media (prefers-reduced-motion: reduce)`)
- Keep the existing global rule: `html{scroll-behavior:auto}` and near-zero transition and animation durations.
- Keep the DART-loader block: no animation, static dots, speed lines and sparks hidden.
- Button lift and sink still apply but are instant, which is acceptable because nothing is moving over time.
- 🪝 ScoreTicker renders the final value only. The tram egg fades instead of travelling. The comparison panel appears without sliding.
- JS: `focusCard` and any `scrollIntoView` check `matchMedia`.

### 8.5 Colour is never the only cue

| Meaning | Colour | Non-colour cue |
|---|---|---|
| Strength vs trade-off | green ✓ vs warning | "✓" glyph vs **"Note:"** prefix |
| Best vs worth considering | green vs orange | Eyebrow text, left edge, **dashed pin ring** |
| Checked chip | yellow border and tint | Native radio dot or check tick |
| Highlighted card ↔ pin | yellow | Pin grows 36→44px, plus the ring |
| Links | yellow | **Underline, always** |
| Error | red | "Error:" or "Signal failure" text, `role="alert"` |
| Transit vs amenity on the map | hues | Circle vs **diamond**; bus is smaller |
| Score quality | green digits | The number itself |

### 8.6 Other
- `color-scheme: dark` on `:root` gives native scrollbars, spinners, date pickers and autofill a dark style.
- `html { scrollbar-color: var(--line-strong) var(--bg); }`
- `::selection { background:var(--yellow); color:var(--on-yellow); }` (10.62:1)
- `.sr-only` uses the standard clip pattern, for ScoreTicker and the compare hint.
- `app/layout.tsx` sets `viewport: { themeColor: "#05070d", colorScheme: "dark" }`.
- Text resizes to 200% without clipping: no fixed heights on text containers, apart from the map frame.

### 8.7 Whimsy hooks (Stage 3b reference)

| Hook | Where | Contract |
|---|---|---|
| `.score-tile-value[data-value]` | Cards, hero card, YourCommutes | Server renders the final value. Animated digits are `aria-hidden` and the real value stays in `.sr-only`. |
| `.button[aria-busy="true"]` | Preferences submit | Styled in §5.1. Stage 3b sets the attribute and the label. |
| `.route-line` | `.steps`, `.destination-route`, `.site-footer` | Space is reserved (§7). Use the tokens `--yellow`, `--green`, `--lime`. |
| `.state-art` | `.state-panel` | Empty by default, no layout shift. |
| `.footer-egg` | Footer | Styled in §5.16. |
| `.dart-stars` | DART loader | Optional layer. |
| `.brand-mark` | Header | Optional roundel. |
| `--dur-ticker`, `--ease-flap` | Tokens | Motion for ticker and flap effects. |

---

## 9. Ready-to-paste `:root`

```css
/* ── 0. Tokens ─────────────────────────────────────────────── */
:root {
  color-scheme: dark;

  /* Surfaces */
  --bg: #05070d;              /* = hero COL_BG, so there's no seam */
  --surface: #0b0e16;
  --elevated: #11141c;
  --elevated-2: #181c26;
  --board: #000000;
  --board-flap: #0e1015;
  --map-bg: #0e0e0e;

  /* Lines */
  --line: #262b37;            /* decorative only */
  --line-strong: #3a4150;     /* decorative only */
  --control: #6b7487;         /* control borders ≥3:1; never text */

  /* Text */
  --text: #f2f4f8;            /* 18.29 on --bg */
  --muted: #a7afbd;           /*  9.12 on --bg */
  --subtle: #8b93a3;          /*  6.52 on --bg */

  /* Luas yellow: action */
  --yellow: #f5b919;
  --yellow-hover: #ffc83d;
  --yellow-press: #b98a0c;    /* step shadow only */
  --on-yellow: #14110a;       /* 10.62 on --yellow */
  --yellow-tint: #1f1806;
  --yellow-tint-press: #2a2108;

  /* DART green: match */
  --green: #2f7a34;           /* fills only */
  --green-text: #6cc24a;      /* 9.07 on --bg */
  --green-tint: #0f1f14;
  --lime: #cddc39;

  /* Status */
  --warning: #ffa94d;
  --warning-tint: #241806;
  --danger: #ff6b6b;
  --danger-tint: #2a0f12;
  --focus: var(--yellow);

  /* Map (CSS mirror of components/mapColors.ts) */
  --map-property: #6cc24a;
  --map-property-alt: #ffa94d;
  --map-destination: #f2f4f8;
  --map-bus: #5aa9ff;
  --map-luas: #f5b919;
  --map-rail: #6cc24a;
  --map-grocery: #2dd4bf;
  --map-kindergarten: #d8b4fe;
  --map-school: #fb923c;
  --map-radius: #f5b919;
  --map-halo: #05070d;

  /* Type */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "Courier New", "Liberation Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
  --fs-display: clamp(34px, 5vw, 56px);
  --fs-hero-heading: clamp(32px, 4.4vw, 52px);
  --fs-h2: clamp(26px, 3.2vw, 34px);
  --fs-card-title: 24px;
  --fs-h3: 20px;
  --fs-legend: 17px;
  --fs-lede: 18px;
  --fs-body: 16px;
  --fs-label: 15px;
  --fs-small: 14px;
  --fs-mono-xs: 12px;         /* mono floor */
  --fs-mono-sm: 13px;
  --fs-mono-md: 15px;
  --fs-price: 28px;
  --fs-score: 30px;
  --fs-404: clamp(72px, 14vw, 132px);
  --lh-display: 1.04;
  --lh-heading: 1.12;
  --lh-body: 1.55;
  --lh-mono: 1.3;
  --ls-display: -0.035em;
  --ls-heading: -0.025em;
  --ls-eyebrow: 0.14em;
  --ls-chip: 0.08em;

  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  --space-11: 80px;

  /* Layout */
  --max-width: 1120px;
  --gutter: 32px;
  --header-h: 64px;
  --sidebar-w: 320px;
  --form-w: 760px;
  --detail-w: 820px;
  --z-header: 10;
  --z-egg: 90;
  --z-skip: 100;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 18px;
  --radius-pill: 999px;

  /* Elevation */
  --shadow-card: inset 0 1px 0 rgb(255 255 255 / 0.04), 0 12px 32px rgb(0 0 0 / 0.45);
  --shadow-pop: 0 16px 40px rgb(0 0 0 / 0.6);
  --shadow-step: 0 4px 0 var(--yellow-press);
  --shadow-step-lift: 0 6px 0 var(--yellow-press);
  --shadow-hard: 6px 6px 0 var(--yellow);

  /* Motion */
  --dur-instant: 80ms;
  --dur-fast: 140ms;
  --dur-base: 220ms;
  --dur-slow: 360ms;
  --dur-ticker: 600ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-flap: steps(6, end);
}
@media (max-width: 760px) { :root { --gutter: 20px; } }
@media (max-width: 520px) { :root { --gutter: 16px; } }

/* ── 1. Base (minimum) ─────────────────────────────────────── */
html { scroll-behavior: smooth; scrollbar-color: var(--line-strong) var(--bg); }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 400 var(--fs-body)/var(--lh-body) var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
::selection { background: var(--yellow); color: var(--on-yellow); }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
:focus:not(:focus-visible) { outline: none; }
```

**Hero hookup (Stage 2, `luas-door-hero.tsx` lines 61–64 and 82 only):**
- `SANS = "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)"`
- `COL_BG = "var(--bg, #05070d)"`
- `COL_TEXT = "var(--text, #f2f4f8)"`
- `LUAS_YELLOW = "var(--yellow, #f5b919)"`
- In `.ldh-cta`, `color: var(--on-yellow, #14110a)`.

The fallbacks keep the hero identical if the tokens ever fail to load. The `rgba(245,185,25,0.6)` in the progress gradient stays a literal.

---

*UI Designer, Stage 1, 2026-10-03. Ready for Stage 2. QA checks: §2.2 contrast via `javascript_tool`, real CARTO tile pixel sampling for §6.2, Courier New legibility at 12–13px on a 375px viewport (fallback in §3.1).*
