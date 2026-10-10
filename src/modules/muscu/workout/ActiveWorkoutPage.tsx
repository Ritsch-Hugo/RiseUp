import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Icon, IconButton, Sheet } from '../../../core/ui'
import type { Tracking } from '../config'
import { ExerciseImage } from '../library/ExerciseImage'
import { LibraryState } from '../library/LibraryState'
import { ExercisePicker } from '../programs/ExercisePicker'
import { useExercises, type Exercise } from '../queries'
import { workoutVolume } from '../rules/volume'
import { formatClock, formatLastTime, formatPrevious } from './format'
import { parseDecimal, type PrevSet, type Row } from './rows'
import { clearDraft, useWorkoutRows } from './useWorkoutRows'
import {
  OPEN_WORKOUT_KEY,
  useAbandonWorkout,
  useAddWorkoutExercise,
  useFinishWorkout,
  useOpenWorkout,
  usePreviousPerformance,
  type OpenWorkout,
  type WorkoutExercise,
} from './workoutQueries'
import styles from './workout.module.css'

/** Séance en cours : plein écran par-dessus l'onglet Muscu. */
export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const { data: workout, isPending, isError } = useOpenWorkout()
  const { data: exercises } = useExercises()
  const ids = useMemo(() => (workout?.exercises ?? []).map((we) => we.exercise_id), [workout])
  const previous = usePreviousPerformance(ids)

  useEffect(() => {
    if (workout === null) navigate('/muscu', { replace: true })
  }, [workout, navigate])

  const ready = !isPending && workout && exercises && (ids.length === 0 || !previous.isPending)

  return (
    <div className={styles.screen}>
      <div className={styles.handle} />
      {isError ? (
        <p className={styles.center}>Impossible de charger la séance.</p>
      ) : ready ? (
        <Workout workout={workout} exercises={exercises} previous={previous.data ?? new Map()} />
      ) : (
        <LibraryState isPending isError={false}>
          {null}
        </LibraryState>
      )}
    </div>
  )
}

type WorkoutProps = {
  workout: OpenWorkout
  exercises: Exercise[]
  previous: Map<string, PrevSet[]>
}

function Workout({ workout, exercises, previous }: WorkoutProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const finish = useFinishWorkout()
  const abandon = useAbandonWorkout()
  const addExercise = useAddWorkoutExercise()
  const [picking, setPicking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const trackingOf = useMemo(
    () =>
      (exerciseId: string): Tracking =>
        exerciseById.get(exerciseId)?.tracking ?? 'poids_reps',
    [exerciseById]
  )
  const { rows, patchRow, commit, toggleDone, addRow, syncError, dismissSyncError } =
    useWorkoutRows({
      workout,
      trackingOf,
      previous,
    })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // En quittant l'écran, on rafraîchit la séance en cours (barre réduite, reprise sur un autre appareil).
  useEffect(
    () => () => {
      void queryClient.invalidateQueries({ queryKey: OPEN_WORKOUT_KEY })
    },
    [queryClient]
  )

  const allRows = workout.exercises.flatMap((we) => rows[we.id] ?? [])
  const doneRows = allRows.filter((r) => r.done)
  const volume = workoutVolume(
    doneRows.map((r) => ({
      weight_kg: parseDecimal(r.weight) ?? 0,
      reps: parseDecimal(r.reps) ?? 0,
      is_warmup: r.warmup,
    }))
  )
  const firstOpen = workout.exercises.find((we) => (rows[we.id] ?? []).some((r) => !r.done))
  const [openId, setOpenId] = useState<string | null>(firstOpen?.id ?? null)

  const onFinish = () =>
    finish.mutate(workout.id, {
      onSuccess: () => {
        clearDraft(workout.id)
        navigate('/muscu', { replace: true })
      },
    })
  const onAbandon = () =>
    abandon.mutate(workout.id, {
      onSuccess: () => {
        clearDraft(workout.id)
        navigate('/muscu', { replace: true })
      },
    })

  return (
    <>
      <div className={styles.head}>
        <IconButton icon="arrowDown" label="Réduire la séance" onClick={() => navigate('/muscu')} />
        <div className={styles.headTitle}>
          <span className={styles.name}>{workout.name}</span>
          <span className={styles.sub}>Séance en cours</span>
        </div>
        <button type="button" className={styles.finish} onClick={() => setConfirming(true)}>
          Terminer
        </button>
      </div>

      <div className={styles.stats}>
        <div>
          <span className={styles.statAccent}>
            {formatClock((now - new Date(workout.started_at).getTime()) / 1000)}
          </span>
          <span className={styles.statLabel}>Durée</span>
        </div>
        <div>
          <span className={styles.statValue}>{Math.round(volume).toLocaleString('fr-FR')} kg</span>
          <span className={styles.statLabel}>Volume</span>
        </div>
        <div>
          <span className={styles.statValue}>
            {doneRows.length} / {allRows.length}
          </span>
          <span className={styles.statLabel}>Séries</span>
        </div>
      </div>

      {syncError && (
        <button type="button" className={styles.syncError} onClick={dismissSyncError}>
          Une série n’a pas pu être enregistrée (connexion ?). Elle reste dans ton brouillon.
          Toucher pour masquer.
        </button>
      )}

      <div className={styles.exercises}>
        {workout.exercises.map((we) => (
          <ExerciseBlock
            key={we.id}
            we={we}
            exercise={exerciseById.get(we.exercise_id)}
            rows={rows[we.id] ?? []}
            previous={previous.get(we.exercise_id) ?? []}
            open={openId === we.id}
            onToggleOpen={() => setOpenId(openId === we.id ? null : we.id)}
            onPatch={(rowId, patch) => patchRow(we.id, rowId, patch)}
            onCommit={(rowId, patch) => commit(we.id, rowId, patch)}
            onToggleDone={(rowId) => toggleDone(we.id, rowId)}
            onAddRow={() => addRow(we.id)}
          />
        ))}
        <button type="button" className={styles.dashed} onClick={() => setPicking(true)}>
          <Icon name="plus" size={18} />
          Ajouter un exercice
        </button>
      </div>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(e) =>
          addExercise.mutate(
            { workoutId: workout.id, exercise: e, position: workout.exercises.length },
            { onSuccess: () => undefined }
          )
        }
      />

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Terminer la séance ?">
        <p className={styles.sub}>
          {doneRows.length} série{doneRows.length > 1 ? 's' : ''} validée
          {doneRows.length > 1 ? 's' : ''} ·{' '}
          {formatClock((now - new Date(workout.started_at).getTime()) / 1000)}
        </p>
        <div className={styles.sheetActions}>
          <Button fullWidth onClick={onFinish} disabled={finish.isPending}>
            Terminer la séance
          </Button>
          <Button variant="danger" fullWidth onClick={onAbandon} disabled={abandon.isPending}>
            Abandonner (tout supprimer)
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
            Continuer la séance
          </Button>
        </div>
      </Sheet>
    </>
  )
}

type ExerciseBlockProps = {
  we: WorkoutExercise
  exercise: Exercise | undefined
  rows: Row[]
  previous: PrevSet[]
  open: boolean
  onToggleOpen: () => void
  onPatch: (rowId: string, patch: Partial<Row>) => void
  onCommit: (rowId: string, patch?: Partial<Row>) => void
  onToggleDone: (rowId: string) => void
  onAddRow: () => void
}

function ExerciseBlock({
  we,
  exercise,
  rows,
  previous,
  open,
  onToggleOpen,
  onPatch,
  onCommit,
  onToggleDone,
  onAddRow,
}: ExerciseBlockProps) {
  const tracking: Tracking = exercise?.tracking ?? 'poids_reps'
  const name = exercise?.name ?? 'Exercice archivé'
  const done = rows.filter((r) => r.done).length
  const gridClass = {
    poids_reps: styles.gridWeight,
    reps: styles.gridReps,
    duree: styles.gridTime,
  }[tracking]

  if (!open) {
    return (
      <button type="button" className={styles.collapsed} onClick={onToggleOpen}>
        <span className={styles.thumb}>
          {exercise && <ExerciseImage exercise={exercise} iconSize={18} />}
        </span>
        <span className={styles.collapsedText}>
          <span className={styles.collapsedName}>{name}</span>
          <span className={styles.sub}>
            {done} / {rows.length} séries
          </span>
        </span>
        <Icon name="chevronRight" size={18} />
      </button>
    )
  }

  const lastTime = formatLastTime(previous, tracking)
  return (
    <div className={styles.block}>
      <button type="button" className={styles.blockHead} onClick={onToggleOpen} aria-expanded>
        <span className={styles.thumbLarge}>
          {exercise && <ExerciseImage exercise={exercise} iconSize={20} />}
        </span>
        <span className={styles.collapsedText}>
          <span className={styles.blockName}>{name}</span>
          {lastTime && <span className={styles.sub}>Dernière fois : {lastTime}</span>}
        </span>
      </button>

      <div className={`${styles.gridRow} ${gridClass} ${styles.gridHeader}`}>
        <span>SÉR.</span>
        <span>PRÉC.</span>
        {tracking === 'poids_reps' && <span>KG</span>}
        {tracking !== 'duree' && <span>REPS</span>}
        {tracking === 'duree' && <span>SEC.</span>}
        <span>RPE</span>
        <span />
      </div>

      {rows.map((row, i) => (
        <div key={row.id} className={`${styles.gridRow} ${gridClass}`}>
          <button
            type="button"
            className={row.warmup ? styles.indexWarmup : styles.index}
            aria-label={
              row.warmup
                ? `Série ${i + 1} : échauffement (toucher pour retirer)`
                : `Série ${i + 1} (toucher pour marquer comme échauffement)`
            }
            onClick={() => {
              onPatch(row.id, { warmup: !row.warmup })
              onCommit(row.id, { warmup: !row.warmup })
            }}
          >
            {row.warmup ? 'É' : i + 1}
          </button>
          <span className={styles.prev}>
            {formatPrevious(previous[i] ?? previous[previous.length - 1], tracking)}
          </span>
          {tracking === 'poids_reps' && (
            <NumberInput
              label={`Poids série ${i + 1}`}
              value={row.weight}
              done={row.done}
              decimal
              onChange={(v) => onPatch(row.id, { weight: v })}
              onBlur={() => onCommit(row.id)}
            />
          )}
          {tracking !== 'duree' && (
            <NumberInput
              label={`Répétitions série ${i + 1}`}
              value={row.reps}
              done={row.done}
              onChange={(v) => onPatch(row.id, { reps: v })}
              onBlur={() => onCommit(row.id)}
            />
          )}
          {tracking === 'duree' && (
            <NumberInput
              label={`Secondes série ${i + 1}`}
              value={row.duration}
              done={row.done}
              onChange={(v) => onPatch(row.id, { duration: v })}
              onBlur={() => onCommit(row.id)}
            />
          )}
          <NumberInput
            label={`RPE série ${i + 1}`}
            value={row.rpe}
            done={row.done}
            decimal
            placeholder="–"
            onChange={(v) => onPatch(row.id, { rpe: v })}
            onBlur={() => onCommit(row.id)}
          />
          <button
            type="button"
            className={row.done ? styles.checkOn : styles.checkOff}
            aria-label={row.done ? `Annuler la série ${i + 1}` : `Valider la série ${i + 1}`}
            aria-pressed={row.done}
            onClick={() => onToggleDone(row.id)}
          >
            {row.done && <Icon name="check" size={20} strokeWidth={3} />}
          </button>
        </div>
      ))}

      <button type="button" className={styles.addSet} onClick={onAddRow}>
        <Icon name="plus" size={18} />
        Ajouter une série
      </button>
      {we.target_sets !== null && (
        <span className={styles.target}>
          Objectif : {we.target_sets} série{we.target_sets > 1 ? 's' : ''}
          {we.target_reps_min !== null &&
            ` · ${we.target_reps_min === we.target_reps_max ? we.target_reps_min : `${we.target_reps_min}-${we.target_reps_max}`} reps`}
        </span>
      )}
    </div>
  )
}

type NumberInputProps = {
  label: string
  value: string
  done: boolean
  decimal?: boolean
  placeholder?: string
  onChange: (value: string) => void
  onBlur: () => void
}

function NumberInput({
  label,
  value,
  done,
  decimal,
  placeholder,
  onChange,
  onBlur,
}: NumberInputProps) {
  return (
    <input
      className={done ? styles.inputDone : styles.input}
      aria-label={label}
      inputMode={decimal ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  )
}
