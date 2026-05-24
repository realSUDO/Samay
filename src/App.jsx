import { useState, useEffect } from 'react'
import Clock from './components/Clock'
import Stopwatch from './components/Stopwatch'
import Timer from './components/Timer'
import styles from './App.module.css'

const TABS = [
  { id: 'clock',     label: 'Clock',     key: '1', icon: ClockIcon },
  { id: 'stopwatch', label: 'Stopwatch', key: '2', icon: StopwatchIcon },
  { id: 'timer',     label: 'Timer',     key: '3', icon: TimerIcon },
]

export default function App() {
  const [active, setActive] = useState('clock')

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      const tab = TABS.find(t => t.key === e.key)
      if (tab) setActive(tab.id)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const view = { clock: <Clock />, stopwatch: <Stopwatch />, timer: <Timer /> }[active]

  return (
    <div className={styles.shell}>
      {/* Brand — top left */}
      <header className={styles.header}>
        <span className={styles.brand}>Samay</span>
      </header>

      {/* Content */}
      <main className={styles.main}>
        {view}
      </main>

      {/* Arc nav — bottom */}
      <nav className={styles.arcNav} aria-label="Mode">
        {/*
          Arc: imaginary circle center at (50%, 100% + 300px), radius 400px.
          3 buttons at angles 248°, 270°, 292° (measured from positive-X axis).
          cos/sin precomputed:
            248°: cos≈-0.3746, sin≈-0.9272  → x=50%-150px, y=100%+300-371px = 100%-71px
            270°: cos=0,        sin=-1        → x=50%,       y=100%+300-400px = 100%-100px
            292°: cos≈0.3746,  sin≈-0.9272  → x=50%+150px, y=100%-71px
        */}
        {TABS.map(({ id, label, key, icon: Icon }, i) => (
          <button
            key={id}
            className={`${styles.arcBtn} ${styles[`arcBtn${i}`]} ${active === id ? styles.arcActive : ''}`}
            onClick={() => setActive(id)}
            aria-pressed={active === id}
          >
            <span className={styles.arcIcon}><Icon /></span>
            <span className={styles.arcLabel}>{label}</span>
          </button>
        ))}

        {/* The visible arc track — decorative SVG */}
        <svg className={styles.arcTrack} viewBox="0 0 800 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path
            d="M 60 180 Q 400 20 740 180"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        </svg>
      </nav>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  )
}

function StopwatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <polyline points="12 9 12 13 14.5 15.5" />
      <line x1="9.5" y1="3" x2="14.5" y2="3" />
      <line x1="12" y1="3" x2="12" y2="5" />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
