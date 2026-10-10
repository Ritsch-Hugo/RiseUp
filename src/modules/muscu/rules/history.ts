import { brokenRecords, exerciseRecords, type ExerciseRecords, type RecordSet } from './records'

export type HistoryWorkout = {
  id: string
  exercises: { exerciseId: string; sets: RecordSet[] }[]
}

/**
 * Nombre d'exercices avec au moins un record battu, par séance.
 * `workouts` doit être trié du plus ancien au plus récent.
 */
export function brokenCountByWorkout(workouts: HistoryWorkout[]): Map<string, number> {
  const best = new Map<string, RecordSet[]>()
  const counts = new Map<string, number>()
  for (const w of workouts) {
    let count = 0
    const before = new Map<string, ExerciseRecords>()
    for (const e of w.exercises) {
      const prior = exerciseRecords(best.get(e.exerciseId) ?? [])
      before.set(e.exerciseId, prior)
      if (brokenRecords(prior, exerciseRecords(e.sets)).length > 0) count += 1
    }
    counts.set(w.id, count)
    for (const e of w.exercises) {
      best.set(e.exerciseId, [...(best.get(e.exerciseId) ?? []), ...e.sets])
    }
  }
  return counts
}
