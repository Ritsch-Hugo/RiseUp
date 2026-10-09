import { useEffect, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Feuille qui monte du bas de l'écran (modale). */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} />
        {title && <h2 className={styles.title}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}
