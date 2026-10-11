import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { PRIORITIES } from '../config'
import { subtaskProgress, taskSubtitle, taskXp, upcomingSubtitle } from '../rules/tasks'
import { useToggleTask, type Task } from './taskQueries'
import styles from './tasks.module.css'

/** Ligne de tâche : case à cocher (couleur = priorité), titre, détails et XP promis. */
export function TaskRow({
  task,
  categoryName,
  today,
  upcoming,
  later,
  earnedXp,
}: {
  task: Task
  categoryName: string | null
  today: string
  /** Vue « À venir » : le jour est dans l'en-tête de section, pas dans la ligne. */
  upcoming?: boolean
  later?: boolean
  /** XP réellement gagné (tâche terminée aujourd'hui). */
  earnedXp?: number
}) {
  const toggle = useToggleTask()
  const done = task.completed_at !== null
  const color = PRIORITIES.find((p) => p.key === task.priority)!.color
  const progress = subtaskProgress(task.subtasks)
  const subtitle = [
    upcoming
      ? upcomingSubtitle(task, categoryName, !!later)
      : taskSubtitle(task, categoryName, today),
    progress ? `${progress.done}/${progress.total} sous-tâches` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={done ? styles.rowDone : styles.row}>
      <button
        type="button"
        className={done ? styles.checkOn : styles.check}
        style={done ? undefined : { borderColor: color }}
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Décocher' : 'Terminer'} ${task.title}`}
        onClick={() => toggle.mutate({ task, done: !done })}
      >
        {done && <Icon name="check" size={16} strokeWidth={3.5} />}
      </button>
      <Link to={`/taches/${task.id}`} className={styles.rowText}>
        <span className={done ? styles.titleDone : styles.title}>{task.title}</span>
        {!done && <span className={styles.sub}>{subtitle}</span>}
      </Link>
      {!done && <span className={styles.xpChip}>+{taskXp(task.difficulty)} XP</span>}
      {done && earnedXp !== undefined && <span className={styles.xpEarned}>+{earnedXp} XP</span>}
    </div>
  )
}
