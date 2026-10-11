import { describe, expect, it } from 'vitest'
import type { FoodValues } from './food'
import {
  defaultQuantity,
  mealSummary,
  mealTotals,
  parseQuantity,
  recentFoodIds,
  slotForMeal,
} from './meals'

const food = (kcal: number, protein: number, carbs: number, fat: number): FoodValues => ({
  kcal,
  protein,
  carbs,
  sugars: 0,
  fat,
  saturated_fat: 0,
  fiber: 0,
  salt: 0,
})

describe('mealTotals', () => {
  it('poulet 150 g + riz 200 g', () => {
    const n = mealTotals([
      { quantity_g: 150, food: food(165, 31, 0, 3.6) },
      { quantity_g: 200, food: food(130, 2.7, 28, 0.3) },
    ])
    expect(n.kcal).toBe(507.5)
    expect(n.protein).toBe(51.9)
    expect(mealSummary(n)).toBe('508 kcal · P 52 · G 56 · L 6')
  })
  it('repas vide → 0', () => expect(mealTotals([]).kcal).toBe(0))
})

describe('defaultQuantity', () => {
  it('portion sinon 100 g', () => {
    expect(defaultQuantity({ serving_g: 120 })).toBe(120)
    expect(defaultQuantity({ serving_g: null })).toBe(100)
  })
})

describe('parseQuantity', () => {
  it('nombre positif, virgule acceptée', () => {
    expect(parseQuantity('150')).toBe(150)
    expect(parseQuantity('0,5')).toBe(0.5)
    expect(parseQuantity('0')).toBeNull()
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity('x')).toBeNull()
  })
})

describe('recentFoodIds', () => {
  const entries = [
    { food_id: 'a', created_at: '2026-10-01T10:00:00Z' },
    { food_id: 'b', created_at: '2026-10-03T10:00:00Z' },
    { food_id: 'a', created_at: '2026-10-05T10:00:00Z' },
    { food_id: 'c', created_at: '2026-09-01T10:00:00Z' },
  ]
  it('plus récent d’abord, sans doublon, limité', () => {
    expect(recentFoodIds(entries, 10)).toEqual(['a', 'b', 'c'])
    expect(recentFoodIds(entries, 2)).toEqual(['a', 'b'])
  })
})

describe('slotForMeal', () => {
  it('créneau du journal prioritaire, puis habituel, puis proposé', () => {
    expect(slotForMeal('diner', 'dejeuner', true)).toBe('dejeuner')
    expect(slotForMeal('diner', 'dejeuner', false)).toBe('diner')
    expect(slotForMeal(null, 'dejeuner', false)).toBe('dejeuner')
  })
})
