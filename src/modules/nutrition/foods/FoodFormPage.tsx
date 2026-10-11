import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, IconLink, Sheet } from '../../../core/ui'
import { offToForm, type OffFood } from '../rules/off'
import { EMPTY_FOOD_FORM, foodToForm, validateFoodForm, type FoodForm } from '../rules/food'
import { useArchiveFood, useFoods, useSaveFood, type Food } from './foodQueries'
import styles from './foods.module.css'

export function FoodFormPage() {
  const { id } = useParams()
  const { data: foods, isPending } = useFoods()
  if (id && isPending) return <p className={styles.state}>Chargement…</p>
  const existing = id ? foods?.find((f) => f.id === id) : undefined
  if (id && !existing) return <Navigate to="/nutrition/aliments" replace />
  return <FoodEditor existing={existing} />
}

const NUTRIENTS = [
  { key: 'kcal', label: 'Calories (kcal)', hint: 'auto' },
  { key: 'protein', label: 'Protéines (g)', color: 'var(--macro-protein)' },
  { key: 'carbs', label: 'Glucides (g)', color: 'var(--macro-carbs)' },
  { key: 'sugars', label: 'dont sucres (g)' },
  { key: 'fat', label: 'Lipides (g)', color: 'var(--macro-fat)' },
  { key: 'saturatedFat', label: 'dont saturés (g)' },
  { key: 'fiber', label: 'Fibres (g)' },
  { key: 'salt', label: 'Sel (g)' },
] as const

function FoodEditor({ existing }: { existing: Food | undefined }) {
  const navigate = useNavigate()
  const save = useSaveFood()
  const { state, search } = useLocation()
  const off = (state as { off?: OffFood; barcode?: string } | null)?.off
  const scannedCode = (state as { barcode?: string } | null)?.barcode ?? off?.barcode
  const archive = useArchiveFood()
  const [form, setForm] = useState<FoodForm>(
    existing ? foodToForm(existing) : off ? offToForm(off) : EMPTY_FOOD_FORM
  )
  const [confirmArchive, setConfirmArchive] = useState(false)
  const patch = (p: Partial<FoodForm>) => setForm((f) => ({ ...f, ...p }))
  const result = validateFoodForm(form)

  const back = existing
    ? `/nutrition/aliments/${existing.id}${search}`
    : `/nutrition/aliments${search}`

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!('values' in result)) return
    save.mutate(
      {
        existingId: existing?.id,
        values: existing
          ? result.values
          : {
              ...result.values,
              ...(off ? { source: 'off' as const } : {}),
              barcode: scannedCode ?? null,
            },
      },
      { onSuccess: (id) => navigate(`/nutrition/aliments/${id}${search}`, { replace: true }) }
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.titleRow}>
        <IconLink to={back} icon="chevronLeft" label="Retour" />
        <h2 className={styles.title}>{existing ? 'Modifier l’aliment' : 'Nouvel aliment'}</h2>
      </div>

      {!existing && off && (
        <p className={styles.notice}>
          Valeurs pré-remplies depuis Open Food Facts. Corrige-les si l’étiquette dit autre chose.
        </p>
      )}
      {!existing && !off && scannedCode && (
        <p className={styles.notice}>
          Code-barres {scannedCode} : il sera retrouvé au prochain scan.
        </p>
      )}
      {existing?.source === 'off' && (
        <p className={styles.notice}>
          Valeurs issues d’Open Food Facts. Corrige-les si l’étiquette dit autre chose.
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="name">Nom</label>
        <input
          id="name"
          className={styles.input}
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>

      <div className={styles.twoCols}>
        <div className={styles.field}>
          <label htmlFor="brand">Marque (optionnel)</label>
          <input
            id="brand"
            className={styles.input}
            value={form.brand}
            onChange={(e) => patch({ brand: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="serving">1 portion (g)</label>
          <input
            id="serving"
            className={styles.input}
            inputMode="decimal"
            value={form.servingG}
            onChange={(e) => patch({ servingG: e.target.value })}
          />
        </div>
      </div>

      {form.servingG.trim() !== '' && (
        <div className={styles.field}>
          <label htmlFor="serving-label">Nom de la portion (optionnel, ex. « 1 pot »)</label>
          <input
            id="serving-label"
            className={styles.input}
            value={form.servingLabel}
            onChange={(e) => patch({ servingLabel: e.target.value })}
          />
        </div>
      )}

      <h3 className={styles.section}>Valeurs pour 100 g</h3>
      <div className={styles.grid}>
        {NUTRIENTS.map((n) => (
          <div key={n.key} className={styles.field}>
            <label htmlFor={n.key} style={'color' in n ? { color: n.color } : undefined}>
              {n.label}
            </label>
            <input
              id={n.key}
              className={`${styles.input} ${styles.number}`}
              inputMode="decimal"
              placeholder={'hint' in n ? n.hint : '0'}
              value={form[n.key]}
              onChange={(e) => patch({ [n.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <p className={styles.help}>
        Calories vides : calculées depuis les macros (P × 4 + G × 4 + L × 9).
      </p>

      <label className={styles.toggleRow}>
        <span>Ajouter aux favoris</span>
        <input
          type="checkbox"
          checked={form.favorite}
          onChange={(e) => patch({ favorite: e.target.checked })}
        />
      </label>

      {'error' in result && result.error && <p className={styles.error}>{result.error}</p>}
      {save.isError && <p className={styles.error}>Impossible d’enregistrer l’aliment.</p>}

      <Button type="submit" fullWidth disabled={!('values' in result) || save.isPending}>
        Enregistrer l’aliment
      </Button>
      {existing && (
        <Button variant="secondary" fullWidth onClick={() => setConfirmArchive(true)}>
          Archiver l’aliment
        </Button>
      )}

      <Sheet
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archiver cet aliment ?"
      >
        <p className={styles.help}>Il disparaît des listes mais reste visible dans ton journal.</p>
        <div className={styles.sheetActions}>
          <Button variant="secondary" fullWidth onClick={() => setConfirmArchive(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={archive.isPending}
            onClick={() =>
              archive.mutate(existing!.id, {
                onSuccess: () => navigate('/nutrition/aliments', { replace: true }),
              })
            }
          >
            Archiver
          </Button>
        </div>
      </Sheet>
    </form>
  )
}
