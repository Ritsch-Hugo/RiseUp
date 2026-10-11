import { KCAL_PER_G } from '../config'

/** Valeurs pour 100 g d'un aliment ; `kcal` null = à calculer depuis les macros. */
export type FoodValues = {
  kcal: number | null
  protein: number
  carbs: number
  sugars: number
  fat: number
  saturated_fat: number
  fiber: number
  salt: number
}

export type Nutrition = { [K in keyof FoodValues]: number }

const round2 = (n: number) => Math.round(n * 100) / 100

/** Calories de l'aliment pour 100 g : celles de l'étiquette, sinon P × 4 + G × 4 + L × 9. */
export function foodKcal(f: FoodValues): number {
  if (f.kcal !== null) return f.kcal
  return f.protein * KCAL_PER_G.protein + f.carbs * KCAL_PER_G.carbs + f.fat * KCAL_PER_G.fat
}

/** Valeurs pour une quantité en grammes (valeur pour 100 g × quantité / 100). */
export function nutritionFor(f: FoodValues, grams: number): Nutrition {
  const k = grams / 100
  return {
    kcal: round2(foodKcal(f) * k),
    protein: round2(f.protein * k),
    carbs: round2(f.carbs * k),
    sugars: round2(f.sugars * k),
    fat: round2(f.fat * k),
    saturated_fat: round2(f.saturated_fat * k),
    fiber: round2(f.fiber * k),
    salt: round2(f.salt * k),
  }
}

/** Nombre à la française, `max` décimales au plus : 3,6 · 31 · 0,13. */
export function formatAmount(n: number, max = 1): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: max })
}

type Serving = { serving_g: number | null; serving_label: string | null }

/** Ligne de liste : « 100 g · 165 kcal · P 31 · G 0 · L 3,6 » (ou pour une portion : « 1 moyenne · … »). */
export function foodSummary(f: FoodValues & Serving): string {
  const grams = f.serving_g ?? 100
  const label = f.serving_g ? (f.serving_label ?? `${formatAmount(f.serving_g)} g`) : '100 g'
  const n = nutritionFor(f, grams)
  return `${label} · ${formatAmount(n.kcal, 0)} kcal · P ${formatAmount(n.protein)} · G ${formatAmount(n.carbs)} · L ${formatAmount(n.fat)}`
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Recherche par nom et marque, sans accents ni casse ; tous les mots doivent être présents. */
export function searchFoods<T extends { name: string; brand: string | null }>(
  foods: T[],
  query: string
): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return foods
  return foods.filter((f) => {
    const text = normalize(`${f.name} ${f.brand ?? ''}`)
    return words.every((w) => text.includes(w))
  })
}

export type FoodForm = {
  name: string
  brand: string
  servingG: string
  servingLabel: string
  kcal: string
  protein: string
  carbs: string
  sugars: string
  fat: string
  saturatedFat: string
  fiber: string
  salt: string
  favorite: boolean
}

export const EMPTY_FOOD_FORM: FoodForm = {
  name: '',
  brand: '',
  servingG: '',
  servingLabel: '',
  kcal: '',
  protein: '',
  carbs: '',
  sugars: '',
  fat: '',
  saturatedFat: '',
  fiber: '',
  salt: '',
  favorite: false,
}

type FoodRow = FoodValues &
  Serving & {
    name: string
    brand: string | null
    is_favorite: boolean
  }

const fmt = (n: number) => String(n).replace('.', ',')

export function foodToForm(f: FoodRow): FoodForm {
  return {
    name: f.name,
    brand: f.brand ?? '',
    servingG: f.serving_g === null ? '' : fmt(f.serving_g),
    servingLabel: f.serving_label ?? '',
    kcal: f.kcal === null ? '' : fmt(f.kcal),
    protein: fmt(f.protein),
    carbs: fmt(f.carbs),
    sugars: fmt(f.sugars),
    fat: fmt(f.fat),
    saturatedFat: fmt(f.saturated_fat),
    fiber: fmt(f.fiber),
    salt: fmt(f.salt),
    favorite: f.is_favorite,
  }
}

/** Nombre ≥ 0 ; champ vide = `empty` ; texte invalide = undefined. */
function num(s: string, empty: number | null): number | null | undefined {
  const t = s.trim().replace(',', '.')
  if (t === '') return empty
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export type FoodFormResult =
  | { values: FoodValues & Serving & { name: string; brand: string | null; is_favorite: boolean } }
  | { error: string | null }

/** Valeurs prêtes à écrire, ou une erreur (null = formulaire pas encore complet, sans message). */
export function validateFoodForm(f: FoodForm): FoodFormResult {
  const name = f.name.trim()
  if (name === '') return { error: null }
  const kcal = num(f.kcal, null)
  const protein = num(f.protein, 0)
  const carbs = num(f.carbs, 0)
  const sugars = num(f.sugars, 0)
  const fat = num(f.fat, 0)
  const sat = num(f.saturatedFat, 0)
  const fiber = num(f.fiber, 0)
  const salt = num(f.salt, 0)
  const serving = num(f.servingG, null)
  const all = [kcal, protein, carbs, sugars, fat, sat, fiber, salt, serving]
  if (all.some((v) => v === undefined)) {
    return { error: 'Les valeurs doivent être des nombres positifs.' }
  }
  if (serving === 0) return { error: 'La portion doit être supérieure à 0 g.' }
  if (sugars! > carbs!) return { error: 'Les sucres ne peuvent pas dépasser les glucides.' }
  if (sat! > fat!) return { error: 'Les saturés ne peuvent pas dépasser les lipides.' }
  return {
    values: {
      name,
      brand: f.brand.trim() || null,
      kcal: kcal!,
      protein: protein!,
      carbs: carbs!,
      sugars: sugars!,
      fat: fat!,
      saturated_fat: sat!,
      fiber: fiber!,
      salt: salt!,
      serving_g: serving!,
      serving_label: serving !== null ? f.servingLabel.trim() || null : null,
      is_favorite: f.favorite,
    },
  }
}
