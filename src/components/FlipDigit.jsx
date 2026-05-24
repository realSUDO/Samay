import { useState, useEffect, useRef } from 'react'
import styles from './FlipDigit.module.css'

export default function FlipDigit({ value, size = 'lg' }) {
  const [current, setCurrent] = useState(value)
  const [next, setNext] = useState(value)
  const [animating, setAnimating] = useState(false)
  const prevRef = useRef(value)
  const timerRef = useRef(null)
  const countRef = useRef(0)

  useEffect(() => {
    if (value === prevRef.current) return
    prevRef.current = value
    countRef.current += 1

    if (timerRef.current) clearTimeout(timerRef.current)

    setNext(value)
    setAnimating(true)

    timerRef.current = setTimeout(() => {
      setCurrent(value)
      setAnimating(false)
    }, 350)

    return () => clearTimeout(timerRef.current)
  }, [value])

  const key = countRef.current

  return (
    <div className={`${styles.digit} ${styles[size]}`}>
      {animating && (
        <span key={`out-${key}`} className={`${styles.num} ${styles.slideOut}`}>
          {current}
        </span>
      )}
      <span key={`in-${key}`} className={`${styles.num} ${animating ? styles.slideIn : ''}`}>
        {animating ? next : current}
      </span>
    </div>
  )
}
