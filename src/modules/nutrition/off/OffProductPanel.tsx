import { Button } from '../../../core/ui'
import { formatAmount } from '../rules/food'
import type { OffFood } from '../rules/off'
import styles from './off.module.css'

/** Produit Open Food Facts : valeurs pour 100 g et actions (utilisé par le scan et par la recherche). */
export function OffProductPanel({
  food,
  saving,
  failed,
  onAdd,
  onEdit,
}: {
  food: OffFood
  saving: boolean
  failed: boolean
  onAdd: () => void
  onEdit: () => void
}) {
  const v = food.values
  const kcal = v.kcal ?? v.protein * 4 + v.carbs * 4 + v.fat * 9
  return (
    <div className={styles.panel}>
      <div>
        <h2 className={styles.name}>{food.name}</h2>
        <span className={styles.sub}>
          {[food.brand, food.quantity].filter(Boolean).join(' · ') || 'Marque inconnue'}
        </span>
      </div>

      <div className={styles.values}>
        <span className={styles.valuesTitle}>POUR 100 G</span>
        <div className={styles.valuesRow}>
          <div>
            <b>{formatAmount(kcal, 0)}</b>
            <span>kcal</span>
          </div>
          <div>
            <b style={{ color: 'var(--macro-protein)' }}>{formatAmount(v.protein)} g</b>
            <span>Protéines</span>
          </div>
          <div>
            <b style={{ color: 'var(--macro-carbs)' }}>{formatAmount(v.carbs)} g</b>
            <span>Glucides</span>
          </div>
          <div>
            <b style={{ color: 'var(--macro-fat)' }}>{formatAmount(v.fat)} g</b>
            <span>Lipides</span>
          </div>
        </div>
        <div className={styles.valuesExtra}>
          <span>Fibres {formatAmount(v.fiber)} g</span>
          <span>Sucres {formatAmount(v.sugars)} g</span>
          <span>Sel {formatAmount(v.salt, 2)} g</span>
        </div>
      </div>

      {failed && <p className={styles.error}>Impossible d’enregistrer l’aliment.</p>}
      <Button fullWidth disabled={saving} onClick={onAdd}>
        Ajouter au journal
      </Button>
      <Button variant="secondary" fullWidth disabled={saving} onClick={onEdit}>
        Modifier avant d’ajouter
      </Button>
      <span className={styles.credit}>
        Données Open Food Facts · vérifie les valeurs avant d’enregistrer
      </span>
    </div>
  )
}
