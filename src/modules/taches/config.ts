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
