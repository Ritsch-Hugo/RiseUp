import { Link } from 'react-router-dom'
import { supabase } from '../core'
import { Card, Icon, IconButton } from '../core/ui'
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
      {modules.map((m) => (
        <Link key={m.path} to={m.path}>
          <Card className={styles.module}>
            <span className={styles.tile}>
              <Icon name={m.icon} size={26} />
            </span>
            <h2 className={styles.name}>{m.label}</h2>
            <Icon name="chevronRight" size={20} className={styles.chevron} />
          </Card>
        </Link>
      ))}
    </main>
  )
}
