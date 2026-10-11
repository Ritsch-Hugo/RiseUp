import { addDays, parisDay } from '../../../core/dates'
import { PRIORITIES, TASK_DIFFICULTIES, type TaskDifficulty, type TaskPriority } from '../config'

export type TaskLike = {
  title: string
  priority: TaskPriority
  difficulty: TaskDifficulty
  due_date: string | null
  due_time: string | null
  created_at: string
  completed_at: string | null
}

/** XP promis par une tâche de cette difficulté. */
export const taskXp = (difficulty: TaskDifficulty): number =>
  TASK_DIFFICULTIES.find((d) => d.key === difficulty)!.xp

const priorityRank = (p: TaskPriority) => PRIORITIES.findIndex((x) => x.key === p)

/** Dimanche de la semaine (lundi → dimanche) d'un jour AAAA-MM-JJ. */
export function endOfWeek(day: string): string {
  const dow = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7 // lundi = 0
  return addDays(day, 6 - dow)
}

/**
 * Séparation de l'écran Aujourd'hui : à faire = non terminées, sans échéance ou échues (en retard comprises) ;
 * terminées = terminées aujourd'hui (heure de Paris), la plus récente d'abord.
 * À faire : priorité décroissante, puis échéance (heure), puis ordre de création.
 */
export function splitToday<T extends TaskLike>(tasks: T[], today: string) {
  const todo = tasks
    .filter((t) => !t.completed_at && (t.due_date === null || t.due_date <= today))
    .sort(
      (a, b) =>
        priorityRank(b.priority) - priorityRank(a.priority) ||
        (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
        (a.due_time ?? '99:99').localeCompare(b.due_time ?? '99:99') ||
        a.created_at.localeCompare(b.created_at)
    )
  const done = tasks
    .filter((t) => t.completed_at && parisDay(t.completed_at) === today)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))
  return { todo, done }
}

const timeLabel = (t: string | null) => (t ? t.slice(0, 5) : '')

/** « aujourd'hui 18:00 », « en retard », « demain », « sans échéance », « lun. 12 oct. ». */
export function dueLabel(t: Pick<TaskLike, 'due_date' | 'due_time'>, today: string): string {
  const { due_date: date } = t
  if (date === null) return 'sans échéance'
  const time = timeLabel(t.due_time)
  if (date < today) return 'en retard'
  const base =
    date === today
      ? 'aujourd’hui'
      : date === addDays(today, 1)
        ? 'demain'
        : new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC',
          })
  return time ? `${base} ${time}` : base
}

/** Ligne sous le titre : « Études · aujourd'hui 18:00 · priorité haute ». */
export function taskSubtitle(
  t: Pick<TaskLike, 'due_date' | 'due_time' | 'priority'>,
  categoryName: string | null,
  today: string
): string {
  return [
    categoryName,
    dueLabel(t, today),
    t.priority === 'normale' ? null : `priorité ${t.priority}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export type DueChoice = 'none' | 'today' | 'tomorrow' | 'week' | 'custom'

/** Date d'échéance correspondant à un choix du formulaire. */
export function dueDateFor(choice: DueChoice, today: string, custom: string): string | null {
  switch (choice) {
    case 'none':
      return null
    case 'today':
      return today
    case 'tomorrow':
      return addDays(today, 1)
    case 'week':
      return endOfWeek(today)
    case 'custom':
      return /^\d{4}-\d{2}-\d{2}$/.test(custom) ? custom : null
  }
}

/** Choix du formulaire qui correspond à une échéance enregistrée (pour modifier une tâche). */
export function choiceForDue(due: string | null, today: string): DueChoice {
  if (due === null) return 'none'
  if (due === today) return 'today'
  if (due === addDays(today, 1)) return 'tomorrow'
  if (due === endOfWeek(today)) return 'week'
  return 'custom'
}

export type TaskForm = {
  title: string
  categoryId: string | null
  priority: TaskPriority
  difficulty: TaskDifficulty
  due: DueChoice
  customDate: string
  /** HH:MM ou vide. */
  time: string
}

/** Valeurs prêtes à écrire, ou null si le formulaire est incomplet (titre vide, date « choisir » vide). */
export function validateTaskForm(f: TaskForm, today: string) {
  const title = f.title.trim()
  if (title === '') return null
  if (f.due === 'custom' && dueDateFor('custom', today, f.customDate) === null) return null
  const due_date = dueDateFor(f.due, today, f.customDate)
  return {
    title,
    category_id: f.categoryId,
    priority: f.priority,
    difficulty: f.difficulty,
    due_date,
    due_time: due_date && /^\d{2}:\d{2}$/.test(f.time) ? f.time : null,
  }
}
