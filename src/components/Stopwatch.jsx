import { useState, useEffect, useRef } from 'react'
import TimeDisplay from './TimeDisplay'
import Controls from './Controls'
import styles from './Stopwatch.module.css'

function playClick() {
  const audio = new Audio('/beep.mp3')
  audio.currentTime = 0
  audio.play().catch(() => {})
}

function formatLap(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function Stopwatch() {
  const [elapsed, setElapsed]   = useState(0)
  const [running, setRunning]   = useState(false)
  const [laps, setLaps]         = useState([])
  const startRef    = useRef(null)
  const baseRef     = useRef(0)
  const elapsedRef  = useRef(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    elapsedRef.current = elapsed
  }, [elapsed])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const next = baseRef.current + (Date.now() - startRef.current)
        elapsedRef.current = next
        setElapsed(next)
      }, 100)
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

  const totalSeconds = Math.floor(elapsed / 1000)
  const hours        = Math.floor(totalSeconds / 3600)
  const minutes      = Math.floor((totalSeconds % 3600) / 60)
  const seconds      = totalSeconds % 60

  return (
    <div className={styles.wrapper}>
      <TimeDisplay
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        centiseconds={0}
        showHours={hours > 0}
        showCentiseconds={false}
      />
      <Controls
        running={running}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onLap={handleLap}
        showLap
      />
      {laps.length > 0 && (
        <ol className={styles.laps} aria-label="Lap times">
          {laps.map((ms, i) => (
            <li key={i} className={styles.lap}>
              <span className={styles.lapNum}>Lap {i + 1}</span>
              <span className={styles.lapTime}>{formatLap(ms)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
