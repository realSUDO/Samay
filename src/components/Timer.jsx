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
  const [displayRemaining, setDisplayRemaining] = useState(DEFAULT)
  const [running, setRunning]     = useState(false)
  const [editing, setEditing]     = useState(false)
  const [inputVal, setInputVal]   = useState(toInputVal(DEFAULT))
  const [finished, setFinished]   = useState(false)
  const [lofiMuted, setLofiMuted] = useState(true)

  const startRef     = useRef(null)
  const baseRef      = useRef(DEFAULT)
  const remainRef    = useRef(DEFAULT)
  const intervalRef  = useRef(null)
  const startedRef   = useRef(false)
  const lofiRef      = useRef(null)
  const beepRef      = useRef(null)
  const timeUpRef    = useRef(null)

  useEffect(() => {
    lofiRef.current = Object.assign(new Audio('/lofi.mp3'), { loop: true })
    beepRef.current = new Audio('/beep.mp3')
    timeUpRef.current = Object.assign(new Audio('/time-up.mp3'), { loop: true })
    return () => {
      lofiRef.current?.pause()
      timeUpRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (lofiRef.current) lofiRef.current.muted = lofiMuted
  }, [lofiMuted])

  useEffect(() => { remainRef.current = remaining }, [remaining])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const leftExact = Math.max(0, baseRef.current - ((Date.now() - startRef.current) / 1000))
        const leftWhole = Math.ceil(leftExact)
        remainRef.current = leftWhole
        setDisplayRemaining(leftExact)
        setRemaining(leftWhole)
        if (leftExact === 0) setRunning(false)
      }, 50)
    } else {
      clearInterval(intervalRef.current)
      baseRef.current = remainRef.current
      if (remainRef.current === 0) {
        lofiRef.current?.pause()
        if (lofiRef.current) lofiRef.current.currentTime = 0
        if (timeUpRef.current) {
          timeUpRef.current.currentTime = 0
          timeUpRef.current.play().catch(() => {})
        }
        setFinished(true)
      } else {
        lofiRef.current?.pause()
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const stopTimeUpAlarm = () => {
    if (!timeUpRef.current) return
    timeUpRef.current.pause()
    timeUpRef.current.currentTime = 0
  }

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

  const handleToggleLofiMute = () => {
    setLofiMuted(v => !v)
  }

  const handleReset = () => {
    stopTimeUpAlarm()
    lofiRef.current?.pause()
    if (lofiRef.current) lofiRef.current.currentTime = 0
    startedRef.current = false
    setRunning(false)
    setFinished(false)
    setRemaining(totalSec)
    setDisplayRemaining(totalSec)
    remainRef.current = totalSec
    baseRef.current = totalSec
  }

  const applyPreset = (sec) => {
    stopTimeUpAlarm()
    lofiRef.current?.pause()
    if (lofiRef.current) lofiRef.current.currentTime = 0
    startedRef.current = false
    setRunning(false)
    setFinished(false)
    setTotalSec(sec)
    setRemaining(sec)
    setDisplayRemaining(sec)
    remainRef.current = sec
    baseRef.current = sec
    setInputVal(toInputVal(sec))
  }

  const handleAcknowledgeFinished = () => {
    stopTimeUpAlarm()
    setFinished(false)
  }

  const handleEditRequest = () => {
    if (finished) handleAcknowledgeFinished()
    setEditing(true)
  }

  const commitInput = (raw) => {
    const result = validate(raw)
    if (!result.ok) return false
    applyPreset(result.total)
    setEditing(false)
    return true
  }

  const progress = totalSec > 0 ? displayRemaining / totalSec : 1
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
            style={{ transition: running ? 'stroke-dashoffset 0.08s linear, stroke 0.6s ease' : 'stroke 0.6s ease' }}
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
            onClick={() => !running && handleEditRequest()}
            disabled={running}
            aria-label="Set timer duration"
          >
            <span className={styles.ringTime}>{timeStr}</span>
            {!running && !finished && <span className={styles.ringHint}>click to edit</span>}
          </button>
        )}
      </div>

      {finished && (
        <div className={styles.finishedBox}>
          <p className={styles.finishedMsg}>Time&apos;s up!</p>
          <button className={styles.okayBtn} onClick={handleAcknowledgeFinished}>
            OK
          </button>
        </div>
      )}

      {!editing && (
        <Controls
          running={running}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          showLap={false}
          rightAction={running ? {
            onClick: handleToggleLofiMute,
            ariaLabel: lofiMuted ? 'Unmute lofi' : 'Mute lofi',
            active: lofiMuted,
            icon: lofiMuted ? <VolumeOffIcon /> : <VolumeIcon />,
          } : null}
        />
      )}

      {!editing && !running && !finished && remaining === totalSec && (
        <p className={styles.hint}>Click the time to set a custom duration</p>
      )}
    </div>
  )
}

function VolumeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

function VolumeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
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
