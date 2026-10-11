import { supabase } from '../supabase'
import { EXPORT_TABLES, type ExportFile, type ExportTable, type Row } from './exportFile'
import { existingColumns, planImport, type ImportPlan } from './importFile'

const PAGE = 1000
const CHUNK = 200

async function fetchExisting(table: ExportTable): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(existingColumns(table).join(','))
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as unknown as Row[]))
    if (data.length < PAGE) return rows
  }
}

/** Compare le fichier à ce qui est déjà en base ; ne modifie rien. */
export async function previewImport(file: ExportFile): Promise<ImportPlan> {
  const entries = await Promise.all(
    EXPORT_TABLES.map(async (t) => [t, await fetchExisting(t)] as const)
  )
  return planImport(file, Object.fromEntries(entries) as Record<ExportTable, Row[]>)
}

/**
 * Ajoute les lignes manquantes, table par table (parents d'abord). Sans danger à relancer : ce qui est déjà
 * importé est reconnu et ignoré. S'arrête à la première erreur en nommant la table.
 */
export async function runImport(plan: ImportPlan): Promise<void> {
  for (const { table, rows } of plan.inserts) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase.from(table).insert(rows.slice(i, i + CHUNK) as never)
      if (error) throw new Error(`${table} : ${error.message}`)
    }
  }
}
