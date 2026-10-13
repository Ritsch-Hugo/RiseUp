import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { BOSS_STEP_XP, BOSS_VICTORY_XP } from '../config'
import { bossHealth } from '../rules/boss'
import { useBoss, useToggleBossStep } from './bossQueries'
import styles from './boss.module.css'

const weekdayName = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' })

/** Boss de la semaine : barre de vie, étapes à cocher, ou invitation à en invoquer un. */
export function BossCard() {
  const { boss } = useBoss()
  const toggle = useToggleBossStep()

  return (
    <>
      <div className={styles.head}>
        <h3 className={styles.title}>Boss de la semaine</h3>
        <span className={styles.chip}>Boss</span>
      </div>

      {!boss && (
        <Link to="/taches/nouvelle?boss=1" className={styles.summon}>
          <Icon name="plus" size={18} />
          Invoquer un boss
        </Link>
      )}

      {boss && (
        <BossBody
          boss={boss}
          onToggle={(stepId, done) => toggle.mutate({ task: boss, stepId, done })}
        />
      )}
    </>
  )
}

function BossBody({
  boss,
  onToggle,
}: {
  boss: NonNullable<ReturnType<typeof useBoss>['boss']>
  onToggle: (stepId: string, done: boolean) => void
}) {
  const health = bossHealth(boss.subtasks)
  const defeated = boss.completed_at !== null
  return (
    <div className={defeated ? styles.cardDefeated : styles.card}>
      <div className={styles.top}>
        <span className={styles.icon}>
          <Icon name="trophy" size={26} />
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{boss.title}</span>
          <span className={styles.sub}>
            {defeated
              ? 'boss vaincu'
              : `échéance ${boss.due_date ? weekdayName(boss.due_date) : 'dimanche'} · victoire +${BOSS_VICTORY_XP} XP · +${BOSS_STEP_XP} XP par étape`}
          </span>
        </span>
        <Link
          to={`/taches/${boss.id}/modifier`}
          className={styles.edit}
          aria-label="Modifier le boss"
        >
          <Icon name="edit" size={18} />
        </Link>
      </div>

      <div className={styles.hp}>
        <div className={styles.hpHead}>
          <span className={styles.hpLabel}>Points de vie du boss</span>
          <span className={styles.sub}>{health.percent} %</span>
        </div>
        <div className={styles.bar}>
          <div style={{ width: `${health.percent}%` }} />
        </div>
      </div>

      <div className={styles.steps}>
        {boss.subtasks.map((s) => {
          const done = s.done_at !== null
          return (
            <button
              key={s.id}
              type="button"
              role="checkbox"
              aria-checked={done}
              className={styles.step}
              onClick={() => onToggle(s.id, !done)}
            >
              <span className={done ? styles.checkOn : styles.check}>
                {done && <Icon name="check" size={12} strokeWidth={3.5} />}
              </span>
              <span className={done ? styles.stepDone : styles.stepTitle}>{s.title}</span>
              <span className={styles.stepHp}>{s.hp} PV</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
