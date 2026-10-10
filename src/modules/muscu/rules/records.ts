import { ONE_RM_MAX_REPS } from '../config'

export type RecordSet = { weight_kg: number; reps: number; is_warmup: boolean }

export type ExerciseRecords = {
  maxLoad: number
  best1RM: number
  /** Meilleure série = poids × reps le plus élevé. */
  bestSet: { weight: number; reps: number } | null
  /** Reps max, seulement pour les séries sans charge. */
  maxReps: number
}

/** 1RM estimé (Epley), 1 à 12 reps ; au-delà → null. */
export function estimateOneRM(weight: number, reps: number): number | null {
  if (weight <= 0 || reps < 1 || reps > ONE_RM_MAX_REPS) return null
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

/** Records d'un ensemble de séries (échauffement exclu). */
export function exerciseRecords(sets: RecordSet[]): ExerciseRecords {
  const records: ExerciseRecords = { maxLoad: 0, best1RM: 0, bestSet: null, maxReps: 0 }
  for (const s of sets) {
    if (s.is_warmup || s.reps < 1) continue
    if (s.weight_kg === 0) {
      records.maxReps = Math.max(records.maxReps, s.reps)
      continue
    }
    records.maxLoad = Math.max(records.maxLoad, s.weight_kg)
    records.best1RM = Math.max(records.best1RM, estimateOneRM(s.weight_kg, s.reps) ?? 0)
    if (!records.bestSet || s.weight_kg * s.reps > records.bestSet.weight * records.bestSet.reps) {
      records.bestSet = { weight: s.weight_kg, reps: s.reps }
    }
  }
  return records
}

export type BrokenRecord = 'maxLoad' | 'best1RM' | 'bestSet' | 'maxReps'

/**
 * Records battus par la séance `current` face à l'historique `before`.
 * Sans historique, rien n'est « battu » : c'est un point de départ.
 */
export function brokenRecords(before: ExerciseRecords, current: ExerciseRecords): BrokenRecord[] {
  const hasHistory =
    before.maxLoad > 0 || before.maxReps > 0 || before.best1RM > 0 || before.bestSet !== null
  if (!hasHistory) return []
  const broken: BrokenRecord[] = []
  if (current.maxLoad > before.maxLoad) broken.push('maxLoad')
  if (current.best1RM > before.best1RM) broken.push('best1RM')
  const volume = (r: ExerciseRecords) => (r.bestSet ? r.bestSet.weight * r.bestSet.reps : 0)
  if (volume(current) > volume(before)) broken.push('bestSet')
  if (current.maxReps > before.maxReps) broken.push('maxReps')
  return broken
}
