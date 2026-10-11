import { EMPTY_FOOD_FORM, foodToForm, type FoodForm, type FoodValues } from './food'

/** Produit tel que renvoyé par Open Food Facts (recherche ou fiche produit) ; tout est optionnel. */
export type OffProduct = {
  code?: unknown
  product_name?: unknown
  brands?: unknown
  quantity?: unknown
  serving_quantity?: unknown
  nutriments?: Record<string, unknown>
}

export type OffFood = {
  barcode: string
  name: string
  brand: string | null
  /** Contenance du produit si connue (« 450 g »). */
  quantity: string | null
  values: FoodValues
  serving_g: number | null
}

const KJ_PER_KCAL = 4.184
const SALT_PER_SODIUM = 2.5

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined
}
const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** Code-barres valide : 8 à 14 chiffres. */
export const isBarcode = (s: string): boolean => /^\d{8,14}$/.test(s.trim())

/**
 * Convertit un produit OFF en aliment (valeurs pour 100 g). Renvoie null s'il n'a ni code ni valeurs
 * nutritionnelles exploitables. Les données OFF sont collaboratives : sucres et saturés sont plafonnés
 * aux glucides et aux lipides.
 */
export function offToFood(p: OffProduct): OffFood | null {
  const code = text(p.code) ?? (typeof p.code === 'number' ? String(p.code) : null)
  if (!code || !isBarcode(code)) return null
  const n = p.nutriments ?? {}

  const kj = num(n['energy-kj_100g'])
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / KJ_PER_KCAL : undefined)
  const protein = num(n['proteins_100g'])
  const carbs = num(n['carbohydrates_100g'])
  const fat = num(n['fat_100g'])
  if (kcal === undefined && protein === undefined && carbs === undefined && fat === undefined) {
    return null
  }

  const sodium = num(n['sodium_100g'])
  const salt = num(n['salt_100g']) ?? (sodium !== undefined ? sodium * SALT_PER_SODIUM : 0)
  const carbsG = carbs ?? 0
  const fatG = fat ?? 0
  const brands = Array.isArray(p.brands) ? p.brands.map(text).filter(Boolean) : [text(p.brands)]
  const brand = (brands[0] ?? '').split(',')[0]?.trim() || null
  const serving = num(p.serving_quantity)

  return {
    barcode: code,
    name: text(p.product_name) ?? 'Produit sans nom',
    brand,
    quantity: text(p.quantity),
    values: {
      kcal: kcal === undefined ? null : round(kcal, 1),
      protein: round(protein ?? 0),
      carbs: round(carbsG),
      sugars: round(Math.min(num(n['sugars_100g']) ?? 0, carbsG)),
      fat: round(fatG),
      saturated_fat: round(Math.min(num(n['saturated-fat_100g']) ?? 0, fatG)),
      fiber: round(num(n['fiber_100g']) ?? 0),
      salt: round(salt),
    },
    serving_g: serving && serving > 0 ? round(serving, 1) : null,
  }
}

/** Formulaire de création pré-rempli avec un produit OFF (l'utilisateur corrige avant d'enregistrer). */
export function offToForm(f: OffFood): FoodForm {
  return {
    ...EMPTY_FOOD_FORM,
    ...foodToForm({
      ...f.values,
      name: f.name,
      brand: f.brand,
      serving_g: f.serving_g,
      serving_label: null,
      is_favorite: false,
    }),
  }
}

/** Ligne prête à écrire dans nutri_foods pour un produit OFF (cache local de l'aliment). */
export function offToFoodRow(f: OffFood) {
  return {
    name: f.name,
    brand: f.brand,
    ...f.values,
    serving_g: f.serving_g,
    serving_label: null,
    is_favorite: false,
    source: 'off' as const,
    barcode: f.barcode,
  }
}
