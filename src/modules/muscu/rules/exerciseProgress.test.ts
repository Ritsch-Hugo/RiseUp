import { describe, expect, it } from 'vitest'
import { progressByExercise, sessionMetric, type ProgressRow } from './exerciseProgress'

const set = (weight_kg: number, reps: number, is_warmup = false) => ({ weight_kg, reps, is_warmup })

describe('sessionMetric', () => {
  const sets = [set(40, 10, true), set(80, 5), set(85, 3), set(0, 12)]
  it('charge max hors échauffement', () => expect(sessionMetric(sets, 'maxLoad')).toBe(85))
  it('volume hors échauffement et sans charge', () =>
    expect(sessionMetric(sets, 'volume')).toBe(80 * 5 + 85 * 3))
  it('1RM Epley', () => expect(sessionMetric(sets, 'oneRM')).toBeCloseTo(93.5))
  it('0 sans série valide', () => expect(sessionMetric([set(0, 10)], 'maxLoad')).toBe(0))
})

describe('progressByExercise', () => {
  const row = (exerciseId: string, startedAt: string, w: number): ProgressRow => ({
    exerciseId,
    name: exerciseId,
    primary: 'pecs',
    secondary: [],
    startedAt,
    sets: [set(w, 5)],
  })
  const rows = [
    row('squat', '2026-09-01T10:00:00Z', 100),
    row('squat', '2026-10-01T10:00:00Z', 110),
    row('squat', '2026-05-01T10:00:00Z', 50),
    row('curl', '2026-10-02T10:00:00Z', 20),
  ]

  it('ignore avant la période, calcule dernier et écart', () => {
    const r = progressByExercise(rows, 'maxLoad', '2026-07-01')
    expect(r.map((e) => e.exerciseId)).toEqual(['squat', 'curl'])
    expect(r[0]).toMatchObject({ last: 110, delta: 10 })
    expect(r[0]!.points).toHaveLength(2)
  })
  it('écart null avec une seule séance', () => {
    expect(progressByExercise(rows, 'maxLoad', '2026-07-01')[1]!.delta).toBeNull()
  })
  it('vide sans séance dans la période', () => {
    expect(progressByExercise(rows, 'maxLoad', '2026-11-01')).toEqual([])
  })
})
