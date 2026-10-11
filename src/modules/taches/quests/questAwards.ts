import { addDays, parisDay, supabase } from '../../../core'
import {
  validatedHabitDays,
  questProgress,
  isActiveQuest,
  periodStart,
  questBonus,
  type QuestContext,
} from '../rules/quests'
import type { LogMap } from '../rules/habits'
import type { Award, Bonus } from '../rules/xp'
import { insertXp, netXp } from '../xp/xpLedger'

/** Données utiles au calcul de la progression des quêtes depuis `sinceDay` (inclus). */
export async function fetchQuestContext(sinceDay: string): Promise<QuestContext> {
  const [tasks, habits, logs] = await Promise.all([
    supabase
      .from('taches_tasks')
      .select('category_id, difficulty, completed_at')
      .not('completed_at', 'is', null)
      .gte('completed_at', `${addDays(sinceDay, -1)}T00:00:00Z`),
    supabase.from('taches_habits').select('id, moment, type, target, weekdays, archived_at'),
    supabase.from('taches_habit_logs').select('habit_id, day, value').gte('day', sinceDay),
  ])
  if (tasks.error) throw tasks.error
  if (habits.error) throw habits.error
  if (logs.error) throw logs.error

  const byHabit = new Map<string, LogMap>()
  for (const l of logs.data) {
    const map = byHabit.get(l.habit_id) ?? new Map<string, number>()
    map.set(l.day, l.value)
    byHabit.set(l.habit_id, map)
  }
  return {
    tasks: tasks.data
      .map((t) => ({
        category_id: t.category_id,
        difficulty: t.difficulty,
        completed_day: parisDay(t.completed_at!),
      }))
      .filter((t) => t.completed_day >= sinceDay),
    habitDays: validatedHabitDays(habits.data, byHabit),
  }
}

/**
 * Met les quêtes de la période en cours en accord avec les données : une quête dont l'objectif est atteint
 * est validée (+20 / +75 XP, une seule fois) ; si l'objectif n'est plus atteint (tâche décochée…), elle est
 * dé-validée et son XP annulé par une ligne négative.
 */
export async function settleQuests(today: string): Promise<{ gained: Bonus[]; lost: Bonus[] }> {
  const weekStart = periodStart('semaine', today)
  const { data, error } = await supabase
    .from('taches_quests')
    .select('*')
    .gte('period_start', weekStart)
  if (error) throw error
  const active = data.filter((q) => isActiveQuest(q, today))
  const result: { gained: Bonus[]; lost: Bonus[] } = { gained: [], lost: [] }
  if (active.length === 0) return result

  const ctx = await fetchQuestContext(weekStart)
  for (const q of active) {
    const reached = questProgress(q, ctx) >= q.target
    if (reached && !q.completed_at) {
      if ((await netXp('quete', q.id)) <= 0) {
        await insertXp({
          source: 'quete',
          sourceId: q.id,
          day: today,
          xp: questBonus(q.period),
          factor: 1,
        })
        result.gained.push({ title: q.title, xp: questBonus(q.period) })
      }
      const { error: upError } = await supabase
        .from('taches_quests')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', q.id)
      if (upError) throw upError
    } else if (!reached && q.completed_at) {
      const net = await netXp('quete', q.id)
      if (net > 0) {
        await insertXp({ source: 'quete', sourceId: q.id, day: today, xp: -net, factor: 1 })
        result.lost.push({ title: q.title, xp: net })
      }
      const { error: upError } = await supabase
        .from('taches_quests')
        .update({ completed_at: null })
        .eq('id', q.id)
      if (upError) throw upError
    }
  }
  return result
}

/**
 * Quêtes reconduites : au premier passage d'une nouvelle période, chaque quête « reconduire » de la période
 * précédente est recréée pour la période en cours (la précédente cesse d'être reconduite).
 */
export async function ensureRecurringQuests(today: string): Promise<boolean> {
  const { data, error } = await supabase.from('taches_quests').select('*').eq('recurring', true)
  if (error) throw error
  let changed = false
  for (const q of data) {
    const start = periodStart(q.period, today)
    if (q.period_start >= start) continue
    const { data: existing, error: readError } = await supabase
      .from('taches_quests')
      .select('id')
      .eq('title', q.title)
      .eq('period', q.period)
      .eq('period_start', start)
      .eq('kind', q.kind)
      .eq('target', q.target)
      .limit(1)
    if (readError) throw readError
    if (existing.length === 0) {
      const { error: insError } = await supabase.from('taches_quests').insert({
        id: crypto.randomUUID(),
        title: q.title,
        period: q.period,
        period_start: start,
        kind: q.kind,
        params: q.params,
        target: q.target,
        bonus_xp: questBonus(q.period),
        recurring: true,
      })
      if (insError) throw insError
    }
    const { error: upError } = await supabase
      .from('taches_quests')
      .update({ recurring: false })
      .eq('id', q.id)
    if (upError) throw upError
    changed = true
  }
  return changed
}

/** Gain affiché quand seule une quête est validée (progression manuelle, nouvelle quête déjà atteinte). */
export function questOnlyAward(before: number, gained: Bonus[], streak: number): Award {
  return {
    kind: 'quest',
    title: gained[0]?.title ?? 'Quête',
    label: 'Quête validée',
    base: 0,
    xp: 0,
    reductions: [],
    bonuses: gained,
    before,
    after: before + gained.reduce((t, b) => t + b.xp, 0),
    streak,
  }
}
