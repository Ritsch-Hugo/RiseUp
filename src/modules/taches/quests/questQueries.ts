import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { parisDay, supabase, type Tables } from '../../../core'
import { isActiveQuest, periodStart, type QuestParams } from '../rules/quests'
import type { QuestKind, QuestPeriod } from '../config'
import { fetchActiveStreak, fetchTotalXp } from '../xp/xpLedger'
import { invalidateProgress } from '../xp/xpQueries'
import { fetchQuestContext, questOnlyAward, settleQuests } from './questAwards'

export type Quest = Tables<'taches_quests'>

const QUESTS_KEY = ['taches', 'quests']

/** Quêtes de la période en cours (jour et semaine). */
export function useQuests() {
  return useQuery({
    queryKey: [...QUESTS_KEY, 'list'],
    queryFn: async (): Promise<Quest[]> => {
      const today = parisDay()
      const { data, error } = await supabase
        .from('taches_quests')
        .select('*')
        .gte('period_start', periodStart('semaine', today))
        .order('created_at')
      if (error) throw error
      return data.filter((q) => isActiveQuest(q, today))
    },
  })
}

/** Tâches terminées et habitudes validées de la semaine, de quoi calculer toutes les progressions. */
export function useQuestContext() {
  return useQuery({
    queryKey: [...QUESTS_KEY, 'context'],
    queryFn: () => fetchQuestContext(periodStart('semaine', parisDay())),
  })
}

type NewQuest = {
  title: string
  period: QuestPeriod
  period_start: string
  kind: QuestKind
  params: QuestParams
  target: number
  bonus_xp: number
  recurring: boolean
}

/** Valide une quête gagnée par une action (nouvelle quête déjà atteinte, progression manuelle). */
async function settleWithAward(
  navigate: ReturnType<typeof useNavigate>,
  action: () => Promise<void>
) {
  const before = await fetchTotalXp()
  await action()
  const { gained } = await settleQuests(parisDay())
  if (gained.length > 0) {
    navigate('/taches/recompense', {
      state: { award: questOnlyAward(before, gained, await fetchActiveStreak(parisDay())) },
    })
  }
}

export function useCreateQuest() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (quest: NewQuest) => {
      await settleWithAward(navigate, async () => {
        const { error } = await supabase
          .from('taches_quests')
          .insert({ id: crypto.randomUUID(), ...quest })
        if (error) throw error
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_KEY })
      invalidateProgress(queryClient)
    },
  })
}

export function useDeleteQuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('taches_quests').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUESTS_KEY }),
  })
}

/** Fait avancer (ou reculer) une quête manuelle ; l'objectif atteint la valide. */
export function useSetManualProgress() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      await settleWithAward(navigate, async () => {
        const { error } = await supabase
          .from('taches_quests')
          .update({ manual_progress: Math.max(0, value) })
          .eq('id', id)
        if (error) throw error
      })
    },
    onMutate: async ({ id, value }) => {
      const key = [...QUESTS_KEY, 'list']
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Quest[]>(key)
      queryClient.setQueryData<Quest[]>(key, (qs) =>
        qs?.map((q) => (q.id === id ? { ...q, manual_progress: Math.max(0, value) } : q))
      )
      return { previous }
    },
    onError: (_e, _v, context) =>
      queryClient.setQueryData([...QUESTS_KEY, 'list'], context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_KEY })
      invalidateProgress(queryClient)
    },
  })
}
