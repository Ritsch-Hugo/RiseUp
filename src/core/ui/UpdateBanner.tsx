import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './UpdateBanner.module.css'

/** Bandeau « nouvelle version » : la PWA ne se met à jour qu'au clic, et revérifie au retour sur l'app. */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })

  if (!needRefresh) return null
  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>Nouvelle version disponible</span>
      <button type="button" className={styles.button} onClick={() => void updateServiceWorker(true)}>
        Actualiser
      </button>
    </div>
  )
}
