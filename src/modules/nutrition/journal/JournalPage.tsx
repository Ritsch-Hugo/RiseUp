import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDays, parisDay } from '../../../core'
import { Card, Icon } from '../../../core/ui'
import { MEAL_SLOTS } from '../config'
import { useGoalsForDay } from '../goals/goalsQueries'
import { formatAmount, type Nutrition } from '../rules/food'
import { dayLabel, isDay, sumNutrition } from '../rules/journal'
import { WaterCard } from '../water/WaterCard'
import { EntrySheet } from './EntrySheet'
import { useEntries, useInsertEntries, type EntryDraft, type JournalEntry } from './journalQueries'
import { Rings } from './Rings'
import styles from './journal.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

/** Journal d'un jour (`?jour=AAAA-MM-JJ`, aujourd'hui par défaut). */
export function JournalPage() {
  const [params, setParams] = useSearchParams()
  const today = parisDay()
  const raw = params.get('jour')
  const day = isDay(raw) && raw <= today ? raw : today
  const { data: entries, isPending, isError } = useEntries(day)
  const { data: goals } = useGoalsForDay(day)
  const yesterday = useEntries(addDays(day, -1))
  const insert = useInsertEntries()
  const [selected, setSelected] = useState<JournalEntry | null>(null)

  const go = (n: number) =>
    setParams(
      (p) => {
        const next = addDays(day, n)
        if (next === today) p.delete('jour')
        else p.set('jour', next)
        return p
      },
      { replace: true }
    )

  const total = sumNutrition(entries ?? [])
  const copyFromYesterday = (slot: string) => {
    const drafts: EntryDraft[] = (yesterday.data ?? [])
      .filter((e) => e.slot === slot)
      .map((e) => ({
        id: crypto.randomUUID(),
        day,
        slot: e.slot,
        food_id: e.food_id,
        food: e.food,
        quantity_g: e.quantity_g,
        from_meal_id: e.from_meal_id,
        kcal: e.kcal,
        protein: e.protein,
        carbs: e.carbs,
        sugars: e.sugars,
        fat: e.fat,
        saturated_fat: e.saturated_fat,
        fiber: e.fiber,
        salt: e.salt,
      }))
    if (drafts.length > 0) insert.mutate(drafts)
  }
  const addLink = (slot: string) => `/nutrition/aliments?creneau=${slot}&jour=${day}`

  return (
    <>
      <div className={styles.dayNav}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Jour précédent"
          onClick={() => go(-1)}
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <span className={styles.dayTitle}>{dayLabel(day, today, addDays(today, -1))}</span>
        <button
          type="button"
          className={styles.navButton}
          aria-label="Jour suivant"
          disabled={day >= today}
          onClick={() => go(1)}
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>

      {isPending && <ListSkeleton />}
      {isError && <p className={styles.state}>Impossible de charger le journal.</p>}

      {entries && goals && (
        <>
          <Card large>
            <Rings total={total} goals={goals} />
          </Card>

          <WaterCard day={day} goalMl={goals.water_ml} />

          {MEAL_SLOTS.map((slot) => {
            const items = entries.filter((e) => e.slot === slot.key)
            const kcal = sumNutrition(items).kcal
            return (
              <Card key={slot.key}>
                <div className={styles.slotHead}>
                  <div>
                    <h2 className={styles.slotTitle}>{slot.label}</h2>
                    <span className={styles.sub}>{formatAmount(kcal, 0)} kcal</span>
                  </div>
                  <Link
                    to={addLink(slot.key)}
                    className={styles.addButton}
                    aria-label={`Ajouter au ${slot.label.toLowerCase()}`}
                  >
                    <Icon name="plus" size={20} />
                  </Link>
                </div>
                {items.length === 0 && (
                  <div className={styles.emptyRow}>
                    <span className={styles.emptyText}>Rien d’enregistré pour l’instant</span>
                    <button
                      type="button"
                      className={styles.copyButton}
                      disabled={!(yesterday.data ?? []).some((e) => e.slot === slot.key)}
                      onClick={() => copyFromYesterday(slot.key)}
                    >
                      Copier hier
                    </button>
                  </div>
                )}
                {items.map((e) => (
                  <EntryRow key={e.id} entry={e} onSelect={() => setSelected(e)} />
                ))}
                {items.length > 0 && (
                  <Link
                    to={`/nutrition/repas/nouveau?jour=${day}&creneau=${slot.key}`}
                    className={styles.saveMeal}
                  >
                    <Icon name="save" size={18} />
                    Enregistrer comme repas
                  </Link>
                )}
              </Card>
            )
          })}
        </>
      )}

      <EntrySheet entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function EntryRow({ entry, onSelect }: { entry: JournalEntry; onSelect: () => void }) {
  const n: Nutrition = entry
  return (
    <button type="button" className={styles.entry} onClick={onSelect}>
      <span className={styles.entryText}>
        <span className={styles.entryName}>{entry.food?.name ?? 'Aliment supprimé'}</span>
        <span className={styles.sub}>{formatAmount(entry.quantity_g, 1)} g</span>
      </span>
      <span className={styles.entryKcal}>{formatAmount(n.kcal, 0)}</span>
    </button>
  )
}
