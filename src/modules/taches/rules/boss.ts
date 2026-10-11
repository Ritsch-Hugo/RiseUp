import { endOfWeek } from './tasks'
import { periodStart } from './quests'

/** Étape d'un boss : une sous-tâche portant des points de vie. */
export type BossStep = { hp: number | null; done_at: string | null }

export type BossHealth = {
  total: number
  remaining: number
  /** PV restants, de 0 à 100 (barre de vie). */
  percent: number
  /** Étapes battues / total. */
  done: number
  steps: number
  defeated: boolean
}

/** Points de vie du boss : chaque étape coche retire ses PV (une étape sans PV compte 1). */
export function bossHealth(steps: BossStep[]): BossHealth {
  const hp = (s: BossStep) => s.hp ?? 1
  const total = steps.reduce((t, s) => t + hp(s), 0)
  const remaining = steps.filter((s) => !s.done_at).reduce((t, s) => t + hp(s), 0)
  const done = steps.filter((s) => s.done_at).length
  return {
    total,
    remaining,
    percent: total === 0 ? 0 : Math.round((remaining / total) * 100),
    done,
    steps: steps.length,
    defeated: steps.length > 0 && done === steps.length,
  }
}

/** Lundi de la semaine d'un jour : valeur de `boss_week`. */
export const bossWeekOf = (day: string): string => periodStart('semaine', day)

/** Échéance d'un boss créé ce jour-là : le dimanche de la semaine. */
export const bossDueDate = (day: string): string => endOfWeek(day)

/** Le boss de cette semaine-là est-il celui de la semaine en cours ? Sinon, il s'est échappé (sans pénalité). */
export const isCurrentBoss = (bossWeek: string | null, today: string): boolean =>
  bossWeek !== null && bossWeek === bossWeekOf(today)
