import { describe, expect, it } from 'vitest'
import { workoutVolume } from './volume'

describe('workoutVolume', () => {
  it('somme poids × reps', () => {
    expect(
      workoutVolume([
        { weight_kg: 85, reps: 8, is_warmup: false },
        { weight_kg: 87.5, reps: 6, is_warmup: false },
      ])
    ).toBe(1205)
  })
  it('exclut les séries d’échauffement', () => {
    expect(
      workoutVolume([
        { weight_kg: 40, reps: 10, is_warmup: true },
        { weight_kg: 80, reps: 5, is_warmup: false },
      ])
    ).toBe(400)
  })
  it('vaut 0 sans série', () => {
    expect(workoutVolume([])).toBe(0)
  })
})
