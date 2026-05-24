import { useState, useEffect, useRef, useCallback } from 'react'
import Clock from './components/Clock'
import Stopwatch from './components/Stopwatch'
import Timer from './components/Timer'
import styles from './App.module.css'

const POOL_SIZE = 10
const MIN_TICK_STEP_DEGREES = 3
const MAX_TICK_STEP_DEGREES = 7
const MIN_PLAYBACK_RATE = 0.85
const MAX_PLAYBACK_RATE = 1.35
const TICK_VOLUME = 0.43
const VELOCITY_SMOOTHING = 0.18
const MIN_TICK_GAP_MS = 16
const MIN_SOUND_VELOCITY = 0.015
const MAX_SOUND_VELOCITY = 0.5
let audioPool = null
let poolIdx = 0
let lastTickAt = 0

function getPool() {
  if (!audioPool) {
    audioPool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio('/tick.mp3')
      a.preload = 'auto'
      a.volume = TICK_VOLUME
      return a
    })
  }
  return audioPool
}

function playDialTick(speedFactor = 0) {
  const now = performance.now()
  if (now - lastTickAt < MIN_TICK_GAP_MS) return
  lastTickAt = now

  try {
    const pool = getPool()
    const a = pool[poolIdx % POOL_SIZE]
    poolIdx++
    a.pause()
    a.currentTime = 0
    a.volume = TICK_VOLUME
    const rate = mapRange(clamp(speedFactor, 0, 1), 0, 1, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE)
    a.playbackRate = clamp(rate + (Math.random() - 0.5) * 0.06, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE)
    a.play().catch(() => {})
  } catch {
    // Audio playback can fail before the browser grants media permission.
  }
}

// ── Dial geometry ──────────────────────────────────────────────────────────
const TABS        = [
  { id: 'clock',     label: 'Clock',     icon: ClockIcon },
  { id: 'stopwatch', label: 'Stopwatch', icon: StopwatchIcon },
  { id: 'timer',     label: 'Timer',     icon: TimerIcon },
]
const DESKTOP_DISK_R = 500
const DESKTOP_DISK_BELOW = 380
const STEP        = 28
const BASE_ANGLES = [-118, -90, -62]
const RETURN_ANIMATION_MS = 430

function getDialGeometry(width = 1024) {
  if (width <= 600) {
    const radius = clamp(width * 0.42, 135, 168)
    return {
      radius,
      below: radius - 132,
    }
  }

  if (width <= 820) {
    const radius = clamp(width * 0.52, 330, DESKTOP_DISK_R)
    return {
      radius,
      below: radius - 110,
    }
  }

  return {
    radius: DESKTOP_DISK_R,
    below: DESKTOP_DISK_BELOW,
  }
}

function tabPos(tabIdx, rotation, geometry) {
  const rad = (BASE_ANGLES[tabIdx] + rotation) * Math.PI / 180
  return {
    left: `calc(50% + ${(geometry.radius * Math.cos(rad)).toFixed(2)}px)`,
    top:  `calc(100% + ${(geometry.below + geometry.radius * Math.sin(rad)).toFixed(2)}px)`,
  }
}

function activeFromRot(rot) {
  const offset = Math.round(rot / STEP)
  return ((1 - offset) % 3 + 3) % 3
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360
}

function getAngleDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return Math.min(diff, 360 - diff)
}

function getAngleDelta(currentAngle, previousAngle) {
  const current = normalizeAngle(currentAngle)
  const previous = normalizeAngle(previousAngle)
  return ((current - previous + 540) % 360) - 180
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(start, end, amount) {
  return start + (end - start) * amount
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1)
  return outMin + (outMax - outMin) * t
}

function createDialSoundTracker(angle, now = performance.now()) {
  return {
    lastAngle: angle,
    lastTickAngle: angle,
    lastTime: now,
    smoothedVelocity: 0,
  }
}

function updateDialSoundFromMovement(currentAngle, tracker, now = performance.now()) {
  const elapsed = Math.max(now - tracker.lastTime, 16)
  const angleDelta = Math.abs(getAngleDelta(currentAngle, tracker.lastAngle))
  const angularVelocity = angleDelta / elapsed

  tracker.smoothedVelocity = lerp(
    tracker.smoothedVelocity,
    angularVelocity,
    VELOCITY_SMOOTHING,
  )
  tracker.lastAngle = currentAngle
  tracker.lastTime = now

  const speedFactor = mapRange(
    tracker.smoothedVelocity,
    MIN_SOUND_VELOCITY,
    MAX_SOUND_VELOCITY,
    0,
    1,
  )
  const tickStepDegrees = mapRange(
    speedFactor,
    0,
    1,
    MAX_TICK_STEP_DEGREES,
    MIN_TICK_STEP_DEGREES,
  )

  if (getAngleDistance(currentAngle, tracker.lastTickAngle) < tickStepDegrees) return
  playDialTick(speedFactor)
  tracker.lastTickAngle = currentAngle
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [rotation, setRotation] = useState(STEP)
  const [isDragging, setIsDragging] = useState(false)
  const [dialGeometry, setDialGeometry] = useState(() => getDialGeometry(
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  ))

  // drag state — all in a ref to avoid stale closures
  const drag = useRef({
    active: false,
    startX: 0,
    startRot: 0,
    moved: false,
    sound: createDialSoundTracker(0),
  })
  const rotationRef = useRef(rotation)
  const returnRaf = useRef(null)

  const activeIdx = activeFromRot(rotation)
  const activeId  = TABS[activeIdx].id

  useEffect(() => {
    const updateGeometry = () => setDialGeometry(getDialGeometry(window.innerWidth))
    updateGeometry()
    window.addEventListener('resize', updateGeometry)
    return () => window.removeEventListener('resize', updateGeometry)
  }, [])

  useEffect(() => {
    rotationRef.current = rotation
  }, [rotation])

  useEffect(() => () => cancelAnimationFrame(returnRaf.current), [])

  // keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === '1') rotateTo(0)
      if (e.key === '2') rotateTo(1)
      if (e.key === '3') rotateTo(2)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  function rotateTo(tabIdx) {
    const target = -90 - BASE_ANGLES[tabIdx]
    playDialTick(0.25)
    rotationRef.current = target
    setRotation(target)
  }

  // ── Pointer down ──
  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    cancelAnimationFrame(returnRaf.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    getPool()
    const currentRot = rotationRef.current
    drag.current = {
      active: true,
      startX: e.clientX,
      startRot: currentRot,
      moved: false,
      sound: createDialSoundTracker(currentRot),
    }
    setIsDragging(true)
  }, [])

  // ── Pointer move — fire ticks based on angle delta ──
  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 3) drag.current.moved = true

    const deltaRot = (dx / dialGeometry.radius) * (180 / Math.PI)
    const raw = drag.current.startRot + deltaRot
    const clamped = Math.max(-STEP * 1.4, Math.min(STEP * 2.4, raw))

    updateDialSoundFromMovement(clamped, drag.current.sound)
    rotationRef.current = clamped
    setRotation(clamped)
  }, [dialGeometry.radius])

  // ── Pointer up — snap back with movement-driven return ticks ──
  const onPointerUp = useCallback((e, tabIdx) => {
    if (!drag.current.active) return
    drag.current.active = false
    setIsDragging(false)
    const moved = drag.current.moved
    const fromRot = rotationRef.current

    const snapped = Math.round(fromRot / STEP) * STEP
    const target  = Math.max(-STEP, Math.min(STEP * 2, snapped))
    rotationRef.current = target
    setRotation(target)

    const start   = performance.now()
    const returnTracker = createDialSoundTracker(fromRot, start)
    returnTracker.smoothedVelocity = drag.current.sound.smoothedVelocity

    function tick(now) {
      const t = Math.min((now - start) / RETURN_ANIMATION_MS, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const cur  = fromRot + (target - fromRot) * ease

      updateDialSoundFromMovement(cur, returnTracker, now)

      if (t < 1) {
        returnRaf.current = requestAnimationFrame(tick)
      }
    }

    if (getAngleDistance(target, fromRot) >= MIN_TICK_STEP_DEGREES) {
      returnRaf.current = requestAnimationFrame(tick)
    } else {
      playDialTick(0.15)
    }

    if (!moved && tabIdx >= 0) {
      rotateTo(tabIdx)
    }
  }, [])

  const view = { clock: <Clock />, stopwatch: <Stopwatch />, timer: <Timer /> }[activeId]

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Samay</span>
      </header>

      <main className={styles.main}>
        {view}
      </main>

      <div
        className={`${styles.arcZone} ${isDragging ? styles.dragging : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => onPointerUp(e, -1)}
        onPointerCancel={(e) => onPointerUp(e, -1)}
        aria-hidden="true"
      />

      <ArcTrack rotation={rotation} geometry={dialGeometry} />

      <nav className={styles.arcNav} aria-label="Mode">
        {TABS.map((tab, i) => {
          const pos = tabPos(i, rotation, dialGeometry)
          const isActive = i === activeIdx
          return (
            <button
              key={tab.id}
              className={`${styles.arcBtn} ${isActive ? styles.arcActive : ''} ${isDragging ? styles.arcDragging : ''}`}
              style={{ left: pos.left, top: pos.top }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, i)}
              onPointerCancel={(e) => onPointerUp(e, i)}
              aria-pressed={isActive}
            >
              <span className={styles.arcIcon}><tab.icon /></span>
              <span className={styles.arcLabel}>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function ArcTrack({ rotation, geometry }) {
  const svgW = 900, svgH = 200
  const cx = svgW / 2
  const scale = DESKTOP_DISK_R / geometry.radius
  const radius = geometry.radius * scale
  const below = geometry.below * scale
  const cy = svgH + below

  const pts = BASE_ANGLES.map(base => {
    const rad = (base + rotation) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  })
  const [p0, p1, p2] = pts
  const d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${radius} ${radius} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`

  return (
    <svg className={styles.arcTrack} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <line x1={p1.x.toFixed(1)} y1={(p1.y - 6).toFixed(1)} x2={p1.x.toFixed(1)} y2={(p1.y + 6).toFixed(1)} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
    </svg>
  )
}
function StopwatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 14.5 15.5" />
      <line x1="9.5" y1="3" x2="14.5" y2="3" /><line x1="12" y1="3" x2="12" y2="5" />
    </svg>
  )
}
function TimerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
