import { describe, expect, it } from 'vitest'
import { dayLabel, isDay, rescaleEntry, ringFraction, suggestSlot, sumNutrition } from './journal'

const e = (kcal: number, protein: number, extra = {}) => ({
  kcal,
  protein,
  carbs: 0,
  sugars: 0,
  fat: 0,
  saturated_fat: 0,
  fiber: 0,
  salt: 0,
  ...extra,
})

describe('sumNutrition', () => {
  it('additionne toutes les valeurs', () => {
    const t = sumNutrition([e(266, 9, { fiber: 7 }), e(130, 22), e(105, 1.3, { salt: 0.1 })])
    expect(t).toMatchObject({ kcal: 501, protein: 32.3, fiber: 7, salt: 0.1 })
  })
  it('liste vide → zéros', () => expect(sumNutrition([]).kcal).toBe(0))
})

describe('ringFraction', () => {
  it('proportion bornée à 1', () => {
    expect(ringFraction(1424, 2400)).toBeCloseTo(0.593, 3)
    expect(ringFraction(3000, 2400)).toBe(1)
  })
  it('0 sans objectif ou valeur négative', () => {
    expect(ringFraction(100, 0)).toBe(0)
    expect(ringFraction(-5, 100)).toBe(0)
  })
})

describe('rescaleEntry', () => {
  it('garde les valeurs d’origine, proportionnelles', () => {
    const r = rescaleEntry({ ...e(248, 46.5), quantity_g: 150 }, 100)
    expect(r).toMatchObject({ quantity_g: 100, kcal: 165.33, protein: 31 })
  })
})

describe('suggestSlot', () => {
  it('selon l’heure', () => {
    expect(suggestSlot(8)).toBe('petit_dej')
    expect(suggestSlot(12)).toBe('dejeuner')
    expect(suggestSlot(16)).toBe('collation')
    expect(suggestSlot(20)).toBe('diner')
  })
})

describe('dayLabel', () => {
  it('aujourd’hui, hier, autre jour', () => {
    expect(dayLabel('2026-10-06', '2026-10-06', '2026-10-05')).toBe('Aujourd’hui · mar. 6 oct.')
    expect(dayLabel('2026-10-05', '2026-10-06', '2026-10-05')).toBe('Hier · lun. 5 oct.')
    expect(dayLabel('2026-10-03', '2026-10-06', '2026-10-05')).toBe('sam. 3 oct.')
  })
})

describe('isDay', () => {
  it('valide le format', () => {
    expect(isDay('2026-10-06')).toBe(true)
    expect(isDay('hier')).toBe(false)
    expect(isDay(null)).toBe(false)
  })
})
