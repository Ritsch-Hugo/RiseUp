import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { IconLink } from '../../../core/ui'
import { MUSCLE_GROUPS } from '../config'
import { useExercises } from '../queries'
import { ExerciseCard } from './ExerciseCard'
import { LibraryState } from './LibraryState'
import { SearchField } from './SearchField'
import { searchExercises } from './searchExercises'
import styles from './library.module.css'

export function GroupePage() {
  const { group } = useParams()
  const current = MUSCLE_GROUPS.find((g) => g.key === group)
  const { data: exercises, isPending, isError } = useExercises()
  const [query, setQuery] = useState('')

  const inGroup = useMemo(
    () => (exercises ?? []).filter((e) => e.primary_group === current?.key),
    [exercises, current]
  )
  const results = useMemo(() => searchExercises(inGroup, query), [inGroup, query])

  if (!current) return <Navigate to="/muscu/bibliotheque" replace />

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink to="/muscu/bibliotheque" icon="chevronLeft" label="Retour aux groupes" />
        <h2 className={styles.pageTitle}>Exercices</h2>
      </div>
      <nav className={styles.carousel} aria-label="Groupes musculaires">
        {MUSCLE_GROUPS.map((g) => (
          <Link
            key={g.key}
            to={`/muscu/bibliotheque/${g.key}`}
            replace
            className={g.key === current.key ? styles.chipActive : styles.chip}
            aria-current={g.key === current.key ? 'page' : undefined}
          >
            <span className={styles.chipBadge}>{g.abbr}</span>
            <span className={styles.chipLabel}>{g.label}</span>
          </Link>
        ))}
      </nav>
      <SearchField value={query} onChange={setQuery} />
      <LibraryState isPending={isPending} isError={isError}>
        <div className={styles.groupHeader}>
          <h2>{current.label}</h2>
          <span className={styles.groupCount}>{inGroup.length} exercices</span>
        </div>
        {results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Aucun exercice trouvé.</p>
        )}
      </LibraryState>
    </>
  )
}
