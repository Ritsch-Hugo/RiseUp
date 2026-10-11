import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

/** Bloc qui pulse à la place d'un contenu en chargement. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
}) {
  const style: CSSProperties = { width, height, borderRadius: radius }
  return <span className={styles.block} style={style} aria-hidden />
}

/** Liste de cartes en chargement (remplace le texte « Chargement… »). */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.list} role="status" aria-busy="true">
      <span className={styles.sr}>Chargement…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} style={{ animationDelay: `${i * 90}ms` }}>
          <Skeleton width={40} height={40} radius={12} />
          <div className={styles.lines}>
            <Skeleton width={`${70 - (i % 3) * 12}%`} height={14} />
            <Skeleton width={`${45 + (i % 2) * 15}%`} height={11} />
          </div>
        </div>
      ))}
    </div>
  )
}
