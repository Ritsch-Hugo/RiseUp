import { useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Icon, IconLink, Input, Sheet } from '../../../core/ui'
import { EQUIPMENTS, MUSCLE_GROUPS, TRACKINGS, type MuscleGroup } from '../config'
import { useArchiveExercise, useExercises, useSaveExercise, type Exercise } from '../queries'
import { ExerciseImage } from './ExerciseImage'
import { toExerciseValues, type ExerciseForm } from './exerciseForm'
import { LibraryState } from './LibraryState'
import styles from './form.module.css'

function initialForm(existing: Exercise | undefined, group: string | null): ExerciseForm {
  if (existing) {
    return {
      name: existing.name,
      primary: existing.primary_group,
      secondary: existing.secondary_groups,
      equipment: existing.equipment,
      tracking: existing.tracking,
      instructions: existing.instructions ?? '',
    }
  }
  const preset = MUSCLE_GROUPS.find((g) => g.key === group)
  return {
    name: '',
    primary: preset?.key ?? 'pecs',
    secondary: [],
    equipment: null,
    tracking: 'poids_reps',
    instructions: '',
  }
}

/** Création (/nouveau) et modification (/exercice/:id/modifier) d'un exercice. */
export function ExerciceFormPage() {
  const { id } = useParams()
  const { data: exercises, isPending, isError } = useExercises()
  const existing = id ? exercises?.find((e) => e.id === id) : undefined

  if (id && exercises && !existing) return <Navigate to="/muscu/bibliotheque" replace />

  return (
    <LibraryState isPending={isPending} isError={isError}>
      <Form existing={existing} />
    </LibraryState>
  )
}

function Form({ existing }: { existing?: Exercise }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState(() => initialForm(existing, params.get('groupe')))
  const [photo, setPhoto] = useState<File | undefined>()
  const [removePhoto, setRemovePhoto] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const save = useSaveExercise()
  const archive = useArchiveExercise()

  const patch = (p: Partial<ExerciseForm>) => setForm((f) => ({ ...f, ...p }))
  const toggleSecondary = (g: MuscleGroup) =>
    patch({
      secondary: form.secondary.includes(g)
        ? form.secondary.filter((x) => x !== g)
        : [...form.secondary, g],
    })

  const previewUrl = photo ? URL.createObjectURL(photo) : null
  const hasPhoto = photo || (existing?.image_path && !removePhoto)
  const back = existing
    ? `/muscu/bibliotheque/exercice/${existing.id}`
    : `/muscu/bibliotheque/${params.get('groupe') ?? ''}`

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!toExerciseValues(form)) return
    save.mutate(
      { existing, form, photo, removePhoto },
      {
        onSuccess: (saved) =>
          navigate(`/muscu/bibliotheque/exercice/${saved.id}`, { replace: true }),
      }
    )
  }

  const onArchive = () => {
    if (!existing) return
    archive.mutate(existing.id, {
      onSuccess: () => navigate(`/muscu/bibliotheque/${existing.primary_group}`, { replace: true }),
    })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.titleRow}>
        <IconLink to={back} icon="chevronLeft" label="Retour" />
        <h2 className={styles.title}>{existing ? 'Modifier l’exercice' : 'Nouvel exercice'}</h2>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          setPhoto(e.target.files?.[0])
          setRemovePhoto(false)
        }}
      />
      {hasPhoto ? (
        <div className={styles.photo}>
          {previewUrl ? (
            <img src={previewUrl} alt="" />
          ) : (
            existing && <ExerciseImage exercise={existing} iconSize={64} />
          )}
          <div className={styles.photoActions}>
            <Button variant="secondary" onClick={() => fileInput.current?.click()}>
              Changer
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPhoto(undefined)
                setRemovePhoto(true)
              }}
            >
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.addPhoto}
          onClick={() => fileInput.current?.click()}
        >
          <Icon name="image" size={32} />
          <span className={styles.addPhotoTitle}>Ajouter une image</span>
          <span className={styles.hint}>Optionnel · photo ou capture</span>
        </button>
      )}

      <Input
        label="Nom de l’exercice"
        value={form.name}
        onChange={(e) => patch({ name: e.target.value })}
        required
        maxLength={80}
      />

      <fieldset className={styles.field}>
        <legend>Groupe musculaire principal</legend>
        <div className={styles.pills}>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={form.primary === g.key ? styles.pillOn : styles.pill}
              aria-pressed={form.primary === g.key}
              onClick={() => patch({ primary: g.key })}
            >
              {g.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.field}>
        <legend>Muscles secondaires (optionnel)</legend>
        <div className={styles.pills}>
          {MUSCLE_GROUPS.filter((g) => g.key !== form.primary).map((g) => (
            <button
              key={g.key}
              type="button"
              className={form.secondary.includes(g.key) ? styles.pillOn : styles.pill}
              aria-pressed={form.secondary.includes(g.key)}
              onClick={() => toggleSecondary(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.field}>
        <legend>Équipement</legend>
        <div className={styles.pills}>
          {EQUIPMENTS.map((q) => (
            <button
              key={q.key}
              type="button"
              className={form.equipment === q.key ? styles.pillOn : styles.pill}
              aria-pressed={form.equipment === q.key}
              onClick={() => patch({ equipment: form.equipment === q.key ? null : q.key })}
            >
              {q.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.field}>
        <legend>Ce que tu suis</legend>
        <div className={styles.segmented}>
          {TRACKINGS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={form.tracking === t.key ? styles.segOn : styles.seg}
              aria-pressed={form.tracking === t.key}
              onClick={() => patch({ tracking: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="instructions">Consignes / notes (optionnel)</label>
        <textarea
          id="instructions"
          className={styles.textarea}
          placeholder="Omoplates serrées, pieds ancrés au sol…"
          value={form.instructions}
          onChange={(e) => patch({ instructions: e.target.value })}
        />
      </div>

      {(save.isError || archive.isError) && (
        <p className={styles.error} role="alert">
          Échec de l’enregistrement. Réessaie.
        </p>
      )}

      <Button type="submit" fullWidth disabled={save.isPending || form.name.trim() === ''}>
        {save.isPending ? 'Enregistrement…' : 'Enregistrer l’exercice'}
      </Button>

      {existing && (
        <Button variant="danger" fullWidth onClick={() => setConfirmArchive(true)}>
          Archiver l’exercice
        </Button>
      )}

      <Sheet
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archiver cet exercice ?"
      >
        <p className={styles.hint}>
          Il disparaît de la bibliothèque mais reste visible dans l’historique de tes séances.
        </p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmArchive(false)}>
            Annuler
          </Button>
          <Button variant="danger" fullWidth onClick={onArchive} disabled={archive.isPending}>
            Archiver
          </Button>
        </div>
      </Sheet>
    </form>
  )
}
