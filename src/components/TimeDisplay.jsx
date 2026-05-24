import FlipDigit from './FlipDigit'
import styles from './TimeDisplay.module.css'

/**
 * Stopwatch mode:  [HH:]MM:SS.cs
 * Timer mode:      [HH:]MM:SS  (no centiseconds)
 *
 * Hours column only appears when hours > 0.
 * Centiseconds render as a smaller superscript-style suffix on the right.
 */
export default function TimeDisplay({
  hours,
  minutes,
  seconds,
  centiseconds,
  showHours = false,
  showCentiseconds = false,
}) {
  const h  = String(hours).padStart(2, '0')
  const m  = String(minutes).padStart(2, '0')
  const s  = String(seconds).padStart(2, '0')
  const cs = String(centiseconds).padStart(2, '0')

  return (
    <div className={styles.display} role="timer" aria-live="off">

      {/* Hours — only when elapsed ≥ 1 hour */}
      {showHours && (
        <>
          <DigitGroup d0={h[0]} d1={h[1]} label="HRS" />
          <Colon />
        </>
      )}

      {/* Minutes */}
      <DigitGroup d0={m[0]} d1={m[1]} label={showHours ? 'MIN' : 'MIN'} />
      <Colon />

      {/* Seconds */}
      <DigitGroup d0={s[0]} d1={s[1]} label="SEC" />

      {/* Centiseconds — smaller, right-aligned suffix, stopwatch only */}
      {showCentiseconds && (
        <div className={styles.csGroup}>
          <div className={styles.csDigits}>
            <FlipDigit value={cs[0]} size="cs" />
            <FlipDigit value={cs[1]} size="cs" />
          </div>
          <span className={styles.csLabel}>CS</span>
        </div>
      )}
    </div>
  )
}

function DigitGroup({ d0, d1, label }) {
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

function Colon() {
  return (
    <div className={styles.colonWrap}>
      <span className={styles.colon}>:</span>
    </div>
  )
}
