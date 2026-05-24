import { useEffect, useRef, useState } from 'react'
import styles from './FlipDigit.module.css'

export default function FlipDigit({ value, size = 'lg' }) {
  const [display, setDisplay] = useState(value)
  const [prev, setPrev]       = useState(value)
  const [phase, setPhase]     = useState('idle') // idle | out | in
  const pendingRef = useRef(null)
  const timerRef   = useRef(null)

  useEffect(() => {
    if (value === display && phase === 'idle') return

    pendingRef.current = value

    if (phase !== 'idle') return // already animating, will pick up pending on next cycle

    setPrev(display)
    setPhase('out')
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (phase === 'out') {
      timerRef.current = setTimeout(() => {
        setDisplay(pendingRef.current)
        setPhase('in')
      }, 140)
    } else if (phase === 'in') {
      timerRef.current = setTimeout(() => {
        // If another value queued up, start again
        if (pendingRef.current !== display) {
          setPrev(display)
          setPhase('out')
        } else {
          setPhase('idle')
        }
      }, 160)
    }
    return () => clearTimeout(timerRef.current)
  }, [phase, display])

  return (
    <div className={`${styles.digit} ${styles[size]}`}>
      {phase === 'out' && (
        <span className={`${styles.num} ${styles.out}`}>{prev}</span>
      )}
      <span className={`${styles.num} ${phase === 'in' ? styles.in : ''}`}>
        {display}
      </span>
    </div>
  )
}
