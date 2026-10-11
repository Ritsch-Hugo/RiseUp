import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Card, Icon, IconLink } from '../../../core/ui'
import { DEFAULT_QUANTITY_G, PORTION_STEP, QUANTITY_STEP_G } from '../config'
import { useCurrentGoals } from '../goals/goalsQueries'
import { formatAmount, nutritionFor } from '../rules/food'
import { useFoods, useToggleFavorite, type Food } from './foodQueries'
import styles from './foods.module.css'

export function FoodPage() {
  const { id } = useParams()
  const { data: foods, isPending, isError } = useFoods()
  const food = foods?.find((f) => f.id === id)
  if (isPending) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger l’aliment.</p>
  if (!food) return <Navigate to="/nutrition/aliments" replace />
  return <FoodSheet food={food} />
}

const MACROS = [
  { key: 'protein', goal: 'protein_g', label: 'Protéines', color: 'var(--macro-protein)' },
  { key: 'carbs', goal: 'carbs_g', label: 'Glucides', color: 'var(--macro-carbs)' },
  { key: 'fat', goal: 'fat_g', label: 'Lipides', color: 'var(--macro-fat)' },
] as const

function FoodSheet({ food }: { food: Food }) {
  const { data: goals } = useCurrentGoals()
  const favorite = useToggleFavorite()
  const hasPortion = food.serving_g !== null
  const [unit, setUnit] = useState<'g' | 'portion'>('g')
  const [amount, setAmount] = useState(String(DEFAULT_QUANTITY_G))

  const parsed = Number(amount.replace(',', '.'))
  const valid = amount.trim() !== '' && Number.isFinite(parsed) && parsed >= 0
  const grams = valid ? (unit === 'g' ? parsed : parsed * (food.serving_g ?? 0)) : 0
  const n = nutritionFor(food, grams)
  const per100 = nutritionFor(food, 100)

  const step = (dir: 1 | -1) => {
    const s = unit === 'g' ? QUANTITY_STEP_G : PORTION_STEP
    setAmount(formatAmount(Math.max(0, (valid ? parsed : 0) + dir * s), 2).replace(/\s/g, ''))
  }
  const switchUnit = (next: 'g' | 'portion') => {
    if (next === unit) return
    setUnit(next)
    setAmount(next === 'g' ? String(DEFAULT_QUANTITY_G) : '1')
  }

  const rows: {
    label: string
    sub?: boolean
    value: number
    per: number
    unit: string
    digits?: number
  }[] = [
    { label: 'Calories', value: n.kcal, per: per100.kcal, unit: 'kcal', digits: 0 },
    { label: 'Protéines', value: n.protein, per: per100.protein, unit: 'g' },
    { label: 'Glucides', value: n.carbs, per: per100.carbs, unit: 'g' },
    { label: 'dont sucres', sub: true, value: n.sugars, per: per100.sugars, unit: 'g' },
    { label: 'Lipides', value: n.fat, per: per100.fat, unit: 'g' },
    {
      label: 'dont saturés',
      sub: true,
      value: n.saturated_fat,
      per: per100.saturated_fat,
      unit: 'g',
    },
    { label: 'Fibres', value: n.fiber, per: per100.fiber, unit: 'g' },
    { label: 'Sel', value: n.salt, per: per100.salt, unit: 'g', digits: 2 },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <IconLink to="/nutrition/aliments" icon="chevronLeft" label="Retour" />
        <h2 className={styles.title}>{food.name}</h2>
        <button
          type="button"
          className={food.is_favorite ? styles.starOn : styles.star}
          aria-label={food.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={food.is_favorite}
          onClick={() => favorite.mutate({ id: food.id, favorite: !food.is_favorite })}
        >
          <Icon name="star" size={22} />
        </button>
        <IconLink to={`/nutrition/aliments/${food.id}/modifier`} icon="edit" label="Modifier" />
      </div>
      {food.brand && <p className={styles.help}>{food.brand}</p>}

      <Card>
        <label htmlFor="quantity" className={styles.label}>
          Quantité
        </label>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Diminuer"
            onClick={() => step(-1)}
          >
            −
          </button>
          <div className={styles.stepValue}>
            <input
              id="quantity"
              className={styles.stepInput}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className={styles.unit}>{unit === 'g' ? 'g' : 'portion'}</span>
          </div>
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Augmenter"
            onClick={() => step(1)}
          >
            +
          </button>
        </div>
        {hasPortion && (
          <div className={styles.pills}>
            <button
              type="button"
              className={unit === 'g' ? styles.pillOn : styles.pill}
              onClick={() => switchUnit('g')}
            >
              grammes
            </button>
            <button
              type="button"
              className={unit === 'portion' ? styles.pillOn : styles.pill}
              onClick={() => switchUnit('portion')}
            >
              1 portion ({food.serving_label ? `${food.serving_label}, ` : ''}
              {formatAmount(food.serving_g!)} g)
            </button>
          </div>
        )}
      </Card>

      <Card>
        <div className={styles.kcalLine}>
          <span className={styles.kcalBig}>{formatAmount(n.kcal, 0)}</span>
          <span className={styles.sub}>kcal pour {formatAmount(grams)} g</span>
        </div>
        {MACROS.map((m) => {
          const goal = goals?.[m.goal] ?? 0
          const pct = goal > 0 ? Math.round((n[m.key] / goal) * 100) : 0
          return (
            <div key={m.key} className={styles.macro}>
              <div className={styles.macroHead}>
                <span className={styles.macroName}>{m.label}</span>
                <span className={styles.sub}>
                  {formatAmount(n[m.key])} g{goal > 0 ? ` · ${pct} % de ton objectif` : ''}
                </span>
              </div>
              <div className={styles.track}>
                <div style={{ width: `${Math.min(100, pct)}%`, background: m.color }} />
              </div>
            </div>
          )
        })}
      </Card>

      <Card>
        <div className={styles.tableHead}>
          <h3 className={styles.cardTitle}>Valeurs nutritionnelles</h3>
          <span className={styles.colNow}>{formatAmount(grams)} g</span>
          <span className={styles.colRef}>100 g</span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className={r.sub ? styles.rowSub : styles.row}>
            <span className={styles.rowLabel}>{r.label}</span>
            <span className={styles.colNow}>
              {formatAmount(r.value, r.digits ?? 1)} {r.unit}
            </span>
            <span className={styles.colRef}>
              {r.unit === 'kcal'
                ? formatAmount(r.per, 0)
                : `${formatAmount(r.per, r.digits ?? 1)} g`}
            </span>
          </div>
        ))}
        {food.source === 'off' && <p className={styles.help}>Données : Open Food Facts</p>}
      </Card>

      <p className={styles.help}>
        L’ajout au journal arrive à l’étape suivante.{' '}
        <Link to="/nutrition/aliments/nouveau">Créer un autre aliment</Link>
      </p>
    </div>
  )
}
