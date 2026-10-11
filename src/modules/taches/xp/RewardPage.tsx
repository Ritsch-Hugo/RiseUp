import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Icon } from '../../../core/ui'
import { summarizeAward, rankFor, type Award } from '../rules/xp'
import styles from './xp.module.css'

const factorLabel = (f: number) => `×${String(f).replace('.', ',')}`

/** Écran de récompense : XP gagné, détail, anti-triche, niveau, série. Aussi l'écran de passage de niveau. */
export function RewardPage() {
  const navigate = useNavigate()
  const award = (useLocation().state as { award?: Award } | null)?.award
  if (!award) return <Navigate to="/taches" replace />

  const s = summarizeAward(award)
  const title = s.levelUp
    ? `Niveau ${s.after.level} atteint !`
    : award.kind === 'task'
      ? 'Tâche terminée'
      : 'Habitude validée'
  const gained = award.after - award.before

  return (
    <div className={styles.screen}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.badge}>
          <Icon name={s.levelUp ? 'trophy' : 'check'} size={52} strokeWidth={3} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.subtitle}>
          {s.levelUp && s.rankChanged ? `Nouveau rang : ${rankFor(s.after.level)}` : award.title}
        </span>

        <span className={styles.big}>
          {gained >= 0 ? '+' : '−'}
          {Math.abs(gained)} XP
        </span>

        <div className={styles.lines}>
          <div className={styles.line}>
            <span>{award.label}</span>
            <span className={styles.lineXp}>+{award.base} XP</span>
          </div>
          {award.reductions.map((r) => (
            <div key={r.reason} className={styles.line}>
              <span className={styles.lineMuted}>{r.label}</span>
              <span className={styles.lineMuted}>{factorLabel(r.factor)}</span>
            </div>
          ))}
        </div>

        <div className={styles.level}>
          <div className={styles.levelHead}>
            <span className={styles.levelName}>Niveau {s.after.level}</span>
            <span className={styles.levelXp}>
              {s.after.xpInto} / {s.after.xpForNext} XP
            </span>
          </div>
          <div className={styles.track}>
            {!s.levelUp && (
              <div
                className={styles.trackBefore}
                style={{ width: `${s.before.progress * 100}%` }}
              />
            )}
            <div className={styles.trackAfter} style={{ width: `${s.after.progress * 100}%` }} />
          </div>
          <span className={styles.levelHint}>
            Plus que {s.toNext} XP pour atteindre le niveau {s.after.level + 1}
          </span>
        </div>

        {award.streak > 0 && (
          <div className={styles.streak}>
            <Icon name="bolt" size={20} strokeWidth={2.2} />
            <span>
              {award.streak > 1
                ? `Série maintenue : ${award.streak} jours`
                : 'Série lancée : 1 jour'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button fullWidth onClick={() => navigate('/taches', { replace: true })}>
          Continuer
        </Button>
      </div>
    </div>
  )
}
