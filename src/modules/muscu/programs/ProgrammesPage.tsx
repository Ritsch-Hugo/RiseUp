import { Link, useNavigate } from 'react-router-dom'
import { Button, Icon } from '../../../core/ui'
import { LibraryState } from '../library/LibraryState'
import { LibrarySwitch } from '../library/LibrarySwitch'
import { useCreateProgram, usePrograms } from './programQueries'
import styles from './programs.module.css'

export function ProgrammesPage() {
  const { data: programs, isPending, isError } = usePrograms()
  const create = useCreateProgram()
  const navigate = useNavigate()

  const onCreate = () =>
    create.mutate(programs ?? [], {
      onSuccess: (id) => navigate(`/muscu/bibliotheque/programmes/${id}/modifier`),
    })

  return (
    <>
      <LibrarySwitch />
      <Button fullWidth onClick={onCreate} disabled={create.isPending || isPending}>
        <span className={styles.buttonContent}>
          <Icon name="plus" size={20} />
          Créer un programme
        </span>
      </Button>
      {create.isError && <p className={styles.error}>Impossible de créer le programme.</p>}
      <h2>Mes programmes</h2>
      <LibraryState isPending={isPending} isError={isError}>
        {programs && programs.length > 0 ? (
          <div className={styles.list}>
            {programs.map((p) => (
              <Link
                key={p.id}
                to={`/muscu/bibliotheque/programmes/${p.id}`}
                className={styles.card}
              >
                <span className={styles.cardText}>
                  <span className={styles.cardTitle}>{p.name}</span>
                  <span className={styles.meta}>
                    {p.sessions.length} séance{p.sessions.length > 1 ? 's' : ''}
                    {p.days_per_week ? ` · ${p.days_per_week} jours par semaine` : ''}
                  </span>
                </span>
                <Icon name="chevronRight" size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Aucun programme pour l’instant.</p>
        )}
      </LibraryState>
    </>
  )
}
