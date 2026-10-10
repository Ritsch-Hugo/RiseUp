import type { ReactNode } from 'react'
import styles from './library.module.css'

type LibraryStateProps = { isPending: boolean; isError: boolean; children: ReactNode }

/** Affiche chargement / erreur à la place du contenu tant que les exercices ne sont pas là. */
export function LibraryState({ isPending, isError, children }: LibraryStateProps) {
  if (isPending) return <p className={styles.empty}>Chargement…</p>
  if (isError) return <p className={styles.empty}>Impossible de charger les exercices.</p>
  return <>{children}</>
}
