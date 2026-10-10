import { describe, expect, it } from 'vitest'
import { brokenRecords, estimateOneRM, exerciseRecords } from './records'

const s = (weight_kg: number, reps: number, is_warmup = false) => ({ weight_kg, reps, is_warmup })

describe('estimateOneRM', () => {
  it('Epley : 100 × 5 → 116,67', () => {
    expect(estimateOneRM(100, 5)).toBeCloseTo(116.67, 2)
  })
  it('1 rep → le poids', () => expect(estimateOneRM(100, 1)).toBe(100))
  it('plus de 12 reps ou sans charge → null', () => {
    expect(estimateOneRM(50, 13)).toBeNull()
    expect(estimateOneRM(0, 10)).toBeNull()
  })
})

describe('exerciseRecords', () => {
  it('ignore l’échauffement', () => {
    expect(exerciseRecords([s(200, 5, true), s(80, 5)]).maxLoad).toBe(80)
  })
  it('meilleure série = poids × reps max', () => {
    expect(exerciseRecords([s(100, 3), s(80, 6)]).bestSet).toEqual({ weight: 80, reps: 6 })
  })
  it('reps max pour les séries sans charge', () => {
    const r = exerciseRecords([s(0, 12), s(0, 15)])
    expect(r.maxReps).toBe(15)
    expect(r.maxLoad).toBe(0)
  })
})

describe('brokenRecords', () => {
  it('rien sans historique', () => {
    expect(brokenRecords(exerciseRecords([]), exerciseRecords([s(80, 5)]))).toEqual([])
  })
  it('détecte charge, 1RM et série', () => {
    const before = exerciseRecords([s(80, 5)])
    const now = exerciseRecords([s(85, 5)])
    expect(brokenRecords(before, now)).toEqual(['maxLoad', 'best1RM', 'bestSet'])
  })
  it('égalité ne bat pas le record', () => {
    const r = exerciseRecords([s(80, 5)])
    expect(brokenRecords(r, r)).toEqual([])
  })
})
