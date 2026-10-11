import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Button, IconLink, Sheet } from '../../../core/ui'
import {
  DEFAULT_HABIT_MOMENT,
  DEFAULT_REMINDER_TIME,
  HABIT_MOMENTS,
  TASK_DIFFICULTIES,
  WEEKDAYS,
} from '../config'
import {
  habitStatus,
  habitXp,
  validateHabitForm,
  weekdaysLabel,
  type HabitForm,
} from '../rules/habits'
import {
  useArchiveHabit,
  useHabits,
  usePauseHabit,
  useResumeHabit,
  useSaveHabit,
  type Habit,
} from './habitQueries'
import styles from './habits.module.css'

/** Création (`/taches/habitudes/nouvelle`) ou modification (`/taches/habitudes/:id`) d'une habitude. */
export function HabitFormPage() {
  const { id } = useParams()
  const { data: habits, isPending } = useHabits()
  if (id && isPending) return <p className={styles.empty}>Chargement…</p>
  const existing = id ? habits?.find((h) => h.id === id) : undefined
  if (id && !existing) return <Navigate to="/taches/habitudes" replace />
  return <HabitEditor existing={existing} />
}

function initialForm(h: Habit | undefined): HabitForm {
  if (!h) {
    return {
      name: '',
      weekdays: WEEKDAYS.map((d) => d.iso),
      moment: DEFAULT_HABIT_MOMENT,
      type: 'fait',
      target: '',
      unit: '',
      difficulty: 'facile',
      reminderOn: false,
      reminderTime: DEFAULT_REMINDER_TIME,
    }
  }
  return {
    name: h.name,
    weekdays: h.weekdays,
    moment: h.moment,
    type: h.type,
    target: h.target === null ? '' : String(h.target),
    unit: h.unit ?? '',
    difficulty: h.difficulty,
    reminderOn: h.reminder_time !== null,
    reminderTime: h.reminder_time?.slice(0, 5) ?? DEFAULT_REMINDER_TIME,
  }
}

function HabitEditor({ existing }: { existing: Habit | undefined }) {
  const navigate = useNavigate()
  const today = parisDay()
  const save = useSaveHabit()
  const archive = useArchiveHabit()
  const pause = usePauseHabit()
  const resume = useResumeHabit()
  const [form, setForm] = useState<HabitForm>(initialForm(existing))
  const [confirmArchive, setConfirmArchive] = useState(false)
  const patch = (p: Partial<HabitForm>) => setForm((f) => ({ ...f, ...p }))
  const values = validateHabitForm(form)
  const status = existing ? habitStatus(existing, existing.pauses, today) : 'active'

  const toggleDay = (iso: number) =>
    patch({
      weekdays: form.weekdays.includes(iso)
        ? form.weekdays.filter((d) => d !== iso)
        : [...form.weekdays, iso],
    })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!values) return
    save.mutate(
      { existingId: existing?.id, values },
      { onSuccess: () => navigate('/taches/habitudes', { replace: true }) }
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.topLeft}>
        <IconLink to="/taches/habitudes" icon="chevronLeft" label="Retour" />
        <h2 className={styles.pageTitle}>
          {existing ? 'Modifier l’habitude' : 'Nouvelle habitude'}
        </h2>
      </div>

      <div className={styles.field}>
        <label htmlFor="habit-name">Nom</label>
        <input
          id="habit-name"
          className={styles.titleInput}
          value={form.name}
          autoFocus={!existing}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Jours de la semaine</span>
        <div className={styles.days} role="group" aria-label="Jours de la semaine">
          {WEEKDAYS.map((d) => (
            <button
              key={d.iso}
              type="button"
              className={form.weekdays.includes(d.iso) ? styles.dayOn : styles.day}
              aria-label={d.name}
              aria-pressed={form.weekdays.includes(d.iso)}
              onClick={() => toggleDay(d.iso)}
            >
              {d.letter}
            </button>
          ))}
        </div>
        <span className={styles.sub}>
          {form.weekdays.length === 0
            ? 'Choisis au moins un jour'
            : `${weekdaysLabel(form.weekdays)} · ${form.weekdays.length} fois par semaine`}
        </span>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Moment de la journée</span>
        <div className={styles.segmented} role="group" aria-label="Moment de la journée">
          {HABIT_MOMENTS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={m.key === form.moment ? styles.segOn : styles.seg}
              aria-pressed={m.key === form.moment}
              onClick={() => patch({ moment: m.key })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Ce que tu suis</span>
        <div className={styles.segmented} role="group" aria-label="Ce que tu suis">
          <button
            type="button"
            className={form.type === 'fait' ? styles.segOn : styles.seg}
            aria-pressed={form.type === 'fait'}
            onClick={() => patch({ type: 'fait' })}
          >
            Fait / pas fait
          </button>
          <button
            type="button"
            className={form.type === 'compteur' ? styles.segOn : styles.seg}
            aria-pressed={form.type === 'compteur'}
            onClick={() => patch({ type: 'compteur' })}
          >
            Compteur
          </button>
        </div>
        {form.type === 'compteur' && (
          <div className={styles.twoCols}>
            <div className={styles.field}>
              <label htmlFor="habit-target" className={styles.smallLabel}>
                Objectif par jour
              </label>
              <input
                id="habit-target"
                className={styles.input}
                inputMode="numeric"
                value={form.target}
                onChange={(e) => patch({ target: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="habit-unit" className={styles.smallLabel}>
                Unité
              </label>
              <input
                id="habit-unit"
                className={styles.input}
                value={form.unit}
                placeholder="pages, minutes…"
                onChange={(e) => patch({ unit: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Difficulté · détermine l’XP</span>
        <div className={styles.difficulties} role="group" aria-label="Difficulté">
          {TASK_DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              className={d.key === form.difficulty ? styles.diffOn : styles.diff}
              aria-pressed={d.key === form.difficulty}
              onClick={() => patch({ difficulty: d.key })}
            >
              <span className={styles.diffName}>{d.label}</span>
              <span className={styles.diffXp}>+{habitXp(d.key)} XP</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.reminderCard}>
        <label className={styles.switchRow}>
          <span className={styles.switchText}>
            <span className={styles.cardName}>Rappel</span>
            <span className={styles.sub}>Une notification les jours prévus</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className={styles.switch}
            checked={form.reminderOn}
            onChange={(e) => patch({ reminderOn: e.target.checked })}
          />
        </label>
        {form.reminderOn && (
          <label className={styles.timeRow}>
            <span>Heure du rappel</span>
            <input
              type="time"
              className={styles.timeInput}
              value={form.reminderTime}
              onChange={(e) => patch({ reminderTime: e.target.value })}
            />
          </label>
        )}
      </div>

      <div className={styles.xpCard}>
        <div className={styles.xpLine}>
          <span className={styles.xpBig}>+{habitXp(form.difficulty)} XP</span>
          <span className={styles.sub}>chaque jour validé</span>
        </div>
        <span className={styles.sub}>
          Une habitude comptée ne valide que lorsque l’objectif du jour est atteint.
        </span>
      </div>

      {save.isError && <p className={styles.error}>Impossible d’enregistrer l’habitude.</p>}
      <Button type="submit" fullWidth disabled={!values || save.isPending}>
        {existing ? 'Enregistrer' : 'Créer l’habitude'}
      </Button>

      {existing && status !== 'archived' && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            (status === 'paused'
              ? resume.mutateAsync({ habit: existing, today })
              : pause.mutateAsync({ habitId: existing.id, today })
            ).then(() => navigate('/taches/habitudes', { replace: true }))
          }
        >
          {status === 'paused' ? 'Reprendre l’habitude' : 'Mettre en pause'}
        </Button>
      )}
      {existing && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            status === 'archived'
              ? archive
                  .mutateAsync({ id: existing.id, archived: false })
                  .then(() => navigate('/taches/habitudes', { replace: true }))
              : setConfirmArchive(true)
          }
        >
          {status === 'archived' ? 'Désarchiver' : 'Archiver l’habitude'}
        </Button>
      )}

      <Sheet
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archiver cette habitude ?"
      >
        <p className={styles.sub}>
          Elle disparaît de ta routine, mais son historique est conservé.
        </p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmArchive(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={archive.isPending}
            onClick={() =>
              archive.mutate(
                { id: existing!.id, archived: true },
                { onSuccess: () => navigate('/taches/habitudes', { replace: true }) }
              )
            }
          >
            Archiver
          </Button>
        </div>
      </Sheet>
    </form>
  )
}
