import { useEffect } from 'react'

/** Garde l'écran allumé pendant la séance (le minuteur reste ainsi visible et fiable). */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        const l = await navigator.wakeLock?.request('screen')
        if (cancelled) void l?.release()
        else lock = l ?? null
      } catch {
        // refusé (économie d'énergie…) : sans conséquence
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && void request()
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])
}
