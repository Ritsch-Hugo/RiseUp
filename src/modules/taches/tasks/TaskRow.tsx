import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { PRIORITIES } from '../config'
import { taskSubtitle, taskXp } from '../rules/tasks'
import { useToggleTask, type Task } from './taskQueries'
import styles from './tasks.module.css'

/** Ligne de tâche : case à cocher (couleur = priorité), titre, détails et XP promis. */
export function TaskRow({
  task,
  categoryName,
  today,
}: {
  task: Task
  categoryName: string | null
  today: string
}) {
  const toggle = useToggleTask()
  const done = task.completed_at !== null
  const color = PRIORITIES.find((p) => p.key === task.priority)!.color

  return (
    <div className={done ? styles.rowDone : styles.row}>
      <button
        type="button"
        className={done ? styles.checkOn : styles.check}
        style={done ? undefined : { borderColor: color }}
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? 'Décocher' : 'Terminer'} ${task.title}`}
        onClick={() => toggle.mutate({ id: task.id, done: !done })}
      >
        {done && <Icon name="check" size={16} strokeWidth={3.5} />}
      </button>
      <Link to={`/taches/${task.id}/modifier`} className={styles.rowText}>
        <span className={done ? styles.titleDone : styles.title}>{task.title}</span>
        {!done && <span className={styles.sub}>{taskSubtitle(task, categoryName, today)}</span>}
      </Link>
      {!done && <span className={styles.xpChip}>+{taskXp(task.difficulty)} XP</span>}
    </div>
  )
}
