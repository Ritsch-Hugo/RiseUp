import { Link } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Icon } from '../../../core/ui'
import { splitToday, taskXp } from '../rules/tasks'
import { TaskRow } from './TaskRow'
import { useCategories, useTasks } from './taskQueries'
import styles from './tasks.module.css'

/** Écran Aujourd'hui : tâches à faire (échues, du jour, sans échéance) et terminées du jour. */
export function TodayPage() {
  const { data: tasks, isPending, isError } = useTasks()
  const { data: categories } = useCategories()
  const today = parisDay()

  if (isPending) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger les tâches.</p>

  const { todo, done } = splitToday(tasks, today)
  const categoryName = (id: string | null) => categories?.find((c) => c.id === id)?.name ?? null
  const xpInPlay = todo.reduce((t, x) => t + taskXp(x.difficulty), 0)

  return (
    <div className={styles.page}>
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
            <span className={styles.sub}>
              {done.length} tâche{done.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.list}>
            {done.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                categoryName={categoryName(t.category_id)}
                today={today}
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
