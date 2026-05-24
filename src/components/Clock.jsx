import { useEffect, useMemo, useState } from 'react'
import TimeDisplay from './TimeDisplay'
import styles from './Clock.module.css'

function getNow() {
  return new Date()
}

export default function Clock() {
  const [now, setNow] = useState(getNow)
  const [use24h, setUse24h] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(getNow()), 1000)
    return () => clearInterval(interval)
  }, [])

  const details = useMemo(() => ({
    date: new Intl.DateTimeFormat(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    }).format(now),
    timezone: new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value,
  }), [now])

  const displayHours = use24h ? now.getHours() : now.getHours() % 12 || 12
  const ampm = now.getHours() < 12 ? 'AM' : 'PM'

  return (
    <section className={styles.wrapper} aria-label="Clock">
      <TimeDisplay
        hours={displayHours}
        minutes={now.getMinutes()}
        seconds={now.getSeconds()}
        centiseconds={0}
        showHours
        showCentiseconds={false}
      />
      <div className={styles.meta} aria-live="polite">
        <p className={styles.date}>{details.date}</p>
        {details.timezone && <p className={styles.timezone}>{details.timezone}</p>}
        {!use24h && <p className={styles.ampm}>{ampm}</p>}
      </div>
      <button
        className={styles.toggleBtn}
        onClick={() => setUse24h(v => !v)}
        aria-label={`Switch to ${use24h ? '12' : '24'}-hour format`}
      >
        {use24h ? '24h' : '12h'}
      </button>
    </section>
  )
}
