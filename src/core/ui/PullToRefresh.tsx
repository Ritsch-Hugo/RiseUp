import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { haptic } from '../haptics'
import styles from './PullToRefresh.module.css'

const THRESHOLD = 80
const MAX_PULL = 120

/** Tirer vers le bas en haut d'un écran recharge les données (hors feuilles et champs de saisie). */
export function PullToRefresh() {
  const queryClient = useQueryClient()
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)
  const start = useRef<number | null>(null)
  const pullRef = useRef(0)

  useEffect(() => {
    const set = (v: number) => {
      pullRef.current = v
      setPull(v)
    }
    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const blocked = target.closest('[role="dialog"], input, textarea, select')
      start.current = window.scrollY <= 0 && !blocked ? e.touches[0]!.clientY : null
    }
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return
      const dy = e.touches[0]!.clientY - start.current
      if (dy <= 0 || window.scrollY > 0) return set(0)
      set(Math.min(MAX_PULL, dy * 0.5))
    }
    const onEnd = async () => {
      const reached = pullRef.current >= THRESHOLD * 0.5
      start.current = null
      set(0)
      if (!reached) return
      haptic('tap')
      setBusy(true)
      await queryClient.invalidateQueries()
      setBusy(false)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [queryClient])

  const visible = pull > 4 || busy
  return (
    <div
      className={styles.indicator}
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${busy ? 56 : pull}px)`,
      }}
      aria-hidden
    >
      <span className={busy || pull >= THRESHOLD * 0.5 ? styles.spinnerOn : styles.spinner} />
    </div>
  )
}
