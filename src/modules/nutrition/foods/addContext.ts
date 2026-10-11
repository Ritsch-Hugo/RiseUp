import { useSearchParams } from 'react-router-dom'
import { parisDay } from '../../../core'
import type { MealSlot } from '../config'
import { MEAL_SLOTS } from '../config'
import { isDay, suggestSlot } from '../rules/journal'

/**
 * Contexte d'ajout au journal, porté par l'URL (`?jour=…&creneau=…`) : le journal l'ouvre depuis le « + »
 * d'un créneau. Sans paramètres, on ajoute aujourd'hui, au créneau qui correspond à l'heure.
 */
export function useAddContext() {
  const [params, setParams] = useSearchParams()
  const rawDay = params.get('jour')
  const rawSlot = params.get('creneau')
  const day = isDay(rawDay) ? rawDay : parisDay()
  const slot: MealSlot =
    MEAL_SLOTS.find((s) => s.key === rawSlot)?.key ??
    suggestSlot(
      Number(
        new Intl.DateTimeFormat('fr-FR', {
          hour: 'numeric',
          hourCycle: 'h23',
          timeZone: 'Europe/Paris',
        }).format(new Date())
      )
    )
  const setSlot = (next: MealSlot) =>
    setParams(
      (p) => {
        p.set('creneau', next)
        if (isDay(rawDay)) p.set('jour', rawDay)
        return p
      },
      { replace: true }
    )
  return { day, slot, setSlot, fromJournal: rawSlot !== null }
}
