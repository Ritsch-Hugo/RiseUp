import { useMemo, useState } from 'react'
import { ListSkeleton } from '../../../core/ui/Skeleton'
import { Sheet } from '../../../core/ui'
import { MUSCLE_GROUPS } from '../config'
import { ExerciseImage } from '../library/ExerciseImage'
import { SearchField } from '../library/SearchField'
import { searchExercises } from '../library/searchExercises'
import { useExercises, type Exercise } from '../queries'
import styles from './programs.module.css'

type ExercisePickerProps = {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

/** Feuille de choix d'un exercice (recherche + liste). */
export function ExercisePicker({ open, onClose, onPick }: ExercisePickerProps) {
  const { data: exercises, isPending } = useExercises()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchExercises(exercises ?? [], query), [exercises, query])

  return (
    <Sheet open={open} onClose={onClose} title="Ajouter un exercice">
      <SearchField value={query} onChange={setQuery} />
      <div className={styles.pickerList}>
        {isPending && <ListSkeleton rows={3} />}
        {results.map((e) => (
          <button
            key={e.id}
            type="button"
            className={styles.pickerItem}
            onClick={() => {
              onPick(e)
              setQuery('')
              onClose()
            }}
          >
            <span className={styles.pickerThumb}>
              <ExerciseImage exercise={e} iconSize={20} />
            </span>
            <span className={styles.cardText}>
              <span className={styles.lineName}>{e.name}</span>
              <span className={styles.meta}>
                {MUSCLE_GROUPS.find((g) => g.key === e.primary_group)?.label}
              </span>
            </span>
          </button>
        ))}
        {!isPending && results.length === 0 && (
          <p className={styles.meta}>Aucun exercice trouvé.</p>
        )}
      </div>
    </Sheet>
  )
}
