import FlipDigit from './FlipDigit'
import styles from './TimeDisplay.module.css'

export default function TimeDisplay({ hours, minutes, seconds, centiseconds, showHours = false, showCentiseconds = false }) {
  const h  = String(hours).padStart(2, '0')
  const m  = String(minutes).padStart(2, '0')
  const s  = String(seconds).padStart(2, '0')
  const cs = String(centiseconds).padStart(2, '0')

  return (
    <div className={styles.display} role="timer" aria-live="off">
      {showHours && (
        <>
          <Group d0={h[0]} d1={h[1]} label="HRS" />
          <Sep />
        </>
      )}
      <Group d0={m[0]} d1={m[1]} label="MIN" />
      <Sep />
      <Group d0={s[0]} d1={s[1]} label="SEC" />
      {showCentiseconds && (
        <div className={styles.csGroup}>
          <div className={styles.csDigits}>
            <FlipDigit value={cs[0]} size="cs" />
            <FlipDigit value={cs[1]} size="cs" />
          </div>
          <span className={styles.label}>CS</span>
        </div>
      )}
    </div>
  )
}

function Group({ d0, d1, label }) {
  return (
    <div className={styles.group}>
      <div className={styles.digits}>
        <FlipDigit value={d0} size="lg" />
        <FlipDigit value={d1} size="lg" />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

function Sep() {
  return (
    <div className={styles.sep}>
      <span className={styles.colon}>:</span>
    </div>
  )
}
