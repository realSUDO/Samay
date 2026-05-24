import styles from './Controls.module.css'

export default function Controls({ running, onPlayPause, onReset, onLap, showLap = true, rightAction = null }) {
  return (
    <div className={styles.controls}>
      <button className={`${styles.btn} ${styles.secondary}`} onClick={onReset} aria-label="Reset">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      <button
        className={`${styles.btn} ${styles.primary} ${running ? styles.running : ''}`}
        onClick={onPlayPause}
        aria-label={running ? 'Pause' : 'Start'}
      >
        {running ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>

      {showLap ? (
        <button
          className={`${styles.btn} ${styles.secondary}`}
          onClick={onLap}
          aria-label="Lap"
          disabled={!running}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
        </button>
      ) : rightAction ? (
        <button
          className={`${styles.btn} ${styles.secondary} ${rightAction.active ? styles.secondaryActive : ''}`}
          onClick={rightAction.onClick}
          aria-label={rightAction.ariaLabel}
          disabled={rightAction.disabled}
        >
          {rightAction.icon}
        </button>
      ) : (
        <div className={`${styles.btn} ${styles.secondary} ${styles.ghost}`} aria-hidden="true" />
      )}
    </div>
  )
}
