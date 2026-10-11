import { describe, expect, it } from 'vitest'
import { DEFAULT_GOALS } from '../config'
import {
  formToGoal,
  goalForDay,
  goalToForm,
  macroGapMessage,
  macroKcal,
  macroShares,
} from './goals'

describe('goalForDay', () => {
  const goals = [
    { effective_from: '2026-09-01', kcal: 2300 },
    { effective_from: '2026-10-05', kcal: 2400 },
  ]
  it('objectif de l’époque', () => {
    expect(goalForDay(goals, '2026-09-20')?.kcal).toBe(2300)
    expect(goalForDay(goals, '2026-10-05')?.kcal).toBe(2400)
    expect(goalForDay(goals, '2026-12-01')?.kcal).toBe(2400)
  })
  it('null avant le premier objectif ou sans objectif', () => {
    expect(goalForDay(goals, '2026-08-31')).toBeNull()
    expect(goalForDay([], '2026-10-05')).toBeNull()
  })
})

describe('macros', () => {
  it('2 310 kcal pour 160 / 260 / 70', () => expect(macroKcal(DEFAULT_GOALS)).toBe(2310))
  it('parts en % des calories de l’objectif', () => {
    expect(macroShares(DEFAULT_GOALS)).toEqual({ protein: 27, carbs: 43, fat: 26 })
  })
  it('avertit si des calories ne sont pas attribuées', () => {
    expect(macroGapMessage(DEFAULT_GOALS)).toContain('90 kcal ne sont pas attribuées')
  })
  it('avertit si les macros dépassent', () => {
    expect(macroGapMessage({ ...DEFAULT_GOALS, kcal: 2000 })).toContain('dépassent')
  })
  it('rien quand c’est pile', () => {
    expect(macroGapMessage({ ...DEFAULT_GOALS, kcal: 2310 })).toBeNull()
  })
})

describe('formulaire', () => {
  it('aller-retour sur les valeurs par défaut', () => {
    expect(formToGoal(goalToForm(DEFAULT_GOALS))).toEqual(DEFAULT_GOALS)
  })
  it('virgule décimale et litres → ml', () => {
    const f = { ...goalToForm(DEFAULT_GOALS), salt: '4,5', water: '3' }
    expect(formToGoal(f)).toMatchObject({ salt_g: 4.5, water_ml: 3000 })
  })
  it('refuse vide, négatif, décimal en grammes et calories nulles', () => {
    const ok = goalToForm(DEFAULT_GOALS)
    expect(formToGoal({ ...ok, protein: '' })).toBeNull()
    expect(formToGoal({ ...ok, fat: '-3' })).toBeNull()
    expect(formToGoal({ ...ok, carbs: '12,5' })).toBeNull()
    expect(formToGoal({ ...ok, kcal: '0' })).toBeNull()
  })
})
