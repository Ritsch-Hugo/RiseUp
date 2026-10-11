import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'

export type Reward = Tables<'taches_rewards'>

const REWARDS_KEY = ['taches', 'rewards']

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_KEY,
    queryFn: async (): Promise<Reward[]> => {
      const { data, error } = await supabase.from('taches_rewards').select('*').order('level')
      if (error) throw error
      return data
    },
  })
}

/** Crée (sans `id`) ou renomme une récompense ; le niveau d'une récompense existante ne change pas. */
export function useSaveReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, level, title }: { id?: string; level: number; title: string }) => {
      const { error } = id
        ? await supabase.from('taches_rewards').update({ title }).eq('id', id)
        : await supabase.from('taches_rewards').insert({ id: crypto.randomUUID(), level, title })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}

/** Marque la récompense comme prise (mise à jour immédiate). */
export function useClaimReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('taches_rewards')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: REWARDS_KEY })
      const previous = queryClient.getQueryData<Reward[]>(REWARDS_KEY)
      queryClient.setQueryData<Reward[]>(REWARDS_KEY, (rs) =>
        rs?.map((r) => (r.id === id ? { ...r, claimed_at: new Date().toISOString() } : r))
      )
      return { previous }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(REWARDS_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}

export function useDeleteReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('taches_rewards').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}
