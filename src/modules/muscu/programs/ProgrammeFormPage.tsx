import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Icon, IconLink, Input, Sheet } from '../../../core/ui'
import { PROGRAM_DAYS_OPTIONS } from '../config'
import { LibraryState } from '../library/LibraryState'
import { useExercises } from '../queries'
import {
  useAddSession,
  useDeleteProgram,
  usePrograms,
  useUpdateProgram,
  type Program,
} from './programQueries'
import { formatTarget, nextPosition } from './programs'
import styles from './programs.module.css'

/** Édition d'un programme : chaque changement est enregistré tout de suite. */
export function ProgrammeFormPage() {
  const { id } = useParams()
  const { data: programs, isPending, isError } = usePrograms()
  const program = programs?.find((p) => p.id === id)

  if (programs && !program) return <Navigate to="/muscu/bibliotheque/programmes" replace />

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {program && <Form program={program} />}
    </LibraryState>
  )
}

function Form({ program }: { program: Program }) {
  const navigate = useNavigate()
  const { data: exercises } = useExercises()
  const update = useUpdateProgram()
  const addSession = useAddSession()
  const remove = useDeleteProgram()
  const [name, setName] = useState(program.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => setName(program.name), [program.name])

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed === '') return setName(program.name)
    if (trimmed !== program.name) update.mutate({ id: program.id, name: trimmed })
  }

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink
          to={`/muscu/bibliotheque/programmes/${program.id}`}
          icon="chevronLeft"
          label="Retour"
        />
        <h2 className={styles.titleText}>Modifier le programme</h2>
      </div>

      <Input
        label="Nom du programme"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
      />

      <fieldset className={styles.field}>
        <legend>Jours par semaine</legend>
        <div className={styles.days}>
          {PROGRAM_DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={program.days_per_week === d ? styles.dayOn : styles.day}
              aria-pressed={program.days_per_week === d}
              onClick={() => update.mutate({ id: program.id, days_per_week: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.sectionHeader}>
        <h2>Séances</h2>
        <span className={styles.meta}>
          {program.sessions.length} séance{program.sessions.length > 1 ? 's' : ''}
        </span>
      </div>

      {program.sessions.map((s, i) => (
        <div key={s.id} className={styles.sessionBox}>
          <div className={styles.cardText}>
            <span className={styles.tag}>SÉANCE {i + 1}</span>
            <span className={styles.cardTitle}>{s.name}</span>
          </div>
          {s.exercises.length === 0 ? (
            <span className={styles.meta}>Aucun exercice pour le moment</span>
          ) : (
            s.exercises.map((se, j) => (
              <div key={se.id} className={styles.line}>
                <span className={styles.index}>{j + 1}</span>
                <span className={styles.lineName}>
                  {exercises?.find((e) => e.id === se.exercise_id)?.name ?? 'Exercice archivé'}
                </span>
                <span className={styles.meta}>
                  {formatTarget(se.target_sets, se.target_reps_min, se.target_reps_max)}
                </span>
              </div>
            ))
          )}
          <Link
            to={`/muscu/bibliotheque/programmes/${program.id}/seance/${s.id}/modifier`}
            className={styles.link}
          >
            <Icon name="edit" size={16} />
            Modifier la séance
          </Link>
        </div>
      ))}

      <button
        type="button"
        className={styles.dashed}
        disabled={addSession.isPending}
        onClick={() =>
          addSession.mutate({
            programId: program.id,
            name: `Séance ${program.sessions.length + 1}`,
            position: nextPosition(program.sessions),
          })
        }
      >
        <Icon name="plus" size={18} />
        Ajouter une séance
      </button>

      <Button fullWidth onClick={() => navigate(`/muscu/bibliotheque/programmes/${program.id}`)}>
        Terminer
      </Button>
      <Button variant="danger" fullWidth onClick={() => setConfirmDelete(true)}>
        Supprimer le programme
      </Button>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce programme ?"
      >
        <p className={styles.meta}>
          Le programme et ses séances types sont supprimés. Tes séances déjà faites restent dans
          l’historique.
        </p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(program.id, {
                onSuccess: () => navigate('/muscu/bibliotheque/programmes', { replace: true }),
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </Sheet>
    </>
  )
}
