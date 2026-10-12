import { fetchAll, supabase } from '../../../core'
import { bestStreak } from '../../../core/streak'
import { newBadges, type BadgeStats } from '../rules/badges'
import { levelFromXp } from '../rules/xp'
import { fetchTotalXp } from './xpLedger'

const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
  const { count: n, error } = await query
  if (error) throw error
  return n ?? 0
}

/** Mesures qui décident des badges, lues dans les données. */
export async function fetchBadgeStats(): Promise<BadgeStats> {
  const [total, byDay, days, quests, boss, habits] = await Promise.all([
    fetchTotalXp(),
    fetchAll((from, to) =>
      supabase.from('taches_completed_by_day').select('day, completed').order('day').range(from, to)
    ),
    fetchAll((from, to) =>
      supabase.from('taches_active_days').select('day').order('day').range(from, to)
    ),
    count(
      supabase
        .from('taches_quests')
        .select('id', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
    ),
    count(
      supabase
        .from('taches_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('is_boss', true)
        .not('completed_at', 'is', null)
    ),
    count(
      supabase
        .from('taches_xp_events')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'habitude')
        .gt('xp', 0)
    ),
  ])
  return {
    tasks: byDay.reduce((t, d) => t + Number(d.completed), 0),
    streak: bestStreak(new Set(days.flatMap((d) => (d.day ? [d.day] : [])))),
    quests,
    level: levelFromXp(total).level,
    boss,
    habits,
  }
}

/** Enregistre les badges atteints pas encore débloqués ; renvoie leurs clés. */
export async function syncBadges(): Promise<string[]> {
  const [stats, unlocked] = await Promise.all([
    fetchBadgeStats(),
    supabase.from('taches_badges').select('badge_key'),
  ])
  if (unlocked.error) throw unlocked.error
  const fresh = newBadges(
    stats,
    unlocked.data.map((b) => b.badge_key)
  )
  if (fresh.length === 0) return []
  const { error } = await supabase.from('taches_badges').upsert(
    fresh.map((badge_key) => ({ id: crypto.randomUUID(), badge_key })),
    { onConflict: 'user_id,badge_key', ignoreDuplicates: true }
  )
  if (error) throw error
  return fresh
}
