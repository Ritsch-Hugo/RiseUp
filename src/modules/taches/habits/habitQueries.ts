import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { addDays, supabase, type Tables } from '../../../core'
import { isDone, type LogMap } from '../rules/habits'
import { summarizeAward } from '../rules/xp'
import { awardHabit, revokeHabit } from '../xp/xpAwards'
import { invalidateProgress } from '../xp/xpQueries'

export type HabitPause = Tables<'taches_habit_pauses'>
export type Habit = Tables<'taches_habits'> & { pauses: HabitPause[] }
export type HabitLog = Pick<Tables<'taches_habit_logs'>, 'habit_id' | 'day' | 'value'>

const HABITS_KEY = ['taches', 'habits']
const LOGS_KEY = ['taches', 'habit-logs']

/** Toutes les habitudes (actives, en pause, archivées) avec leurs périodes de pause. */
export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await supabase
        .from('taches_habits')
        .select('*, pauses:taches_habit_pauses(*)')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

/** Valeurs enregistrées par jour pour toutes les habitudes (historique complet : une ligne par jour fait). */
export function useHabitLogs() {
  return useQuery({
    queryKey: LOGS_KEY,
    queryFn: async (): Promise<HabitLog[]> => {
      const { data, error } = await supabase
        .from('taches_habit_logs')
        .select('habit_id, day, value')
      if (error) throw error
      return data
    },
  })
}

/** Valeurs par jour d'une habitude. */
export function logMapFor(logs: HabitLog[], habitId: string): LogMap {
  return new Map(logs.filter((l) => l.habit_id === habitId).map((l) => [l.day, l.value]))
}

type HabitValues = Pick<
  Habit,
  'name' | 'weekdays' | 'moment' | 'type' | 'target' | 'unit' | 'difficulty' | 'reminder_time'
>

/** Crée l'habitude (sans `existingId`) ou la modifie ; renvoie son id. */
export function useSaveHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ existingId, values }: { existingId?: string; values: HabitValues }) => {
      if (existingId) {
        const { error } = await supabase.from('taches_habits').update(values).eq('id', existingId)
        if (error) throw error
        return existingId
      }
      const id = crypto.randomUUID()
      const { error } = await supabase.from('taches_habits').insert({ id, ...values })
      if (error) throw error
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: HABITS_KEY }),
  })
}

/** Archive / désarchive : l'historique est conservé. */
export function useArchiveHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('taches_habits')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: HABITS_KEY }),
  })
}

/** Met en pause à partir d'aujourd'hui (la série est gelée, pas perdue). */
export function usePauseHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ habitId, today }: { habitId: string; today: string }) => {
      const { error } = await supabase
        .from('taches_habit_pauses')
        .insert({ id: crypto.randomUUID(), habit_id: habitId, start_day: today })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: HABITS_KEY }),
  })
}

/**
 * Reprend l'habitude : la pause ouverte se termine hier. Une pause commencée aujourd'hui est
 * simplement supprimée (elle n'aurait couvert aucun jour).
 */
export function useResumeHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ habit, today }: { habit: Habit; today: string }) => {
      for (const p of habit.pauses.filter((x) => x.end_day === null || x.end_day >= today)) {
        const { error } =
          p.start_day >= today
            ? await supabase.from('taches_habit_pauses').delete().eq('id', p.id)
            : await supabase
                .from('taches_habit_pauses')
                .update({ end_day: addDays(today, -1) })
                .eq('id', p.id)
        if (error) throw error
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: HABITS_KEY }),
  })
}

/**
 * Enregistre la valeur du jour (cochée = 1, compteur = quantité) ; 0 efface la ligne. Mise à jour immédiate.
 * Valider l'habitude (objectif atteint) inscrit son XP ; la dé-valider l'annule. Un passage de niveau
 * ouvre l'écran de récompense.
 */
export function useSetHabitValue() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({
      habit,
      day,
      value,
      previous,
    }: {
      habit: Habit
      day: string
      value: number
      /** Valeur du jour avant ce changement. */
      previous: number
    }) => {
      if (value <= 0) {
        const { error } = await supabase
          .from('taches_habit_logs')
          .delete()
          .eq('habit_id', habit.id)
          .eq('day', day)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('taches_habit_logs')
          .upsert(
            { id: crypto.randomUUID(), habit_id: habit.id, day, value },
            { onConflict: 'habit_id,day' }
          )
        if (error) throw error
      }
      const wasDone = isDone(habit, previous)
      const nowDone = isDone(habit, value)
      if (!wasDone && nowDone) return awardHabit(habit, day)
      if (wasDone && !nowDone) await revokeHabit(habit, day)
      return null
    },
    onMutate: async ({ habit, day, value }) => {
      await queryClient.cancelQueries({ queryKey: LOGS_KEY })
      const previous = queryClient.getQueryData<HabitLog[]>(LOGS_KEY)
      queryClient.setQueryData<HabitLog[]>(LOGS_KEY, (logs = []) => {
        const rest = logs.filter((l) => !(l.habit_id === habit.id && l.day === day))
        return value > 0 ? [...rest, { habit_id: habit.id, day, value }] : rest
      })
      return { previous }
    },
    onSuccess: (award) => {
      if (award && (summarizeAward(award).levelUp || (award.badges?.length ?? 0) > 0))
        navigate('/taches/recompense', { state: { award } })
    },
    onError: (_e, _v, context) => queryClient.setQueryData(LOGS_KEY, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LOGS_KEY })
      invalidateProgress(queryClient)
    },
  })
}
