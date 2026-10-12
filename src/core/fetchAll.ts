/** Taille d'une page : l'API Supabase renvoie au plus 1000 lignes par requête. */
const PAGE = 1000

type Page<T> = PromiseLike<{ data: T[] | null; error: Error | null }>

/**
 * Récupère toutes les lignes d'une requête, page par page. `page` doit appliquer `.range(from, to)`
 * et un tri stable (sinon des lignes peuvent manquer ou se répéter d'une page à l'autre).
 */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if ((data?.length ?? 0) < PAGE) return rows
  }
}
