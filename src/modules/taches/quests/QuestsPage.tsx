import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parisDay, parisMinutes } from '../../../core'
import { Button, Icon, Sheet } from '../../../core/ui'
import { QUEST_BONUS_XP } from '../config'
import { logMapFor, useHabitLogs, useHabits } from '../habits/habitQueries'
import { addDays } from '../../../core'
import { habitStreak, isDone } from '../rules/habits'
import { hoursUntilMidnight, questProgress, weekDaysLeft } from '../rules/quests'
import {
  useDeleteQuest,
  useQuestContext,
  useQuests,
  useSetManualProgress,
  type Quest,
} from './questQueries'
import styles from './quests.module.css'

const LETTERS = 'DLMMJVS'

/** Onglet Quêtes : quêtes du jour et de la semaine, aperçu des habitudes de la semaine. */
export function QuestsPage() {
  const { data: quests, isPending, isError } = useQuests()
  const { data: ctx } = useQuestContext()
  const { data: habits } = useHabits()
  const { data: logs } = useHabitLogs()
  const setManual = useSetManualProgress()
  const remove = useDeleteQuest()
  const [selected, setSelected] = useState<Quest | null>(null)
  const today = parisDay()

  if (isPending || !ctx) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger les quêtes.</p>

  const progressOf = (q: Quest) => Math.min(q.target, questProgress(q, ctx))
  const isValid = (q: Quest) => q.completed_at !== null
  const daily = quests.filter((q) => q.period === 'jour')
  const weekly = quests.filter((q) => q.period === 'semaine')
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  const renderQuest = (q: Quest) => {
    const done = isValid(q)
    const progress = progressOf(q)
    const manual = q.kind === 'manuelle'
    return (
      <div key={q.id} className={done ? styles.questDone : styles.quest}>
        <button
          type="button"
          className={styles.questMain}
          onClick={() => setSelected(q)}
          aria-label={`Détails de la quête ${q.title}`}
        >
          <span className={done ? styles.iconDone : styles.icon}>
            <Icon name={done ? 'check' : 'flag'} size={20} strokeWidth={done ? 3.2 : 2} />
          </span>
          <span className={styles.questText}>
            <span className={styles.questHead}>
              <span className={done ? styles.titleDone : styles.questTitle}>{q.title}</span>
              {!done && (
                <span className={styles.sub}>
                  {progress} / {q.target}
                </span>
              )}
            </span>
            {!done && (
              <span className={styles.bar}>
                <span style={{ width: `${(progress / q.target) * 100}%` }} />
              </span>
            )}
          </span>
        </button>
        {manual && !done && (
          <span className={styles.stepper}>
            <button
              type="button"
              aria-label="Retirer 1"
              disabled={q.manual_progress <= 0}
              onClick={() => setManual.mutate({ id: q.id, value: q.manual_progress - 1 })}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Ajouter 1"
              onClick={() => setManual.mutate({ id: q.id, value: q.manual_progress + 1 })}
            >
              +
            </button>
          </span>
        )}
        <span className={done ? styles.xpDone : styles.xpChip}>+{q.bonus_xp} XP</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h2 className={styles.pageTitle}>Quêtes</h2>
        <span className={styles.sub}>
          Réinitialisation dans {hoursUntilMidnight(parisMinutes())} h
        </span>
      </div>

      <div className={styles.sectionHead}>
        <h3 className={styles.section}>Du jour</h3>
        <span className={styles.count}>
          {daily.filter(isValid).length} / {daily.length}
        </span>
      </div>
      {daily.length === 0 && <p className={styles.empty}>Aucune quête du jour.</p>}
      <div className={styles.list}>{daily.map(renderQuest)}</div>

      <div className={styles.sectionHead}>
        <h3 className={styles.section}>De la semaine</h3>
        <span className={styles.sub}>
          reste {weekDaysLeft(today)} jour{weekDaysLeft(today) > 1 ? 's' : ''}
        </span>
      </div>
      {weekly.length === 0 && <p className={styles.empty}>Aucune quête de la semaine.</p>}
      <div className={styles.list}>{weekly.map(renderQuest)}</div>

      <Link to="/taches/quetes/nouvelle" className={styles.newQuest}>
        <Icon name="plus" size={18} />
        Nouvelle quête
      </Link>
      <p className={styles.help}>
        Une quête validée rapporte {QUEST_BONUS_XP.jour} XP (du jour) ou {QUEST_BONUS_XP.semaine} XP
        (de la semaine).
      </p>

      <div className={styles.sectionHead}>
        <h3 className={styles.section}>Habitudes</h3>
        <span className={styles.links}>
          <Link to="/taches/habitudes" className={styles.linkMuted}>
            Gérer
          </Link>
          <Link to="/taches/habitudes/nouvelle" className={styles.link}>
            + Nouvelle
          </Link>
        </span>
      </div>
      {(habits ?? []).filter((h) => !h.archived_at).length === 0 && (
        <p className={styles.empty}>Aucune habitude pour l’instant.</p>
      )}
      {(habits ?? [])
        .filter((h) => !h.archived_at)
        .map((h) => {
          const map = logMapFor(logs ?? [], h.id)
          const streak = habitStreak(h, h.pauses, map, today)
          return (
            <Link key={h.id} to={`/taches/habitudes/${h.id}`} className={styles.habitCard}>
              <div className={styles.habitTop}>
                <span className={styles.habitName}>{h.name}</span>
                <span className={styles.streak}>
                  <Icon name="bolt" size={14} strokeWidth={2.4} />
                  Série {streak} j
                </span>
              </div>
              <div className={styles.week}>
                {days.map((d) => {
                  const done = isDone(h, map.get(d) ?? 0)
                  const letter = LETTERS[new Date(`${d}T12:00:00Z`).getUTCDay()]
                  return (
                    <span key={d} className={styles.weekDay}>
                      <span
                        className={
                          done ? styles.squareOn : d === today ? styles.squareToday : styles.square
                        }
                      />
                      <span className={d === today ? styles.letterToday : styles.letter}>
                        {letter}
                      </span>
                    </span>
                  )
                })}
              </div>
            </Link>
          )
        })}

      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className={styles.sheetBody}>
            <p className={styles.help}>
              {selected.period === 'jour' ? 'Quête du jour' : 'Quête de la semaine'} · +
              {selected.bonus_xp} XP
              {selected.recurring
                ? ` · reconduite ${selected.period === 'jour' ? 'chaque jour' : 'chaque semaine'}`
                : ''}
            </p>
            <Button
              variant="danger"
              fullWidth
              disabled={remove.isPending}
              onClick={() => remove.mutate(selected.id, { onSuccess: () => setSelected(null) })}
            >
              Supprimer la quête
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
