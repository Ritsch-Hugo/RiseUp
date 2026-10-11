import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { HABIT_MOMENTS } from '../config'
import { dueOn, habitStreak, habitXp, isDone } from '../rules/habits'
import { CounterSheet } from './CounterSheet'
import { logMapFor, useHabitLogs, useHabits, useSetHabitValue, type Habit } from './habitQueries'
import styles from './habits.module.css'

/** Routine du jour : habitudes prévues aujourd'hui, par moment de la journée. */
export function RoutineCard({ today }: { today: string }) {
  const { data: habits } = useHabits()
  const { data: logs } = useHabitLogs()
  const setValue = useSetHabitValue()
  const [counter, setCounter] = useState<Habit | null>(null)

  if (!habits || !logs) return null
  const due = habits.filter((h) => dueOn(h, h.pauses, today))
  const doneCount = due.filter((h) => isDone(h, logMapFor(logs, h.id).get(today) ?? 0)).length

  return (
    <>
      <div className={styles.routineHead}>
        <h2 className={styles.routineTitle}>Routine du jour</h2>
        <Link to="/taches/habitudes" className={styles.manageLink}>
          Gérer{due.length > 0 ? ` · ${doneCount} / ${due.length}` : ''}
        </Link>
      </div>

      {due.length === 0 ? (
        <p className={styles.empty}>
          {habits.some((h) => !h.archived_at)
            ? 'Aucune habitude prévue aujourd’hui.'
            : 'Crée ta première habitude pour construire une routine.'}
        </p>
      ) : (
        <div className={styles.routine}>
          {HABIT_MOMENTS.map((m) => {
            const list = due.filter((h) => h.moment === m.key)
            if (list.length === 0) return null
            return (
              <div key={m.key} className={styles.moment}>
                <span className={styles.momentLabel}>{m.short}</span>
                {list.map((h) => {
                  const map = logMapFor(logs, h.id)
                  const value = map.get(today) ?? 0
                  const done = isDone(h, value)
                  const streak = habitStreak(h, h.pauses, map, today)
                  const counted = h.type === 'compteur'
                  return (
                    <div key={h.id} className={styles.habitRow}>
                      <button
                        type="button"
                        className={
                          done ? styles.checkOn : counted ? styles.checkCounter : styles.check
                        }
                        role="checkbox"
                        aria-checked={done}
                        aria-label={
                          counted
                            ? `Saisir ${h.name}`
                            : `${done ? 'Décocher' : 'Valider'} ${h.name}`
                        }
                        onClick={() =>
                          counted
                            ? setCounter(h)
                            : setValue.mutate({
                                habit: h,
                                day: today,
                                value: done ? 0 : 1,
                                previous: value,
                              })
                        }
                      >
                        {done && <Icon name="check" size={14} strokeWidth={3.5} />}
                      </button>
                      <span className={styles.habitText}>
                        <span className={styles.habitLine}>
                          <span className={done ? styles.nameDone : styles.name}>{h.name}</span>
                          {counted && (
                            <span className={styles.sub}>
                              {value} / {h.target}
                            </span>
                          )}
                        </span>
                        {counted && (
                          <span className={styles.bar}>
                            <span
                              style={{
                                width: `${Math.min(100, (value / (h.target ?? 1)) * 100)}%`,
                              }}
                            />
                          </span>
                        )}
                        {!counted && streak > 0 && (
                          <span className={styles.sub}>Série {streak} j</span>
                        )}
                      </span>
                      <span className={done ? styles.xpDone : styles.xpChip}>
                        +{habitXp(h.difficulty)} XP
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      <CounterSheet
        habit={counter}
        day={today}
        value={counter ? (logMapFor(logs, counter.id).get(today) ?? 0) : 0}
        onClose={() => setCounter(null)}
      />
    </>
  )
}
