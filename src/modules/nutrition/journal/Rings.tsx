import { ringFraction } from '../rules/journal'
import { formatAmount, type Nutrition } from '../rules/food'
import type { GoalValues } from '../rules/goals'
import styles from './journal.module.css'

const BIG_R = 52
const BIG_C = 2 * Math.PI * BIG_R
const SMALL_R = 18
const SMALL_C = 2 * Math.PI * SMALL_R

const MACROS = [
  { key: 'protein', goal: 'protein_g', label: 'Protéines', color: 'var(--macro-protein)' },
  { key: 'carbs', goal: 'carbs_g', label: 'Glucides', color: 'var(--macro-carbs)' },
  { key: 'fat', goal: 'fat_g', label: 'Lipides', color: 'var(--macro-fat)' },
] as const

/** Anneau des calories (restantes au centre) et trois petits anneaux de macros, plus fibres, sucres, sel. */
export function Rings({ total, goals }: { total: Nutrition; goals: GoalValues }) {
  const remaining = Math.round(goals.kcal - total.kcal)
  const over = remaining < 0
  const bigDash = ringFraction(total.kcal, goals.kcal) * BIG_C

  return (
    <div className={styles.rings}>
      <div className={styles.ringsTop}>
        <div className={styles.bigRing}>
          <svg
            width="130"
            height="130"
            viewBox="0 0 130 130"
            role="img"
            aria-label={`${formatAmount(Math.abs(remaining), 0)} kilocalories ${over ? 'au-dessus' : 'restantes'} sur ${formatAmount(goals.kcal, 0)}`}
          >
            <defs>
              <linearGradient id="kcalGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-hi)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r={BIG_R} fill="none" stroke="var(--card-2)" strokeWidth="12" />
            <circle
              cx="65"
              cy="65"
              r={BIG_R}
              fill="none"
              stroke={over ? 'var(--danger)' : 'url(#kcalGradient)'}
              className={styles.ringGlow}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${bigDash} ${BIG_C}`}
              style={{ transition: 'stroke-dasharray 0.6s var(--ease-out)' }}
              transform="rotate(-90 65 65)"
            />
          </svg>
          <div className={styles.ringCenter}>
            <span className={styles.ringValue}>{formatAmount(Math.abs(remaining), 0)}</span>
            <span className={styles.ringLabel}>kcal {over ? 'au-dessus' : 'restantes'}</span>
          </div>
        </div>

        <div className={styles.macros}>
          {MACROS.map((m) => {
            const goal = goals[m.goal]
            const dash = ringFraction(total[m.key], goal) * SMALL_C
            return (
              <div key={m.key} className={`${styles.macro} ${styles.macroPill}`}>
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  role="img"
                  aria-label={`${m.label} ${formatAmount(total[m.key], 0)} sur ${goal} grammes`}
                >
                  <circle
                    cx="22"
                    cy="22"
                    r={SMALL_R}
                    fill="none"
                    stroke="var(--card-2)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r={SMALL_R}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${SMALL_C}`}
                    style={{ transition: 'stroke-dasharray 0.6s var(--ease-out)' }}
                    transform="rotate(-90 22 22)"
                  />
                </svg>
                <div className={styles.macroText}>
                  <span className={styles.macroName}>{m.label}</span>
                  <span className={styles.sub}>
                    {formatAmount(total[m.key], 0)} / {goal} g
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.extras}>
        <div>
          <span className={styles.extraValue}>
            {formatAmount(total.fiber, 0)} / {goals.fiber_g} g
          </span>
          <span className={styles.sub}>Fibres</span>
        </div>
        <div>
          <span className={styles.extraValue}>{formatAmount(total.sugars, 0)} g</span>
          <span className={styles.sub}>Sucres</span>
        </div>
        <div>
          <span className={total.salt > goals.salt_g ? styles.extraOver : styles.extraValue}>
            {formatAmount(total.salt, 1)} g
          </span>
          <span className={styles.sub}>Sel</span>
        </div>
      </div>
    </div>
  )
}
