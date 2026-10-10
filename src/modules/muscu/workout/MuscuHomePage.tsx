import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../core/ui'
import { HOME_MUSCLE_BUBBLES, HOME_RECENT_WORKOUTS, MUSCLE_GROUPS } from '../config'
import { addDays, parisDay, weekStart, weekStats } from '../rules/week'
import { formatDuration } from './format'
import { usePastWorkouts, type PastWorkout } from './historyQueries'
import { useOpenWorkout, useStartWorkout } from './workoutQueries'
import styles from './workout.module.css'

/** Accueil Muscu (provisoire : lancement d'une séance ; les stats de la semaine viennent avec les règles métier). */
export function MuscuHomePage() {
  const { data: past } = usePastWorkouts()
  const { data: open } = useOpenWorkout()
  const start = useStartWorkout()
  const navigate = useNavigate()

  return (
    <>
      <Card large>
        <h2>Entraînement</h2>
        <p className={styles.homeText}>
          Choisis une séance dans un de tes programmes, ou lance une séance libre.
        </p>
        <div className={styles.homeActions}>
          <Link to="/muscu/bibliotheque/programmes" className={styles.homeLink}>
            Mes programmes
          </Link>
          <Button
            variant="secondary"
            disabled={start.isPending || !!open}
            onClick={() =>
              start.mutate(
                { name: 'Séance libre', session: null },
                { onSuccess: () => navigate('/muscu/seance') }
              )
            }
          >
            Séance libre
          </Button>
        </div>
        {start.isError && <p className={styles.errorText}>Impossible de lancer la séance.</p>}
      </Card>

      {past && <WeekCard workouts={past} />}

      {past && past.length > 0 && (
        <>
          <h2 className={styles.homeTitle}>Dernières séances</h2>
          {past.slice(0, HOME_RECENT_WORKOUTS).map((w) => (
            <PastWorkoutCard key={w.id} workout={w} />
          ))}
        </>
      )}
    </>
  )
}

function WeekCard({ workouts }: { workouts: PastWorkout[] }) {
  const today = parisDay(new Date())
  const start = weekStart(today)
  const stats = weekStats(workouts, today)
  const label = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
  return (
    <Card large>
      <div className={styles.weekHead}>
        <h2>Cette semaine</h2>
        <span className={styles.sub}>
          {label(start)} – {label(addDays(start, 6))}
        </span>
      </div>
      <div className={styles.weekStats}>
        <WeekStat value={String(stats.count)} label="Entraînements" />
        <WeekStat
          value={stats.count > 0 ? formatDuration(stats.durationSeconds) : '–'}
          label="Durée"
        />
        <WeekStat value={`${Math.round(stats.volume).toLocaleString('fr-FR')} kg`} label="Volume" />
      </div>
    </Card>
  )
}

function WeekStat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.weekStat}>
      <span className={styles.weekValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function PastWorkoutCard({ workout }: { workout: PastWorkout }) {
  const date = new Date(workout.startedAt)
  const shown = workout.groups.slice(0, HOME_MUSCLE_BUBBLES)
  const hidden = workout.groups.length - shown.length
  return (
    <Link to={`/muscu/resume/${workout.id}`} className={styles.pastCard}>
      <div className={styles.pastTitle}>
        <span className={styles.pastName}>{workout.name}</span>
        <span className={styles.sub}>
          {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className={styles.weekStats}>
        <WeekStat value={formatDuration(workout.durationSeconds)} label="Durée" />
        <WeekStat
          value={`${Math.round(workout.volume).toLocaleString('fr-FR')} kg`}
          label="Volume"
        />
        <WeekStat value={String(workout.records)} label="Records" />
      </div>
      <div className={styles.bubbles}>
        {shown.map((g) => (
          <span key={g} className={styles.bubble}>
            {MUSCLE_GROUPS.find((m) => m.key === g)?.abbr}
          </span>
        ))}
        {hidden > 0 && <span className={styles.bubbleMore}>+{hidden}</span>}
      </div>
    </Link>
  )
}
