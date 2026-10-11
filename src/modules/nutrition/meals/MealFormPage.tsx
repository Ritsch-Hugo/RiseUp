import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Button, Card, Icon, IconLink, Sheet } from '../../../core/ui'
import { MEAL_SLOTS, type MealSlot } from '../config'
import { useFoods, type Food } from '../foods/foodQueries'
import { useEntries } from '../journal/journalQueries'
import { formatAmount, nutritionFor, searchFoods } from '../rules/food'
import { isDay } from '../rules/journal'
import { defaultQuantity, mealSummary, mealTotals, parseQuantity } from '../rules/meals'
import { useDeleteMeal, useMeals, useSaveMeal, type Meal } from './mealQueries'
import styles from './meals.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

type Line = { key: string; food: Food; qty: string }

const newLine = (food: Food, qty: number): Line => ({
  key: crypto.randomUUID(),
  food,
  qty: formatAmount(qty, 2).replace(/\s/g, ''),
})

/** Création (`/repas/nouveau`, éventuellement depuis un créneau du journal) ou modification d'un repas. */
export function MealFormPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { data: foods, isPending: foodsPending } = useFoods()
  const { data: meals, isPending: mealsPending } = useMeals()
  const rawDay = params.get('jour')
  const fromDay = isDay(rawDay) ? rawDay : parisDay()
  const fromSlot = MEAL_SLOTS.find((s) => s.key === params.get('creneau'))?.key ?? null
  const entries = useEntries(fromDay)

  if (foodsPending || (id && mealsPending) || (!id && fromSlot && entries.isPending)) {
    return <ListSkeleton />
  }
  const existing = id ? meals?.find((m) => m.id === id) : undefined
  if (id && !existing) return <Navigate to="/nutrition/aliments" replace />

  const initial: Line[] = existing
    ? existing.items.map((i) => newLine(i.food, i.quantity_g))
    : fromSlot
      ? (entries.data ?? [])
          .filter((e) => e.slot === fromSlot)
          .flatMap((e) => {
            const food = foods?.find((f) => f.id === e.food_id)
            return food ? [newLine(food, e.quantity_g)] : []
          })
      : []

  return (
    <MealEditor
      existing={existing}
      initialLines={initial}
      initialSlot={existing?.default_slot ?? fromSlot}
      allFoods={foods ?? []}
    />
  )
}

function MealEditor({
  existing,
  initialLines,
  initialSlot,
  allFoods,
}: {
  existing: Meal | undefined
  initialLines: Line[]
  initialSlot: MealSlot | null
  allFoods: Food[]
}) {
  const navigate = useNavigate()
  const save = useSaveMeal()
  const remove = useDeleteMeal()
  const [name, setName] = useState(existing?.name ?? '')
  const [slot, setSlot] = useState<MealSlot | null>(initialSlot)
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [picking, setPicking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const quantities = lines.map((l) => parseQuantity(l.qty))
  const valid = name.trim() !== '' && lines.length > 0 && quantities.every((q) => q !== null)
  const totals = mealTotals(lines.map((l, i) => ({ food: l.food, quantity_g: quantities[i] ?? 0 })))

  const onSave = () => {
    if (!valid) return
    save.mutate(
      {
        existingId: existing?.id,
        name: name.trim(),
        defaultSlot: slot,
        items: lines.map((l, i) => ({ food_id: l.food.id, quantity_g: quantities[i]! })),
      },
      { onSuccess: () => navigate('/nutrition/aliments', { replace: true }) }
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <IconLink to="/nutrition/aliments" icon="chevronLeft" label="Retour" />
        <h2 className={styles.title}>{existing ? 'Modifier le repas' : 'Nouveau repas'}</h2>
      </div>

      <div className={styles.field}>
        <label htmlFor="meal-name">Nom du repas</label>
        <input
          id="meal-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Repas habituel (optionnel)</span>
        <div className={styles.pills} role="group" aria-label="Repas habituel">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={s.key === slot ? styles.pillOn : styles.pill}
              aria-pressed={s.key === slot}
              onClick={() => setSlot(s.key === slot ? null : s.key)}
            >
              {s.short}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.sectionHead}>
        <h3 className={styles.section}>Aliments</h3>
        <span className={styles.sub}>
          {lines.length} aliment{lines.length > 1 ? 's' : ''}
        </span>
      </div>

      {lines.length > 0 && (
        <div className={styles.lines}>
          {lines.map((l, i) => (
            <div key={l.key} className={styles.line}>
              <span className={styles.lineText}>
                <span className={styles.lineName}>{l.food.name}</span>
                <span className={styles.sub}>
                  {formatAmount(nutritionFor(l.food, quantities[i] ?? 0).kcal, 0)} kcal
                </span>
              </span>
              <label className={styles.qty}>
                <input
                  inputMode="decimal"
                  aria-label={`Quantité de ${l.food.name} en grammes`}
                  value={l.qty}
                  onChange={(e) =>
                    setLines((ls) =>
                      ls.map((x) => (x.key === l.key ? { ...x, qty: e.target.value } : x))
                    )
                  }
                />
                g
              </label>
              <button
                type="button"
                className={styles.removeButton}
                aria-label={`Retirer ${l.food.name}`}
                onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
              >
                <Icon name="plus" size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className={styles.addFood} onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} />
        Ajouter un aliment
      </button>

      <Card large>
        <div className={styles.totalLine}>
          <span className={styles.totalBig}>{formatAmount(totals.kcal, 0)}</span>
          <span className={styles.sub}>kcal au total</span>
        </div>
        <p className={styles.sub}>{mealSummary(totals)}</p>
        <p className={styles.sub}>
          Fibres {formatAmount(totals.fiber, 0)} g · Sucres {formatAmount(totals.sugars, 0)} g · Sel{' '}
          {formatAmount(totals.salt, 1)} g · calculé automatiquement
        </p>
      </Card>

      {save.isError && <p className={styles.error}>Impossible d’enregistrer le repas.</p>}
      <Button fullWidth disabled={!valid || save.isPending} onClick={onSave}>
        Enregistrer le repas
      </Button>
      {existing && (
        <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(true)}>
          Supprimer le repas
        </Button>
      )}

      <FoodPicker
        open={picking}
        foods={allFoods}
        onClose={() => setPicking(false)}
        onPick={(food) => {
          setLines((ls) => [...ls, newLine(food, defaultQuantity(food))])
          setPicking(false)
        }}
      />

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce repas ?"
      >
        <p className={styles.sub}>Les entrées déjà ajoutées à ton journal ne changent pas.</p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(existing!.id, {
                onSuccess: () => navigate('/nutrition/aliments', { replace: true }),
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function FoodPicker({
  open,
  foods,
  onClose,
  onPick,
}: {
  open: boolean
  foods: Food[]
  onClose: () => void
  onPick: (food: Food) => void
}) {
  const [query, setQuery] = useState('')
  const list = searchFoods(foods, query).slice(0, 50)
  return (
    <Sheet open={open} onClose={onClose} title="Ajouter un aliment">
      <input
        className={styles.input}
        type="search"
        placeholder="Rechercher un aliment"
        aria-label="Rechercher un aliment"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.pickerList}>
        {list.length === 0 && (
          <p className={styles.sub}>Aucun aliment. Crée-le d’abord dans l’onglet Aliments.</p>
        )}
        {list.map((f) => (
          <button key={f.id} type="button" className={styles.pickerItem} onClick={() => onPick(f)}>
            <span className={styles.lineName}>{f.name}</span>
            <span className={styles.sub}>{formatAmount(f.kcal ?? 0, 0)} kcal / 100 g</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
