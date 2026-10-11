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

/** Niveaux : XP pour passer du niveau n à n+1 = max(LEVEL_MIN_XP, LEVEL_STEP_XP × (n − 1)). */
export const LEVEL_MIN_XP = 100
export const LEVEL_STEP_XP = 100

/** Rangs, par niveau minimum (docs/regles-metier.md). */
export const RANKS: { minLevel: number; name: string }[] = [
  { minLevel: 1, name: 'Débutant' },
  { minLevel: 5, name: 'Régulier' },
  { minLevel: 10, name: 'Discipliné' },
  { minLevel: 15, name: 'Acharné' },
  { minLevel: 20, name: 'Élite' },
  { minLevel: 30, name: 'Légende' },
]

/** Anti-triche (facteurs cumulables, stockés dans taches_xp_events.factor). */
export const ANTI_CHEAT = {
  /** Tâches faciles du jour : jusqu'à la 5e plein tarif, de la 6e à la 10e demi-tarif, au-delà rien. */
  easyFullLimit: 5,
  easyHalfLimit: 10,
  /** Tâche créée puis terminée en moins de ce nombre de minutes. */
  minDurationMinutes: 5,
  /** Même titre (normalisé) déjà validé dans cette fenêtre. */
  duplicateWindowHours: 24,
  halfFactor: 0.5,
} as const

/** Fenêtre (heures) des tâches terminées relues pour appliquer l'anti-triche. */
export const ANTI_CHEAT_FETCH_HOURS = 48

/** Écran Progrès : jours du graphe et fenêtre du taux de réussite. */
export const PROGRESS_CHART_DAYS = 14
export const SUCCESS_RATE_DAYS = 30

export type QuestKind = Enums<'quest_kind'>
export type QuestPeriod = Enums<'quest_period'>

/** Bonus fixe d'une quête validée, non réglable (docs/regles-metier.md, ADR-012). */
export const QUEST_BONUS_XP: Record<QuestPeriod, number> = { jour: 20, semaine: 75 }

export const QUEST_PERIODS: { key: QuestPeriod; label: string; reconduct: string }[] = [
  { key: 'jour', label: 'Du jour', reconduct: 'chaque jour' },
  { key: 'semaine', label: 'De la semaine', reconduct: 'chaque semaine' },
]

/** Types de quêtes (ADR-007 §6) : la progression se calcule seule, sauf « manuelle ». */
export const QUEST_KINDS: { key: QuestKind; label: string; hint: string }[] = [
  {
    key: 'n_taches',
    label: 'Tâches terminées',
    hint: 'Termine N tâches, de n’importe quelle difficulté ou d’une seule.',
  },
  {
    key: 'n_taches_categorie',
    label: 'Tâches d’une catégorie',
    hint: 'Termine N tâches d’une catégorie.',
  },
  {
    key: 'habitudes_moment',
    label: 'Habitudes d’un moment',
    hint: 'Valide N habitudes du matin, de l’après-midi ou du soir.',
  },
  {
    key: 'habitudes_jour',
    label: 'Habitudes validées',
    hint: 'Valide N habitudes, quel que soit leur moment.',
  },
  { key: 'manuelle', label: 'Manuelle', hint: 'Tu fais avancer la quête toi-même.' },
]

/** Objectif proposé par défaut à la création d'une quête. */
export const DEFAULT_QUEST_TARGET = 3

/** Boss de la semaine (docs/regles-metier.md) : XP par étape battue et à la victoire. */
export const BOSS_STEP_XP = 10
export const BOSS_VICTORY_XP = 150
/** PV proposés par défaut à une nouvelle étape de boss. */
export const BOSS_DEFAULT_STEP_HP = 20

export type BadgeMetric = 'tasks' | 'streak' | 'quests' | 'level' | 'boss' | 'habits'

/**
 * Catalogue des badges (12). Un badge se débloque quand la mesure atteint le seuil, puis reste acquis.
 * Mesures : tâches terminées, meilleure série de jours actifs, quêtes validées, niveau, boss vaincus,
 * habitudes validées (au moins une fois).
 */
export const BADGES: {
  key: string
  label: string
  icon: 'check' | 'bolt' | 'target' | 'star' | 'trophy'
  metric: BadgeMetric
  threshold: number
}[] = [
  { key: 'premiere_tache', label: 'Première tâche', icon: 'check', metric: 'tasks', threshold: 1 },
  {
    key: 'premiere_habitude',
    label: 'Première habitude',
    icon: 'check',
    metric: 'habits',
    threshold: 1,
  },
  { key: 'serie_5', label: 'Série de 5 jours', icon: 'bolt', metric: 'streak', threshold: 5 },
  { key: 'serie_10', label: 'Série de 10 jours', icon: 'bolt', metric: 'streak', threshold: 10 },
  { key: 'serie_30', label: 'Série de 30 jours', icon: 'bolt', metric: 'streak', threshold: 30 },
  {
    key: 'quetes_10',
    label: '10 quêtes validées',
    icon: 'target',
    metric: 'quests',
    threshold: 10,
  },
  { key: 'taches_50', label: '50 tâches', icon: 'star', metric: 'tasks', threshold: 50 },
  { key: 'taches_100', label: '100 tâches', icon: 'star', metric: 'tasks', threshold: 100 },
  { key: 'boss_1', label: 'Boss vaincu', icon: 'trophy', metric: 'boss', threshold: 1 },
  { key: 'niveau_5', label: 'Niveau 5', icon: 'trophy', metric: 'level', threshold: 5 },
  { key: 'niveau_10', label: 'Niveau 10', icon: 'trophy', metric: 'level', threshold: 10 },
  { key: 'niveau_20', label: 'Niveau 20', icon: 'trophy', metric: 'level', threshold: 20 },
]
