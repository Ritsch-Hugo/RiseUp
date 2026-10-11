import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Icon, IconLink } from '../../../core/ui'
import {
  habitStatus,
  habitStreak,
  habitSubtitle,
  habitXp,
  pausedSince,
  weekProgress,
  type HabitStatus,
} from '../rules/habits'
import {
  logMapFor,
  useArchiveHabit,
  useHabitLogs,
  useHabits,
  useResumeHabit,
  type Habit,
} from './habitQueries'
import styles from './habits.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

const TABS: { key: HabitStatus; label: string }[] = [
  { key: 'active', label: 'Actives' },
  { key: 'paused', label: 'En pause' },
  { key: 'archived', label: 'Archivées' },
]

/** Gestion des habitudes : actives, en pause, archivées. */
export function HabitsPage() {
  const { data: habits, isPending, isError } = useHabits()
  const { data: logs = [] } = useHabitLogs()
  const resume = useResumeHabit()
  const archive = useArchiveHabit()
  const [tab, setTab] = useState<HabitStatus>('active')
  const today = parisDay()

  const withStatus = (habits ?? []).map((h) => ({
    habit: h,
    status: habitStatus(h, h.pauses, today),
  }))
  const list = withStatus.filter((x) => x.status === tab).map((x) => x.habit)
  const count = (s: HabitStatus) => withStatus.filter((x) => x.status === s).length

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.topLeft}>
          <IconLink to="/taches" icon="chevronLeft" label="Retour" />
          <h2 className={styles.pageTitle}>Habitudes</h2>
        </div>
        <Link
          to="/taches/habitudes/nouvelle"
          className={styles.addButton}
          aria-label="Nouvelle habitude"
        >
          <Icon name="plus" size={22} strokeWidth={2.5} />
        </Link>
      </div>

      <div className={styles.segmented} role="group" aria-label="Statut">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === tab ? styles.segOn : styles.seg}
            aria-pressed={t.key === tab}
            onClick={() => setTab(t.key)}
          >
            {t.label} · {count(t.key)}
          </button>
        ))}
      </div>

      {isPending && <ListSkeleton />}
      {isError && <p className={styles.empty}>Impossible de charger les habitudes.</p>}
      {habits && list.length === 0 && (
        <p className={styles.empty}>
          {tab === 'active'
            ? 'Aucune habitude active. Crée-en une avec le bouton +.'
            : tab === 'paused'
              ? 'Aucune habitude en pause.'
              : 'Aucune habitude archivée.'}
        </p>
      )}

      <div className={styles.cards}>
        {list.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            status={tab}
            today={today}
            logs={logs}
            onResume={() => resume.mutate({ habit: h, today })}
            onRestore={() => archive.mutate({ id: h.id, archived: false })}
          />
        ))}
      </div>

      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>Modifier une habitude</h3>
        <p className={styles.infoText}>
          Touche une habitude pour changer ses jours, son moment, son rappel ou son objectif. Tu
          peux aussi la mettre en pause ou l’archiver : l’historique est conservé.
        </p>
      </div>
    </div>
  )
}

function HabitCard({
  habit,
  status,
  today,
  logs,
  onResume,
  onRestore,
}: {
  habit: Habit
  status: HabitStatus
  today: string
  logs: ReturnType<typeof useHabitLogs>['data'] & object
  onResume: () => void
  onRestore: () => void
}) {
  const map = logMapFor(logs, habit.id)
  const streak = habitStreak(habit, habit.pauses, map, today)
  const week = weekProgress(habit, habit.pauses, map, today)
  const counted = habit.type === 'compteur'
  const todayValue = map.get(today) ?? 0
  const subtitle = habitSubtitle(habit)

  if (status !== 'active') {
    const since = pausedSince(habit.pauses, today)
    return (
      <div className={styles.restCard}>
        <Link to={`/taches/habitudes/${habit.id}`} className={styles.restText}>
          <span className={styles.cardName}>{habit.name}</span>
          <span className={styles.sub}>
            {status === 'paused' && since !== null
              ? `${subtitle} · en pause depuis ${since} j`
              : subtitle}
          </span>
        </Link>
        <button
          type="button"
          className={styles.pillButton}
          onClick={status === 'paused' ? onResume : onRestore}
        >
          {status === 'paused' ? 'Reprendre' : 'Désarchiver'}
        </button>
      </div>
    )
  }

  return (
    <Link to={`/taches/habitudes/${habit.id}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardTitleBlock}>
          <span className={styles.cardName}>{habit.name}</span>
          <span className={styles.sub}>{subtitle}</span>
        </span>
        <span className={styles.streak}>
          <Icon name="bolt" size={14} strokeWidth={2.4} />
          Série {streak} j
        </span>
      </div>
      <div className={styles.cardBottom}>
        <span className={styles.progress}>
          <span
            className={counted ? styles.progressCounter : undefined}
            style={{
              width: `${
                counted
                  ? Math.min(100, (todayValue / (habit.target ?? 1)) * 100)
                  : week.planned > 0
                    ? (week.done / week.planned) * 100
                    : 0
              }%`,
            }}
          />
        </span>
        <span className={styles.sub}>
          {counted
            ? `${todayValue} / ${habit.target} ${habit.unit ?? ''} aujourd’hui`.replace('  ', ' ')
            : `${week.done} / ${week.planned} cette semaine`}
        </span>
        <span className={styles.xpChip}>+{habitXp(habit.difficulty)} XP</span>
      </div>
    </Link>
  )
}
