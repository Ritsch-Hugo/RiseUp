import { supabase } from '../supabase'
import type { Database } from '../db.types'

type TableName = keyof Database['public']['Tables']

/**
 * Tables exportées, parents avant enfants (ordre utile pour une future importation).
 * `push_subscriptions` est exclue : ce sont des clés d'appareil, pas des données à sauvegarder.
 * Les vues (stats, séries…) sont dérivées : rien à exporter.
 */
export const EXPORT_TABLES = [
  'muscu_exercises',
  'muscu_settings',
  'muscu_programs',
  'muscu_program_sessions',
  'muscu_session_exercises',
  'muscu_workouts',
  'muscu_workout_exercises',
  'muscu_sets',
  'nutri_foods',
  'nutri_goals',
  'nutri_meals',
  'nutri_meal_items',
  'nutri_entries',
  'nutri_water',
  'taches_categories',
  'taches_tasks',
  'taches_subtasks',
  'taches_habits',
  'taches_habit_pauses',
  'taches_habit_logs',
  'taches_quests',
  'taches_xp_events',
  'taches_badges',
  'taches_rewards',
] as const satisfies readonly TableName[]

/** Échoue à la compilation si une table de la base n'est ni exportée ni explicitement exclue. */
type Missing = Exclude<TableName, (typeof EXPORT_TABLES)[number] | 'push_subscriptions'>
const allTablesCovered: [Missing] extends [never] ? true : never = true
void allTablesCovered

export type ExportTable = (typeof EXPORT_TABLES)[number]
export type Row = Record<string, unknown>

export type ExportFile = {
  app: 'riseup'
  version: 1
  exported_at: string
  tables: Record<ExportTable, Row[]>
}

/** Lignes de la table par pages (la limite de l'API est de 1000 lignes par requête). */
const PAGE = 1000

async function fetchAllRows(table: ExportTable): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as Row[]))
    if (data.length < PAGE) return rows
  }
}

/** Toutes les données de l'utilisateur (la RLS limite chaque lecture à ses lignes). */
export async function buildExport(
  fetchRows: (table: ExportTable) => Promise<Row[]> = fetchAllRows,
  now: Date = new Date()
): Promise<ExportFile> {
  const entries = await Promise.all(
    EXPORT_TABLES.map(async (t) => [t, await fetchRows(t)] as const)
  )
  return {
    app: 'riseup',
    version: 1,
    exported_at: now.toISOString(),
    tables: Object.fromEntries(entries) as ExportFile['tables'],
  }
}

export const exportFileName = (day: string): string => `riseup-export-${day}.json`

/** Déclenche le téléchargement du fichier dans le navigateur. */
export function downloadJson(file: ExportFile, fileName: string): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
