import { useEffect, useState } from 'react'
import { Button } from '../ui'
import styles from './PushSettings.module.css'
import { disablePush, enablePush, pushState, sendTestPush, type PushState } from './push'

const HELP: Record<PushState, string> = {
  unsupported:
    'Cet appareil ne gère pas les notifications. Installe l’appli sur l’écran d’accueil.',
  denied: 'Les notifications sont bloquées. Autorise-les dans les réglages du navigateur.',
  off: 'Active les notifications pour recevoir les rappels sur cet appareil.',
  on: 'Les rappels arrivent sur cet appareil.',
}

/** Activation des notifications push sur l'appareil, avec une notification d'essai. */
export function PushSettings() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    pushState().then((s) => alive && setState(s))
    return () => {
      alive = false
    }
  }, [])

  if (state === null) return null

  const run = async (action: () => Promise<PushState | number>) => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await action()
      if (typeof result === 'number') {
        setMessage(result > 0 ? 'Notification envoyée.' : 'Aucun appareil abonné trouvé.')
      } else {
        setState(result)
      }
    } catch {
      setMessage('Impossible de terminer l’opération.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.box}>
      <span className={styles.help}>{HELP[state]}</span>
      {state === 'off' && (
        <Button variant="secondary" fullWidth disabled={busy} onClick={() => run(enablePush)}>
          Activer les notifications
        </Button>
      )}
      {state === 'on' && (
        <>
          <Button variant="secondary" fullWidth disabled={busy} onClick={() => run(sendTestPush)}>
            Envoyer une notification d’essai
          </Button>
          <Button variant="secondary" fullWidth disabled={busy} onClick={() => run(disablePush)}>
            Désactiver sur cet appareil
          </Button>
        </>
      )}
      {message && <span className={styles.message}>{message}</span>}
    </div>
  )
}
