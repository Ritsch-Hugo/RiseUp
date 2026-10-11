import { supabase } from '../../../core'
import { currentStreak } from '../../../core/streak'

export type XpSource = 'tache' | 'habitude' | 'quete'

/** XP total actuel (somme du journal d'XP). */
export async function fetchTotalXp(): Promise<number> {
  const { data, error } = await supabase.from('taches_xp_total').select('total_xp').maybeSingle()
  if (error) throw error
  return Number(data?.total_xp ?? 0)
}

/** XP net déjà inscrit pour une source (et un jour, pour les habitudes) : sert à ne jamais compter deux fois. */
export async function netXp(source: XpSource, sourceId: string, day?: string): Promise<number> {
  let query = supabase
    .from('taches_xp_events')
    .select('xp')
    .eq('source', source)
    .eq('source_id', sourceId)
  if (day) query = query.eq('day', day)
  const { data, error } = await query
  if (error) throw error
  return data.reduce((t, e) => t + e.xp, 0)
}

export async function insertXp(e: {
  source: XpSource
  sourceId: string
  day: string
  xp: number
  factor: number
}) {
  const { error } = await supabase.from('taches_xp_events').insert({
    id: crypto.randomUUID(),
    source: e.source,
    source_id: e.sourceId,
    day: e.day,
    xp: e.xp,
    factor: e.factor,
  })
  if (error) throw error
}

/** Série de jours actifs (tâche terminée ou habitude validée) qui finit aujourd'hui. */
export async function fetchActiveStreak(today: string): Promise<number> {
  const { data, error } = await supabase.from('taches_active_days').select('day')
  if (error) throw error
  return currentStreak(new Set(data.flatMap((d) => (d.day ? [d.day] : []))), today)
}
