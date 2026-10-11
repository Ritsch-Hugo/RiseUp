import { describe, expect, it } from 'vitest'
import { isBarcode, offToFood, offToForm } from './off'

const skyr = {
  code: '3033490004743',
  product_name: 'Skyr',
  brands: ['Danone'],
  nutriments: {
    'energy-kcal_100g': 47.9,
    proteins_100g: 7.14,
    carbohydrates_100g: 2.79,
    sugars_100g: 2.79,
    fat_100g: 0.143,
    'saturated-fat_100g': 0.0714,
    salt_100g: 0.0643,
  },
}

describe('isBarcode', () => {
  it('8 à 14 chiffres', () => {
    expect(isBarcode('3033490004743')).toBe(true)
    expect(isBarcode(' 12345678 ')).toBe(true)
    expect(isBarcode('1234567')).toBe(false)
    expect(isBarcode('abc12345678')).toBe(false)
  })
})

describe('offToFood', () => {
  it('convertit un résultat de recherche (marques en liste)', () => {
    const f = offToFood(skyr)!
    expect(f).toMatchObject({
      barcode: '3033490004743',
      name: 'Skyr',
      brand: 'Danone',
      serving_g: null,
    })
    expect(f.values).toMatchObject({
      kcal: 47.9,
      protein: 7.14,
      carbs: 2.79,
      fat: 0.14,
      salt: 0.06,
    })
  })
  it('convertit une fiche produit (marques en texte, portion)', () => {
    const f = offToFood({
      ...skyr,
      brands: 'Nutella, Ferrero',
      quantity: '450 g',
      serving_quantity: '15',
    })!
    expect(f.brand).toBe('Nutella')
    expect(f.quantity).toBe('450 g')
    expect(f.serving_g).toBe(15)
  })
  it('kcal depuis les kJ si absentes', () => {
    const f = offToFood({
      code: '12345678',
      nutriments: { 'energy-kj_100g': 418.4, proteins_100g: 1 },
    })!
    expect(f.values.kcal).toBe(100)
  })
  it('sel depuis le sodium (× 2,5)', () => {
    const f = offToFood({ code: '12345678', nutriments: { proteins_100g: 1, sodium_100g: 0.4 } })!
    expect(f.values.salt).toBe(1)
  })
  it('plafonne sucres et saturés (données collaboratives)', () => {
    const f = offToFood({
      code: '12345678',
      nutriments: { carbohydrates_100g: 10, sugars_100g: 14, fat_100g: 5, 'saturated-fat_100g': 7 },
    })!
    expect(f.values.sugars).toBe(10)
    expect(f.values.saturated_fat).toBe(5)
  })
  it('null sans code valide ou sans valeurs', () => {
    expect(offToFood({ product_name: 'x', nutriments: { proteins_100g: 1 } })).toBeNull()
    expect(offToFood({ code: 'abc', nutriments: { proteins_100g: 1 } })).toBeNull()
    expect(offToFood({ code: '12345678', product_name: 'x', nutriments: {} })).toBeNull()
  })
  it('nom par défaut', () => {
    expect(offToFood({ code: '12345678', nutriments: { proteins_100g: 1 } })!.name).toBe(
      'Produit sans nom'
    )
  })
})

describe('offToForm', () => {
  it('pré-remplit le formulaire (virgule décimale)', () => {
    const form = offToForm(offToFood(skyr)!)
    expect(form).toMatchObject({
      name: 'Skyr',
      brand: 'Danone',
      kcal: '47,9',
      protein: '7,14',
      servingG: '',
    })
  })
})
