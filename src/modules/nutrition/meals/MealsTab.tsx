import { Link, useNavigate } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Icon } from '../../../core/ui'
import { useAddContext } from '../foods/addContext'
import { useInsertEntries, type EntryDraft } from '../journal/journalQueries'
import { nutritionFor } from '../rules/food'
import { mealSummary, mealTotals, slotForMeal } from '../rules/meals'
import { useMeals, type Meal } from './mealQueries'
import styles from './meals.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

/** Onglet « Mes repas » de l'écran Aliments : créer, modifier, ajouter au journal en un tap. */
export function MealsTab() {
  const { data: meals, isPending, isError } = useMeals()
  const { day, slot, fromJournal } = useAddContext()
  const insert = useInsertEntries()
  const navigate = useNavigate()

  const addToJournal = (meal: Meal) => {
    const target = slotForMeal(meal.default_slot, slot, fromJournal)
    const drafts: EntryDraft[] = meal.items.map((i) => ({
      id: crypto.randomUUID(),
      day,
      slot: target,
      food_id: i.food_id,
      food: { name: i.food.name, brand: i.food.brand },
      quantity_g: i.quantity_g,
      from_meal_id: meal.id,
      ...nutritionFor(i.food, i.quantity_g),
    }))
    if (drafts.length === 0) return
    insert.mutate(drafts)
    navigate(day === parisDay() ? '/nutrition' : `/nutrition?jour=${day}`)
  }

  return (
    <>
      <Link to="/nutrition/repas/nouveau" className={styles.createButton}>
        <Icon name="plus" size={20} />
        Créer un repas
      </Link>
      <p className={styles.sub}>
        Un repas est un ensemble d’aliments enregistré, que tu ajoutes au journal en un tap.
      </p>
      {isPending && <ListSkeleton />}
      {isError && <p className={styles.state}>Impossible de charger les repas.</p>}
      {meals?.length === 0 && (
        <p className={styles.state}>Aucun repas enregistré pour l’instant.</p>
      )}
      {meals?.map((m) => (
        <div key={m.id} className={styles.mealCard}>
          <Link to={`/nutrition/repas/${m.id}`} className={styles.mealText}>
            <span className={styles.mealName}>{m.name}</span>
            <span className={styles.sub}>
              {mealSummary(
                mealTotals(m.items.map((i) => ({ food: i.food, quantity_g: i.quantity_g })))
              )}
            </span>
            <span className={styles.sub}>{m.items.map((i) => i.food.name).join(' · ')}</span>
          </Link>
          <button
            type="button"
            className={styles.mealAdd}
            aria-label={`Ajouter ${m.name} au journal`}
            onClick={() => addToJournal(m)}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      ))}
    </>
  )
}
