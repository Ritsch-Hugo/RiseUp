import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../core'
import { Card, Icon, IconButton } from '../core/ui'
import { ExportCard } from '../core/export/ExportCard'
import type { AppModule } from '../core/module'
import { modules } from './modules'
import styles from './HomePage.module.css'

const formatToday = () => {
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(new Date())
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>Aujourd’hui</h1>
          <span className={styles.date}>{formatToday()}</span>
        </div>
        <IconButton icon="logout" label="Se déconnecter" onClick={() => supabase.auth.signOut()} />
      </header>
      {modules.map((m, i) => (
        <ModuleCard key={m.path} module={m} index={i} />
      ))}
      <ExportCard />
    </main>
  )
}

/** Carte d'un module : son résumé du jour vient de son `useSummary` public. */
function ModuleCard({ module: m, index }: { module: AppModule; index: number }) {
  const summary = m.useSummary()
  return (
    <Link to={m.path} className={styles.link} style={{ '--i': index } as CSSProperties}>
      <Card className={styles.module}>
        <span className={summary?.active ? styles.tileActive : styles.tile}>
          <Icon name={m.icon} size={26} />
        </span>
        <span className={styles.text}>
          <h2 className={styles.name}>{m.label}</h2>
          <span className={styles.summary}>{summary?.text ?? 'Chargement…'}</span>
        </span>
        <Icon name="chevronRight" size={20} className={styles.chevron} />
      </Card>
    </Link>
  )
}
