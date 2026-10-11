import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import type { MealSlot } from '../config'
import type { Food } from '../foods/foodQueries'
import { nutritionFor, type Nutrition } from '../rules/food'
import { rescaleEntry } from '../rules/journal'

export type JournalEntry = Tables<'nutri_entries'> & {
  food: { name: string; brand: string | null } | null
}

const entriesKey = (day: string) => ['nutri', 'entries', day]

/** Entrées d'un jour (aliments archivés inclus : le journal garde son historique). */
export function useEntries(day: string) {
  return useQuery({
    queryKey: entriesKey(day),
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await supabase
        .from('nutri_entries')
        .select('*, food:nutri_foods(name, brand)')
        .eq('day', day)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

/** Applique `change` au cache du jour tout de suite (mise à jour optimiste) et garde de quoi annuler. */
async function optimistic(
  queryClient: QueryClient,
  day: string,
  change: (entries: JournalEntry[]) => JournalEntry[]
) {
  const key = entriesKey(day)
  await queryClient.cancelQueries({ queryKey: key })
  const previous = queryClient.getQueryData<JournalEntry[]>(key)
  queryClient.setQueryData<JournalEntry[]>(key, (entries) => change(entries ?? []))
  return { key, previous }
}

type Context = Awaited<ReturnType<typeof optimistic>>

function useEntryMutation<TInput>(
  day: (input: TInput) => string,
  run: (input: TInput) => PromiseLike<{ error: unknown }>,
  change: (input: TInput) => (entries: JournalEntry[]) => JournalEntry[]
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => {
      const { error } = await run(input)
      if (error) throw error
    },
    onMutate: (input) => optimistic(queryClient, day(input), change(input)),
    onError: (_e, _i, context?: Context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['nutri', 'entries'] })
      queryClient.invalidateQueries({ queryKey: ['nutri', 'day-totals'] })
    },
  })
}

type AddInput = { day: string; slot: MealSlot; food: Food; grams: number }

/** Ajoute l'aliment au journal : les valeurs sont copiées pour la quantité. */
export function useAddEntry() {
  return useEntryMutation<AddInput & { id: string }>(
    (i) => i.day,
    (i) => {
      const n = nutritionFor(i.food, i.grams)
      return supabase.from('nutri_entries').insert({
        id: i.id,
        day: i.day,
        slot: i.slot,
        food_id: i.food.id,
        quantity_g: i.grams,
        ...n,
      })
    },
    (i) => (entries) => {
      const n = nutritionFor(i.food, i.grams)
      const now = new Date().toISOString()
      return [
        ...entries,
        {
          id: i.id,
          user_id: '',
          day: i.day,
          slot: i.slot,
          food_id: i.food.id,
          quantity_g: i.grams,
          from_meal_id: null,
          created_at: now,
          updated_at: now,
          ...n,
          food: { name: i.food.name, brand: i.food.brand },
        },
      ]
    }
  )
}

/** Change la quantité d'une entrée en gardant ses valeurs proportionnelles. */
export function useUpdateEntryQuantity() {
  return useEntryMutation<{ entry: JournalEntry; grams: number }>(
    (i) => i.entry.day,
    (i) => {
      const { quantity_g, kcal, protein, carbs, sugars, fat, saturated_fat, fiber, salt } =
        rescaleEntry(i.entry, i.grams)
      return supabase
        .from('nutri_entries')
        .update({ quantity_g, kcal, protein, carbs, sugars, fat, saturated_fat, fiber, salt })
        .eq('id', i.entry.id)
    },
    (i) => (entries) =>
      entries.map((e) => (e.id === i.entry.id ? { ...e, ...rescaleEntry(e, i.grams) } : e))
  )
}

export function useDeleteEntry() {
  return useEntryMutation<JournalEntry>(
    (e) => e.day,
    (e) => supabase.from('nutri_entries').delete().eq('id', e.id),
    (e) => (entries) => entries.filter((x) => x.id !== e.id)
  )
}

/** Entrée prête à insérer : valeurs déjà calculées (nouvel ajout) ou recopiées (copie d'un autre jour). */
export type EntryDraft = {
  id: string
  day: string
  slot: MealSlot
  food_id: string
  food: { name: string; brand: string | null } | null
  quantity_g: number
  from_meal_id: string | null
} & Nutrition

/** Insère plusieurs entrées d'un même jour d'un coup (repas enregistré, « Copier hier »). */
export function useInsertEntries() {
  return useEntryMutation<EntryDraft[]>(
    (drafts) => drafts[0]!.day,
    (drafts) =>
      supabase.from('nutri_entries').insert(
        drafts.map((d) => ({
          id: d.id,
          day: d.day,
          slot: d.slot,
          food_id: d.food_id,
          quantity_g: d.quantity_g,
          from_meal_id: d.from_meal_id,
          kcal: d.kcal,
          protein: d.protein,
          carbs: d.carbs,
          sugars: d.sugars,
          fat: d.fat,
          saturated_fat: d.saturated_fat,
          fiber: d.fiber,
          salt: d.salt,
        }))
      ),
    (drafts) => (entries) => {
      const now = new Date().toISOString()
      return [
        ...entries,
        ...drafts.map((d) => ({ ...d, user_id: '', created_at: now, updated_at: now })),
      ]
    }
  )
}
