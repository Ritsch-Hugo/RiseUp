import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Button, IconLink } from '../../../core/ui'
import {
  DEFAULT_QUEST_TARGET,
  HABIT_MOMENTS,
  QUEST_BONUS_XP,
  QUEST_KINDS,
  QUEST_PERIODS,
  TASK_DIFFICULTIES,
} from '../config'
import { periodStart, suggestQuestTitle, validateQuestForm, type QuestForm } from '../rules/quests'
import { useCategories } from '../tasks/taskQueries'
import { useCreateQuest } from './questQueries'
import styles from './quests.module.css'

/** Création d'une quête : période, type, paramètres du type, objectif, titre, reconduction. */
export function QuestFormPage() {
  const navigate = useNavigate()
  const today = parisDay()
  const { data: categories = [] } = useCategories()
  const create = useCreateQuest()
  const [form, setForm] = useState<QuestForm>({
    period: 'jour',
    kind: 'n_taches',
    difficulty: null,
    categoryId: null,
    moment: null,
    target: String(DEFAULT_QUEST_TARGET),
    title: '',
    recurring: false,
  })
  const patch = (p: Partial<QuestForm>) => setForm((f) => ({ ...f, ...p }))
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? null
  const values = validateQuestForm(form, periodStart(form.period, today), categoryName)
  const target = Number(form.target)
  const suggestion =
    form.kind === 'manuelle'
      ? ''
      : suggestQuestTitle(
          form.kind,
          {
            difficulty: form.difficulty ?? undefined,
            category_id: form.categoryId ?? undefined,
            moment: form.moment ?? undefined,
          },
          Number.isInteger(target) && target > 0 ? target : 1,
          categoryName
        )
  const period = QUEST_PERIODS.find((p) => p.key === form.period)!
  const step = (delta: number) =>
    patch({ target: String(Math.max(1, (Number.isInteger(target) ? target : 1) + delta)) })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!values) return
    create.mutate(values, { onSuccess: () => navigate('/taches/quetes', { replace: true }) })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.topLeft}>
        <IconLink to="/taches/quetes" icon="chevronLeft" label="Retour" />
        <h2 className={styles.pageTitle}>Nouvelle quête</h2>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Période</span>
        <div className={styles.segmented} role="group" aria-label="Période">
          {QUEST_PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={p.key === form.period ? styles.segOn : styles.seg}
              aria-pressed={p.key === form.period}
              onClick={() => patch({ period: p.key })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Type de quête</span>
        <div className={styles.kinds} role="group" aria-label="Type de quête">
          {QUEST_KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={k.key === form.kind ? styles.kindOn : styles.kind}
              aria-pressed={k.key === form.kind}
              onClick={() => patch({ kind: k.key })}
            >
              <span className={styles.kindName}>{k.label}</span>
              <span className={styles.sub}>{k.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {form.kind === 'n_taches' && (
        <div className={styles.field}>
          <span className={styles.label}>Difficulté (optionnel)</span>
          <div className={styles.pills} role="group" aria-label="Difficulté">
            <button
              type="button"
              className={form.difficulty === null ? styles.pillOn : styles.pill}
              aria-pressed={form.difficulty === null}
              onClick={() => patch({ difficulty: null })}
            >
              Toutes
            </button>
            {TASK_DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                type="button"
                className={form.difficulty === d.key ? styles.pillOn : styles.pill}
                aria-pressed={form.difficulty === d.key}
                onClick={() => patch({ difficulty: d.key })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.kind === 'n_taches_categorie' && (
        <div className={styles.field}>
          <span className={styles.label}>Catégorie</span>
          {categories.length === 0 ? (
            <span className={styles.sub}>Crée d’abord une catégorie en ajoutant une tâche.</span>
          ) : (
            <div className={styles.pills} role="group" aria-label="Catégorie">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={form.categoryId === c.id ? styles.pillOn : styles.pill}
                  aria-pressed={form.categoryId === c.id}
                  onClick={() => patch({ categoryId: c.id })}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {form.kind === 'habitudes_moment' && (
        <div className={styles.field}>
          <span className={styles.label}>Moment de la journée</span>
          <div className={styles.pills} role="group" aria-label="Moment de la journée">
            {HABIT_MOMENTS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={form.moment === m.key ? styles.pillOn : styles.pill}
                aria-pressed={form.moment === m.key}
                onClick={() => patch({ moment: m.key })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.field}>
        <span className={styles.label}>Objectif</span>
        <div className={styles.targetRow}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Diminuer"
            onClick={() => step(-1)}
          >
            −
          </button>
          <input
            className={styles.targetInput}
            inputMode="numeric"
            aria-label="Objectif"
            value={form.target}
            onChange={(e) => patch({ target: e.target.value })}
          />
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Augmenter"
            onClick={() => step(1)}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="quest-title" className={styles.label}>
          Titre{form.kind === 'manuelle' ? '' : ' (facultatif)'}
        </label>
        <input
          id="quest-title"
          className={styles.titleInput}
          value={form.title}
          placeholder={suggestion || 'Ex. Courir 3 fois'}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>

      <label className={styles.switchRow}>
        <span className={styles.switchText}>
          <span className={styles.switchTitle}>Reconduire {period.reconduct}</span>
          <span className={styles.sub}>
            La quête est recréée automatiquement à chaque nouvelle période.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className={styles.switch}
          checked={form.recurring}
          onChange={(e) => patch({ recurring: e.target.checked })}
        />
      </label>

      <div className={styles.bonusCard}>
        <span className={styles.bonusBig}>+{QUEST_BONUS_XP[form.period]} XP</span>
        <span className={styles.sub}>à la validation de la quête (bonus fixe)</span>
      </div>

      {create.isError && <p className={styles.error}>Impossible de créer la quête.</p>}
      <Button type="submit" fullWidth disabled={!values || create.isPending}>
        Créer la quête
      </Button>
    </form>
  )
}
