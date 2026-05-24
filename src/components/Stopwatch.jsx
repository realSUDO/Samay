import { useEffect, useRef, useState } from 'react'
import Controls from './Controls'
import styles from './Stopwatch.module.css'

function playClick() {
  const a = new Audio('/beep.mp3')
  a.currentTime = 0
  a.play().catch(() => {})
}

function pad(n, len = 2) { return String(n).padStart(len, '0') }

function fmtSplit(ms) {
  const cs  = Math.floor(ms / 10) % 100
  const s   = Math.floor(ms / 1000) % 60
  const m   = Math.floor(ms / 60000) % 60
  const h   = Math.floor(ms / 3600000)
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`
    : `${pad(m)}:${pad(s)}.${pad(cs)}`
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps]       = useState([])

  const startRef    = useRef(null)
  const baseRef     = useRef(0)
  const elapsedRef  = useRef(0)
  const rafRef      = useRef(null)

  // Use rAF for smooth centisecond updates instead of setInterval
  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      const tick = () => {
        const next = baseRef.current + (Date.now() - startRef.current)
        elapsedRef.current = next
        setElapsed(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      baseRef.current = elapsedRef.current
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const handlePlayPause = () => {
    if (!running) playClick()
    setRunning(r => !r)
  }

  const handleReset = () => {
    setRunning(false)
    cancelAnimationFrame(rafRef.current)
    setElapsed(0)
    setLaps([])
    elapsedRef.current = 0
    baseRef.current = 0
  }

  const handleLap = () => setLaps(prev => [...prev, elapsedRef.current])

  // Derive display values
  const cs  = Math.floor(elapsed / 10) % 100
  const s   = Math.floor(elapsed / 1000) % 60
  const m   = Math.floor(elapsed / 60000) % 60
  const h   = Math.floor(elapsed / 3600000)

  // Lap analysis
  const lapTimes = laps.map((abs, i) => abs - (laps[i - 1] ?? 0))
  const bestIdx  = lapTimes.length > 0 ? lapTimes.indexOf(Math.min(...lapTimes)) : -1
  const worstIdx = lapTimes.length > 1 ? lapTimes.indexOf(Math.max(...lapTimes)) : -1

  return (
    <div className={styles.wrapper}>
      {/* Plain text time display */}
      <div className={styles.timeDisplay} role="timer" aria-live="off">
        {h > 0 && <span className={styles.seg}>{pad(h)}<span className={styles.sep}>:</span></span>}
        <span className={styles.seg}>{pad(m)}<span className={styles.sep}>:</span></span>
        <span className={styles.seg}>{pad(s)}</span>
        <span className={styles.cs}><span className={styles.csDot}>.</span>{pad(cs)}</span>
      </div>

      <Controls
        running={running}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onLap={handleLap}
        showLap
      />

      {laps.length > 0 && (
        <div className={styles.lapsWrap}>
          <div className={styles.lapsHeader}>
            <span>Lap</span><span>Split</span><span>Total</span>
          </div>
          <ol className={styles.laps} aria-label="Lap times">
            {[...laps].reverse().map((abs, ri) => {
              const i = laps.length - 1 - ri
              const split = lapTimes[i]
              const isBest  = i === bestIdx
              const isWorst = i === worstIdx
              return (
                <li key={i} className={`${styles.lap} ${isBest ? styles.best : ''} ${isWorst ? styles.worst : ''}`}>
                  <span className={styles.lapNum}>
                    {isBest  && <span className={styles.badge} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>best</span>}
                    {isWorst && <span className={styles.badge} style={{ background: 'var(--red-dim)',   color: 'var(--red)'   }}>slow</span>}
                    {i + 1}
                  </span>
                  <span className={styles.lapSplit}>{fmtSplit(split)}</span>
                  <span className={styles.lapTotal}>{fmtSplit(abs)}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
