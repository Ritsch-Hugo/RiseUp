import { describe, expect, it } from 'vitest'
import type { ProgressRow } from './exerciseProgress'
import { balance, daysAgoLabel, topRecords, volumeByGroup, volumeShares } from './stats'

const row = (
  exerciseId: string,
  primary: ProgressRow['primary'],
  secondary: ProgressRow['secondary'],
  startedAt: string,
  sets: [number, number][]
): ProgressRow => ({
  exerciseId,
  name: exerciseId,
  primary,
  secondary,
  startedAt,
  sets: sets.map(([weight_kg, reps]) => ({ weight_kg, reps, is_warmup: false })),
})

describe('topRecords', () => {
  const rows = [
    row('dc', 'pecs', [], '2026-10-07T10:00:00Z', [
      [80, 5],
      [87.5, 5],
    ]),
    row('dc', 'pecs', [], '2026-09-01T10:00:00Z', [[60, 10]]),
    row('squat', 'quadriceps', [], '2026-10-05T10:00:00Z', [[115, 5]]),
    row('pompes', 'pecs', [], '2026-10-05T10:00:00Z', [[0, 20]]),
  ]
  it('meilleur 1RM par exercice, trié, sans charge nulle', () => {
    const r = topRecords(rows, 5)
    expect(r.map((x) => x.exerciseId)).toEqual(['squat', 'dc'])
    expect(r[1]).toMatchObject({ weight: 87.5, reps: 5, day: '2026-10-07' })
    expect(r[1]!.oneRM).toBeCloseTo(87.5 * (1 + 5 / 30))
  })
  it('respecte la limite', () => expect(topRecords(rows, 1)).toHaveLength(1))
})

describe('daysAgoLabel', () => {
  it('libellés', () => {
    expect(daysAgoLabel('2026-10-10', '2026-10-10')).toBe('aujourd’hui')
    expect(daysAgoLabel('2026-10-07', '2026-10-10')).toBe('il y a 3 j')
  })
})

describe('volume par groupe', () => {
  const rows = [
    row('dc', 'pecs', ['triceps'], '2026-10-07T10:00:00Z', [[100, 10]]),
    row('old', 'dos', [], '2026-09-07T10:00:00Z', [[100, 10]]),
  ]
  const v = volumeByGroup(rows, '2026-10')
  it('100 % principal, 50 % secondaire, mois seulement', () => {
    expect(v.pecs).toBe(1000)
    expect(v.triceps).toBe(500)
    expect(v.dos).toBe(0)
  })
  it('parts en %', () => {
    const s = volumeShares(v)
    expect(s.pecs).toBe(67)
    expect(s.triceps).toBe(33)
  })
  it('tout à 0 sans volume', () => expect(volumeShares(volumeByGroup([], '2026-10')).pecs).toBe(0))
})

describe('balance', () => {
  it('haut/bas (abdos en bas) et push/pull', () => {
    const v = volumeByGroup(
      [
        row('a', 'pecs', [], '2026-10-07T10:00:00Z', [[100, 6]]), // push 600
        row('b', 'dos', [], '2026-10-07T10:00:00Z', [[100, 4]]), // pull 400
        row('c', 'abdos', [], '2026-10-07T10:00:00Z', [[50, 20]]), // bas 1000
      ],
      '2026-10'
    )
    expect(balance(v).upperLower).toEqual([50, 50])
    expect(balance(v).pushPull).toEqual([60, 40])
  })
  it('null sans volume', () => {
    expect(balance(volumeByGroup([], '2026-10')).upperLower).toBeNull()
  })
})
