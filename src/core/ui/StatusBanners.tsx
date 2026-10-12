import { useNotice } from '../notify'
import { useOnline } from '../useOnline'
import styles from './StatusBanners.module.css'

/** Bandeau « hors ligne » en haut, message d'erreur éphémère en bas. */
export function StatusBanners() {
  const online = useOnline()
  const notice = useNotice()
  return (
    <>
      {!online && (
        <div className={styles.offline} role="status">
          Hors ligne : tes données ne se synchronisent pas tant que la connexion est coupée.
        </div>
      )}
      {notice && (
        <div className={styles.notice} role="alert">
          {notice}
        </div>
      )}
    </>
  )
}
