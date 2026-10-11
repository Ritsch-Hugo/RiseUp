import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, IconLink } from '../../../core/ui'
import { GOAL_KCAL_STEP, GOAL_SLOT_OPTIONS } from '../config'
import {
  formToGoal,
  goalToForm,
  macroGapMessage,
  macroShares,
  type GoalForm,
  type GoalValues,
} from '../rules/goals'
import { useCurrentGoals, useSaveGoals } from './goalsQueries'
import styles from './goals.module.css'

export function GoalsPage() {
  const { data, isPending, isError } = useCurrentGoals()
  if (isPending) return <p className={styles.state}>Chargement…</p>
  if (isError) return <p className={styles.state}>Impossible de charger les objectifs.</p>
  return <GoalsForm initial={data} />
}

const MACROS = [
  { key: 'protein', label: 'Protéines', color: 'var(--macro-protein)' },
  { key: 'carbs', label: 'Glucides', color: 'var(--macro-carbs)' },
  { key: 'fat', label: 'Lipides', color: 'var(--macro-fat)' },
] as const

function GoalsForm({ initial }: { initial: GoalValues }) {
  const navigate = useNavigate()
  const save = useSaveGoals()
  const [form, setForm] = useState<GoalForm>(goalToForm(initial))
  const patch = (p: Partial<GoalForm>) => setForm((f) => ({ ...f, ...p }))
  const values = formToGoal(form)

  const stepKcal = (delta: number) => {
    const current = Number(form.kcal) || 0
    patch({ kcal: String(Math.max(GOAL_KCAL_STEP, current + delta)) })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!values) return
    save.mutate(values, { onSuccess: () => navigate('/nutrition/stats', { replace: true }) })
  }

  const shares = values ? macroShares(values) : null
  const gap = values ? macroGapMessage(values) : null

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.titleRow}>
        <IconLink to="/nutrition/stats" icon="chevronLeft" label="Retour aux stats" />
        <h2 className={styles.title}>Objectifs</h2>
      </div>

      <Card>
        <h3 className={styles.cardTitle}>Calories par jour</h3>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Diminuer les calories"
            onClick={() => stepKcal(-GOAL_KCAL_STEP)}
          >
            −
          </button>
          <label className={styles.stepValue}>
            <input
              className={styles.stepInput}
              inputMode="numeric"
              aria-label="Calories par jour"
              value={form.kcal}
              onChange={(e) => patch({ kcal: e.target.value })}
            />
            <span className={styles.unit}>kcal</span>
          </label>
          <button
            type="button"
            className={styles.stepButton}
            aria-label="Augmenter les calories"
            onClick={() => stepKcal(GOAL_KCAL_STEP)}
          >
            +
          </button>
        </div>
      </Card>

      <Card>
        <h3 className={styles.cardTitle}>Macros par jour</h3>
        {MACROS.map((m) => (
          <div key={m.key} className={styles.macroRow}>
            <span className={styles.dot} style={{ background: m.color }} />
            <span className={styles.macroName}>{m.label}</span>
            <span className={styles.unit}>{shares ? `${shares[m.key]} %` : ''}</span>
            <label className={styles.chip}>
              <input
                className={styles.chipInput}
                inputMode="numeric"
                aria-label={`${m.label} en grammes`}
                value={form[m.key]}
                onChange={(e) => patch({ [m.key]: e.target.value })}
              />
              g
            </label>
          </div>
        ))}
        {shares && (
          <div className={styles.shareBar} aria-hidden>
            {MACROS.map((m) => (
              <div key={m.key} style={{ width: `${shares[m.key]}%`, background: m.color }} />
            ))}
          </div>
        )}
        {gap && <p className={styles.warning}>{gap}</p>}
      </Card>

      <Card>
        <h3 className={styles.cardTitle}>Autres repères</h3>
        <Row
          label="Fibres (objectif)"
          unit="g"
          value={form.fiber}
          onChange={(v) => patch({ fiber: v })}
        />
        <Row
          label="Sel (maximum)"
          unit="g"
          value={form.salt}
          onChange={(v) => patch({ salt: v })}
          decimal
        />
        <Row
          label="Eau (objectif)"
          unit="L"
          value={form.water}
          onChange={(v) => patch({ water: v })}
          decimal
        />
      </Card>

      <Card>
        <h3 className={styles.cardTitle}>Quand un jour compte comme suivi</h3>
        <p className={styles.help}>Pour la série de jours suivis, il suffit d’avoir enregistré :</p>
        <div className={styles.segmented} role="group" aria-label="Repas à enregistrer">
          {GOAL_SLOT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={n === form.slots ? styles.segOn : styles.seg}
              aria-pressed={n === form.slots}
              onClick={() => patch({ slots: n })}
            >
              {n} repas
            </button>
          ))}
        </div>
        <p className={styles.help}>
          On récompense la régularité du suivi, pas le fait de manger moins.
        </p>
      </Card>

      {save.isError && <p className={styles.warning}>Impossible d’enregistrer les objectifs.</p>}
      <Button type="submit" fullWidth disabled={!values || save.isPending}>
        Enregistrer les objectifs
      </Button>
    </form>
  )
}

function Row({
  label,
  unit,
  value,
  onChange,
  decimal,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  decimal?: boolean
}) {
  return (
    <label className={styles.row}>
      <span>{label}</span>
      <span className={styles.rowValue}>
        <input
          className={styles.rowInput}
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.unit}>{unit}</span>
      </span>
    </label>
  )
}
