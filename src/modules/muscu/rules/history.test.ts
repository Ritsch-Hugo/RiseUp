import { describe, expect, it } from 'vitest'
import { brokenCountByWorkout } from './history'

const set = (weight_kg: number, reps: number) => ({ weight_kg, reps, is_warmup: false })

describe('brokenCountByWorkout', () => {
  it('première séance : 0, puis compte les exercices qui progressent', () => {
    const counts = brokenCountByWorkout([
      { id: 'a', exercises: [{ exerciseId: 'dc', sets: [set(80, 5)] }] },
      { id: 'b', exercises: [{ exerciseId: 'dc', sets: [set(85, 5)] }] },
      { id: 'c', exercises: [{ exerciseId: 'dc', sets: [set(60, 5)] }] },
    ])
    expect([counts.get('a'), counts.get('b'), counts.get('c')]).toEqual([0, 1, 0])
  })
})
