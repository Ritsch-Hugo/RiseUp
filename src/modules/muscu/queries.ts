import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../core'
import { EXERCISE_IMAGES_BUCKET } from './config'
import { isUploadedImage, toExerciseValues, type ExerciseForm } from './library/exerciseForm'
import { resizeImage } from './library/resizeImage'

export type Exercise = Tables<'muscu_exercises'>

const EXERCISES_KEY = ['muscu', 'exercises']

/** Tous les exercices non archivés, triés par nom (≈250 lignes : filtrage côté client). */
export function useExercises() {
  return useQuery({
    queryKey: EXERCISES_KEY,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('muscu_exercises')
        .select('*')
        .is('archived_at', null)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}

/** URL signée (1 h) d'une photo perso du bucket privé. */
export function useSignedImageUrl(path: string | null) {
  return useQuery({
    queryKey: ['muscu', 'image', path],
    enabled: isUploadedImage(path),
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(EXERCISE_IMAGES_BUCKET)
        .createSignedUrl(path as string, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

type SaveExerciseInput = {
  /** Exercice modifié ; absent = création. */
  existing?: Exercise
  form: ExerciseForm
  /** Nouvelle photo choisie. */
  photo?: File
  removePhoto?: boolean
}

export function useSaveExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ existing, form, photo, removePhoto }: SaveExerciseInput) => {
      const values = toExerciseValues(form)
      if (!values) throw new Error('Le nom est obligatoire')
      const id = existing?.id ?? crypto.randomUUID()

      let image_path = existing?.image_path ?? null
      if (photo) {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Non connecté')
        const path = `${auth.user.id}/${id}-${Date.now()}.jpg`
        const { error } = await supabase.storage
          .from(EXERCISE_IMAGES_BUCKET)
          .upload(path, await resizeImage(photo), { contentType: 'image/jpeg' })
        if (error) throw error
        image_path = path
      } else if (removePhoto) {
        image_path = null
      }

      const row = { ...values, image_path }
      const query = existing
        ? supabase.from('muscu_exercises').update(row).eq('id', id)
        : supabase.from('muscu_exercises').insert({ ...row, id, is_custom: true })
      const { data, error } = await query.select().single()
      if (error) throw error

      // L'ancienne photo perso n'est plus référencée : on la supprime (sans bloquer en cas d'échec).
      const old = existing?.image_path ?? null
      if (old && isUploadedImage(old) && old !== image_path) {
        await supabase.storage.from(EXERCISE_IMAGES_BUCKET).remove([old])
      }
      return data
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Exercise[]>(EXERCISES_KEY, (list = []) =>
        [...list.filter((e) => e.id !== saved.id), saved].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr')
        )
      )
    },
  })
}

/** Archive (plutôt que supprime) : l'exercice reste lisible dans l'historique. */
export function useArchiveExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('muscu_exercises')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Exercise[]>(EXERCISES_KEY, (list = []) =>
        list.filter((e) => e.id !== id)
      )
    },
  })
}
