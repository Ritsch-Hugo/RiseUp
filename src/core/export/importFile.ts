import { EXPORT_TABLES, type ExportFile, type ExportTable, type Row } from './exportFile'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Lit un fichier d'export : renvoie le contenu, ou un message d'erreur lisible. */
export function parseImport(text: string): { file: ExportFile } | { error: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { error: 'Ce fichier n’est pas un JSON valide.' }
  }
  const obj = data as { app?: unknown; version?: unknown; tables?: unknown } | null
  if (!obj || obj.app !== 'riseup' || typeof obj.tables !== 'object' || obj.tables === null) {
    return { error: 'Ce fichier n’est pas un export RiseUp.' }
  }
  if (obj.version !== 1) return { error: 'Version d’export non prise en charge.' }
  const given = obj.tables as Record<string, unknown>
  const tables = {} as Record<ExportTable, Row[]>
  for (const t of EXPORT_TABLES) {
    const rows = given[t] ?? []
    if (!Array.isArray(rows)) return { error: `Table « ${t} » illisible.` }
    for (const r of rows) {
      const id = (r as { id?: unknown } | null)?.id
      if (typeof id !== 'string' || !UUID.test(id)) {
        return { error: `Table « ${t} » : une ligne n’a pas d’identifiant valide.` }
      }
    }
    tables[t] = rows as Row[]
  }
  return { file: { ...(obj as ExportFile), tables } }
}

type Fk = { column: string; parent: ExportTable; nullable: boolean }

type TableRule = {
  /** Colonnes qui identifient une ligne en plus de `id` (contrainte d'unicité côté base). */
  key?: string[]
  fks?: Fk[]
  /** Lignes jamais importées (ex. séance encore ouverte : la base n'en accepte qu'une). */
  skip?: (row: Row) => boolean
}

/** Clés étrangères et unicités à respecter pour fusionner sans erreur. */
export const RULES: Partial<Record<ExportTable, TableRule>> = {
  muscu_settings: { key: [] },
  muscu_program_sessions: {
    fks: [{ column: 'program_id', parent: 'muscu_programs', nullable: false }],
  },
  muscu_session_exercises: {
    fks: [
      { column: 'session_id', parent: 'muscu_program_sessions', nullable: false },
      { column: 'exercise_id', parent: 'muscu_exercises', nullable: false },
    ],
  },
  muscu_workouts: {
    fks: [{ column: 'session_id', parent: 'muscu_program_sessions', nullable: true }],
    skip: (r) => r.ended_at === null || r.ended_at === undefined,
  },
  muscu_workout_exercises: {
    fks: [
      { column: 'workout_id', parent: 'muscu_workouts', nullable: false },
      { column: 'exercise_id', parent: 'muscu_exercises', nullable: false },
    ],
  },
  muscu_sets: {
    fks: [{ column: 'workout_exercise_id', parent: 'muscu_workout_exercises', nullable: false }],
  },
  nutri_foods: { key: ['barcode'] },
  nutri_goals: { key: ['effective_from'] },
  nutri_meal_items: {
    fks: [
      { column: 'meal_id', parent: 'nutri_meals', nullable: false },
      { column: 'food_id', parent: 'nutri_foods', nullable: false },
    ],
  },
  nutri_entries: {
    fks: [
      { column: 'food_id', parent: 'nutri_foods', nullable: false },
      { column: 'from_meal_id', parent: 'nutri_meals', nullable: true },
    ],
  },
  taches_tasks: {
    fks: [
      { column: 'category_id', parent: 'taches_categories', nullable: true },
      { column: 'recurred_from', parent: 'taches_tasks', nullable: true },
    ],
  },
  taches_subtasks: { fks: [{ column: 'task_id', parent: 'taches_tasks', nullable: false }] },
  taches_habits: { fks: [{ column: 'category_id', parent: 'taches_categories', nullable: true }] },
  taches_habit_pauses: { fks: [{ column: 'habit_id', parent: 'taches_habits', nullable: false }] },
  taches_habit_logs: {
    key: ['habit_id', 'day'],
    fks: [{ column: 'habit_id', parent: 'taches_habits', nullable: false }],
  },
  taches_badges: { key: ['badge_key'] },
  taches_rewards: { key: ['level'] },
}

/** Colonnes à lire dans la base pour reconnaître les lignes déjà présentes. */
export const existingColumns = (t: ExportTable): string[] => ['id', ...(RULES[t]?.key ?? [])]

export type TableReport = {
  /** Lignes à ajouter. */
  add: number
  /** Lignes déjà présentes (même identifiant ou même clé). */
  existing: number
  /** Lignes écartées (séance ouverte, parent absent…). */
  dropped: number
}

export type ImportPlan = {
  inserts: { table: ExportTable; rows: Row[] }[]
  report: Record<ExportTable, TableReport>
}

const keyOf = (row: Row, cols: string[]) => cols.map((c) => String(row[c] ?? '')).join('\u0000')

/** Parents avant enfants pour une clé étrangère vers la même table. */
function parentsFirst(rows: Row[], column: string): Row[] {
  const byId = new Map(rows.map((r) => [r.id as string, r]))
  const depth = (r: Row, seen = new Set<string>()): number => {
    const p = r[column]
    if (typeof p !== 'string' || !byId.has(p) || seen.has(p)) return 0
    return 1 + depth(byId.get(p)!, seen.add(p))
  }
  return [...rows].sort((a, b) => depth(a) - depth(b))
}

/**
 * Fusion : n'ajoute que ce qui manque. Une ligne dont l'identifiant (ou la clé naturelle) existe déjà est
 * gardée telle quelle ; les lignes qui s'y rattachent sont rebranchées sur l'existante. `user_id` est
 * retiré : la base remet celui du compte connecté. `existing` = lignes déjà en base (colonnes de `existingColumns`).
 */
export function planImport(file: ExportFile, existing: Record<ExportTable, Row[]>): ImportPlan {
  const existingIds = {} as Record<ExportTable, Set<string>>
  const fileIds = {} as Record<ExportTable, Set<string>>
  for (const t of EXPORT_TABLES) {
    existingIds[t] = new Set(existing[t].map((r) => r.id as string))
    fileIds[t] = new Set(file.tables[t].map((r) => r.id as string))
  }
  const remap = {} as Record<ExportTable, Map<string, string>>
  const dropped = {} as Record<ExportTable, Set<string>>
  const inserts: ImportPlan['inserts'] = []
  const report = {} as ImportPlan['report']

  for (const t of EXPORT_TABLES) {
    remap[t] = new Map()
    dropped[t] = new Set()
    const rule = RULES[t]
    const cols = rule?.key ?? []
    const known = new Map<string, string>()
    // muscu_settings : une seule ligne par compte, identifiée sans colonne supplémentaire.
    const single = t === 'muscu_settings'
    for (const e of existing[t]) {
      if (single) known.set('', e.id as string)
      else if (cols.length > 0 && cols.every((c) => e[c] != null))
        known.set(keyOf(e, cols), e.id as string)
    }

    const rows: Row[] = []
    const r: TableReport = { add: 0, existing: 0, dropped: 0 }
    for (const row of file.tables[t]) {
      const id = row.id as string
      if (existingIds[t].has(id)) {
        r.existing++
        continue
      }
      const hasKey = single || (cols.length > 0 && cols.every((c) => row[c] != null))
      const twin = hasKey ? known.get(single ? '' : keyOf(row, cols)) : undefined
      if (twin) {
        remap[t].set(id, twin)
        r.existing++
        continue
      }
      if (rule?.skip?.(row)) {
        dropped[t].add(id)
        r.dropped++
        continue
      }
      const out: Row = { ...row }
      delete out.user_id
      let ok = true
      for (const fk of rule?.fks ?? []) {
        const v = out[fk.column]
        if (typeof v !== 'string') continue
        const mapped = remap[fk.parent].get(v)
        if (mapped) out[fk.column] = mapped
        else if (
          dropped[fk.parent].has(v) ||
          !(existingIds[fk.parent].has(v) || fileIds[fk.parent].has(v))
        ) {
          if (fk.nullable) out[fk.column] = null
          else ok = false
        }
      }
      if (!ok) {
        dropped[t].add(id)
        r.dropped++
        continue
      }
      if (hasKey) known.set(single ? '' : keyOf(row, cols), id)
      rows.push(out)
      r.add++
    }
    const selfFk = rule?.fks?.find((f) => f.parent === t)
    inserts.push({ table: t, rows: selfFk ? parentsFirst(rows, selfFk.column) : rows })
    report[t] = r
  }
  return { inserts, report }
}

export const totalOf = (plan: ImportPlan, field: keyof TableReport): number =>
  Object.values(plan.report).reduce((t, r) => t + r[field], 0)
