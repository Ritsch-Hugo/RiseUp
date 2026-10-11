import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parisMinutes, supabase } from '../core'
import { DataTools } from '../core/export/DataTools'
import type { AppModule } from '../core/module'
import { Icon, IconButton, Sheet, Skeleton } from '../core/ui'
import { modules } from './modules'
import styles from './HomePage.module.css'

const formatToday = () =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(new Date())

/** Salutation selon l'heure de Paris. */
const greeting = (minutes: number) =>
  minutes < 5 * 60
    ? 'Bonne nuit'
    : minutes < 12 * 60
      ? 'Bonjour'
      : minutes < 18 * 60
        ? 'Bon après-midi'
        : 'Bonsoir'

export function HomePage() {
  const [dataOpen, setDataOpen] = useState(false)
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden />
      <header className={styles.header}>
        <div className={styles.title}>
          <span className={styles.date}>{formatToday()}</span>
          <h1>{greeting(parisMinutes())}</h1>
        </div>
        <IconButton icon="logout" label="Se déconnecter" onClick={() => supabase.auth.signOut()} />
      </header>

      {modules.map((m, i) => (
        <ModuleCard key={m.path} module={m} index={i} />
      ))}

      <button type="button" className={styles.dataRow} onClick={() => setDataOpen(true)}>
        <Icon name="save" size={20} />
        <span className={styles.dataText}>Mes données</span>
        <span className={styles.dataHint}>Export et import</span>
        <Icon name="chevronRight" size={18} />
      </button>
      <Sheet open={dataOpen} onClose={() => setDataOpen(false)} title="Mes données">
        <DataTools />
      </Sheet>
    </main>
  )
}

const RING_R = 29

/** Carte d'un module : son résumé du jour vient de son `useSummary` public. */
function ModuleCard({ module: m, index }: { module: AppModule; index: number }) {
  const summary = m.useSummary()
  const active = summary?.active ?? false
  return (
    <Link to={m.path} className={styles.link} style={{ '--i': index } as CSSProperties}>
      <div className={active ? styles.moduleActive : styles.module}>
        <span className={styles.ringBox}>
          <svg className={styles.ring} viewBox="0 0 64 64" aria-hidden>
            <defs>
              <linearGradient id={`ring-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r={RING_R} className={styles.ringTrack} />
            {summary?.progress !== undefined && summary.progress > 0 && (
              <circle
                cx="32"
                cy="32"
                r={RING_R}
                pathLength={100}
                className={styles.ringFill}
                stroke={`url(#ring-${index})`}
                strokeDasharray={`${Math.max(2, summary.progress * 100)} 100`}
                transform="rotate(-90 32 32)"
              />
            )}
          </svg>
          <span className={active ? styles.tileActive : styles.tile}>
            <Icon name={m.icon} size={24} />
          </span>
        </span>
        <span className={styles.text}>
          <h2 className={styles.name}>{m.label}</h2>
          {summary ? (
            <span className={styles.summary}>{summary.text}</span>
          ) : (
            <Skeleton width="70%" height={12} />
          )}
        </span>
        <Icon name="chevronRight" size={20} className={styles.chevron} />
      </div>
    </Link>
  )
}
