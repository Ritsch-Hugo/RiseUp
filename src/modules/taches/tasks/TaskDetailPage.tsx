import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Button, Icon, IconLink, Sheet } from '../../../core/ui'
import { PRIORITIES, TASK_DIFFICULTIES } from '../config'
import { dueLabel, parseRecurrence, relativeDue, subtaskProgress, taskXp } from '../rules/tasks'
import {
  useCategories,
  useDeleteTask,
  useTasks,
  useToggleSubtask,
  useToggleTask,
  type Task,
} from './taskQueries'
import styles from './tasks.module.css'

const REPEAT_LABELS = { daily: 'Se répète chaque jour', weekly: 'Se répète chaque semaine' }

/** Minutes écoulées depuis minuit, heure de Paris. */
function parisMinutes(): number {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone: 'Europe/Paris',
  }).formatToParts(new Date())
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return get('hour') * 60 + get('minute')
}

export function TaskDetailPage() {
  const { id } = useParams()
  const { data: tasks, isPending } = useTasks()
  if (isPending) return <p className={styles.state}>Chargement…</p>
  const task = tasks?.find((t) => t.id === id)
  if (!task) return <Navigate to="/taches" replace />
  return <Detail task={task} />
}

function Detail({ task }: { task: Task }) {
  const navigate = useNavigate()
  const today = parisDay()
  const { data: categories } = useCategories()
  const toggleTask = useToggleTask()
  const toggleSubtask = useToggleSubtask()
  const remove = useDeleteTask()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = task.completed_at !== null
  const category = categories?.find((c) => c.id === task.category_id)
  const priority = PRIORITIES.find((p) => p.key === task.priority)!
  const difficulty = TASK_DIFFICULTIES.find((d) => d.key === task.difficulty)!
  const progress = subtaskProgress(task.subtasks)
  const recurrence = parseRecurrence(task.recurrence)
  const relative = done ? null : relativeDue(task, today, parisMinutes())
  const dueText = dueLabel(task, today)

  return (
    <div className={styles.page}>
      <div className={styles.detailTop}>
        <IconLink to="/taches" icon="chevronLeft" label="Retour" />
        <IconLink to={`/taches/${task.id}/modifier`} icon="edit" label="Modifier la tâche" />
      </div>

      <h2 className={done ? styles.detailTitleDone : styles.detailTitle}>{task.title}</h2>

      <div className={styles.chips}>
        {category && (
          <span className={styles.chip} style={{ color: 'var(--accent-text)' }}>
            {category.name}
          </span>
        )}
        <span className={styles.chip} style={{ color: priority.color }}>
          Priorité {priority.label.toLowerCase()}
        </span>
        <span className={styles.chip}>{difficulty.label}</span>
        <span className={styles.chip} style={{ color: 'var(--accent-2)' }}>
          +{taskXp(task.difficulty)} XP
        </span>
      </div>

      <div className={styles.infoRow}>
        <Icon name="clock" size={22} />
        <span className={styles.infoText}>
          <span className={styles.infoMain}>
            {task.due_date === null ? 'Sans échéance' : capitalize(dueText)}
          </span>
          {relative && <span className={styles.sub}>{relative}</span>}
          {recurrence && <span className={styles.sub}>{REPEAT_LABELS[recurrence.type]}</span>}
        </span>
      </div>

      {progress && (
        <div className={styles.detailCard}>
          <div className={styles.sectionHead}>
            <h3 className={styles.cardTitle}>Sous-tâches</h3>
            <span className={styles.progressText}>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className={styles.track}>
            <div style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          {task.subtasks.map((s) => {
            const subDone = s.done_at !== null
            return (
              <button
                key={s.id}
                type="button"
                className={styles.subToggle}
                role="checkbox"
                aria-checked={subDone}
                onClick={() => toggleSubtask.mutate({ id: s.id, done: !subDone })}
              >
                <span className={subDone ? styles.subCheckOn : styles.subCheck}>
                  {subDone && <Icon name="check" size={14} strokeWidth={3.5} />}
                </span>
                <span className={subDone ? styles.subDone : styles.subTitle}>{s.title}</span>
              </button>
            )
          })}
        </div>
      )}

      {task.notes && (
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>Notes</h3>
          <p className={styles.notes}>{task.notes}</p>
        </div>
      )}

      <button type="button" className={styles.deleteButton} onClick={() => setConfirmDelete(true)}>
        <Icon name="trash" size={18} />
        Supprimer la tâche
      </button>

      <div className={styles.doneBar}>
        <Button
          fullWidth
          variant={done ? 'secondary' : 'primary'}
          onClick={() => toggleTask.mutate({ task, done: !done })}
        >
          {done ? 'Rouvrir la tâche' : `Terminer la tâche · +${taskXp(task.difficulty)} XP`}
        </Button>
      </div>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette tâche ?"
      >
        <p className={styles.sub}>Cette action est définitive.</p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(task.id, { onSuccess: () => navigate('/taches', { replace: true }) })
            }
          >
            Supprimer
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
