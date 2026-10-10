import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { MUSCLE_GROUPS } from '../config'
import { useExercises } from '../queries'
import { ExerciseCard } from './ExerciseCard'
import { LibrarySwitch } from './LibrarySwitch'
import { LibraryState } from './LibraryState'
import { SearchField } from './SearchField'
import { searchExercises } from './searchExercises'
import styles from './library.module.css'

export function BibliothequePage() {
  const { data: exercises, isPending, isError } = useExercises()
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of exercises ?? []) map.set(e.primary_group, (map.get(e.primary_group) ?? 0) + 1)
    return map
  }, [exercises])

  const results = useMemo(() => searchExercises(exercises ?? [], query), [exercises, query])
  const searching = query.trim() !== ''

  return (
    <>
      <LibrarySwitch />
      <SearchField value={query} onChange={setQuery} />
      <LibraryState isPending={isPending} isError={isError}>
        {searching ? (
          results.length > 0 ? (
            <div className={styles.grid}>
              {results.map((e) => (
                <ExerciseCard key={e.id} exercise={e} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Aucun exercice trouvé.</p>
          )
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <h2>Groupes musculaires</h2>
              <Link to="/muscu/bibliotheque/nouveau" className={styles.createLink}>
                <Icon name="plus" size={16} />
                Créer un exercice
              </Link>
            </div>
            <div className={styles.grid}>
              {MUSCLE_GROUPS.map((g) => (
                <Link key={g.key} to={`/muscu/bibliotheque/${g.key}`} className={styles.group}>
                  <span className={styles.groupBadge}>{g.abbr}</span>
                  <span className={styles.groupText}>
                    <span className={styles.groupName}>{g.label}</span>
                    <span className={styles.groupCount}>{counts.get(g.key) ?? 0} exercices</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </LibraryState>
    </>
  )
}
