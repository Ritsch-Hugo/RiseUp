import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase, type Tables } from '../../../core'
import { COMPLETED_FETCH_HOURS } from '../config'
import { parisDay } from '../../../core'
import { nextOccurrence, parseRecurrence } from '../rules/tasks'
import { awardTask, revokeTask } from '../xp/xpAwards'
import { invalidateProgress } from '../xp/xpQueries'

export type Subtask = Tables<'taches_subtasks'>
export type Task = Tables<'taches_tasks'> & { subtasks: Subtask[] }
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
        .select('*, subtasks:taches_subtasks(*)')
        .is('archived_at', null)
        .or(`completed_at.is.null,completed_at.gte.${since}`)
      if (error) throw error
      return data.map((t) => ({
        ...t,
        subtasks: [...t.subtasks].sort((a, b) => a.position - b.position),
      }))
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
  'title' | 'category_id' | 'priority' | 'difficulty' | 'due_date' | 'due_time' | 'notes'
> & { recurrence: { type: 'daily' | 'weekly' } | null }

/** Crée la tâche (sans `existingId`) ou la modifie, puis aligne ses sous-tâches sur la liste donnée. */
export function useSaveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      existingId,
      values,
      subtasks,
    }: {
      existingId?: string
      values: TaskValues
      subtasks: { id: string; title: string }[]
    }) => {
      const id = existingId ?? crypto.randomUUID()
      if (existingId) {
        const { error } = await supabase.from('taches_tasks').update(values).eq('id', id)
        if (error) throw error
        const { data: current, error: readError } = await supabase
          .from('taches_subtasks')
          .select('id')
          .eq('task_id', id)
        if (readError) throw readError
        const keep = new Set(subtasks.map((s) => s.id))
        const removed = current.map((c) => c.id).filter((sid) => !keep.has(sid))
        if (removed.length > 0) {
          const { error: delError } = await supabase
            .from('taches_subtasks')
            .delete()
            .in('id', removed)
          if (delError) throw delError
        }
      } else {
        const { error } = await supabase.from('taches_tasks').insert({ id, ...values })
        if (error) throw error
      }
      if (subtasks.length > 0) {
        const { error } = await supabase.from('taches_subtasks').upsert(
          subtasks.map((s, position) => ({ id: s.id, task_id: id, title: s.title, position })),
          { onConflict: 'id' }
        )
        if (error) throw error
      }
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

/** Crée l'occurrence suivante d'une tâche récurrente qu'on vient de terminer (une seule fois). */
async function createNextOccurrence(task: Task) {
  const rec = parseRecurrence(task.recurrence)
  if (!rec) return
  const { data: existing, error: readError } = await supabase
    .from('taches_tasks')
    .select('id')
    .eq('recurred_from', task.id)
    .maybeSingle()
  if (readError) throw readError
  if (existing) return
  const today = parisDay()
  const id = crypto.randomUUID()
  const { error } = await supabase.from('taches_tasks').insert({
    id,
    title: task.title,
    category_id: task.category_id,
    priority: task.priority,
    difficulty: task.difficulty,
    due_date: nextOccurrence(rec, task.due_date ?? today, today),
    due_time: task.due_time,
    recurrence: task.recurrence,
    notes: task.notes,
    recurred_from: task.id,
  })
  if (error) throw error
  if (task.subtasks.length > 0) {
    const { error: subError } = await supabase.from('taches_subtasks').insert(
      task.subtasks.map((s, position) => ({
        id: crypto.randomUUID(),
        task_id: id,
        title: s.title,
        position,
      }))
    )
    if (subError) throw subError
  }
}

/**
 * Coche / décoche une tâche (mise à jour immédiate de la liste). Terminer une tâche inscrit son XP
 * (anti-triche appliqué) et ouvre l'écran de récompense ; la décocher annule l'XP. Terminer une tâche
 * récurrente crée l'occurrence suivante ; la décocher retire cette occurrence si elle n'a pas été touchée.
 */
export function useToggleTask() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({ task, done }: { task: Task; done: boolean }) => {
      const completedAt = new Date().toISOString()
      const { error } = await supabase
        .from('taches_tasks')
        .update({ completed_at: done ? completedAt : null })
        .eq('id', task.id)
      if (error) throw error
      if (done) {
        await createNextOccurrence(task)
        return awardTask(task, completedAt)
      }
      const { error: delError } = await supabase
        .from('taches_tasks')
        .delete()
        .eq('recurred_from', task.id)
        .is('completed_at', null)
      if (delError) throw delError
      await revokeTask(task)
      return null
    },
    onMutate: async ({ task, done }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
      queryClient.setQueryData<Task[]>(TASKS_KEY, (tasks) =>
        tasks?.map((t) =>
          t.id === task.id ? { ...t, completed_at: done ? new Date().toISOString() : null } : t
        )
      )
      return { previous }
    },
    onSuccess: (award) => {
      if (award) navigate('/taches/recompense', { state: { award } })
    },
    onError: (_e, _v, context) => queryClient.setQueryData(TASKS_KEY, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      invalidateProgress(queryClient)
    },
  })
}

/** Coche / décoche une sous-tâche (pas d'XP, sauf étapes de boss plus tard). */
export function useToggleSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('taches_subtasks')
        .update({ done_at: done ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY)
      queryClient.setQueryData<Task[]>(TASKS_KEY, (tasks) =>
        tasks?.map((t) => ({
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === id ? { ...s, done_at: done ? new Date().toISOString() : null } : s
          ),
        }))
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
