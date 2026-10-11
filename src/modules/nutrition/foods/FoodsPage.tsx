import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, Icon } from '../../../core/ui'
import { MEAL_SLOTS, RECENT_FOODS_SHOWN } from '../config'
import { OnlineSearch } from '../off/OnlineSearch'
import { MealsTab } from '../meals/MealsTab'
import { recentFoodIds } from '../rules/meals'
import { foodSummary, searchFoods } from '../rules/food'
import { useAddContext } from './addContext'
import { useFoods, useRecentEntries } from './foodQueries'
import styles from './foods.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

const FILTERS = [
  { key: 'recents', label: 'Récents' },
  { key: 'favorites', label: 'Favoris' },
  { key: 'mine', label: 'Mes aliments' },
  { key: 'meals', label: 'Mes repas' },
] as const

/** Onglet Aliments : mes aliments et favoris, recherche locale. (Récents, repas et Open Food Facts viennent ensuite.) */
export function FoodsPage() {
  const { data, isPending, isError } = useFoods()
  const { slot, setSlot, fromJournal } = useAddContext()
  const { search } = useLocation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('recents')

  const recent = useRecentEntries()
  const recentIds = recentFoodIds(recent.data ?? [], RECENT_FOODS_SHOWN)
  const base =
    filter === 'recents'
      ? recentIds.flatMap((id) => data?.find((f) => f.id === id) ?? [])
      : (data ?? []).filter((f) => filter === 'mine' || f.is_favorite)
  const foods = searchFoods(base, query)
  const isMeals = filter === 'meals'

  return (
    <>
      {fromJournal && (
        <div className={styles.pills} role="group" aria-label="Repas">
          {MEAL_SLOTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={s.key === slot ? styles.pillOn : styles.pill}
              aria-pressed={s.key === slot}
              onClick={() => setSlot(s.key)}
            >
              {s.short}
            </button>
          ))}
        </div>
      )}

      {!isMeals && (
        <div className={styles.searchRow}>
          <div className={styles.search}>
            <Icon name="search" size={20} />
            <label htmlFor="food-search" className={styles.srOnly}>
              Rechercher un aliment
            </label>
            <input
              id="food-search"
              type="search"
              placeholder="Rechercher un aliment"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Link
            to={{ pathname: '/nutrition/scan', search }}
            className={styles.scanButton}
            aria-label="Scanner un code-barres"
          >
            <Icon name="scan" size={24} />
          </Link>
        </div>
      )}

      <div className={styles.segmented} role="group" aria-label="Liste">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={f.key === filter ? styles.segOn : styles.seg}
            aria-pressed={f.key === filter}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isMeals ? (
        <MealsTab />
      ) : (
        <>
          {isPending && <ListSkeleton />}
          {isError && <p className={styles.state}>Impossible de charger les aliments.</p>}
          {data && foods.length === 0 && (
            <p className={styles.state}>
              {query
                ? 'Aucun aliment ne correspond.'
                : filter === 'favorites'
                  ? 'Aucun favori pour l’instant.'
                  : filter === 'recents'
                    ? 'Ce que tu ajoutes au journal apparaît ici.'
                    : 'Aucun aliment pour l’instant.'}
            </p>
          )}
          {foods.length > 0 && (
            <div className={styles.list}>
              {foods.map((f) => (
                <Link
                  key={f.id}
                  to={{ pathname: `/nutrition/aliments/${f.id}`, search }}
                  className={styles.item}
                >
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>
                      {f.name}
                      {f.brand ? ` · ${f.brand}` : ''}
                    </span>
                    <span className={styles.sub}>{foodSummary(f)}</span>
                  </span>
                  <Icon name="chevronRight" size={18} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {!isMeals && <OnlineSearch key={query.trim()} query={query} />}

      <Card>
        <h2 className={styles.cardTitle}>Tu ne trouves pas ton aliment ?</h2>
        <p className={styles.help}>
          La recherche en ligne (Open Food Facts) arrive bientôt. Tu peux déjà créer l’aliment
          toi-même.
        </p>
        <Link to="/nutrition/aliments/nouveau" className={styles.createLink}>
          <Icon name="plus" size={18} />
          Créer un aliment
        </Link>
      </Card>
    </>
  )
}
