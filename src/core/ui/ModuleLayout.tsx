import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { IconLink } from './IconLink'
import { TabBar, type Tab } from './TabBar'
import styles from './ModuleLayout.module.css'

type ModuleLayoutProps = { title: string; tabs: Tab[]; headerRight?: ReactNode }

/** Cadre commun des modules : bouton accueil + titre, contenu de l'onglet, barre d'onglets. */
export function ModuleLayout({ title, tabs, headerRight }: ModuleLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.title}>
          <IconLink to="/" icon="home" label="Accueil global" />
          <h1>{title}</h1>
        </div>
        {headerRight}
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      <TabBar tabs={tabs} />
    </div>
  )
}
