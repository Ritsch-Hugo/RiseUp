import { describe, expect, it } from 'vitest'
import { canValidate, parseDecimal, reconcileRows, toDbSet, type DbSet, type Row } from './rows'

let n = 0
const newId = () => `new-${++n}`
const db = (id: string, position: number, weight_kg: number, reps: number): DbSet => ({
  id,
  position,
  weight_kg,
  reps,
  rpe: null,
  duration_seconds: null,
  is_warmup: false,
})
const prev = [
  { weight_kg: 85, reps: 8, duration_seconds: null, is_warmup: false },
  { weight_kg: 85, reps: 7, duration_seconds: null, is_warmup: false },
]

describe('parseDecimal', () => {
  it('accepte virgule et point', () => {
    expect(parseDecimal('87,5')).toBe(87.5)
    expect(parseDecimal(' 12 ')).toBe(12)
  })
  it('refuse vide, texte et négatifs', () => {
    for (const bad of ['', 'abc', '-3', '1,2,3']) expect(parseDecimal(bad)).toBeNull()
  })
})

describe('reconcileRows', () => {
  it('sans brouillon : séries validées puis lignes prévues, préremplies avec la séance précédente', () => {
    n = 0
    const rows = reconcileRows({
      dbSets: [db('a', 0, 85, 8)],
      draft: null,
      targetSets: 3,
      previous: prev,
      newId,
    })
    expect(rows.map((r) => [r.id, r.done, r.weight, r.reps])).toEqual([
      ['a', true, '85', '8'],
      ['new-1', false, '85', '7'],
      ['new-2', false, '85', '7'],
    ])
  })
  it('crée au moins une ligne même sans objectif', () => {
    expect(
      reconcileRows({ dbSets: [], draft: null, targetSets: null, previous: [], newId })
    ).toHaveLength(1)
  })
  it('avec brouillon : la base fait foi pour « validée », le brouillon garde ses lignes', () => {
    const draft: Row[] = [
      { id: 'a', weight: '80', reps: '5', rpe: '', duration: '', warmup: false, done: true },
      { id: 'b', weight: '82,5', reps: '', rpe: '', duration: '', warmup: false, done: false },
      { id: 'c', weight: '', reps: '', rpe: '', duration: '', warmup: false, done: true },
    ]
    const rows = reconcileRows({
      dbSets: [db('a', 0, 85, 8), db('d', 1, 90, 3)],
      draft,
      targetSets: 3,
      previous: prev,
      newId,
    })
    expect(rows.map((r) => [r.id, r.done, r.weight])).toEqual([
      ['a', true, '85'],
      ['b', false, '82,5'],
      ['c', false, ''],
      ['d', true, '90'],
    ])
  })
})

describe('canValidate / toDbSet', () => {
  const row: Row = {
    id: 'x',
    weight: '87,5',
    reps: '6',
    rpe: '8',
    duration: '',
    warmup: false,
    done: false,
  }
  it('poids × reps', () => {
    expect(canValidate(row, 'poids_reps')).toBe(true)
    expect(canValidate({ ...row, reps: '' }, 'poids_reps')).toBe(false)
    expect(toDbSet(row, 'poids_reps')).toEqual({
      weight_kg: 87.5,
      reps: 6,
      rpe: 8,
      duration_seconds: null,
      is_warmup: false,
    })
  })
  it('reps seules : poids ignoré', () => {
    expect(toDbSet(row, 'reps').weight_kg).toBe(0)
  })
  it('durée', () => {
    const timed = { ...row, duration: '45' }
    expect(canValidate(row, 'duree')).toBe(false)
    expect(canValidate(timed, 'duree')).toBe(true)
    expect(toDbSet(timed, 'duree')).toMatchObject({ reps: 0, duration_seconds: 45, weight_kg: 0 })
  })
})
