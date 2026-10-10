import type { Tracking } from '../config'

/** Ligne de série telle qu'affichée : champs en texte (saisie libre), `done` = envoyée en base. */
export type Row = {
  id: string
  weight: string
  reps: string
  rpe: string
  duration: string
  warmup: boolean
  done: boolean
}

export type DbSet = {
  id: string
  position: number
  weight_kg: number
  reps: number
  rpe: number | null
  duration_seconds: number | null
  is_warmup: boolean
}

/** Série de la dernière séance terminée pour le même exercice. */
export type PrevSet = {
  weight_kg: number
  reps: number
  duration_seconds: number | null
  is_warmup: boolean
}

/** « 87,5 » ou « 87.5 » → 87.5 ; vide ou invalide → null. */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (t === '' || !/^\d+(\.\d+)?$/.test(t)) return null
  return Number(t)
}

export const formatNumber = (n: number) => String(n).replace('.', ',')

export function plannedRow(id: string, prev?: PrevSet): Row {
  return {
    id,
    weight: prev && prev.weight_kg > 0 ? formatNumber(prev.weight_kg) : '',
    reps: prev && prev.reps > 0 ? String(prev.reps) : '',
    rpe: '',
    duration: prev?.duration_seconds ? String(prev.duration_seconds) : '',
    warmup: false,
    done: false,
  }
}

const fromDb = (s: DbSet): Row => ({
  id: s.id,
  weight: s.weight_kg > 0 ? formatNumber(s.weight_kg) : '',
  reps: s.reps > 0 ? String(s.reps) : '',
  rpe: s.rpe === null ? '' : formatNumber(s.rpe),
  duration: s.duration_seconds ? String(s.duration_seconds) : '',
  warmup: s.is_warmup,
  done: true,
})

type ReconcileArgs = {
  dbSets: DbSet[]
  /** Brouillon local de cet exercice (null = aucun). */
  draft: Row[] | null
  targetSets: number | null
  /** Séries de la dernière séance terminée (travail uniquement, dans l'ordre). */
  previous: PrevSet[]
  newId: () => string
}

/**
 * Lignes à afficher pour un exercice : la base fait foi pour les séries validées,
 * le brouillon local fournit les lignes pas encore validées (et leur ordre).
 */
export function reconcileRows({
  dbSets,
  draft,
  targetSets,
  previous,
  newId,
}: ReconcileArgs): Row[] {
  const db = [...dbSets].sort((a, b) => a.position - b.position)
  const dbById = new Map(db.map((s) => [s.id, s]))

  if (draft) {
    const rows = draft.map((r) => {
      const s = dbById.get(r.id)
      return s ? fromDb(s) : { ...r, done: false }
    })
    const known = new Set(draft.map((r) => r.id))
    return [...rows, ...db.filter((s) => !known.has(s.id)).map(fromDb)]
  }

  const rows = db.map(fromDb)
  const missing = Math.max((targetSets ?? 1) - rows.length, rows.length === 0 ? 1 : 0)
  for (let i = 0; i < missing; i++) {
    const prev = previous[rows.length] ?? previous[previous.length - 1]
    rows.push(plannedRow(newId(), prev))
  }
  return rows
}

/** Une ligne est validable si elle contient de quoi faire une série (reps, ou durée pour un gainage). */
export function canValidate(row: Row, tracking: Tracking): boolean {
  if (tracking === 'duree') return (parseDecimal(row.duration) ?? 0) > 0
  return (parseDecimal(row.reps) ?? 0) > 0
}

/** Valeurs à écrire dans muscu_sets pour une ligne validée. */
export function toDbSet(row: Row, tracking: Tracking) {
  return {
    weight_kg: tracking === 'poids_reps' ? (parseDecimal(row.weight) ?? 0) : 0,
    reps: tracking === 'duree' ? 0 : Math.round(parseDecimal(row.reps) ?? 0),
    rpe: parseDecimal(row.rpe),
    duration_seconds: tracking === 'duree' ? Math.round(parseDecimal(row.duration) ?? 0) : null,
    is_warmup: row.warmup,
  }
}
