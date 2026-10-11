import { addDays } from '../../../core/dates'
import {
  HABIT_MOMENTS,
  HABIT_XP,
  MAX_STREAK_LOOKBACK_DAYS,
  WEEKDAYS,
  type HabitMoment,
  type HabitType,
  type TaskDifficulty,
} from '../config'
import { endOfWeek } from './tasks'

export type HabitLike = {
  weekdays: number[]
  type: HabitType
  target: number | null
  archived_at: string | null
}
export type Pause = { start_day: string; end_day: string | null }
/** Valeur enregistrée par jour (AAAA-MM-JJ → valeur). */
export type LogMap = Map<string, number>

/** Jour de la semaine ISO (1 = lundi … 7 = dimanche) d'un jour AAAA-MM-JJ. */
export function isoWeekday(day: string): number {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay()
  return dow === 0 ? 7 : dow
}

export const habitXp = (difficulty: TaskDifficulty): number => HABIT_XP[difficulty]

export const isPlanned = (h: Pick<HabitLike, 'weekdays'>, day: string): boolean =>
  h.weekdays.includes(isoWeekday(day))

export const isPausedOn = (pauses: Pause[], day: string): boolean =>
  pauses.some((p) => p.start_day <= day && (p.end_day === null || day <= p.end_day))

/** Faite : cochée (type « fait ») ou objectif atteint (compteur). */
export function isDone(h: Pick<HabitLike, 'type' | 'target'>, value: number): boolean {
  return h.type === 'compteur' ? value >= (h.target ?? Infinity) : value >= 1
}

export type HabitStatus = 'active' | 'paused' | 'archived'

export function habitStatus(
  h: Pick<HabitLike, 'archived_at'>,
  pauses: Pause[],
  today: string
): HabitStatus {
  if (h.archived_at) return 'archived'
  return isPausedOn(pauses, today) ? 'paused' : 'active'
}

/** Habitude à faire ce jour : active, prévue ce jour-là et pas en pause. */
export function dueOn(h: HabitLike, pauses: Pause[], day: string): boolean {
  return !h.archived_at && isPlanned(h, day) && !isPausedOn(pauses, day)
}

/**
 * Série : jours prévus consécutifs faits, jusqu'à aujourd'hui. Les jours non prévus et en pause sont
 * ignorés ; aujourd'hui ne casse pas la série tant qu'il n'est pas fait.
 */
export function habitStreak(h: HabitLike, pauses: Pause[], logs: LogMap, today: string): number {
  let streak = 0
  let day = today
  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++, day = addDays(day, -1)) {
    if (!isPlanned(h, day) || isPausedOn(pauses, day)) continue
    if (isDone(h, logs.get(day) ?? 0)) streak += 1
    else if (day !== today) break
  }
  return streak
}

/** Semaine en cours (lundi → dimanche) : jours prévus (hors pause) et jours faits. */
export function weekProgress(h: HabitLike, pauses: Pause[], logs: LogMap, today: string) {
  const monday = addDays(endOfWeek(today), -6)
  let planned = 0
  let done = 0
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i)
    if (!isPlanned(h, day) || isPausedOn(pauses, day)) continue
    planned += 1
    if (isDone(h, logs.get(day) ?? 0)) done += 1
  }
  return { planned, done }
}

const SHORT_DAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

/** « Tous les jours », « Du lundi au vendredi », « Week-end », sinon « lun., mer., ven. ». */
export function weekdaysLabel(weekdays: number[]): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b)
  if (days.length === 7) return 'Tous les jours'
  if (days.join() === '1,2,3,4,5') return 'Du lundi au vendredi'
  if (days.join() === '6,7') return 'Week-end'
  return days.map((d) => SHORT_DAYS[d - 1]).join(', ')
}

export const momentLabel = (m: HabitMoment): string => HABIT_MOMENTS.find((x) => x.key === m)!.label

/** Ligne sous le nom : « Du lundi au vendredi · Soir · compteur ». */
export function habitSubtitle(h: HabitLike & { moment: HabitMoment }): string {
  return [
    weekdaysLabel(h.weekdays),
    momentLabel(h.moment),
    h.type === 'compteur' ? 'compteur' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** « en pause depuis 4 j » (le jour de la pause compte pour 0). */
export function pausedSince(pauses: Pause[], today: string): number | null {
  const open = pauses.filter(
    (p) => p.start_day <= today && (p.end_day === null || today <= p.end_day)
  )
  if (open.length === 0) return null
  const start = open.map((p) => p.start_day).sort()[0]!
  return Math.round(
    (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) /
      86_400_000
  )
}

export type HabitForm = {
  name: string
  weekdays: number[]
  moment: HabitMoment
  type: HabitType
  /** Objectif par jour (compteur). */
  target: string
  unit: string
  difficulty: TaskDifficulty
  reminderOn: boolean
  /** HH:MM. */
  reminderTime: string
}

/** Valeurs prêtes à écrire, ou null si le formulaire est incomplet. */
export function validateHabitForm(f: HabitForm) {
  const name = f.name.trim()
  if (name === '' || f.weekdays.length === 0) return null
  const target = Number(f.target.trim().replace(',', '.'))
  if (f.type === 'compteur' && !(Number.isInteger(target) && target > 0)) return null
  if (f.reminderOn && !/^\d{2}:\d{2}$/.test(f.reminderTime)) return null
  return {
    name,
    weekdays: [...new Set(f.weekdays)].sort((a, b) => a - b),
    moment: f.moment,
    type: f.type,
    target: f.type === 'compteur' ? target : null,
    unit: f.type === 'compteur' ? f.unit.trim() || null : null,
    difficulty: f.difficulty,
    reminder_time: f.reminderOn ? f.reminderTime : null,
  }
}

export const weekdayName = (iso: number): string => WEEKDAYS.find((d) => d.iso === iso)!.name
