import {
  MUSCLE_GROUPS,
  MUSCLE_WEEKLY_TARGET_SETS,
  RECOVERY_BASE_HOURS,
  RECOVERY_HOURS_PER_SET,
  RECOVERY_MAX_HOURS,
  SECONDARY_GROUP_WEIGHT,
  type MuscleGroup,
} from '../config'
import { parisDay, weekStart } from './week'

export type MuscleWorkout = {
  startedAt: string
  endedAt: string
  exercises: {
    primary: MuscleGroup
    secondary: MuscleGroup[]
    /** Séries de travail (échauffement exclu). */
    workingSets: number
  }[]
}

export type GroupSets = Record<MuscleGroup, number>

const emptySets = (): GroupSets =>
  Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.key, 0])) as GroupSets

/** Séries effectives par groupe : 1 pour le principal, 0,5 pour chaque secondaire. */
export function effectiveSets(workout: MuscleWorkout): GroupSets {
  const sets = emptySets()
  for (const e of workout.exercises) {
    sets[e.primary] += e.workingSets
    for (const g of new Set(e.secondary)) {
      if (g !== e.primary) sets[g] += e.workingSets * SECONDARY_GROUP_WEIGHT
    }
  }
  return sets
}

/** Sollicitation de la semaine de `today`, de 0 à 1 par groupe. */
export function weeklyLoad(workouts: MuscleWorkout[], today: string): GroupSets {
  const start = weekStart(today)
  const total = emptySets()
  for (const w of workouts) {
    if (weekStart(parisDay(w.startedAt)) !== start) continue
    const s = effectiveSets(w)
    for (const g of MUSCLE_GROUPS) total[g.key] += s[g.key]
  }
  for (const g of MUSCLE_GROUPS) {
    total[g.key] = Math.min(1, total[g.key] / MUSCLE_WEEKLY_TARGET_SETS)
  }
  return total
}

export type Recovery = {
  group: MuscleGroup
  /** Avancement de 0 à 1 (1 = prêt). */
  progress: number
  remainingHours: number
}

/** Récupération par groupe depuis la dernière séance qui l'a sollicité. */
export function recovery(workouts: MuscleWorkout[], now: Date): Recovery[] {
  const sorted = [...workouts].sort((a, b) => b.endedAt.localeCompare(a.endedAt))
  return MUSCLE_GROUPS.map(({ key }) => {
    for (const w of sorted) {
      const sets = effectiveSets(w)[key]
      if (sets <= 0) continue
      const need = Math.min(RECOVERY_MAX_HOURS, RECOVERY_BASE_HOURS + RECOVERY_HOURS_PER_SET * sets)
      const elapsed = (now.getTime() - new Date(w.endedAt).getTime()) / 3_600_000
      const remainingHours = Math.max(0, need - elapsed)
      return { group: key, progress: Math.min(1, Math.max(0, elapsed / need)), remainingHours }
    }
    return { group: key, progress: 1, remainingHours: 0 }
  })
}

const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [0x2e, 0x38, 0x46]],
  [0.4, [0x3b, 0x82, 0xc4]],
  [1, [0xe5, 0x48, 0x4d]],
]

/** Couleur de la silhouette : gris (rien) → bleu (peu) → rouge (très sollicité). */
export function heatColor(level: number): string {
  const t = Math.min(1, Math.max(0, level))
  const i = HEAT_STOPS.findIndex(([at]) => t <= at)
  const [a, ca] = HEAT_STOPS[Math.max(0, i - 1)]!
  const [b, cb] = HEAT_STOPS[Math.max(1, i)]!
  const k = (t - a) / (b - a)
  const c = ca.map((v, n) => Math.round(v + (cb[n]! - v) * k))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
