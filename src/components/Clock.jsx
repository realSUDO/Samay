import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Clock.module.css'

const SUGGESTED_ZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
]

function getTimeInZone(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type) => parts.find(p => p.type === type)?.value ?? '00'
  return { h: get('hour'), m: get('minute'), s: get('second') }
}

function getOffsetLabel(tz) {
  try {
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
    const tzDate = new Date(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now))
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
    return formatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value ?? tz
  } catch {
    return tz
  }
}

function cityName(tz) {
  return tz.split('/').pop().replace(/_/g, ' ')
}

export default function Clock() {
  const [now, setNow] = useState(() => new Date())
  const [use24h, setUse24h] = useState(false)
  const [pins, setPins] = useState([])
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { date, tzLabel, ampm, h, m, s } = useMemo(() => {
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    }).format(now)
    const tzLabel = getOffsetLabel(localTz)
    const raw = getTimeInZone(now, localTz)
    const hour24 = parseInt(raw.h, 10)
    const ampm = hour24 < 12 ? 'AM' : 'PM'
    const h = use24h ? String(hour24).padStart(2, '0') : String(hour24 % 12 || 12).padStart(2, '0')
    return { date, tzLabel, ampm, h, m: raw.m, s: raw.s }
  }, [now, use24h, localTz])

  const filtered = SUGGESTED_ZONES.filter(z =>
    z !== localTz &&
    !pins.includes(z) &&
    (query === '' || z.toLowerCase().includes(query.toLowerCase()))
  )

  const addPin = (tz) => {
    setPins(p => [...p, tz])
    setAdding(false)
    setQuery('')
  }

  const removePin = (tz) => setPins(p => p.filter(z => z !== tz))

  return (
    <section className={styles.wrapper} aria-label="Clock">
      {/* Main local clock */}
      <div className={styles.mainClock}>
        <div className={styles.timeRow}>
          <span className={styles.timeHours}>{h}</span>
          <span className={styles.timeColon}>:</span>
          <span className={styles.timeMinutes}>{m}</span>
          <span className={styles.timeSeconds}>
            <span className={styles.seconds}>{s}</span>
            {!use24h && <span className={styles.ampm}>{ampm}</span>}
          </span>
        </div>
        <div className={styles.meta}>
          <span className={styles.date}>{date}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.tz}>{tzLabel}</span>
          <button
            className={styles.toggleBtn}
            onClick={() => setUse24h(v => !v)}
            aria-label={`Switch to ${use24h ? '12' : '24'}-hour`}
          >
            {use24h ? '24h' : '12h'}
          </button>
        </div>
      </div>

      {/* World clock pins */}
      {(pins.length > 0 || adding) && (
        <div className={styles.pins}>
          {pins.map(tz => (
            <PinCard key={tz} tz={tz} now={now} use24h={use24h} onRemove={() => removePin(tz)} />
          ))}
        </div>
      )}

      {/* Add zone */}
      {adding ? (
        <div className={styles.addBox}>
          <input
            ref={inputRef}
            className={styles.addInput}
            placeholder="Search timezone…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (setAdding(false), setQuery(''))}
          />
          <div className={styles.suggestions}>
            {filtered.slice(0, 6).map(tz => (
              <button key={tz} className={styles.suggestion} onClick={() => addPin(tz)}>
                <span className={styles.suggCity}>{cityName(tz)}</span>
                <span className={styles.suggTz}>{getOffsetLabel(tz)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className={styles.noResults}>No matches</p>}
          </div>
        </div>
      ) : (
        <button className={styles.addBtn} onClick={() => setAdding(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add world clock
        </button>
      )}
    </section>
  )
}

function PinCard({ tz, now, use24h, onRemove }) {
  const { h, m, s } = getTimeInZone(now, tz)
  const hour24 = parseInt(h, 10)
  const displayH = use24h ? String(hour24).padStart(2, '0') : String(hour24 % 12 || 12).padStart(2, '0')
  const ampm = hour24 < 12 ? 'AM' : 'PM'
  const tzLabel = getOffsetLabel(tz)

  return (
    <div className={styles.pinCard}>
      <div className={styles.pinLeft}>
        <span className={styles.pinCity}>{cityName(tz)}</span>
        <span className={styles.pinTz}>{tzLabel}</span>
      </div>
      <div className={styles.pinRight}>
        <span className={styles.pinTime}>{displayH}:{m}</span>
        {!use24h && <span className={styles.pinAmpm}>{ampm}</span>}
      </div>
      <button className={styles.pinRemove} onClick={onRemove} aria-label={`Remove ${cityName(tz)}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
