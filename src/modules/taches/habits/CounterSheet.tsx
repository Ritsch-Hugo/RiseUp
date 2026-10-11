import { useState } from 'react'
import { Button, Sheet } from '../../../core/ui'
import { useSetHabitValue, type Habit } from './habitQueries'
import styles from './habits.module.css'

/** Saisie de la valeur du jour d'une habitude à compteur. */
export function CounterSheet({
  habit,
  day,
  value,
  onClose,
}: {
  habit: Habit | null
  day: string
  value: number
  onClose: () => void
}) {
  return (
    <Sheet open={habit !== null} onClose={onClose} title={habit?.name}>
      {habit && (
        <CounterForm key={habit.id} habit={habit} day={day} value={value} onClose={onClose} />
      )}
    </Sheet>
  )
}

function CounterForm({
  habit,
  day,
  value,
  onClose,
}: {
  habit: Habit
  day: string
  value: number
  onClose: () => void
}) {
  const setValue = useSetHabitValue()
  const [text, setText] = useState(String(value))
  const target = habit.target ?? 0
  const parsed = Number(text.replace(',', '.'))
  const valid = text.trim() !== '' && Number.isInteger(parsed) && parsed >= 0
  const unit = habit.unit ?? ''
  const step = (delta: number) => setText(String(Math.max(0, (valid ? parsed : 0) + delta)))

  return (
    <div className={styles.sheetBody}>
      <p className={styles.sub}>
        Objectif du jour : {target} {unit}
      </p>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          aria-label="Diminuer"
          onClick={() => step(-1)}
        >
          −
        </button>
        <div className={styles.stepValue}>
          <input
            className={styles.stepInput}
            inputMode="numeric"
            aria-label="Valeur du jour"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className={styles.unit}>{unit}</span>
        </div>
        <button
          type="button"
          className={styles.stepButton}
          aria-label="Augmenter"
          onClick={() => step(1)}
        >
          +
        </button>
      </div>
      <button type="button" className={styles.reachButton} onClick={() => setText(String(target))}>
        Objectif atteint ({target})
      </button>
      <Button
        fullWidth
        disabled={!valid}
        onClick={() => {
          setValue.mutate({ habit, day, value: parsed, previous: value })
          onClose()
        }}
      >
        Enregistrer
      </Button>
    </div>
  )
}
