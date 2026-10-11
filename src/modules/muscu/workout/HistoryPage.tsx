import { useState } from 'react'
import { Icon } from '../../../core/ui'
import { Calendar } from '../profile/Calendar'
import profile from '../profile/profile.module.css'
import { LibraryState } from '../library/LibraryState'
import { monthGrid, shiftMonth } from '../rules/profile'
import { parisDay } from '../rules/week'
import { usePastWorkouts } from './historyQueries'
import { PastWorkoutCard } from './PastWorkoutCard'
import styles from './workout.module.css'

/** Historique : calendrier du mois (navigable) et séances du mois, ou du jour touché. */
export function HistoryPage() {
  const { data: past, isPending, isError } = usePastWorkouts()
  const today = parisDay(new Date())
  const [month, setMonth] = useState(`${today.slice(0, 7)}-01`)
  const [selected, setSelected] = useState<string | null>(null)

  const go = (n: number) => {
    setMonth(shiftMonth(month, n))
    setSelected(null)
  }

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {past && (
        <>
          <Calendar
            today={today}
            month={month}
            cells={monthGrid(month, new Set(past.map((w) => parisDay(w.startedAt))), today)}
            count={0}
            selectedDay={selected}
            onSelectDay={(d) => setSelected(selected === d ? null : d)}
            nav={
              <div className={profile.monthNav}>
                <button
                  type="button"
                  className={profile.monthButton}
                  aria-label="Mois précédent"
                  onClick={() => go(-1)}
                >
                  <Icon name="chevronLeft" size={18} />
                </button>
                <button
                  type="button"
                  className={profile.monthButton}
                  aria-label="Mois suivant"
                  disabled={month.slice(0, 7) >= today.slice(0, 7)}
                  onClick={() => go(1)}
                >
                  <Icon name="chevronRight" size={18} />
                </button>
              </div>
            }
          />
          <MonthList
            workouts={past.filter((w) => {
              const day = parisDay(w.startedAt)
              return selected ? day === selected : day.slice(0, 7) === month.slice(0, 7)
            })}
            selected={selected}
            neverTrained={past.length === 0}
          />
        </>
      )}
    </LibraryState>
  )
}

function MonthList({
  workouts,
  selected,
  neverTrained,
}: {
  workouts: NonNullable<ReturnType<typeof usePastWorkouts>['data']>
  selected: string | null
  neverTrained: boolean
}) {
  return (
    <>
      <h2 className={styles.homeTitle}>
        {workouts.length} séance{workouts.length > 1 ? 's' : ''}
        {selected ? ' ce jour-là' : ' ce mois-ci'}
      </h2>
      {workouts.length === 0 && (
        <p className={profile.sub}>
          {neverTrained
            ? 'Ton historique est vide. Lance ta première séance depuis l’accueil Muscu.'
            : selected
              ? 'Pas de séance ce jour-là.'
              : 'Pas de séance ce mois-ci.'}
        </p>
      )}
      <div className={profile.historyList}>
        {workouts.map((w) => (
          <PastWorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </>
  )
}
