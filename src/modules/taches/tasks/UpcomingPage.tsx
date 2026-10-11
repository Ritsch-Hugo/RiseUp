import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Icon } from '../../../core/ui'
import { PRIORITIES } from '../config'
import { groupUpcoming, weekStrip } from '../rules/tasks'
import { TaskRow } from './TaskRow'
import { useCategories, useTasks } from './taskQueries'
import styles from './tasks.module.css'

/** Écran À venir : semaine en cours, filtre par catégorie, tâches à échéance future par jour. */
export function UpcomingPage() {
  const { data: tasks, isPending, isError } = useTasks()
  const { data: categories = [] } = useCategories()
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const today = parisDay()

  if (isPending) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger les tâches.</p>

  const regular = tasks.filter((t) => !t.is_boss)
  const filtered = categoryId ? regular.filter((t) => t.category_id === categoryId) : regular
  const sections = groupUpcoming(filtered, today)
  const strip = weekStrip(filtered, today)
  const monthLabel = new Date(`${today}T12:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? null

  return (
    <div className={styles.page}>
      <div className={styles.sectionHead}>
        <h2 className={styles.pageTitle}>À venir</h2>
        <span className={styles.sub}>{monthLabel}</span>
      </div>

      <div className={styles.strip}>
        {strip.map((d) => (
          <div
            key={d.day}
            className={
              d.today ? styles.stripToday : d.day < today ? styles.stripPast : styles.stripDay
            }
          >
            <span className={styles.stripLetter}>{d.letter}</span>
            <span className={styles.stripNumber}>{d.number}</span>
            <span
              className={styles.stripDot}
              style={{
                background: d.priority
                  ? d.today
                    ? '#fff'
                    : PRIORITIES.find((p) => p.key === d.priority)!.color
                  : 'transparent',
              }}
            />
          </div>
        ))}
      </div>

      <div className={styles.filters} role="group" aria-label="Catégorie">
        <button
          type="button"
          className={categoryId === null ? styles.pillOn : styles.pill}
          aria-pressed={categoryId === null}
          onClick={() => setCategoryId(null)}
        >
          Toutes
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === categoryId ? styles.pillOn : styles.pill}
            aria-pressed={c.id === categoryId}
            onClick={() => setCategoryId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {sections.length === 0 && (
        <p className={styles.empty}>Rien de prévu pour les prochains jours.</p>
      )}
      {sections.map((s) => (
        <section key={s.key} className={styles.daySection}>
          <h3 className={styles.dayTitle}>{s.label}</h3>
          <div className={styles.list}>
            {s.tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                categoryName={categoryName(t.category_id)}
                today={today}
                upcoming
                later={s.key === 'later'}
              />
            ))}
          </div>
        </section>
      ))}

      <Link to="/taches/nouvelle" className={styles.fab} aria-label="Nouvelle tâche">
        <Icon name="plus" size={28} strokeWidth={2.5} />
      </Link>
    </div>
  )
}
