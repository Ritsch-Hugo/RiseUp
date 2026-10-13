import type { CSSProperties, ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { ModuleColors } from '../module'
import { IconLink } from './IconLink'
import { TabBar, type Tab } from './TabBar'
import styles from './ModuleLayout.module.css'

type ModuleLayoutProps = {
  title: string
  /** Couleurs du module : remplacent l'accent bleu dans tout le module. */
  colors: ModuleColors
  tabs: Tab[]
  headerRight?: ReactNode
  /** Bandeau fixe au-dessus de la barre d'onglets (ex. séance en cours). */
  banner?: ReactNode
}

/** Cadre commun des modules : bouton accueil + titre, contenu de l'onglet, barre d'onglets. */
export function ModuleLayout({ title, colors, tabs, headerRight, banner }: ModuleLayoutProps) {
  const { pathname } = useLocation()
  return (
    <div
      className={styles.layout}
      style={
        {
          '--accent': colors.accent,
          '--accent-solid': colors.solid,
          '--accent-text': colors.text,
          // Recalculé ici : une variable définie sur :root garde sa valeur bleue héritée.
          '--accent-hi': `color-mix(in srgb, ${colors.accent} 70%, white)`,
          '--glow-accent': `0 6px 24px color-mix(in srgb, ${colors.accent} 45%, transparent)`,
        } as CSSProperties
      }
    >
      <header className={styles.header}>
        <div className={styles.title}>
          <IconLink to="/" icon="home" label="Accueil global" />
          <h1>{title}</h1>
        </div>
        {headerRight}
      </header>
      <main
        key={pathname}
        className={banner ? `${styles.content} ${styles.withBanner}` : styles.content}
      >
        <Outlet />
      </main>
      {banner && <div className={styles.banner}>{banner}</div>}
      <TabBar tabs={tabs} />
    </div>
  )
}
