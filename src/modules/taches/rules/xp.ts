import { parisDay } from '../../../core/dates'
import { ANTI_CHEAT, LEVEL_MIN_XP, LEVEL_STEP_XP, RANKS, type TaskDifficulty } from '../config'

/** XP nécessaire pour passer du niveau `level` au suivant. */
export const xpToNextLevel = (level: number): number =>
  Math.max(LEVEL_MIN_XP, LEVEL_STEP_XP * (level - 1))

export type LevelInfo = {
  level: number
  /** XP gagné dans le niveau en cours. */
  xpInto: number
  /** XP total pour finir ce niveau. */
  xpForNext: number
  /** Avancement dans le niveau, de 0 à 1. */
  progress: number
}

/** Niveau calculé depuis la somme du journal d'XP (un total négatif ou nul = niveau 1). */
export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, totalXp)
  while (rest >= xpToNextLevel(level)) {
    rest -= xpToNextLevel(level)
    level += 1
  }
  const xpForNext = xpToNextLevel(level)
  return { level, xpInto: rest, xpForNext, progress: rest / xpForNext }
}

export function rankFor(level: number): string {
  let rank = RANKS[0]!.name
  for (const r of RANKS) if (level >= r.minLevel) rank = r.name
  return rank
}

/** Titre normalisé : minuscules, sans accents, ponctuation et espaces multiples ignorés. */
export function normalizeTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Tâche déjà terminée, relue pour l'anti-triche. */
export type RecentTask = {
  id: string
  title: string
  difficulty: TaskDifficulty
  completed_at: string
  /** Tâche récurrente (ou occurrence d'une tâche récurrente). */
  recurring: boolean
}

export type Reduction = { reason: 'easy' | 'duplicate' | 'fast'; factor: number; label: string }

export type TaskFactor = { factor: number; reductions: Reduction[] }

const MIN_MS = 60_000

/**
 * Facteur d'XP d'une tâche qu'on vient de terminer (docs/regles-metier.md) :
 * - tâches faciles du jour : de la 6e à la 10e ×0,5, au-delà ×0 ;
 * - créée et terminée en moins de 5 min : ×0,5 ;
 * - même titre validé dans les 24 h : ×0,5 (tâches récurrentes exclues).
 * Les facteurs se multiplient. `others` = les autres tâches terminées récemment (celle-ci exclue).
 */
export function taskFactor(
  task: {
    title: string
    difficulty: TaskDifficulty
    created_at: string
    recurring: boolean
  },
  completedAt: string,
  others: RecentTask[]
): TaskFactor {
  const reductions: Reduction[] = []
  const day = parisDay(completedAt)
  const doneAt = new Date(completedAt).getTime()

  if (task.difficulty === 'facile') {
    const rank =
      others.filter(
        (o) =>
          o.difficulty === 'facile' &&
          parisDay(o.completed_at) === day &&
          o.completed_at <= completedAt
      ).length + 1
    if (rank > ANTI_CHEAT.easyHalfLimit) {
      reductions.push({ reason: 'easy', factor: 0, label: `${rank}ᵉ tâche facile du jour` })
    } else if (rank > ANTI_CHEAT.easyFullLimit) {
      reductions.push({
        reason: 'easy',
        factor: ANTI_CHEAT.halfFactor,
        label: `${rank}ᵉ tâche facile du jour`,
      })
    }
  }

  if (!task.recurring) {
    const created = new Date(task.created_at).getTime()
    if (doneAt - created < ANTI_CHEAT.minDurationMinutes * MIN_MS) {
      reductions.push({
        reason: 'fast',
        factor: ANTI_CHEAT.halfFactor,
        label: `Créée et terminée en moins de ${ANTI_CHEAT.minDurationMinutes} min`,
      })
    }
    const title = normalizeTitle(task.title)
    const windowMs = ANTI_CHEAT.duplicateWindowHours * 60 * MIN_MS
    const duplicate = others.some((o) => {
      const at = new Date(o.completed_at).getTime()
      return (
        !o.recurring && normalizeTitle(o.title) === title && at <= doneAt && doneAt - at <= windowMs
      )
    })
    if (duplicate) {
      reductions.push({
        reason: 'duplicate',
        factor: ANTI_CHEAT.halfFactor,
        label: 'Même tâche déjà validée dans les 24 h',
      })
    }
  }

  return { factor: reductions.reduce((f, r) => f * r.factor, 1), reductions }
}

/** XP final d'un événement : base × facteur, arrondi. */
export const applyFactor = (base: number, factor: number): number => Math.round(base * factor)

/** Résultat d'un gain, pour l'écran de récompense. */
/** Bonus de quête gagné en même temps (ou perdu). */
export type Bonus = { title: string; xp: number }

export type Award = {
  kind: 'task' | 'habit' | 'quest' | 'boss'
  title: string
  /** Ligne de détail de l'écran de récompense : « Tâche difficile », « Habitude facile »… */
  label: string
  base: number
  xp: number
  reductions: Reduction[]
  /** Quêtes validées par ce gain. */
  bonuses: Bonus[]
  /** XP total avant / après le gain. */
  before: number
  after: number
  /** Série de jours actifs après le gain. */
  streak: number
  /** Libellés des badges débloqués par ce gain. */
  badges?: string[]
}

export type AwardSummary = {
  before: LevelInfo
  after: LevelInfo
  levelUp: boolean
  rankChanged: boolean
  toNext: number
}

export function summarizeAward(a: Pick<Award, 'before' | 'after'>): AwardSummary {
  const before = levelFromXp(a.before)
  const after = levelFromXp(a.after)
  return {
    before,
    after,
    levelUp: after.level > before.level,
    rankChanged: rankFor(after.level) !== rankFor(before.level),
    toNext: after.xpForNext - after.xpInto,
  }
}
