import type { Enums } from '../../core'

export type TaskPriority = Enums<'task_priority'>
export type TaskDifficulty = Enums<'task_difficulty'>

/** Priorités, de la plus basse à la plus haute, avec la couleur de la pastille de la tâche. */
export const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'basse', label: 'Basse', color: '#6f7c99' },
  { key: 'normale', label: 'Normale', color: '#4d8dff' },
  { key: 'haute', label: 'Haute', color: '#ffc857' },
  { key: 'critique', label: 'Critique', color: '#ff5c6c' },
]
export const DEFAULT_PRIORITY: TaskPriority = 'normale'

/** XP gagné à la fin d'une tâche selon sa difficulté (docs/regles-metier.md). */
export const TASK_DIFFICULTIES: { key: TaskDifficulty; label: string; xp: number }[] = [
  { key: 'facile', label: 'Facile', xp: 10 },
  { key: 'moyen', label: 'Moyen', xp: 25 },
  { key: 'difficile', label: 'Difficile', xp: 50 },
]
export const DEFAULT_DIFFICULTY: TaskDifficulty = 'facile'

/** Les tâches terminées restent chargées ce nombre d'heures (pour la liste « Terminées » du jour). */
export const COMPLETED_FETCH_HOURS = 48

export type HabitMoment = Enums<'habit_moment'>
export type HabitType = Enums<'habit_type'>

/** XP gagné chaque jour où une habitude est validée selon sa difficulté (docs/regles-metier.md). */
export const HABIT_XP: Record<TaskDifficulty, number> = { facile: 10, moyen: 15, difficile: 25 }

/** Moments de la journée, dans l'ordre d'affichage de la routine. */
export const HABIT_MOMENTS: { key: HabitMoment; label: string; short: string }[] = [
  { key: 'matin', label: 'Matin', short: 'MATIN' },
  { key: 'aprem', label: 'Après-midi', short: 'APRÈS-MIDI' },
  { key: 'soir', label: 'Soir', short: 'SOIR' },
  { key: 'libre', label: 'Libre', short: 'À TOUT MOMENT' },
]
export const DEFAULT_HABIT_MOMENT: HabitMoment = 'libre'

/** Jours de la semaine, 1 = lundi … 7 = dimanche (ISO), comme la colonne `weekdays`. */
export const WEEKDAYS: { iso: number; letter: string; name: string }[] = [
  { iso: 1, letter: 'L', name: 'Lundi' },
  { iso: 2, letter: 'M', name: 'Mardi' },
  { iso: 3, letter: 'M', name: 'Mercredi' },
  { iso: 4, letter: 'J', name: 'Jeudi' },
  { iso: 5, letter: 'V', name: 'Vendredi' },
  { iso: 6, letter: 'S', name: 'Samedi' },
  { iso: 7, letter: 'D', name: 'Dimanche' },
]

/** Rappel d'habitude : heure proposée à l'activation. */
export const DEFAULT_REMINDER_TIME = '21:00'

/** Garde-fou du calcul de série : nombre maximal de jours remontés. */
export const MAX_STREAK_LOOKBACK_DAYS = 3660
