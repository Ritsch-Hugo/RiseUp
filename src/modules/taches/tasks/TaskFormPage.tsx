import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Button, Card, IconLink, Sheet } from '../../../core/ui'
import { DEFAULT_DIFFICULTY, DEFAULT_PRIORITY, PRIORITIES, TASK_DIFFICULTIES } from '../config'
import {
  choiceForDue,
  taskXp,
  validateTaskForm,
  type DueChoice,
  type TaskForm,
} from '../rules/tasks'
import {
  useCategories,
  useCreateCategory,
  useDeleteTask,
  useSaveTask,
  useTasks,
  type Task,
} from './taskQueries'
import styles from './tasks.module.css'

const DUE_CHOICES: { key: DueChoice; label: string }[] = [
  { key: 'none', label: 'Sans échéance' },
  { key: 'today', label: 'Aujourd’hui' },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'custom', label: 'Choisir' },
]

/** Création (`/taches/nouvelle`) ou modification (`/taches/:id/modifier`) d'une tâche. */
export function TaskFormPage() {
  const { id } = useParams()
  const { data: tasks, isPending } = useTasks()
  if (id && isPending) return <p className={styles.state}>Chargement…</p>
  const existing = id ? tasks?.find((t) => t.id === id) : undefined
  if (id && !existing) return <Navigate to="/taches" replace />
  return <TaskEditor existing={existing} />
}

function initialForm(existing: Task | undefined, today: string): TaskForm {
  if (!existing) {
    return {
      title: '',
      categoryId: null,
      priority: DEFAULT_PRIORITY,
      difficulty: DEFAULT_DIFFICULTY,
      due: 'today',
      customDate: '',
      time: '',
    }
  }
  const due = choiceForDue(existing.due_date, today)
  return {
    title: existing.title,
    categoryId: existing.category_id,
    priority: existing.priority,
    difficulty: existing.difficulty,
    due,
    customDate: due === 'custom' ? (existing.due_date ?? '') : '',
    time: existing.due_time?.slice(0, 5) ?? '',
  }
}

function TaskEditor({ existing }: { existing: Task | undefined }) {
  const navigate = useNavigate()
  const today = parisDay()
  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const save = useSaveTask()
  const remove = useDeleteTask()
  const [form, setForm] = useState<TaskForm>(initialForm(existing, today))
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const patch = (p: Partial<TaskForm>) => setForm((f) => ({ ...f, ...p }))
  const values = validateTaskForm(form, today)

  const addCategory = () => {
    const name = (newCategory ?? '').trim()
    if (name === '') return
    const id = crypto.randomUUID()
    createCategory.mutate({ id, name, position: categories.length })
    patch({ categoryId: id })
    setNewCategory(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!values) return
    save.mutate(
      { existingId: existing?.id, values },
      { onSuccess: () => navigate('/taches', { replace: true }) }
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.titleRow}>
        <IconLink to="/taches" icon="chevronLeft" label="Retour" />
        <h2 className={styles.formTitle}>{existing ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
      </div>

      <div className={styles.field}>
        <label htmlFor="task-title">Titre</label>
        <input
          id="task-title"
          className={styles.titleInput}
          value={form.title}
          autoFocus={!existing}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Catégorie</span>
        <div className={styles.pills} role="group" aria-label="Catégorie">
          <button
            type="button"
            className={form.categoryId === null ? styles.pillOn : styles.pill}
            aria-pressed={form.categoryId === null}
            onClick={() => patch({ categoryId: null })}
          >
            Aucune
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === form.categoryId ? styles.pillOn : styles.pill}
              aria-pressed={c.id === form.categoryId}
              onClick={() => patch({ categoryId: c.id })}
            >
              {c.name}
            </button>
          ))}
          {newCategory === null && (
            <button type="button" className={styles.pillNew} onClick={() => setNewCategory('')}>
              + Nouvelle
            </button>
          )}
        </div>
        {newCategory !== null && (
          <div className={styles.inlineRow}>
            <input
              className={styles.input}
              placeholder="Nom de la catégorie"
              aria-label="Nom de la nouvelle catégorie"
              autoFocus
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCategory()
                }
              }}
            />
            <Button variant="secondary" onClick={addCategory} disabled={newCategory.trim() === ''}>
              Ajouter
            </Button>
          </div>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Priorité</span>
        <div className={styles.segmented} role="group" aria-label="Priorité">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={p.key === form.priority ? styles.segOn : styles.seg}
              style={
                p.key === form.priority && p.key !== 'normale'
                  ? { background: p.color, color: '#05070d' }
                  : undefined
              }
              aria-pressed={p.key === form.priority}
              onClick={() => patch({ priority: p.key })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Difficulté · détermine l’XP</span>
        <div className={styles.difficulties} role="group" aria-label="Difficulté">
          {TASK_DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={d.key === form.difficulty ? styles.diffOn : styles.diff}
              aria-pressed={d.key === form.difficulty}
              onClick={() => patch({ difficulty: d.key })}
            >
              <span className={styles.diffName}>{d.label}</span>
              <span className={styles.diffXp}>+{d.xp} XP</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Échéance</span>
        <div className={styles.pills} role="group" aria-label="Échéance">
          {DUE_CHOICES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={c.key === form.due ? styles.pillOn : styles.pill}
              aria-pressed={c.key === form.due}
              onClick={() => patch({ due: c.key })}
            >
              {c.label}
            </button>
          ))}
        </div>
        {form.due === 'custom' && (
          <input
            type="date"
            className={styles.input}
            aria-label="Date d’échéance"
            value={form.customDate}
            onChange={(e) => patch({ customDate: e.target.value })}
          />
        )}
        {form.due !== 'none' && (
          <label className={styles.timeRow}>
            <span>Heure limite</span>
            <input
              type="time"
              className={styles.timeInput}
              value={form.time}
              onChange={(e) => patch({ time: e.target.value })}
            />
          </label>
        )}
      </div>

      <Card className={styles.xpCard}>
        <div className={styles.xpLine}>
          <span className={styles.xpBig}>+{taskXp(form.difficulty)} XP</span>
          <span className={styles.sub}>à la fin de cette tâche</span>
        </div>
        <span className={styles.sub}>
          Les tâches trop faciles ou répétées plusieurs fois par jour rapportent moins d’XP.
        </span>
      </Card>

      {save.isError && <p className={styles.error}>Impossible d’enregistrer la tâche.</p>}
      <Button type="submit" fullWidth disabled={!values || save.isPending}>
        {existing ? 'Enregistrer' : 'Créer la tâche'}
      </Button>
      {existing && (
        <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(true)}>
          Supprimer la tâche
        </Button>
      )}

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
              remove.mutate(existing!.id, {
                onSuccess: () => navigate('/taches', { replace: true }),
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </Sheet>
    </form>
  )
}
