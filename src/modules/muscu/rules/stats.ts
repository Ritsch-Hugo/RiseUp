import {
  LOWER_GROUPS,
  MUSCLE_GROUPS,
  PULL_GROUPS,
  PUSH_GROUPS,
  SECONDARY_GROUP_WEIGHT,
  UPPER_GROUPS,
  type MuscleGroup,
} from '../config'
import type { ProgressRow } from './exerciseProgress'
import { estimateOneRM } from './records'
import { parisDay } from './week'

export type TopRecord = {
  exerciseId: string
  name: string
  weight: number
  reps: number
  oneRM: number
  day: string
}

/** Meilleur 1RM estimé de chaque exercice (toute l'histoire), les plus forts d'abord. */
export function topRecords(rows: ProgressRow[], limit: number): TopRecord[] {
  const best = new Map<string, TopRecord>()
  for (const r of rows) {
    for (const s of r.sets) {
      if (s.is_warmup) continue
      const oneRM = estimateOneRM(s.weight_kg, s.reps)
      if (oneRM === null) continue
      const current = best.get(r.exerciseId)
      if (!current || oneRM > current.oneRM) {
        best.set(r.exerciseId, {
          exerciseId: r.exerciseId,
          name: r.name,
          weight: s.weight_kg,
          reps: s.reps,
          oneRM,
          day: parisDay(r.startedAt),
        })
      }
    }
  }
  return [...best.values()].sort((a, b) => b.oneRM - a.oneRM).slice(0, limit)
}

/** « aujourd'hui », « il y a 3 j » entre deux jours AAAA-MM-JJ. */
export function daysAgoLabel(day: string, today: string): string {
  const n = Math.round(
    (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${day}T00:00:00Z`).getTime()) / 86_400_000
  )
  return n <= 0 ? 'aujourd’hui' : `il y a ${n} j`
}

export type GroupVolume = Record<MuscleGroup, number>

/** Volume par groupe sur un mois (AAAA-MM) : 100 % au principal, 50 % aux secondaires. */
export function volumeByGroup(rows: ProgressRow[], month: string): GroupVolume {
  const total = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.key, 0])) as GroupVolume
  for (const r of rows) {
    if (parisDay(r.startedAt).slice(0, 7) !== month) continue
    const volume = r.sets.reduce((t, s) => (s.is_warmup ? t : t + s.weight_kg * s.reps), 0)
    total[r.primary] += volume
    for (const g of new Set(r.secondary)) {
      if (g !== r.primary) total[g] += volume * SECONDARY_GROUP_WEIGHT
    }
  }
  return total
}

/** Part en % (entier) de chaque groupe ; tout à 0 sans volume. */
export function volumeShares(volume: GroupVolume): GroupVolume {
  const sum = MUSCLE_GROUPS.reduce((t, g) => t + volume[g.key], 0)
  return Object.fromEntries(
    MUSCLE_GROUPS.map((g) => [g.key, sum > 0 ? Math.round((volume[g.key] / sum) * 100) : 0])
  ) as GroupVolume
}

const sumOf = (volume: GroupVolume, groups: MuscleGroup[]) =>
  groups.reduce((t, g) => t + volume[g], 0)

/** Parts de deux ensembles l'un par rapport à l'autre, en % ; null si les deux sont vides. */
function split(a: number, b: number): [number, number] | null {
  if (a + b <= 0) return null
  const first = Math.round((a / (a + b)) * 100)
  return [first, 100 - first]
}

export function balance(volume: GroupVolume) {
  return {
    upperLower: split(sumOf(volume, UPPER_GROUPS), sumOf(volume, LOWER_GROUPS)),
    pushPull: split(sumOf(volume, PUSH_GROUPS), sumOf(volume, PULL_GROUPS)),
  }
}
