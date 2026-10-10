import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_REST_SECONDS, REST_STEP_SECONDS } from '../config'
import { adjustRest, elapsedSeconds } from '../rules/restTimer'

type Rest = { endsAt: number; total: number }
type Chrono = { rowId: string; startedAt: number }
type TimersState = { rest: Rest | null; chrono: Chrono | null }

const key = (workoutId: string) => `riseup:muscu:timers:${workoutId}`

function load(workoutId: string): TimersState {
  try {
    const raw = localStorage.getItem(key(workoutId))
    if (raw) return JSON.parse(raw) as TimersState
  } catch {
    // stockage indisponible
  }
  return { rest: null, chrono: null }
}

let audio: AudioContext | null = null

/** À appeler dans un geste utilisateur pour que le bip de fin de repos soit autorisé. */
function unlockAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // pas d'audio : la vibration suffit
  }
}

function alertEndOfRest() {
  navigator.vibrate?.([250, 120, 250])
  if (!audio) return
  try {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    gain.gain.value = 0.15
    osc.connect(gain).connect(audio.destination)
    osc.frequency.value = 880
    osc.start()
    osc.stop(audio.currentTime + 0.35)
  } catch {
    // ignoré
  }
}

/**
 * Minuteur de repos et chrono. Basés sur des horodatages (pas sur un compteur) : ils restent justes
 * quand l'écran s'éteint ou que l'app est rouverte, et sont rangés dans le stockage local.
 */
export function useTimers(workoutId: string, now: number) {
  const [state, setState] = useState<TimersState>(() => load(workoutId))
  const alerted = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(key(workoutId), JSON.stringify(state))
    } catch {
      // ignoré
    }
  }, [workoutId, state])

  const { rest } = state
  useEffect(() => {
    if (!rest) {
      alerted.current = false
      return
    }
    if (now >= rest.endsAt && !alerted.current) {
      alerted.current = true
      alertEndOfRest()
    }
  }, [rest, now])

  const startRest = useCallback((seconds: number | null) => {
    unlockAudio()
    alerted.current = false
    const total = seconds ?? DEFAULT_REST_SECONDS
    setState((s) => ({ ...s, rest: { endsAt: Date.now() + total * 1000, total } }))
  }, [])

  const adjust = useCallback((dir: -1 | 1) => {
    alerted.current = false
    setState((s) =>
      s.rest
        ? {
            ...s,
            rest: {
              endsAt: adjustRest(s.rest.endsAt, dir * REST_STEP_SECONDS, Date.now()),
              total: Math.max(0, s.rest.total + dir * REST_STEP_SECONDS),
            },
          }
        : s
    )
  }, [])

  const stopRest = useCallback(() => setState((s) => ({ ...s, rest: null })), [])

  const startChrono = useCallback((rowId: string) => {
    setState((s) => ({ ...s, chrono: { rowId, startedAt: Date.now() } }))
  }, [])

  /** Arrête le chrono et renvoie la durée mesurée (secondes), ou null s'il ne tournait pas. */
  const stopChrono = useCallback((): number | null => {
    const c = state.chrono
    setState((s) => ({ ...s, chrono: null }))
    return c ? elapsedSeconds(c.startedAt, Date.now()) : null
  }, [state.chrono])

  return { rest, chrono: state.chrono, startRest, adjust, stopRest, startChrono, stopChrono }
}

export function clearTimers(workoutId: string) {
  try {
    localStorage.removeItem(key(workoutId))
  } catch {
    // ignoré
  }
}
