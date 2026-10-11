import { addDays, parisDay } from '../../../core/dates'
import { PRIORITIES, TASK_DIFFICULTIES, type TaskDifficulty, type TaskPriority } from '../config'

export type Recurrence = { type: 'daily' } | { type: 'weekly' }
export type RepeatChoice = 'none' | 'daily' | 'weekly'

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
  repeat: RepeatChoice
  notes: string
  subtasks: { id: string; title: string }[]
}

/** Valeurs prêtes à écrire, ou null si le formulaire est incomplet (titre vide, date « choisir » vide). */
export function validateTaskForm(f: TaskForm, today: string) {
  const title = f.title.trim()
  if (title === '') return null
  if (f.due === 'custom' && dueDateFor('custom', today, f.customDate) === null) return null
  const due_date = dueDateFor(f.due, today, f.customDate)
  // Une tâche qui se répète a besoin d'une échéance : c'est elle qui donne la date suivante.
  if (f.repeat !== 'none' && due_date === null) return null
  return {
    title,
    category_id: f.categoryId,
    priority: f.priority,
    difficulty: f.difficulty,
    due_date,
    due_time: due_date && /^\d{2}:\d{2}$/.test(f.time) ? f.time : null,
    recurrence: (f.repeat === 'none' ? null : { type: f.repeat }) as Recurrence | null,
    notes: f.notes.trim() || null,
  }
}

/** Lit la récurrence enregistrée (jsonb) ; null si absente ou inconnue. */
export function parseRecurrence(value: unknown): Recurrence | null {
  const type = (value as { type?: unknown } | null)?.type
  return type === 'daily' || type === 'weekly' ? { type } : null
}

export const repeatChoiceFor = (r: Recurrence | null): RepeatChoice => r?.type ?? 'none'

/**
 * Échéance de l'occurrence suivante : la première date de la série strictement après
 * l'échéance actuelle et après aujourd'hui (une tâche terminée en retard ne crée pas d'occurrence passée).
 */
export function nextOccurrence(rec: Recurrence, due: string, today: string): string {
  const step = rec.type === 'daily' ? 1 : 7
  let next = addDays(due, step)
  while (next <= today) next = addDays(next, step)
  return next
}

/** Sous-tâches terminées / total, ou null s'il n'y en a pas. */
export function subtaskProgress(subtasks: { done_at: string | null }[]) {
  if (subtasks.length === 0) return null
  return { done: subtasks.filter((s) => s.done_at).length, total: subtasks.length }
}

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const dayName = (day: string, withWeekday: boolean) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
    ...(withWeekday ? { weekday: 'long' as const } : {}),
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export type UpcomingSection<T> = { key: string; label: string; tasks: T[] }

/** Jours détaillés dans « À venir » (à partir de demain) ; au-delà : « Plus tard ». */
export const UPCOMING_DETAILED_DAYS = 7

/**
 * Tâches non terminées à échéance future, groupées par jour (demain, puis les jours suivants jusqu'à
 * `UPCOMING_DETAILED_DAYS`), puis « Plus tard ». Triées par heure dans chaque jour ; sections vides omises.
 */
export function groupUpcoming<T extends TaskLike>(tasks: T[], today: string): UpcomingSection<T>[] {
  const future = tasks.filter((t) => !t.completed_at && t.due_date !== null && t.due_date > today)
  const sortDay = (a: T, b: T) =>
    (a.due_time ?? '').localeCompare(b.due_time ?? '') || a.created_at.localeCompare(b.created_at)
  const sections: UpcomingSection<T>[] = []
  for (let i = 1; i <= UPCOMING_DETAILED_DAYS; i++) {
    const day = addDays(today, i)
    const list = future.filter((t) => t.due_date === day).sort(sortDay)
    if (list.length === 0) continue
    sections.push({
      key: day,
      label: i === 1 ? `Demain · ${dayName(day, true)}` : upperFirst(dayName(day, true)),
      tasks: list,
    })
  }
  const later = future
    .filter((t) => t.due_date! > addDays(today, UPCOMING_DETAILED_DAYS))
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!) || sortDay(a, b))
  if (later.length > 0) sections.push({ key: 'later', label: 'Plus tard', tasks: later })
  return sections
}

/** Sous-titre d'une tâche à venir (le jour est déjà dans l'en-tête) : « Études · 10:00 · priorité haute ». */
export function upcomingSubtitle(
  t: Pick<TaskLike, 'due_date' | 'due_time' | 'priority'>,
  categoryName: string | null,
  inLaterSection: boolean
): string {
  const when = t.due_time
    ? timeLabel(t.due_time)
    : inLaterSection && t.due_date
      ? dayName(t.due_date, false)
      : 'toute la journée'
  return [categoryName, when, t.priority === 'normale' ? null : `priorité ${t.priority}`]
    .filter(Boolean)
    .join(' · ')
}

export type WeekDay = {
  day: string
  letter: string
  number: number
  today: boolean
  priority: TaskPriority | null
}

/** Bandeau de la semaine en cours (lundi → dimanche) : une pastille par jour qui a des tâches ouvertes. */
export function weekStrip(tasks: TaskLike[], today: string): WeekDay[] {
  const monday = addDays(endOfWeek(today), -6)
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i)
    const open = tasks.filter((t) => !t.completed_at && t.due_date === day)
    const top = open.reduce<TaskPriority | null>(
      (best, t) =>
        best === null || priorityRank(t.priority) > priorityRank(best) ? t.priority : best,
      null
    )
    return {
      day,
      letter: 'LMMJVSD'[i]!,
      number: Number(day.slice(8)),
      today: day === today,
      priority: top,
    }
  })
}

/**
 * Échéance en langage courant sous la date : « dans 3 h », « il y a 25 min », « dans 2 jours »,
 * « en retard de 1 jour ». `nowMinutes` = minutes écoulées depuis minuit (Paris). null si rien à dire.
 */
export function relativeDue(
  t: Pick<TaskLike, 'due_date' | 'due_time'>,
  today: string,
  nowMinutes: number
): string | null {
  if (t.due_date === null) return null
  if (t.due_date === today) {
    if (!t.due_time) return null
    const [h, m] = t.due_time.split(':').map(Number) as [number, number]
    const diff = h * 60 + m - nowMinutes
    const abs = Math.abs(diff)
    const span = abs < 60 ? `${abs} min` : `${Math.round(abs / 60)} h`
    return diff >= 0 ? `dans ${span}` : `il y a ${span}`
  }
  const days = Math.round(
    (new Date(`${t.due_date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
      86_400_000
  )
  const n = Math.abs(days)
  const plural = n > 1 ? 's' : ''
  return days > 0 ? `dans ${n} jour${plural}` : `en retard de ${n} jour${plural}`
}
