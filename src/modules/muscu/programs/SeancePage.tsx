import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Icon, IconButton, IconLink, Input } from '../../../core/ui'
import { ExerciseImage } from '../library/ExerciseImage'
import { LibraryState } from '../library/LibraryState'
import { useExercises, type Exercise } from '../queries'
import { ExercisePicker } from './ExercisePicker'
import {
  useAddSessionExercise,
  useDeleteSession,
  useDeleteSessionExercise,
  usePrograms,
  useReorderSessionExercises,
  useUpdateSession,
  useUpdateSessionExercise,
  type ProgramSession,
  type SessionExercise,
} from './programQueries'
import { formatRepsRange, formatTarget, moveItem, nextPosition, parseRepsRange } from './programs'
import styles from './programs.module.css'

/** Édition d'une séance type : nom, exercices, séries / reps / repos. Enregistrement immédiat. */
export function SeancePage() {
  const { id, sessionId } = useParams()
  const { data: programs, isPending, isError } = usePrograms()
  const program = programs?.find((p) => p.id === id)
  const session = program?.sessions.find((s) => s.id === sessionId)

  if (programs && !session) return <Navigate to="/muscu/bibliotheque/programmes" replace />

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {program && session && <Form programId={program.id} session={session} />}
    </LibraryState>
  )
}

function Form({ programId, session }: { programId: string; session: ProgramSession }) {
  const navigate = useNavigate()
  const { data: exercises } = useExercises()
  const updateSession = useUpdateSession()
  const deleteSession = useDeleteSession()
  const addExercise = useAddSessionExercise()
  const reorder = useReorderSessionExercises()
  const [name, setName] = useState(session.name)
  const [picking, setPicking] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => setName(session.name), [session.name])

  const back = `/muscu/bibliotheque/programmes/${programId}`
  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed === '') return setName(session.name)
    if (trimmed !== session.name) updateSession.mutate({ id: session.id, name: trimmed })
  }
  const move = (index: number, dir: -1 | 1) =>
    reorder.mutate(moveItem(session.exercises, index, dir).map((e) => e.id))

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink to={back} icon="chevronLeft" label="Retour au programme" />
        <h2 className={styles.titleText}>Modifier la séance</h2>
      </div>

      <Input
        label="Nom de la séance"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
      />

      <div className={styles.sectionHeader}>
        <h2>Exercices</h2>
        <span className={styles.meta}>
          {session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.list}>
        {session.exercises.map((se, i) => (
          <ExerciseRow
            key={se.id}
            item={se}
            exercise={exercises?.find((e) => e.id === se.exercise_id)}
            open={openId === se.id}
            onToggle={() => setOpenId(openId === se.id ? null : se.id)}
            canUp={i > 0}
            canDown={i < session.exercises.length - 1}
            onMove={(dir) => move(i, dir)}
          />
        ))}
      </div>

      <button type="button" className={styles.dashed} onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} />
        Ajouter un exercice
      </button>

      <Button fullWidth onClick={() => navigate(back)}>
        Terminer
      </Button>
      <Button
        variant="danger"
        fullWidth
        disabled={deleteSession.isPending}
        onClick={() =>
          deleteSession.mutate(session.id, { onSuccess: () => navigate(back, { replace: true }) })
        }
      >
        Supprimer la séance
      </Button>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(e: Exercise) =>
          addExercise.mutate({
            sessionId: session.id,
            exerciseId: e.id,
            position: nextPosition(session.exercises),
            timed: e.tracking === 'duree',
          })
        }
      />
    </>
  )
}

type ExerciseRowProps = {
  item: SessionExercise
  exercise: Exercise | undefined
  open: boolean
  onToggle: () => void
  canUp: boolean
  canDown: boolean
  onMove: (dir: -1 | 1) => void
}

function ExerciseRow({ item, exercise, open, onToggle, canUp, canDown, onMove }: ExerciseRowProps) {
  const update = useUpdateSessionExercise()
  const remove = useDeleteSessionExercise()
  const timed = exercise?.tracking === 'duree'
  const [sets, setSets] = useState(String(item.target_sets ?? ''))
  const [reps, setReps] = useState(formatRepsRange(item.target_reps_min, item.target_reps_max))
  const [rest, setRest] = useState(String(item.rest_seconds ?? ''))

  const commitSets = () => {
    const n = Number(sets)
    if (Number.isInteger(n) && n >= 1 && n !== item.target_sets)
      update.mutate({ id: item.id, target_sets: n })
    else setSets(String(item.target_sets ?? ''))
  }
  const commitReps = () => {
    const range = parseRepsRange(reps)
    if (range)
      update.mutate({ id: item.id, target_reps_min: range.min, target_reps_max: range.max })
    else setReps(formatRepsRange(item.target_reps_min, item.target_reps_max))
  }
  const commitRest = () => {
    const n = Number(rest)
    if (Number.isInteger(n) && n >= 0 && n !== item.rest_seconds)
      update.mutate({ id: item.id, rest_seconds: n })
    else setRest(String(item.rest_seconds ?? ''))
  }

  return (
    <div className={styles.exerciseRow}>
      <div className={styles.exerciseHead}>
        <button
          type="button"
          className={styles.exerciseMain}
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className={styles.rowThumb}>
            {exercise && <ExerciseImage exercise={exercise} iconSize={22} />}
          </span>
          <span className={styles.cardText}>
            <span className={styles.lineName}>{exercise?.name ?? 'Exercice archivé'}</span>
            <span className={styles.meta}>
              {formatTarget(item.target_sets, item.target_reps_min, item.target_reps_max)}
              {item.rest_seconds !== null && ` · repos ${item.rest_seconds} s`}
            </span>
          </span>
        </button>
        <IconButton
          icon="trash"
          label={`Supprimer ${exercise?.name ?? 'l’exercice'}`}
          onClick={() => remove.mutate(item.id)}
        />
      </div>
      {open && (
        <div className={styles.fields}>
          <label className={styles.numField}>
            <span>Séries</span>
            <input
              inputMode="numeric"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              onBlur={commitSets}
            />
          </label>
          {!timed && (
            <label className={styles.numField}>
              <span>Reps</span>
              <input
                inputMode="numeric"
                placeholder="6-8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onBlur={commitReps}
              />
            </label>
          )}
          <label className={styles.numField}>
            <span>Repos (s)</span>
            <input
              inputMode="numeric"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              onBlur={commitRest}
            />
          </label>
          <div className={styles.moveButtons}>
            <IconButton
              icon="arrowUp"
              label="Monter"
              disabled={!canUp}
              onClick={() => onMove(-1)}
            />
            <IconButton
              icon="arrowDown"
              label="Descendre"
              disabled={!canDown}
              onClick={() => onMove(1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
