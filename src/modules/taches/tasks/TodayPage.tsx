import { Link } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Icon } from '../../../core/ui'
import { LevelCard } from '../xp/LevelCard'
import { useXpOnDay } from '../xp/xpQueries'
import { RoutineCard } from '../habits/RoutineCard'
import { splitToday, taskXp } from '../rules/tasks'
import { TaskRow } from './TaskRow'
import { useCategories, useTasks } from './taskQueries'
import styles from './tasks.module.css'

/** Écran Aujourd'hui : tâches à faire (échues, du jour, sans échéance) et terminées du jour. */
export function TodayPage() {
  const { data: tasks, isPending, isError } = useTasks()
  const { data: categories } = useCategories()
  const today = parisDay()
  const { data: xpToday } = useXpOnDay(today)

  if (isPending) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger les tâches.</p>

  const { todo, done } = splitToday(tasks, today)
  const categoryName = (id: string | null) => categories?.find((c) => c.id === id)?.name ?? null
  const earned = (id: string) =>
    (xpToday ?? [])
      .filter((e) => e.source === 'tache' && e.source_id === id)
      .reduce((t, e) => t + e.xp, 0)
  const xpInPlay = todo.reduce((t, x) => t + taskXp(x.difficulty), 0)

  return (
    <div className={styles.page}>
      <LevelCard />
      <RoutineCard today={today} />

      <div className={styles.sectionHead}>
        <h2 className={styles.section}>À faire</h2>
        <span className={styles.sub}>
          {todo.length} tâche{todo.length > 1 ? 's' : ''} · +{xpInPlay} XP
        </span>
      </div>
      {todo.length === 0 && (
        <p className={styles.empty}>
          {done.length > 0 ? 'Tout est fait pour aujourd’hui.' : 'Rien à faire pour l’instant.'}
        </p>
      )}
      <div className={styles.list}>
        {todo.map((t) => (
          <TaskRow key={t.id} task={t} categoryName={categoryName(t.category_id)} today={today} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <h2 className={styles.section}>Terminées</h2>
            <span className={styles.xpEarned}>
              +{done.reduce((t, x) => t + earned(x.id), 0)} XP gagnés
            </span>
          </div>
          <div className={styles.list}>
            {done.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                categoryName={categoryName(t.category_id)}
                today={today}
                earnedXp={earned(t.id)}
              />
            ))}
          </div>
        </>
      )}

      <Link to="/taches/nouvelle" className={styles.fab} aria-label="Nouvelle tâche">
        <Icon name="plus" size={28} strokeWidth={2.5} />
      </Link>
    </div>
  )
}
