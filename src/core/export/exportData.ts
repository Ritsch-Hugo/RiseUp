import { supabase } from '../supabase'
import { buildExport, type ExportFile, type ExportTable, type Row } from './exportFile'

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

/** Export complet depuis la base. */
export const exportAll = (): Promise<ExportFile> => buildExport(fetchAllRows)
