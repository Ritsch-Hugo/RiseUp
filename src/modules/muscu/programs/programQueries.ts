import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables, type TablesUpdate } from '../../../core'
import {
  DEFAULT_PROGRAM_DAYS,
  DEFAULT_REST_SECONDS,
  DEFAULT_TARGET_REPS_MAX,
  DEFAULT_TARGET_REPS_MIN,
  DEFAULT_TARGET_SETS,
} from '../config'
import { nextPosition } from './programs'

export type SessionExercise = Tables<'muscu_session_exercises'>
export type ProgramSession = Tables<'muscu_program_sessions'> & {
  exercises: SessionExercise[]
}
export type Program = Tables<'muscu_programs'> & { sessions: ProgramSession[] }

const PROGRAMS_KEY = ['muscu', 'programs']
const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

/** Tous les programmes non archivés avec leurs séances et exercices (petit volume : un seul appel). */
export function usePrograms() {
  return useQuery({
    queryKey: PROGRAMS_KEY,
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from('muscu_programs')
        .select('*, muscu_program_sessions(*, muscu_session_exercises(*))')
        .is('archived_at', null)
      if (error) throw error
      return data
        .map(({ muscu_program_sessions, ...program }) => ({
          ...program,
          sessions: muscu_program_sessions
            .map(({ muscu_session_exercises, ...session }) => ({
              ...session,
              exercises: [...muscu_session_exercises].sort(byPosition),
            }))
            .sort(byPosition),
        }))
        .sort(byPosition)
    },
    staleTime: 5 * 60_000,
  })
}

/** Mutation qui relit les programmes ensuite (les volumes sont minuscules). */
function useProgramMutation<TInput>(fn: (input: TInput) => PromiseLike<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => {
      await fn(input)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY }),
  })
}

const check = ({ error }: { error: unknown }) => {
  if (error) throw error
}

/** Crée un programme avec une première séance et renvoie son id. */
export function useCreateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (programs: Program[]) => {
      const id = crypto.randomUUID()
      check(
        await supabase.from('muscu_programs').insert({
          id,
          name: 'Nouveau programme',
          days_per_week: DEFAULT_PROGRAM_DAYS,
          position: nextPosition(programs),
        })
      )
      check(
        await supabase
          .from('muscu_program_sessions')
          .insert({ id: crypto.randomUUID(), program_id: id, name: 'Séance 1', position: 0 })
      )
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY }),
  })
}

export const useUpdateProgram = () =>
  useProgramMutation(async ({ id, ...patch }: { id: string } & TablesUpdate<'muscu_programs'>) =>
    check(await supabase.from('muscu_programs').update(patch).eq('id', id))
  )

export const useDeleteProgram = () =>
  useProgramMutation(async (id: string) =>
    check(await supabase.from('muscu_programs').delete().eq('id', id))
  )

export const useAddSession = () =>
  useProgramMutation(async (s: { programId: string; name: string; position: number }) =>
    check(
      await supabase.from('muscu_program_sessions').insert({
        id: crypto.randomUUID(),
        program_id: s.programId,
        name: s.name,
        position: s.position,
      })
    )
  )

export const useUpdateSession = () =>
  useProgramMutation(
    async ({ id, ...patch }: { id: string } & TablesUpdate<'muscu_program_sessions'>) =>
      check(await supabase.from('muscu_program_sessions').update(patch).eq('id', id))
  )

export const useDeleteSession = () =>
  useProgramMutation(async (id: string) =>
    check(await supabase.from('muscu_program_sessions').delete().eq('id', id))
  )

export const useAddSessionExercise = () =>
  useProgramMutation(
    async (e: { sessionId: string; exerciseId: string; position: number; timed: boolean }) =>
      check(
        await supabase.from('muscu_session_exercises').insert({
          id: crypto.randomUUID(),
          session_id: e.sessionId,
          exercise_id: e.exerciseId,
          position: e.position,
          target_sets: DEFAULT_TARGET_SETS,
          target_reps_min: e.timed ? null : DEFAULT_TARGET_REPS_MIN,
          target_reps_max: e.timed ? null : DEFAULT_TARGET_REPS_MAX,
          rest_seconds: DEFAULT_REST_SECONDS,
        })
      )
  )

export const useUpdateSessionExercise = () =>
  useProgramMutation(
    async ({ id, ...patch }: { id: string } & TablesUpdate<'muscu_session_exercises'>) =>
      check(await supabase.from('muscu_session_exercises').update(patch).eq('id', id))
  )

export const useDeleteSessionExercise = () =>
  useProgramMutation(async (id: string) =>
    check(await supabase.from('muscu_session_exercises').delete().eq('id', id))
  )

/** Réécrit les positions 0..n-1 dans l'ordre donné (ids des exercices de la séance). */
export const useReorderSessionExercises = () =>
  useProgramMutation(async (orderedIds: string[]) => {
    const results = await Promise.all(
      orderedIds.map((id, position) =>
        supabase.from('muscu_session_exercises').update({ position }).eq('id', id)
      )
    )
    results.forEach(check)
  })
