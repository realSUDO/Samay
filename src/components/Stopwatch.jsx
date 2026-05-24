import { useEffect, useRef, useState } from 'react'
import TimeDisplay from './TimeDisplay'
import Controls from './Controls'
import styles from './Stopwatch.module.css'

function playClick() {
  const a = new Audio('/beep.mp3')
  a.currentTime = 0
  a.play().catch(() => {})
}

function fmtMs(ms) {
  const totalCs = Math.floor(ms / 10)
  const cs = totalCs % 100
  const totalSec = Math.floor(ms / 1000)
  const s = totalSec % 60
  const m = Math.floor(totalSec / 60) % 60
  const h = Math.floor(totalSec / 3600)
  const base = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${base}.${String(cs).padStart(2,'0')}`
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState([])

  const startRef    = useRef(null)
  const baseRef     = useRef(0)
  const elapsedRef  = useRef(0)
  const intervalRef = useRef(null)

  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const next = baseRef.current + (Date.now() - startRef.current)
        elapsedRef.current = next
        setElapsed(next)
      }, 30)
    } else {
      clearInterval(intervalRef.current)
      baseRef.current = elapsedRef.current
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handlePlayPause = () => {
    if (!running) playClick()
    setRunning(r => !r)
  }

  const handleReset = () => {
    setRunning(false)
    setElapsed(0)
    setLaps([])
    elapsedRef.current = 0
    baseRef.current = 0
  }

  const handleLap = () => {
    setLaps(prev => [...prev, elapsedRef.current])
  }

  const totalCs  = Math.floor(elapsed / 10)
  const cs       = totalCs % 100
  const totalSec = Math.floor(elapsed / 1000)
  const hours    = Math.floor(totalSec / 3600)
  const minutes  = Math.floor((totalSec % 3600) / 60)
  const seconds  = totalSec % 60

  // Lap analysis
  const lapTimes = laps.map((abs, i) => abs - (laps[i - 1] ?? 0))
  const bestIdx  = lapTimes.length > 0 ? lapTimes.indexOf(Math.min(...lapTimes)) : -1
  const worstIdx = lapTimes.length > 1 ? lapTimes.indexOf(Math.max(...lapTimes)) : -1

  return (
    <div className={styles.wrapper}>
      <TimeDisplay
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        centiseconds={cs}
        showHours={hours > 0}
        showCentiseconds
      />
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
            <span>Lap</span>
            <span>Split</span>
            <span>Total</span>
          </div>
          <ol className={styles.laps} aria-label="Lap times">
            {[...laps].reverse().map((abs, ri) => {
              const i = laps.length - 1 - ri
              const split = lapTimes[i]
              const isBest  = i === bestIdx
              const isWorst = i === worstIdx
              return (
                <li
                  key={i}
                  className={`${styles.lap} ${isBest ? styles.best : ''} ${isWorst ? styles.worst : ''}`}
                >
                  <span className={styles.lapNum}>
                    {isBest  && <span className={styles.badge} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>best</span>}
                    {isWorst && <span className={styles.badge} style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>slow</span>}
                    {i + 1}
                  </span>
                  <span className={styles.lapSplit}>{fmtMs(split)}</span>
                  <span className={styles.lapTotal}>{fmtMs(abs)}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
