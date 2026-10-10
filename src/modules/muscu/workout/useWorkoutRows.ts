import { useCallback, useEffect, useRef, useState } from 'react'
import type { Tracking } from '../config'
import { deleteSet, saveSet, type OpenWorkout } from './workoutQueries'
import { canValidate, plannedRow, reconcileRows, type PrevSet, type Row } from './rows'

type RowsByExercise = Record<string, Row[]>

const draftKey = (workoutId: string) => `riseup:muscu:draft:${workoutId}`

function loadDraft(workoutId: string): RowsByExercise | null {
  try {
    const raw = localStorage.getItem(draftKey(workoutId))
    return raw ? (JSON.parse(raw) as RowsByExercise) : null
  } catch {
    return null
  }
}

function saveDraft(workoutId: string, rows: RowsByExercise) {
  try {
    localStorage.setItem(draftKey(workoutId), JSON.stringify(rows))
  } catch {
    // stockage indisponible : la base reste la source de vérité des séries validées
  }
}

export function clearDraft(workoutId: string) {
  try {
    localStorage.removeItem(draftKey(workoutId))
  } catch {
    // rien à nettoyer
  }
}

type Args = {
  workout: OpenWorkout
  trackingOf: (exerciseId: string) => Tracking
  previous: Map<string, PrevSet[]>
}

/**
 * Lignes de séries de la séance en cours. L'état local est la source de vérité de l'écran ;
 * chaque série validée est envoyée en base, le reste vit dans un brouillon local.
 */
export function useWorkoutRows({ workout, trackingOf, previous }: Args) {
  const [rows, setRows] = useState<RowsByExercise>(() => {
    const draft = loadDraft(workout.id)
    const result: RowsByExercise = {}
    for (const we of workout.exercises) {
      result[we.id] = reconcileRows({
        dbSets: we.sets,
        draft: draft?.[we.id] ?? null,
        targetSets: we.target_sets,
        previous: previous.get(we.exercise_id) ?? [],
        newId: () => crypto.randomUUID(),
      })
    }
    return result
  })
  const [syncError, setSyncError] = useState(false)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  useEffect(() => saveDraft(workout.id, rows), [workout.id, rows])

  // Exercice ajouté en cours de séance : on lui crée ses lignes prévues.
  useEffect(() => {
    const missing = workout.exercises.filter((we) => !rowsRef.current[we.id])
    if (missing.length === 0) return
    setRows((current) => {
      const next = { ...current }
      for (const we of missing) {
        next[we.id] = reconcileRows({
          dbSets: we.sets,
          draft: null,
          targetSets: we.target_sets,
          previous: previous.get(we.exercise_id) ?? [],
          newId: () => crypto.randomUUID(),
        })
      }
      return next
    })
  }, [workout.exercises, previous])

  const exerciseOf = useCallback(
    (weId: string) => workout.exercises.find((we) => we.id === weId),
    [workout.exercises]
  )

  const patchRow = useCallback((weId: string, rowId: string, patch: Partial<Row>) => {
    setRows((cur) => ({
      ...cur,
      [weId]: (cur[weId] ?? []).map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    }))
  }, [])

  /** Envoie la ligne en base si elle est déjà validée (appelé quand on quitte un champ). */
  const commit = useCallback(
    (weId: string, rowId: string, patch?: Partial<Row>) => {
      const we = exerciseOf(weId)
      const list = rowsRef.current[weId] ?? []
      const index = list.findIndex((r) => r.id === rowId)
      const current = list[index]
      if (!we || !current || !current.done) return
      saveSet(weId, { ...current, ...patch }, index, trackingOf(we.exercise_id)).catch(() =>
        setSyncError(true)
      )
    },
    [exerciseOf, trackingOf]
  )

  const toggleDone = useCallback(
    (weId: string, rowId: string) => {
      const we = exerciseOf(weId)
      const list = rowsRef.current[weId] ?? []
      const index = list.findIndex((r) => r.id === rowId)
      const row = list[index]
      if (!we || !row) return
      const tracking = trackingOf(we.exercise_id)
      if (row.done) {
        patchRow(weId, rowId, { done: false })
        deleteSet(rowId).catch(() => setSyncError(true))
        return
      }
      if (!canValidate(row, tracking)) return
      patchRow(weId, rowId, { done: true })
      saveSet(weId, { ...row, done: true }, index, tracking).catch(() => {
        patchRow(weId, rowId, { done: false })
        setSyncError(true)
      })
    },
    [exerciseOf, patchRow, trackingOf]
  )

  const addRow = useCallback(
    (weId: string) => {
      const we = exerciseOf(weId)
      const list = rowsRef.current[weId] ?? []
      const last = list[list.length - 1]
      const prev = previous.get(we?.exercise_id ?? '')?.[list.length]
      const base = plannedRow(crypto.randomUUID(), prev)
      // Une série ajoutée reprend la charge de la dernière ligne si rien n'est prévu.
      const row = prev || !last ? base : { ...base, weight: last.weight, reps: last.reps }
      setRows((cur) => ({ ...cur, [weId]: [...(cur[weId] ?? []), row] }))
    },
    [exerciseOf, previous]
  )

  return {
    rows,
    patchRow,
    commit,
    toggleDone,
    addRow,
    syncError,
    dismissSyncError: () => setSyncError(false),
  }
}
