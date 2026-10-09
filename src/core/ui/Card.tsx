import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Fond « carte 2 » pour une carte posée sur une autre carte. */
  raised?: boolean
  /** Marge intérieure de 20 px (cartes de stats) au lieu de 16 px. */
  large?: boolean
}

export function Card({ raised, large, className, ...props }: CardProps) {
  const classes = [styles.card, raised && styles.raised, large && styles.large, className]
    .filter(Boolean)
    .join(' ')
  return <div className={classes} {...props} />
}
