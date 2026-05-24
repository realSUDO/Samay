import { useEffect, useRef, useState } from 'react'
import Controls from './Controls'
import styles from './Timer.module.css'

const PRESETS = [
  { label: '5m',  s: 5 * 60 },
  { label: '10m', s: 10 * 60 },
  { label: '25m', s: 25 * 60 },
  { label: '45m', s: 45 * 60 },
  { label: '60m', s: 60 * 60 },
]

const DEFAULT = 25 * 60
// viewBox 360×360, cx/cy=180, r=163 → C = 2π×163 ≈ 1024
const RING_R  = 163
const RING_C  = 2 * Math.PI * RING_R

function toInputVal(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}`
}

function parseInput(raw) {
  const clean = raw.replace(/[^\d:]/g, '')
  if (clean.includes(':')) {
    const [mm = '0', ss = '0'] = clean.split(':')
    return { m: parseInt(mm || '0', 10), s: parseInt(ss || '0', 10) }
  }
  const d = clean.padStart(4, '0')
  return { m: parseInt(d.slice(0, 2), 10), s: parseInt(d.slice(2, 4), 10) }
}

function validate(raw) {
  const { m, s } = parseInput(raw)
  if (s > 59) return { ok: false, err: 'Seconds must be 00–59' }
  const total = m * 60 + s
  if (total === 0) return { ok: false, err: 'Duration must be at least 1 second' }
  if (total > 99 * 60 + 59) return { ok: false, err: 'Max 99:59' }
  return { ok: true, total }
}

export default function Timer() {
  const [totalSec, setTotalSec]   = useState(DEFAULT)
  const [remaining, setRemaining] = useState(DEFAULT)
  const [running, setRunning]     = useState(false)
  const [editing, setEditing]     = useState(false)
  const [inputVal, setInputVal]   = useState(toInputVal(DEFAULT))
  const [finished, setFinished]   = useState(false)

  const startRef     = useRef(null)
  const baseRef      = useRef(DEFAULT)
  const remainRef    = useRef(DEFAULT)
  const intervalRef  = useRef(null)
  const startedRef   = useRef(false)
  const lofiRef      = useRef(null)
  const beepRef      = useRef(null)

  useEffect(() => {
    lofiRef.current = Object.assign(new Audio('/lofi.mp3'), { loop: true })
    beepRef.current = new Audio('/beep.mp3')
    return () => lofiRef.current?.pause()
  }, [])

  useEffect(() => { remainRef.current = remaining }, [remaining])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, baseRef.current - Math.floor((Date.now() - startRef.current) / 1000))
        remainRef.current = left
        setRemaining(left)
        if (left === 0) setRunning(false)
      }, 250)
    } else {
      clearInterval(intervalRef.current)
      baseRef.current = remainRef.current
      if (remainRef.current === 0) {
        lofiRef.current?.pause()
        if (lofiRef.current) lofiRef.current.currentTime = 0
        beepRef.current?.play().catch(() => {})
        setFinished(true)
      } else {
        lofiRef.current?.pause()
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handlePlayPause = () => {
    if (remainRef.current === 0) return
    if (running) { setRunning(false); return }
    if (!startedRef.current) {
      new Audio('/beep.mp3').play().catch(() => {})
      startedRef.current = true
    }
    lofiRef.current?.play().catch(() => {})
    setRunning(true)
  }

  const handleReset = () => {
    lofiRef.current?.pause()
    if (lofiRef.current) lofiRef.current.currentTime = 0
    startedRef.current = false
    setRunning(false)
    setFinished(false)
    setRemaining(totalSec)
    remainRef.current = totalSec
    baseRef.current = totalSec
  }

  const applyPreset = (sec) => {
    lofiRef.current?.pause()
    if (lofiRef.current) lofiRef.current.currentTime = 0
    startedRef.current = false
    setRunning(false)
    setFinished(false)
    setTotalSec(sec)
    setRemaining(sec)
    remainRef.current = sec
    baseRef.current = sec
    setInputVal(toInputVal(sec))
  }

  const commitInput = (raw) => {
    const result = validate(raw)
    if (!result.ok) return false
    applyPreset(result.total)
    setEditing(false)
    return true
  }

  const progress = totalSec > 0 ? remaining / totalSec : 1
  const dashOffset = RING_C * (1 - progress)

  const hours   = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  // Plain text time string — fits inside the ring without overflow
  const timeStr = hours > 0
    ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
    : `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`

  return (
    <div className={styles.wrapper}>
      {/* Preset chips */}
      {!running && (
        <div className={styles.presets}>
          {PRESETS.map(p => (
            <button
              key={p.s}
              className={`${styles.preset} ${totalSec === p.s ? styles.presetActive : ''}`}
              onClick={() => applyPreset(p.s)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Progress ring + time */}
      <div className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 360 360" aria-hidden="true">
          {/* Track */}
          <circle cx="180" cy="180" r={RING_R} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
          {/* Progress arc */}
          <circle
            cx="180" cy="180" r={RING_R}
            fill="none"
            stroke={finished ? 'var(--red)' : 'var(--accent)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 180 180)"
            style={{ transition: running ? 'stroke-dashoffset 0.25s linear' : 'none' }}
          />
        </svg>

        {editing ? (
          <TimerInput
            value={inputVal}
            onChange={setInputVal}
            onCommit={commitInput}
            onCancel={() => { setInputVal(toInputVal(remaining)); setEditing(false) }}
          />
        ) : (
          <button
            className={`${styles.displayBtn} ${!running ? styles.clickable : ''} ${finished ? styles.finished : ''}`}
            onClick={() => !running && setEditing(true)}
            disabled={running}
            aria-label="Set timer duration"
          >
            <span className={styles.ringTime}>{timeStr}</span>
            {!running && !finished && <span className={styles.ringHint}>click to edit</span>}
          </button>
        )}
      </div>

      {finished && <p className={styles.finishedMsg}>Time&apos;s up!</p>}

      {!editing && (
        <Controls
          running={running}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          showLap={false}
        />
      )}

      {!editing && !running && !finished && remaining === totalSec && (
        <p className={styles.hint}>Click the time to set a custom duration</p>
      )}
    </div>
  )
}

function TimerInput({ value, onChange, onCommit, onCancel }) {
  const ref = useRef(null)
  const [err, setErr] = useState('')

  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  const tryCommit = () => {
    const r = validate(value)
    if (!r.ok) { setErr(r.err); ref.current?.focus(); return }
    onCommit(value)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); tryCommit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div className={styles.inputWrap}>
      <input
        ref={ref}
        className={`${styles.input} ${err ? styles.inputErr : ''}`}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => { onChange(e.target.value.replace(/[^\d:]/g, '').slice(0, 5)); if (err) setErr('') }}
        onKeyDown={handleKey}
        placeholder="MM:SS"
        maxLength={5}
        aria-label="Set timer duration"
      />
      {err && <p className={styles.errMsg}>{err}</p>}
      <div className={styles.inputActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.setBtn} onClick={tryCommit}>Set</button>
      </div>
    </div>
  )
}
