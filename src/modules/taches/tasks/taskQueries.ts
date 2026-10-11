import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import { COMPLETED_FETCH_HOURS } from '../config'

export type Task = Tables<'taches_tasks'>
export type Category = Tables<'taches_categories'>

const TASKS_KEY = ['taches', 'tasks']
const CATEGORIES_KEY = ['taches', 'categories']

/** Tâches non terminées + celles terminées récemment (pour la liste « Terminées » du jour). */
export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async (): Promise<Task[]> => {
      const since = new Date(Date.now() - COMPLETED_FETCH_HOURS * 3600 * 1000).toISOString()
      const { data, error } = await supabase
        .from('taches_tasks')
        .select('*')
        .is('archived_at', null)
        .or(`completed_at.is.null,completed_at.gte.${since}`)
      if (error) throw error
      return data
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('taches_categories')
        .select('*')
        .order('position')
        .order('created_at')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, position }: { id: string; name: string; position: number }) => {
      const { error } = await supabase.from('taches_categories').insert({ id, name, position })
      if (error) throw error
    },
    onMutate: async (cat) => {
      await queryClient.cancelQueries({ queryKey: CATEGORIES_KEY })
      const previous = queryClient.getQueryData<Category[]>(CATEGORIES_KEY)
      const now = new Date().toISOString()
      queryClient.setQueryData<Category[]>(CATEGORIES_KEY, (cats) => [
        ...(cats ?? []),
        { ...cat, user_id: '', color: null, created_at: now, updated_at: now },
      ])
      return { previous }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(CATEGORIES_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

type TaskValues = Pick<
  Task,
  'title' | 'category_id' | 'priority' | 'difficulty' | 'due_date' | 'due_time'
>

/** Crée la tâche (sans `existingId`) ou la modifie. */
export function useSaveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ existingId, values }: { existingId?: string; values: TaskValues }) => {
      if (existingId) {
        const { error } = await supabase.from('taches_tasks').update(values).eq('id', existingId)
        if (error) throw error
        return existingId
      }
      const id = crypto.randomUUID()
      const { error } = await supabase.from('taches_tasks').insert({ id, ...values })
      if (error) throw error
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

/** Coche / décoche une tâche, avec mise à jour immédiate de la liste. */
export function useToggleTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('taches_tasks')
        .update({ completed_at: done ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
      queryClient.setQueryData<Task[]>(TASKS_KEY, (tasks) =>
        tasks?.map((t) =>
          t.id === id ? { ...t, completed_at: done ? new Date().toISOString() : null } : t
        )
      )
      return { previous }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(TASKS_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('taches_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}
