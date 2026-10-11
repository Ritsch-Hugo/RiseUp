import { describe, expect, it } from 'vitest'
import { EXPORT_TABLES, buildExport, type ExportTable, type Row } from './exportFile'
import { parseImport, planImport, totalOf } from './importFile'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const empty = () =>
  Object.fromEntries(EXPORT_TABLES.map((t) => [t, [] as Row[]])) as Record<ExportTable, Row[]>

const fileWith = async (tables: Partial<Record<ExportTable, Row[]>>) =>
  buildExport(async (t) => tables[t] ?? [])

const planWith = async (
  tables: Partial<Record<ExportTable, Row[]>>,
  existing: Partial<Record<ExportTable, Row[]>> = {}
) => planImport(await fileWith(tables), { ...empty(), ...existing })

const rowsOf = (plan: Awaited<ReturnType<typeof planWith>>, t: ExportTable) =>
  plan.inserts.find((i) => i.table === t)!.rows

describe('lecture du fichier', () => {
  it('refuse ce qui n’est pas un export RiseUp', () => {
    expect(parseImport('pas du json')).toHaveProperty('error')
    expect(parseImport('{"app":"autre","tables":{}}')).toHaveProperty('error')
    expect(parseImport('{"app":"riseup","version":2,"tables":{}}')).toHaveProperty('error')
  })
  it('refuse une ligne sans identifiant valide', () => {
    const bad = { app: 'riseup', version: 1, tables: { nutri_water: [{ id: 'x' }] } }
    expect(parseImport(JSON.stringify(bad))).toHaveProperty('error')
  })
  it('accepte un export complet et complète les tables absentes', async () => {
    const file = await fileWith({ nutri_water: [{ id: id(1), amount_ml: 250 }] })
    const parsed = parseImport(
      JSON.stringify({ ...file, tables: { nutri_water: file.tables.nutri_water } })
    )
    expect('file' in parsed && parsed.file.tables.taches_tasks).toEqual([])
  })
})

describe('fusion', () => {
  it('ajoute ce qui manque, garde ce qui existe, retire user_id', async () => {
    const plan = await planWith(
      {
        nutri_water: [
          { id: id(1), user_id: 'ancien', amount_ml: 250 },
          { id: id(2), user_id: 'ancien', amount_ml: 500 },
        ],
      },
      { nutri_water: [{ id: id(1) }] }
    )
    expect(plan.report.nutri_water).toEqual({ add: 1, existing: 1, dropped: 0 })
    expect(rowsOf(plan, 'nutri_water')).toEqual([{ id: id(2), amount_ml: 500 }])
  })
  it('est idempotent : un second import n’ajoute rien', async () => {
    const water = [{ id: id(1) }, { id: id(2) }]
    const plan = await planWith({ nutri_water: water }, { nutri_water: water })
    expect(totalOf(plan, 'add')).toBe(0)
    expect(totalOf(plan, 'existing')).toBe(2)
  })
  it('un aliment avec le même code-barres est rebranché sur celui qui existe', async () => {
    const plan = await planWith(
      {
        nutri_foods: [{ id: id(1), barcode: '123' }],
        nutri_entries: [{ id: id(10), food_id: id(1), from_meal_id: null }],
      },
      { nutri_foods: [{ id: id(99), barcode: '123' }] }
    )
    expect(rowsOf(plan, 'nutri_foods')).toEqual([])
    expect(rowsOf(plan, 'nutri_entries')).toEqual([
      { id: id(10), food_id: id(99), from_meal_id: null },
    ])
  })
  it('deux aliments sans code-barres ne se confondent pas', async () => {
    const plan = await planWith(
      { nutri_foods: [{ id: id(1), barcode: null }] },
      { nutri_foods: [{ id: id(2), barcode: null }] }
    )
    expect(plan.report.nutri_foods.add).toBe(1)
  })
  it('garde les réglages existants (une seule ligne par compte)', async () => {
    const plan = await planWith(
      { muscu_settings: [{ id: id(1) }] },
      { muscu_settings: [{ id: id(2) }] }
    )
    expect(plan.report.muscu_settings).toEqual({ add: 0, existing: 1, dropped: 0 })
  })
  it('une récompense, un badge ou un objectif au même niveau / même clé existe déjà', async () => {
    const plan = await planWith(
      {
        taches_rewards: [{ id: id(1), level: 8 }],
        taches_badges: [{ id: id(2), badge_key: 'boss_1' }],
        nutri_goals: [{ id: id(3), effective_from: '2026-10-01' }],
      },
      {
        taches_rewards: [{ id: id(11), level: 8 }],
        taches_badges: [{ id: id(12), badge_key: 'boss_1' }],
        nutri_goals: [{ id: id(13), effective_from: '2026-10-01' }],
      }
    )
    expect(totalOf(plan, 'add')).toBe(0)
  })
  it('écarte la séance encore ouverte et ses séries', async () => {
    const plan = await planWith({
      muscu_exercises: [{ id: id(50) }],
      muscu_workouts: [
        { id: id(1), ended_at: '2026-10-01T10:00:00Z', session_id: null },
        { id: id(2), ended_at: null, session_id: null },
      ],
      muscu_workout_exercises: [
        { id: id(3), workout_id: id(1), exercise_id: id(50) },
        { id: id(4), workout_id: id(2), exercise_id: id(50) },
      ],
      muscu_sets: [{ id: id(5), workout_exercise_id: id(4) }],
    })
    expect(plan.report.muscu_workouts).toEqual({ add: 1, existing: 0, dropped: 1 })
    expect(rowsOf(plan, 'muscu_workout_exercises').map((r) => r.id)).toEqual([id(3)])
    expect(plan.report.muscu_sets.dropped).toBe(1)
  })
  it('un lien facultatif vers un parent absent est vidé, un lien obligatoire écarte la ligne', async () => {
    const plan = await planWith({
      taches_tasks: [{ id: id(1), category_id: id(77), recurred_from: id(78) }],
      taches_subtasks: [{ id: id(2), task_id: id(79) }],
    })
    expect(rowsOf(plan, 'taches_tasks')).toEqual([
      { id: id(1), category_id: null, recurred_from: null },
    ])
    expect(plan.report.taches_subtasks.dropped).toBe(1)
  })
  it('tâches récurrentes : le parent est inséré avant son enfant', async () => {
    const plan = await planWith({
      taches_tasks: [
        { id: id(2), recurred_from: id(1), category_id: null },
        { id: id(1), recurred_from: null, category_id: null },
      ],
    })
    expect(rowsOf(plan, 'taches_tasks').map((r) => r.id)).toEqual([id(1), id(2)])
  })
})
