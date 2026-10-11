import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Sheet } from '../../../core/ui'
import { foodSummary } from '../rules/food'
import type { OffFood } from '../rules/off'
import { OffProductPanel } from './OffProductPanel'
import { useOffActions, useOffSearch } from './offQueries'
import styles from './off.module.css'

const MIN_QUERY = 2

/** Recherche en ligne (Open Food Facts), lancée seulement sur demande : le local passe d'abord. */
export function OnlineSearch({ query }: { query: string }) {
  const { search } = useLocation()
  const text = query.trim()
  const run = useOffSearch()
  const actions = useOffActions(search)
  const [picked, setPicked] = useState<OffFood | null>(null)

  if (text.length < MIN_QUERY) return null

  return (
    <Card>
      <h2 className={styles.title}>Pas dans ta liste ?</h2>
      <p className={styles.help}>
        Cherche « {text} » dans Open Food Facts, ou scanne le code-barres.
      </p>
      <button
        type="button"
        className={styles.searchButton}
        disabled={run.isPending}
        onClick={() => run.mutate(text)}
      >
        {run.isPending ? 'Recherche…' : 'Chercher en ligne'}
      </button>
      {run.isError && (
        <p className={styles.error}>La recherche en ligne a échoué. Réessaie dans un instant.</p>
      )}
      {run.data?.length === 0 && <p className={styles.help}>Aucun produit trouvé.</p>}
      {run.data && run.data.length > 0 && (
        <div className={styles.results}>
          {run.data.map((f) => (
            <button
              key={f.barcode}
              type="button"
              className={styles.result}
              onClick={() => setPicked(f)}
            >
              <span className={styles.resultName}>
                {f.name}
                {f.brand ? ` · ${f.brand}` : ''}
              </span>
              <span className={styles.sub}>
                {foodSummary({ ...f.values, serving_g: null, serving_label: null })}
              </span>
            </button>
          ))}
          <span className={styles.credit}>Données : Open Food Facts</span>
        </div>
      )}

      <Sheet open={picked !== null} onClose={() => setPicked(null)} title="Produit trouvé">
        {picked && (
          <OffProductPanel
            food={picked}
            saving={actions.saving}
            failed={actions.failed}
            onAdd={() => actions.add(picked)}
            onEdit={() => actions.edit(picked)}
          />
        )}
      </Sheet>
    </Card>
  )
}
