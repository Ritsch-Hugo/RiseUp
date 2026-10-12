import { useSyncExternalStore } from 'react'

/** Message court affiché en bas de l'écran (erreur d'une action, par exemple). Un seul à la fois. */
let message: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

export function notify(text: string, durationMs = 4000) {
  message = text
  clearTimeout(timer)
  timer = setTimeout(() => {
    message = null
    emit()
  }, durationMs)
  emit()
}

export function useNotice(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => message
  )
}
