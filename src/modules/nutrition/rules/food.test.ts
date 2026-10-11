import { describe, expect, it } from 'vitest'
import {
  EMPTY_FOOD_FORM,
  foodKcal,
  foodSummary,
  foodToForm,
  formatAmount,
  nutritionFor,
  searchFoods,
  validateFoodForm,
  type FoodValues,
} from './food'

const poulet: FoodValues = {
  kcal: 165,
  protein: 31,
  carbs: 0,
  sugars: 0,
  fat: 3.6,
  saturated_fat: 1,
  fiber: 0,
  salt: 0.13,
}

describe('nutritionFor', () => {
  it('valeur pour 100 g × quantité / 100 (150 g de poulet)', () => {
    expect(nutritionFor(poulet, 150)).toMatchObject({
      kcal: 247.5,
      protein: 46.5,
      fat: 5.4,
      saturated_fat: 1.5,
      salt: 0.2,
    })
  })
  it('0 g → tout à 0', () => expect(nutritionFor(poulet, 0).kcal).toBe(0))
})

describe('foodKcal', () => {
  it('kcal de l’étiquette si présentes', () => expect(foodKcal(poulet)).toBe(165))
  it('sinon P × 4 + G × 4 + L × 9', () => {
    expect(foodKcal({ ...poulet, kcal: null, protein: 10, carbs: 20, fat: 5 })).toBe(165)
  })
})

describe('formatAmount', () => {
  it('virgule française et décimales limitées', () => {
    expect(formatAmount(3.6)).toBe('3,6')
    expect(formatAmount(31)).toBe('31')
    expect(formatAmount(0.13, 2)).toBe('0,13')
    expect(formatAmount(247.5, 0)).toBe('248')
  })
})

describe('foodSummary', () => {
  it('pour 100 g', () => {
    expect(foodSummary({ ...poulet, serving_g: null, serving_label: null })).toBe(
      '100 g · 165 kcal · P 31 · G 0 · L 3,6'
    )
  })
  it('pour une portion nommée', () => {
    const banane = {
      ...poulet,
      kcal: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      serving_g: 118,
      serving_label: '1 moyenne',
    }
    expect(foodSummary(banane)).toBe('1 moyenne · 105 kcal · P 1,3 · G 27,1 · L 0,4')
  })
})

describe('searchFoods', () => {
  const foods = [
    { name: 'Blanc de poulet cuit', brand: null },
    { name: 'Skyr nature', brand: 'Danone' },
    { name: 'Crème', brand: null },
  ]
  it('sans accents ni casse, sur le nom et la marque', () => {
    expect(searchFoods(foods, 'creme')).toHaveLength(1)
    expect(searchFoods(foods, 'POULET cuit')).toHaveLength(1)
    expect(searchFoods(foods, 'danone')[0]!.name).toBe('Skyr nature')
  })
  it('requête vide → tout', () => expect(searchFoods(foods, '  ')).toHaveLength(3))
})

describe('validateFoodForm', () => {
  const form = {
    ...EMPTY_FOOD_FORM,
    name: ' Skyr ',
    protein: '11',
    carbs: '4',
    sugars: '4',
    fat: '0,2',
  }
  it('nom vide → incomplet sans message', () => {
    expect(validateFoodForm(EMPTY_FOOD_FORM)).toEqual({ error: null })
  })
  it('valeurs, virgule décimale, kcal vide = null', () => {
    const r = validateFoodForm(form)
    expect('values' in r && r.values).toMatchObject({
      name: 'Skyr',
      kcal: null,
      protein: 11,
      fat: 0.2,
      serving_g: null,
      serving_label: null,
      brand: null,
    })
  })
  it('libellé de portion gardé seulement avec une portion', () => {
    const r = validateFoodForm({ ...form, servingG: '150', servingLabel: '1 pot' })
    expect('values' in r && r.values).toMatchObject({ serving_g: 150, serving_label: '1 pot' })
    const r2 = validateFoodForm({ ...form, servingLabel: '1 pot' })
    expect('values' in r2 && r2.values.serving_label).toBeNull()
  })
  it('refuse négatif, texte, sucres > glucides, saturés > lipides, portion 0', () => {
    expect(validateFoodForm({ ...form, protein: '-2' })).toHaveProperty('error')
    expect(validateFoodForm({ ...form, fiber: 'abc' })).toHaveProperty('error')
    expect(validateFoodForm({ ...form, sugars: '5' })).toHaveProperty('error')
    expect(validateFoodForm({ ...form, saturatedFat: '1' })).toHaveProperty('error')
    expect(validateFoodForm({ ...form, servingG: '0' })).toHaveProperty('error')
  })
  it('aller-retour avec foodToForm', () => {
    const food = {
      ...poulet,
      name: 'Poulet',
      brand: 'X',
      serving_g: 120,
      serving_label: null,
      is_favorite: true,
    }
    const r = validateFoodForm(foodToForm(food))
    expect('values' in r && r.values).toEqual(food)
  })
})
