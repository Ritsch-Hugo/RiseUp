import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import {
  DEFAULT_REST_SECONDS,
  DEFAULT_TARGET_REPS_MAX,
  DEFAULT_TARGET_REPS_MIN,
  DEFAULT_TARGET_SETS,
} from '../config'
import type { Exercise } from '../queries'
import type { ProgramSession } from '../programs/programQueries'
import type { PrevSet, Row } from './rows'
import { toDbSet } from './rows'
import type { Tracking } from '../config'

export type WorkoutExercise = Tables<'muscu_workout_exercises'> & { sets: Tables<'muscu_sets'>[] }
export type OpenWorkout = Tables<'muscu_workouts'> & { exercises: WorkoutExercise[] }

export const OPEN_WORKOUT_KEY = ['muscu', 'workout', 'open']

/** La séance en cours (ended_at null), s'il y en a une : au plus une grâce à l'index unique. */
export function useOpenWorkout() {
  return useQuery({
    queryKey: OPEN_WORKOUT_KEY,
    queryFn: async (): Promise<OpenWorkout | null> => {
      const { data, error } = await supabase
        .from('muscu_workouts')
        .select('*, muscu_workout_exercises(*, muscu_sets(*))')
        .is('ended_at', null)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const { muscu_workout_exercises, ...workout } = data
      return {
        ...workout,
        exercises: muscu_workout_exercises
          .map(({ muscu_sets, ...we }) => ({ ...we, sets: muscu_sets }))
          .sort((a, b) => a.position - b.position),
      }
    },
    staleTime: 60_000,
  })
}

type StartInput = {
  name: string
  /** Séance type d'origine (null = séance libre). */
  session: ProgramSession | null
}

/** Lance une séance : copie les exercices et leurs objectifs depuis la séance type. */
export function useStartWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, session }: StartInput) => {
      const id = crypto.randomUUID()
      const { error } = await supabase
        .from('muscu_workouts')
        .insert({ id, name, session_id: session?.id ?? null })
      if (error) throw error
      if (session && session.exercises.length > 0) {
        const { error: e2 } = await supabase.from('muscu_workout_exercises').insert(
          session.exercises.map((se, position) => ({
            id: crypto.randomUUID(),
            workout_id: id,
            exercise_id: se.exercise_id,
            position,
            target_sets: se.target_sets,
            target_reps_min: se.target_reps_min,
            target_reps_max: se.target_reps_max,
            rest_seconds: se.rest_seconds,
          }))
        )
        if (e2) throw e2
      }
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: OPEN_WORKOUT_KEY }),
  })
}

/** Ajoute un exercice à la séance en cours, avec les objectifs par défaut. */
export function useAddWorkoutExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { workoutId: string; exercise: Exercise; position: number }) => {
      const timed = input.exercise.tracking === 'duree'
      const { error } = await supabase.from('muscu_workout_exercises').insert({
        id: crypto.randomUUID(),
        workout_id: input.workoutId,
        exercise_id: input.exercise.id,
        position: input.position,
        target_sets: DEFAULT_TARGET_SETS,
        target_reps_min: timed ? null : DEFAULT_TARGET_REPS_MIN,
        target_reps_max: timed ? null : DEFAULT_TARGET_REPS_MAX,
        rest_seconds: DEFAULT_REST_SECONDS,
      })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: OPEN_WORKOUT_KEY }),
  })
}

export function useFinishWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('muscu_workouts')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: OPEN_WORKOUT_KEY }),
  })
}

export function useAbandonWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('muscu_workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: OPEN_WORKOUT_KEY }),
  })
}

/** Écrit (ou met à jour) une série validée. */
export async function saveSet(
  workoutExerciseId: string,
  row: Row,
  position: number,
  tracking: Tracking
) {
  const { error } = await supabase.from('muscu_sets').upsert({
    id: row.id,
    workout_exercise_id: workoutExerciseId,
    position,
    ...toDbSet(row, tracking),
  })
  if (error) throw error
}

export async function deleteSet(id: string) {
  const { error } = await supabase.from('muscu_sets').delete().eq('id', id)
  if (error) throw error
}

/**
 * Séries de la dernière séance terminée, par exercice (échauffement exclu).
 * À remplacer par une vue SQL quand les règles métier arriveront (rien de dérivé côté client à terme).
 */
export function usePreviousPerformance(exerciseIds: string[]) {
  return useQuery({
    queryKey: ['muscu', 'previous', [...exerciseIds].sort().join(',')],
    enabled: exerciseIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, PrevSet[]>> => {
      const { data, error } = await supabase
        .from('muscu_workout_exercises')
        .select(
          'exercise_id, workout:muscu_workouts!inner(started_at, ended_at), sets:muscu_sets(position, weight_kg, reps, duration_seconds, is_warmup)'
        )
        .in('exercise_id', exerciseIds)
        .not('workout.ended_at', 'is', null)
      if (error) throw error
      const latest = new Map<string, { at: string; sets: PrevSet[] }>()
      for (const row of data) {
        const at = row.workout.started_at
        const current = latest.get(row.exercise_id)
        const sets = [...row.sets]
          .sort((a, b) => a.position - b.position)
          .filter((s) => !s.is_warmup)
        if (sets.length > 0 && (!current || at > current.at))
          latest.set(row.exercise_id, { at, sets })
      }
      return new Map([...latest].map(([id, v]) => [id, v.sets]))
    },
  })
}
