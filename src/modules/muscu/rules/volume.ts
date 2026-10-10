type VolumeSet = { weight_kg: number; reps: number; is_warmup: boolean }

/** Volume = Σ poids × reps des séries de travail (échauffement exclu, ADR-005). */
export function workoutVolume(sets: VolumeSet[]): number {
  return sets.reduce((total, s) => (s.is_warmup ? total : total + s.weight_kg * s.reps), 0)
}
