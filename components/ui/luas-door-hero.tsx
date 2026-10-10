"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

// ─────────────────────────────────────────────────────────────
// LUAS DOOR HERO — scroll-triggered intro.
// Adapted from the 21st.dev "scroll-locked video hero" (MetroHero
// by guglielmogiannattasio). Instead of a video, a layered photo
// composite plays out:
//
//   city photo  →  tram photo with the doorway cut out  →  two door
//   leaves sliced from that same photo
//
// The plug doors slide open, then the camera dollies through the
// doorway until the city fills the screen.
//
// A single scroll / swipe / key press at the top pins the page (body
// position:fixed — the technique modal libraries use; overflow:hidden
// alone isn't reliable on iOS) and plays the intro on a timer; input
// during playback is swallowed. Once it has finished, a fresh push
// forward unlocks the page and it scrolls normally. The intro plays
// once — scrolling back up shows the opened state.
// ─────────────────────────────────────────────────────────────

export interface LuasDoorHeroProps {
  title?: string
  tagline?: string
  scrollHint?: string
  cta?: { label: string; href: string } | false
  citySrc?: string
  cityAlt?: string
  /** Element the "Skip intro" button jumps to once the intro is finished. */
  skipTargetId?: string
  /** How long (ms) the intro plays once triggered. */
  duration?: number
  /** Overlay content (e.g. the site nav), rendered above the scene. */
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

// All scene geometry is in pixels of TRAM_SRC (2000×1333) and was
// measured against that photo — swapping the image means re-measuring.
const TRAM_SRC = "/hero/luas-doors.webp"
const SCENE = { w: 2000, h: 1333 }
const DOORWAY = { x: 896, y: 242, w: 422, h: 710 }
const DOOR_CX = DOORWAY.x + DOORWAY.w / 2
const DOOR_CY = DOORWAY.y + DOORWAY.h / 2
// Leaves as the photo shows them: fully open, plugged out over the windows.
// Rects include the outer frame and bottom rail so no ghost edge is left behind.
const LEFT_LEAF = { x: 621, y: 236, w: 273, h: 740 }
const RIGHT_LEAF = { x: 1316, y: 234, w: 284, h: 746 }
// Closed, the leaves meet at the doorway's centre line.
const LEFT_TRAVEL = DOOR_CX - LEFT_LEAF.w - LEFT_LEAF.x
const RIGHT_TRAVEL = DOOR_CX - RIGHT_LEAF.x
// Window glass band on the tram body (between purple band and yellow stripe).
const GLASS = { top: 244, bottom: 736 }

const DEFAULT_CITY = "/hero/dublin-liffey.webp"
const SANS = "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)"
const COL_BG = "var(--bg, #05070d)"
const COL_TEXT = "var(--text, #f2f4f8)"
const LUAS_YELLOW = "var(--yellow, #f5b919)"

/** Extra zoom beyond "cover" so the doorway can be centred without exposing edges. */
const OVERSCAN = 1.08
/** Forward input (px) past the end of the intro before the page unlocks. */
const RELEASE_DISTANCE = 140
/** Forward input (px) at the top that starts the intro — ignores accidental nudges. */
const TRIGGER_DISTANCE = 24
/** After the intro ends, the final frame holds this long (ms) before input can unlock the page. */
const SETTLE_MS = 600
/** Wheel silence (ms) that marks a new gesture — trackpad momentum never pauses this long. */
const NEW_GESTURE_GAP = 180
const TOUCH_GAIN = 1.4
const MAX_WHEEL_STEP = 200
/** Touch behaviour while pinned: JS handles one-finger pans, the browser keeps pinch-zoom. */
const LOCKED_TOUCH_ACTION = "pinch-zoom"

const HERO_CSS = `
  @keyframes ldh-bounce {
    0%, 100% { transform: translateY(0); opacity: 0.5; }
    50% { transform: translateY(5px); opacity: 1; }
  }
  .ldh-cta { display: inline-flex; align-items: center; gap: 10px; margin-top: 28px; padding: 14px 24px; border-radius: 999px; background: ${LUAS_YELLOW}; color: var(--on-yellow, #14110a); font-weight: 700; font-size: 16px; letter-spacing: 0.01em; box-shadow: 0 10px 30px rgba(0,0,0,0.35); transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .ldh-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(0,0,0,0.45); }
  .ldh-cta span { transition: transform 0.2s ease; }
  .ldh-cta:hover span { transform: translateX(3px); }
  .ldh-cta:active { transform: translateY(2px); box-shadow: 0 4px 12px rgba(0,0,0,0.35); transition-duration: 60ms; }
  .ldh-skip { border: 0; background: none; color: rgba(240,244,248,0.7); cursor: pointer; font: 600 12px/1 ${SANS}; letter-spacing: 0.14em; text-transform: uppercase; padding: 8px 0; transition: color 0.2s ease; }
  .ldh-skip:hover { color: ${COL_TEXT}; }
  .ldh a:focus-visible, .ldh button:focus-visible { outline: 3px solid ${LUAS_YELLOW}; outline-offset: 4px; box-shadow: 0 0 0 4px ${COL_BG}; }
  /* svh: sized to the viewport with mobile toolbars shown, so it doesn't jump as they collapse. */
  .ldh { height: 100vh; height: 100svh; }
`

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
}

const tramLayer = (sx: number, sy: number): CSSProperties => ({
  position: "absolute",
  backgroundImage: `url(${TRAM_SRC})`,
  backgroundSize: `${SCENE.w}px ${SCENE.h}px`,
  backgroundPosition: `${-sx}px ${-sy}px`,
  backgroundRepeat: "no-repeat",
})

export default function LuasDoorHero({
  title = "Find a home that fits your life",
  tagline = "Every door in the city is already open.",
  scrollHint = "SCROLL",
  cta = false,
  citySrc = DEFAULT_CITY,
  cityAlt = "The River Liffey and the Ha'penny Bridge in Dublin city centre",
  skipTargetId,
  duration = 3000,
  children,
  className,
  style,
}: LuasDoorHeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const tramRef = useRef<HTMLImageElement>(null)
  const leftLeafRef = useRef<HTMLDivElement>(null)
  const rightLeafRef = useRef<HTMLDivElement>(null)
  const doorShadowRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLImageElement>(null)
  const cityDimRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const skipButtonRef = useRef<HTMLButtonElement>(null)
  const skipRef = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  const [staticMode, setStaticMode] = useState(false)

  useEffect(() => {
    const tram = tramRef.current
    const city = cityRef.current
    if (!tram || !city) return
    let cancelled = false
    Promise.all([tram.decode(), city.decode()])
      .catch(() => {})
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    // No explicit `behavior`: html's scroll-behavior decides, which globals.css
    // already switches to `auto` under prefers-reduced-motion.
    function scrollToTarget(el?: HTMLElement | null) {
      const dest = el ?? (skipTargetId ? document.getElementById(skipTargetId) : null)
      if (!dest) return
      dest.scrollIntoView({ block: "start" })
      dest.focus({ preventScroll: true })
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStaticMode(true)
      skipRef.current = () => scrollToTarget()
      return
    }

    let layout = computeLayout()
    let target = 0
    let current = 0
    let intent = 0
    let overflow = 0
    let releaseArmed = false
    let lastFrame = 0
    let finishedAt = 0
    let lastWheelAt = -Infinity
    let started = false
    let locked = false
    let lockedScrollY = 0
    let rafId = 0
    let touchY = 0
    let lastTouchMove: TouchEvent | null = null
    let taglineLive: boolean | null = null

    function computeLayout() {
      const vw = section!.clientWidth
      const vh = section!.clientHeight
      const cs = Math.max(vw / SCENE.w, vh / SCENE.h) * OVERSCAN
      const ox = clamp(vw / 2 - DOOR_CX * cs, vw - SCENE.w * cs, 0)
      const oy = clamp(vh / 2 - DOOR_CY * cs, vh - SCENE.h * cs, 0)
      return {
        vh,
        cs,
        ox,
        oy,
        // Offset that brings the doorway to dead centre by the end of the dolly.
        cx: vw / 2 - (ox + DOOR_CX * cs),
        cy: vh / 2 - (oy + DOOR_CY * cs),
        // Zoom at which the doorway alone covers the viewport.
        sEnd: Math.max(vw / (DOORWAY.w * cs), vh / (DOORWAY.h * cs)) * 1.15,
      }
    }

    function render(p: number) {
      const { cs, ox, oy, cx, cy, sEnd } = layout

      const titleT = 1 - seg(p, 0, 0.22)
      const pop = easeOutCubic(seg(p, 0.05, 0.15))
      const slide = easeInOutCubic(seg(p, 0.12, 0.5))
      const zoom = easeInOutSine(seg(p, 0.42, 0.96))
      const s = sEnd ** zoom

      stage!.style.transform =
        `translate(${ox + cx * zoom}px, ${oy + cy * zoom}px) scale(${cs}) ` +
        `translate(${DOOR_CX}px, ${DOOR_CY}px) scale(${s}) translate(${-DOOR_CX}px, ${-DOOR_CY}px)`
      stage!.style.opacity = String(1 - seg(zoom, 0.88, 1))

      // Plug doors: pop out from flush (98.5%) to full size, then slide apart
      // onto exactly the position the photo shows them in.
      const leafScale = 0.985 + 0.015 * pop
      const shadow = 0.4 * pop * (1 - 0.7 * slide)
      if (leftLeafRef.current) {
        leftLeafRef.current.style.transform = `translateX(${LEFT_TRAVEL * (1 - slide)}px) scale(${leafScale})`
        leftLeafRef.current.style.boxShadow = `0 18px 40px rgba(0,0,0,${shadow})`
      }
      if (rightLeafRef.current) {
        rightLeafRef.current.style.transform = `translateX(${RIGHT_TRAVEL * (1 - slide)}px) scale(${leafScale})`
        rightLeafRef.current.style.boxShadow = `0 18px 40px rgba(0,0,0,${shadow})`
      }
      if (doorShadowRef.current) doorShadowRef.current.style.opacity = String(1 - seg(zoom, 0.2, 0.7))

      if (cityRef.current) {
        const approach = easeOutCubic(seg(p, 0.25, 1))
        cityRef.current.style.transform = `scale(${1.28 - 0.28 * approach})`
      }
      if (cityDimRef.current) cityDimRef.current.style.opacity = String(0.4 * (1 - seg(p, 0.3, 0.9)))
      const taglineT = seg(p, 0.84, 1)
      if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(titleT, 0.75 * taglineT))

      if (titleRef.current) {
        titleRef.current.style.opacity = String(titleT)
        titleRef.current.style.transform = `translateY(${(1 - titleT) * -24}px) scale(${0.96 + titleT * 0.04})`
        titleRef.current.style.filter = `blur(${(1 - titleT) * 10}px)`
      }
      const tagEl = taglineRef.current
      if (tagEl) {
        const t = taglineT
        // The CTA is only reachable once it's essentially opaque. If it fades
        // out while focused (scrolling back), hand focus to Skip intro first —
        // inert / visibility:hidden would otherwise drop focus to <body>.
        const live = t >= 0.95
        if (live !== taglineLive) {
          taglineLive = live
          if (!live && tagEl.contains(document.activeElement)) skipButtonRef.current?.focus({ preventScroll: true })
          tagEl.inert = !live
          tagEl.style.pointerEvents = live ? "auto" : "none"
        }
        tagEl.style.opacity = String(t)
        tagEl.style.transform = `translateY(${(1 - t) * 20}px) scale(${0.97 + t * 0.03})`
        tagEl.style.filter = `blur(${(1 - t) * 8}px)`
        tagEl.style.visibility = t > 0.05 ? "visible" : "hidden"
      }
      if (hintRef.current) hintRef.current.style.opacity = started ? "0" : "1"
      if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${p})`
    }

    // Timed playback: progress advances linearly with time; each stage in
    // render() applies its own easing on top. dt is capped so a frame stall
    // (or a backgrounded tab) doesn't skip the doors.
    function tick(now: number) {
      const dt = lastFrame ? Math.min(now - lastFrame, 64) : 16
      lastFrame = now
      current = Math.min(target, current + dt / duration)
      render(current)
      if (current < target) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = 0
        lastFrame = 0
        finishedAt = performance.now()
      }
    }
    const kick = () => {
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    /** Pins the page. Returns whether it is pinned (a collapsed hero never pins). */
    function engageLock() {
      if (locked) return true
      if (section!.clientHeight === 0) return false
      locked = true
      lockedScrollY = window.scrollY
      // Keep the classic scrollbar's gutter so nothing shifts sideways.
      const root = document.documentElement
      if (window.innerWidth > root.clientWidth) root.style.overflowY = "scroll"
      const b = document.body.style
      b.position = "fixed"
      b.top = `-${lockedScrollY}px`
      b.left = "0"
      b.right = "0"
      b.width = "100%"
      b.overscrollBehavior = "none"
      section!.style.touchAction = LOCKED_TOUCH_ACTION
      // Focus left outside the hero (e.g. on <main> after Skip intro) would
      // re-fire focusin when the window regains focus and end the intro.
      const active = document.activeElement
      if (active instanceof HTMLElement && active !== document.body && !section!.contains(active)) active.blur()
      return true
    }

    function releaseLock() {
      if (!locked) return
      locked = false
      const b = document.body.style
      b.position = ""
      b.top = ""
      b.left = ""
      b.right = ""
      b.width = ""
      b.overscrollBehavior = ""
      document.documentElement.style.overflowY = ""
      section!.style.touchAction = ""
      window.scrollTo({ top: lockedScrollY, behavior: "instant" })
    }

    /** `gap`: ms since the previous wheel event (Infinity for touch / keys). */
    function push(dy: number, gap = Infinity) {
      // The intro only plays forwards; backward input while pinned is just swallowed.
      if (dy <= 0) return
      if (target < 1) {
        // One deliberate scroll starts the whole intro.
        intent += dy
        if (intent < TRIGGER_DISTANCE) return
        target = 1
        started = true
        kick()
        return
      }
      // Still playing, or the final frame is still settling: swallow input.
      if (current < 1 || performance.now() - finishedAt < SETTLE_MS) return
      // Trackpad momentum from the triggering flick keeps streaming; only a
      // fresh push (after a pause) counts towards unlocking the page.
      if (!releaseArmed) {
        if (gap < NEW_GESTURE_GAP) return
        releaseArmed = true
      }
      overflow += dy
      if (overflow >= RELEASE_DISTANCE) {
        overflow = 0
        releaseArmed = false
        releaseLock()
      }
    }

    function finish() {
      cancelAnimationFrame(rafId)
      rafId = 0
      lastFrame = 0
      target = current = 1
      started = true
      render(1)
      releaseLock()
    }

    skipRef.current = () => {
      finish()
      scrollToTarget()
    }

    // The page is never pinned up front (that would also strand screen-reader
    // and scrollbar users). It's taken over by forward input at the very top,
    // only while the intro hasn't played yet.
    const atTop = () => window.scrollY <= 1
    const takesOver = (dy: number) => atTop() && dy > 0 && target < 1
    /** Routes one input delta; returns true when the page handled it (caller prevents default). */
    const handle = (dy: number, gap?: number) => {
      if (!locked && !(takesOver(dy) && engageLock())) return false
      push(dy, gap)
      return true
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // trackpad pinch-zoom
      const raw = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * layout.vh : e.deltaY
      const gap = e.timeStamp - lastWheelAt
      lastWheelAt = e.timeStamp
      if (handle(clamp(raw, -MAX_WHEEL_STEP, MAX_WHEEL_STEP), gap)) e.preventDefault()
    }

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? touchY
    }
    // Re-sync when a finger lifts mid-gesture, or the next move would jump by
    // the distance between two fingers.
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length) touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      // Bound on both window and the section (see below): handle each event once.
      if (e === lastTouchMove) return
      lastTouchMove = e
      const y = e.touches[0]?.clientY ?? touchY
      if (e.touches.length > 1) {
        touchY = y
        return
      }
      const dy = (touchY - y) * TOUCH_GAIN
      touchY = y
      if (handle(dy) && e.cancelable) e.preventDefault()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return
      // One key press is a full "push": it starts the intro, or once it has
      // finished, unlocks the page.
      const press = RELEASE_DISTANCE
      let dy = 0
      switch (e.key) {
        case "ArrowDown": case "PageDown": case "End": dy = press; break
        case "ArrowUp": case "PageUp": case "Home": dy = -press; break
        case " ":
          // Space activates focused buttons/links — leave those alone.
          if (e.target instanceof HTMLElement && e.target.closest("a, button, summary")) return
          dy = e.shiftKey ? -press : press
          break
        default:
          return
      }
      if (handle(dy)) e.preventDefault()
    }

    // Keyboard users tabbing past the hero: finish the intro and let the
    // browser bring the focused element into view.
    const onFocusIn = (e: FocusEvent) => {
      if (!locked || !(e.target instanceof HTMLElement) || section.contains(e.target)) return
      finish()
      e.target.scrollIntoView({ block: "nearest" })
    }

    // In-page links (e.g. the "Skip to content" link) can't scroll a pinned page.
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      const dest = link && document.getElementById(link.hash.slice(1))
      if (!dest) return
      e.preventDefault()
      finish()
      scrollToTarget(dest)
    }

    const onHashChange = () => {
      if (!locked) return
      finish()
      scrollToTarget(document.getElementById(window.location.hash.slice(1)))
    }

    const resizeObserver = new ResizeObserver(() => {
      layout = computeLayout()
      render(current)
    })
    resizeObserver.observe(section)

    // A restored scroll position or a #hash deep link shows the finished state.
    if (!atTop() || window.location.hash) {
      target = current = 1
      started = true
    }
    render(current)

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("touchcancel", onTouchEnd, { passive: true })
    // Also bind on the element with capture — on some iOS versions a
    // window-level listener alone can lose the race against native scrolling.
    section.addEventListener("touchstart", onTouchStart, { passive: true, capture: true })
    section.addEventListener("touchmove", onTouchMove, { passive: false, capture: true })
    window.addEventListener("keydown", onKeyDown)
    document.addEventListener("focusin", onFocusIn)
    section.addEventListener("click", onClick)
    window.addEventListener("hashchange", onHashChange)

    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchcancel", onTouchEnd)
      section.removeEventListener("touchstart", onTouchStart, true)
      section.removeEventListener("touchmove", onTouchMove, true)
      window.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("focusin", onFocusIn)
      section.removeEventListener("click", onClick)
      window.removeEventListener("hashchange", onHashChange)
      resizeObserver.disconnect()
      cancelAnimationFrame(rafId)
      releaseLock()
    }
  }, [duration, skipTargetId])

  const fill: CSSProperties = { position: "absolute", inset: 0 }
  const centred: CSSProperties = {
    gridArea: "1 / 1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Introduction"
      className={["ldh", className].filter(Boolean).join(" ")}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: COL_BG,
        color: COL_TEXT,
        fontFamily: SANS,
        ...style,
      }}
    >
      {/* Injected raw: React 18 HTML-escapes quotes in <style> text on the server, breaking hydration. */}
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      {/* City — seen through the doorway, then full-bleed. */}
      <img
        ref={cityRef}
        src={citySrc}
        alt={cityAlt}
        fetchPriority="high"
        style={{
          ...fill,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "47% 62%",
          transformOrigin: "50% 55%",
          transform: staticMode ? "none" : "scale(1.28)",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
      <div ref={cityDimRef} style={{ ...fill, background: COL_BG, opacity: staticMode ? 0 : 0.4, pointerEvents: "none" }} />

      {/* Tram stage — laid out in TRAM_SRC pixel space, scaled to cover by JS. */}
      <div
        ref={stageRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SCENE.w,
          height: SCENE.h,
          transformOrigin: "0 0",
          visibility: ready && !staticMode ? "visible" : "hidden",
          pointerEvents: "none",
        }}
      >
        <img
          ref={tramRef}
          src={TRAM_SRC}
          alt=""
          fetchPriority="high"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SCENE.w,
            height: SCENE.h,
            maxWidth: "none",
            // Punch the doorway out (evenodd: the inner rectangle becomes a hole).
            clipPath: `polygon(evenodd, 0 0, ${SCENE.w}px 0, ${SCENE.w}px ${SCENE.h}px, 0 ${SCENE.h}px, 0 0, ${DOORWAY.x}px ${DOORWAY.y}px, ${DOORWAY.x + DOORWAY.w}px ${DOORWAY.y}px, ${DOORWAY.x + DOORWAY.w}px ${DOORWAY.y + DOORWAY.h}px, ${DOORWAY.x}px ${DOORWAY.y + DOORWAY.h}px, ${DOORWAY.x}px ${DOORWAY.y}px)`,
          }}
        />

        {/* Depth inside the doorway frame. */}
        <div
          ref={doorShadowRef}
          style={{
            position: "absolute",
            left: DOORWAY.x,
            top: DOORWAY.y,
            width: DOORWAY.w,
            height: DOORWAY.h,
            boxShadow: "inset 0 0 70px 14px rgba(0,0,0,0.6), inset 0 40px 50px -20px rgba(0,0,0,0.7)",
          }}
        />

        {/* Window glass the open leaves sit over in the photo — visible while they're closed. */}
        {[
          { leaf: LEFT_LEAF, srcX: LEFT_LEAF.x - LEFT_LEAF.w, mullion: "left" as const },
          { leaf: RIGHT_LEAF, srcX: RIGHT_LEAF.x + RIGHT_LEAF.w, mullion: "right" as const },
        ].map(({ leaf, srcX, mullion }) => (
          <div
            key={mullion}
            style={{ ...tramLayer(srcX, leaf.y), left: leaf.x, top: leaf.y, width: leaf.w, height: leaf.h }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: GLASS.top - leaf.y,
                height: GLASS.bottom - GLASS.top,
                background:
                  "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.07) 42%, rgba(255,255,255,0) 54%), linear-gradient(180deg, rgba(9,12,22,0.86), rgba(16,22,36,0.8) 55%, rgba(9,12,22,0.9))",
                [mullion === "left" ? "borderLeft" : "borderRight"]: "14px solid #0a0c12",
              }}
            />
          </div>
        ))}

        <div
          ref={leftLeafRef}
          style={{
            ...tramLayer(LEFT_LEAF.x, LEFT_LEAF.y),
            left: LEFT_LEAF.x,
            top: LEFT_LEAF.y,
            width: LEFT_LEAF.w,
            height: LEFT_LEAF.h,
            // Pop-out scale pivots on the meeting edge so closed leaves never part.
            transformOrigin: "100% 0%",
            transform: `translateX(${LEFT_TRAVEL}px) scale(0.985)`,
          }}
        />
        <div
          ref={rightLeafRef}
          style={{
            ...tramLayer(RIGHT_LEAF.x, RIGHT_LEAF.y),
            left: RIGHT_LEAF.x,
            top: RIGHT_LEAF.y,
            width: RIGHT_LEAF.w,
            height: RIGHT_LEAF.h,
            transformOrigin: "0% 50%",
            transform: `translateX(${RIGHT_TRAVEL}px) scale(0.985)`,
          }}
        />
      </div>

      {/* Legibility: a vignette (with a fixed-depth band for the nav), plus a dimmer while text is up. */}
      <div
        style={{
          ...fill,
          background:
            "linear-gradient(180deg, rgba(5,7,13,0.65), rgba(5,7,13,0.45) 90px, rgba(5,7,13,0) 30%, rgba(5,7,13,0.15) 70%, rgba(5,7,13,0.6))",
          pointerEvents: "none",
        }}
      />
      <div
        ref={scrimRef}
        style={{
          ...fill,
          background: "radial-gradient(ellipse at center, rgba(5,7,13,0.55), rgba(5,7,13,0.25) 70%)",
          opacity: staticMode ? 0.75 : 1,
          pointerEvents: "none",
        }}
      />

      {/* First in the DOM so the skip link / nav lead the tab order; zIndex keeps them on top. */}
      {children && <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3 }}>{children}</div>}

      <div
        style={{
          ...fill,
          display: "grid",
          alignContent: "center",
          justifyItems: "center",
          rowGap: 20,
          padding: "0 6%",
          pointerEvents: "none",
        }}
      >
        <div ref={titleRef} style={{ ...centred, gridArea: staticMode ? "1 / 1" : centred.gridArea, willChange: "transform, filter, opacity" }}>
          <h1
            style={{
              margin: 0,
              maxWidth: "14ch",
              fontWeight: 800,
              fontSize: "clamp(38px, 7vw, 104px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              textWrap: "balance",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </h1>
        </div>

        {(tagline || cta) && (
          <div
            ref={taglineRef}
            style={{
              ...centred,
              gridArea: staticMode ? "2 / 1" : centred.gridArea,
              opacity: staticMode ? 1 : 0,
              visibility: staticMode ? "visible" : "hidden",
              pointerEvents: staticMode ? "auto" : "none",
            }}
          >
            {tagline && (
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "clamp(22px, 3.4vw, 44px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.015em",
                  textWrap: "balance",
                  textShadow: "0 4px 24px rgba(0,0,0,0.55)",
                }}
              >
                {tagline}
              </p>
            )}
            {cta && (
              <Link className="ldh-cta" href={cta.href}>
                {cta.label} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {!staticMode && (
        <div
          ref={hintRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "clamp(24px, 6vh, 52px)",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            color: "rgba(240,244,248,0.75)",
            fontSize: "clamp(10px, 1.4vw, 12px)",
            fontWeight: 600,
            letterSpacing: "0.3em",
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          <span>{scrollHint}</span>
          <svg width="14" height="18" viewBox="0 0 14 18" style={{ animation: "ldh-bounce 1.6s ease-in-out infinite" }}>
            <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {skipTargetId && (
        <button
          ref={skipButtonRef}
          type="button"
          className="ldh-skip"
          onClick={() => skipRef.current()}
          style={{ position: "absolute", left: "clamp(16px, 3vw, 32px)", bottom: "clamp(14px, 2.4vw, 24px)", zIndex: 3 }}
        >
          {staticMode ? "Continue" : "Skip intro"}
        </button>
      )}

      {/* Thin progress line — fills as the intro plays. */}
      {!staticMode && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "rgba(255,255,255,0.12)" }}>
          <div
            ref={progressBarRef}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, rgba(245,185,25,0.6), ${LUAS_YELLOW})`,
              transform: "scaleX(0)",
              transformOrigin: "left center",
            }}
          />
        </div>
      )}
    </section>
  )
}
