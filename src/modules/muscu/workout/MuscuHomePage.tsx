import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../../core/ui'
import { useOpenWorkout, useStartWorkout } from './workoutQueries'
import styles from './workout.module.css'

/** Accueil Muscu (provisoire : lancement d'une séance ; les stats de la semaine viennent avec les règles métier). */
export function MuscuHomePage() {
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
    </>
  )
}
