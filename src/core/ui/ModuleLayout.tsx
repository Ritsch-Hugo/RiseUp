import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { IconLink } from './IconLink'
import { TabBar, type Tab } from './TabBar'
import styles from './ModuleLayout.module.css'

type ModuleLayoutProps = {
  title: string
  tabs: Tab[]
  headerRight?: ReactNode
  /** Bandeau fixe au-dessus de la barre d'onglets (ex. séance en cours). */
  banner?: ReactNode
}

/** Cadre commun des modules : bouton accueil + titre, contenu de l'onglet, barre d'onglets. */
export function ModuleLayout({ title, tabs, headerRight, banner }: ModuleLayoutProps) {
  const { pathname } = useLocation()
  return (
    <div className={styles.layout}>
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
