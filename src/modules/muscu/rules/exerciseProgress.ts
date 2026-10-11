import type { MuscleGroup } from '../config'
import { parisDay } from './week'
import { estimateOneRM, type RecordSet } from './records'

export type ProgressMetric = 'maxLoad' | 'oneRM' | 'volume'

export type ProgressRow = {
  exerciseId: string
  name: string
  primary: MuscleGroup
  secondary: MuscleGroup[]
  startedAt: string
  sets: RecordSet[]
}

export type ExerciseProgress = {
  exerciseId: string
  name: string
  primary: MuscleGroup
  secondary: MuscleGroup[]
  /** Une valeur par séance de la période, de la plus ancienne à la plus récente. */
  points: { day: string; value: number }[]
  last: number
  /** Dernière valeur − première ; null avec une seule séance. */
  delta: number | null
}

/** Valeur d'une séance pour une métrique (échauffement et séries sans charge exclus). */
export function sessionMetric(sets: RecordSet[], metric: ProgressMetric): number {
  const work = sets.filter((s) => !s.is_warmup && s.weight_kg > 0 && s.reps > 0)
  if (metric === 'volume') return work.reduce((t, s) => t + s.weight_kg * s.reps, 0)
  if (metric === 'maxLoad') return Math.max(0, ...work.map((s) => s.weight_kg))
  return Math.max(0, ...work.map((s) => estimateOneRM(s.weight_kg, s.reps) ?? 0))
}

/**
 * Progression par exercice depuis le jour `sinceDay` (inclus), les plus pratiqués d'abord.
 * Les exercices sans valeur sur la période sont ignorés.
 */
export function progressByExercise(
  rows: ProgressRow[],
  metric: ProgressMetric,
  sinceDay: string
): ExerciseProgress[] {
  const byExercise = new Map<string, ProgressRow[]>()
  for (const r of rows) {
    if (parisDay(r.startedAt) < sinceDay) continue
    byExercise.set(r.exerciseId, [...(byExercise.get(r.exerciseId) ?? []), r])
  }
  const result: ExerciseProgress[] = []
  for (const list of byExercise.values()) {
    const points = list
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .map((r) => ({ day: parisDay(r.startedAt), value: sessionMetric(r.sets, metric) }))
      .filter((p) => p.value > 0)
    if (points.length === 0) continue
    const first = list[0]!
    const last = points[points.length - 1]!.value
    result.push({
      exerciseId: first.exerciseId,
      name: first.name,
      primary: first.primary,
      secondary: first.secondary,
      points,
      last,
      delta: points.length > 1 ? last - points[0]!.value : null,
    })
  }
  return result.sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name))
}
