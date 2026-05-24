import styles from './Controls.module.css'

export default function Controls({ running, onPlayPause, onReset, onLap, showLap = true }) {
  return (
    <div className={styles.controls}>
      {/* Reset — left */}
      <button
        className={`${styles.btn} ${styles.btnSmall}`}
        onClick={onReset}
        aria-label="Reset"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      {/* Play / Pause — center */}
      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={onPlayPause}
        aria-label={running ? 'Pause' : 'Start'}
      >
        {running ? (
          /* Pause icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          /* Play icon */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Lap — right */}
      {showLap ? (
        <button
          className={`${styles.btn} ${styles.btnSmall}`}
          onClick={onLap}
          aria-label="Lap"
          disabled={!running}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
        </button>
      ) : (
        /* Spacer to keep layout symmetric */
        <div className={`${styles.btn} ${styles.btnSmall} ${styles.invisible}`} aria-hidden="true" />
      )}
    </div>
  )
}
