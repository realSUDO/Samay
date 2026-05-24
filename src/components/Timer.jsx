import { useState, useEffect, useRef } from 'react'
import TimeDisplay from './TimeDisplay'
import Controls from './Controls'
import styles from './Timer.module.css'

const DEFAULT_SECONDS = 25 * 60
const MAX_MINUTES = 99

function secondsToInputValue(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function cleanTimerInput(raw) {
  const cleaned = raw.replace(/[^\d:]/g, '')
  if (cleaned.includes(':')) {
    const [minutes = '', seconds = ''] = cleaned.split(':')
    return `${minutes.replace(/\D/g, '').slice(0, 2)}:${seconds.replace(/\D/g, '').slice(0, 2)}`
  }
  return cleaned.slice(0, 4)
}

function parseTimerInput(raw) {
  const cleaned = cleanTimerInput(raw)
  if (cleaned.includes(':')) {
    const [minutes = '0', seconds = '0'] = cleaned.split(':')
    return { minutes: parseInt(minutes || '0', 10), seconds: parseInt(seconds || '0', 10) }
  }
  const digits = cleaned.padStart(4, '0')
  return { minutes: parseInt(digits.slice(0, 2), 10), seconds: parseInt(digits.slice(2, 4), 10) }
}

function validateTimerInput(raw) {
  const value = cleanTimerInput(raw)
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return { valid: false, error: 'Enter a duration.' }
  const { minutes, seconds } = parseTimerInput(value)
  if (minutes > MAX_MINUTES) return { valid: false, error: 'Maximum timer duration is 99:59.' }
  if (seconds > 59) return { valid: false, error: 'Seconds must be between 00 and 59.' }
  const totalSeconds = minutes * 60 + seconds
  if (totalSeconds === 0) return { valid: false, error: 'Duration must be at least 00:01.' }
  return { valid: true, error: '', totalSeconds }
}

export default function Timer() {
  const [totalSec, setTotalSec]   = useState(DEFAULT_SECONDS)
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS)
  const [running, setRunning]     = useState(false)
  const [editing, setEditing]     = useState(false)
  const [inputVal, setInputVal]   = useState(secondsToInputValue(DEFAULT_SECONDS))
  const [finished, setFinished]   = useState(false)

  const startRef      = useRef(null)
  const baseRef       = useRef(DEFAULT_SECONDS)
  const remainingRef  = useRef(DEFAULT_SECONDS)
  const intervalRef   = useRef(null)
  const hasStartedRef = useRef(false)
  const startAudioRef = useRef(null)
  const lofiAudioRef  = useRef(null)
  const beepAudioRef  = useRef(null)

  useEffect(() => {
    startAudioRef.current = new Audio('/beep.mp3')
    lofiAudioRef.current  = Object.assign(new Audio('/lofi.mp3'), { loop: true })
    beepAudioRef.current  = new Audio('/beep.mp3')
    return () => {
      lofiAudioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startRef.current) / 1000)
        const left = Math.max(0, baseRef.current - elapsedSec)
        remainingRef.current = left
        setRemaining(left)
        if (left === 0) setRunning(false)
      }, 250)
    } else {
      clearInterval(intervalRef.current)
      baseRef.current = remainingRef.current
      if (remainingRef.current === 0) {
        lofiAudioRef.current?.pause()
        if (lofiAudioRef.current) lofiAudioRef.current.currentTime = 0
        beepAudioRef.current?.play().catch(() => {})
        setFinished(true)
      } else {
        lofiAudioRef.current?.pause()
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handlePlayPause = () => {
    if (remainingRef.current === 0) return
    if (running) {
      setRunning(false)
      return
    }
    if (!hasStartedRef.current) {
      startAudioRef.current?.play().catch(() => {})
      hasStartedRef.current = true
    }
    lofiAudioRef.current?.play().catch(() => {})
    setRunning(true)
  }

  const handleReset = () => {
    lofiAudioRef.current?.pause()
    if (lofiAudioRef.current) lofiAudioRef.current.currentTime = 0
    hasStartedRef.current = false
    setRunning(false)
    setFinished(false)
    setRemaining(totalSec)
    remainingRef.current = totalSec
    baseRef.current = totalSec
  }

  const commitInput = (raw) => {
    const result = validateTimerInput(raw)
    if (!result.valid) return false
    setTotalSec(result.totalSeconds)
    setRemaining(result.totalSeconds)
    remainingRef.current = result.totalSeconds
    baseRef.current = result.totalSeconds
    hasStartedRef.current = false
    setFinished(false)
    setInputVal(secondsToInputValue(result.totalSeconds))
    setEditing(false)
    return true
  }

  const handleDisplayClick = () => {
    if (running) return
    setEditing(true)
    setInputVal(secondsToInputValue(remaining))
  }

  const hours   = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  return (
    <div className={styles.wrapper}>
      {editing ? (
        <TimerInput
          value={inputVal}
          onChange={setInputVal}
          onCommit={commitInput}
          onCancel={() => {
            setInputVal(secondsToInputValue(remaining))
            setEditing(false)
          }}
        />
      ) : (
        <button
          type="button"
          className={`${styles.displayButton} ${!running ? styles.clickable : ''} ${finished ? styles.finished : ''}`}
          onClick={handleDisplayClick}
          disabled={running}
          title={!running ? 'Click to set time' : undefined}
          aria-label="Set timer duration"
        >
          <TimeDisplay
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            centiseconds={0}
            showHours={hours > 0}
            showCentiseconds={false}
          />
        </button>
      )}

      {!editing && finished && (
        <p className={styles.finishedMsg}>Time&apos;s up!</p>
      )}

      {!editing && (
        <Controls
          running={running}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          showLap={false}
        />
      )}

      {!editing && !running && !finished && remaining === totalSec && (
        <p className={styles.hint}>Click the time to set duration</p>
      )}
    </div>
  )
}

function TimerInput({ value, onChange, onCommit, onCancel }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const updateValue = (raw) => {
    const nextValue = cleanTimerInput(raw)
    onChange(nextValue)
    if (error) {
      const result = validateTimerInput(nextValue)
      if (result.valid) setError('')
    }
  }

  const tryCommit = () => {
    const result = validateTimerInput(value)
    if (!result.valid) {
      setError(result.error)
      inputRef.current?.focus()
      inputRef.current?.select()
      return
    }
    onCommit(value)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tryCommit() }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div className={styles.inputWrap}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => updateValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => {
          const result = validateTimerInput(value)
          if (!result.valid && value.replace(/\D/g, '').length > 0) setError(result.error)
        }}
        aria-label="Set timer duration"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'timer-input-error' : 'timer-input-hint'}
        placeholder="MM:SS"
        maxLength={5}
      />
      {error ? (
        <p className={styles.inputError} id="timer-input-error">{error}</p>
      ) : (
        <p className={styles.inputHint} id="timer-input-hint">Use MM:SS, up to 99:59</p>
      )}
      <div className={styles.inputActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>Cancel</button>
        <button type="button" className={styles.primaryButton} onClick={tryCommit}>Set</button>
      </div>
    </div>
  )
}
