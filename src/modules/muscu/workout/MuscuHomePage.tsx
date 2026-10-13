import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../core/ui'
import { HOME_RECENT_WORKOUTS } from '../config'
import { usePrograms } from '../programs/programQueries'
import { nextSession } from '../rules/nextSession'
import { addDays, parisDay, weekStart, weekStats } from '../rules/week'
import { formatDuration } from './format'
import { usePastWorkouts, type PastWorkout } from './historyQueries'
import { PastWorkoutCard, WeekStat } from './PastWorkoutCard'
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
      {past && <NextSessionCard past={past} />}

      <div>
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
      </div>

      {past && <WeekCard workouts={past} />}

      {past && past.length > 0 && (
        <>
          <div className={styles.weekHead}>
            <h2 className={styles.homeTitle}>Dernières séances</h2>
            <Link to="/muscu/historique" className={styles.seeAll}>
              Tout voir
            </Link>
          </div>
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

function NextSessionCard({ past }: { past: PastWorkout[] }) {
  const { data: programs } = usePrograms()
  if (!programs) return null
  // `past` est trié du plus récent au plus ancien.
  const lastSessionId = past.find((w) => w.sessionId)?.sessionId ?? null
  const next = nextSession(programs, lastSessionId)
  if (!next) return null
  const program = programs.find((p) => p.id === next.programId)!
  const session = program.sessions.find((s) => s.id === next.sessionId)!
  const count = session.exercises.length
  return (
    <Link
      to={`/muscu/bibliotheque/programmes/${program.id}/seance/${session.id}`}
      className={styles.nextCard}
    >
      <span className={styles.sub}>Prochaine séance · {program.name}</span>
      <span className={styles.nextName}>{session.name}</span>
      <span className={styles.sub}>
        {count} exercice{count > 1 ? 's' : ''}
      </span>
    </Link>
  )
}
