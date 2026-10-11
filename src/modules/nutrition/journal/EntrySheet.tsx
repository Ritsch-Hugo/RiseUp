import { useState } from 'react'
import { Button, Sheet } from '../../../core/ui'
import { formatAmount } from '../rules/food'
import { useDeleteEntry, useUpdateEntryQuantity, type JournalEntry } from './journalQueries'
import styles from './journal.module.css'

/** Modifier la quantité d'une entrée ou la supprimer. */
export function EntrySheet({
  entry,
  onClose,
}: {
  entry: JournalEntry | null
  onClose: () => void
}) {
  return (
    <Sheet open={entry !== null} onClose={onClose} title={entry?.food?.name ?? 'Aliment'}>
      {entry && <EntryForm key={entry.id} entry={entry} onClose={onClose} />}
    </Sheet>
  )
}

function EntryForm({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const update = useUpdateEntryQuantity()
  const remove = useDeleteEntry()
  const [value, setValue] = useState(formatAmount(entry.quantity_g, 2).replace(/\s/g, ''))
  const grams = Number(value.replace(',', '.'))
  const valid = value.trim() !== '' && Number.isFinite(grams) && grams > 0

  return (
    <div className={styles.sheetBody}>
      <label htmlFor="entry-quantity" className={styles.sub}>
        Quantité (g)
      </label>
      <input
        id="entry-quantity"
        className={styles.sheetInput}
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className={styles.sheetActions}>
        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            remove.mutate(entry)
            onClose()
          }}
        >
          Supprimer
        </Button>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            if (grams !== entry.quantity_g) update.mutate({ entry, grams })
            onClose()
          }}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
