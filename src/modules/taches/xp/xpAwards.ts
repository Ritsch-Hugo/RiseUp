import { parisDay, supabase } from '../../../core'
import { currentStreak } from '../../../core/streak'
import { ANTI_CHEAT_FETCH_HOURS } from '../config'
import type { Habit } from '../habits/habitQueries'
import { habitXp } from '../rules/habits'
import { taskXp } from '../rules/tasks'
import { applyFactor, taskFactor, type Award, type RecentTask } from '../rules/xp'
import type { Task } from '../tasks/taskQueries'

type XpSource = 'tache' | 'habitude'

/** XP total actuel (somme du journal d'XP). */
export async function fetchTotalXp(): Promise<number> {
  const { data, error } = await supabase.from('taches_xp_total').select('total_xp').maybeSingle()
  if (error) throw error
  return Number(data?.total_xp ?? 0)
}

/** XP net déjà inscrit pour une source (et un jour, pour les habitudes) : sert à ne jamais compter deux fois. */
async function netXp(source: XpSource, sourceId: string, day?: string): Promise<number> {
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

async function insertXp(e: {
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

/** Tâches terminées récemment (pour appliquer l'anti-triche), `exceptId` exclue. */
async function recentCompleted(exceptId: string): Promise<RecentTask[]> {
  const since = new Date(Date.now() - ANTI_CHEAT_FETCH_HOURS * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('taches_tasks')
    .select('id, title, difficulty, completed_at, recurrence, recurred_from')
    .gte('completed_at', since)
    .neq('id', exceptId)
  if (error) throw error
  return data.flatMap((t) =>
    t.completed_at
      ? [
          {
            id: t.id,
            title: t.title,
            difficulty: t.difficulty,
            completed_at: t.completed_at,
            recurring: t.recurrence !== null || t.recurred_from !== null,
          },
        ]
      : []
  )
}

/**
 * Inscrit l'XP d'une tâche qu'on vient de terminer, anti-triche appliqué. Renvoie le gain, ou null si
 * l'XP de cette tâche a déjà été compté (décocher puis recocher ne double jamais l'XP).
 */
export async function awardTask(task: Task, completedAt: string): Promise<Award | null> {
  if ((await netXp('tache', task.id)) > 0) return null
  const before = await fetchTotalXp()
  const { factor, reductions } = taskFactor(
    {
      title: task.title,
      difficulty: task.difficulty,
      created_at: task.created_at,
      recurring: task.recurrence !== null || task.recurred_from !== null,
    },
    completedAt,
    await recentCompleted(task.id)
  )
  const base = taskXp(task.difficulty)
  const xp = applyFactor(base, factor)
  const day = parisDay(completedAt)
  await insertXp({ source: 'tache', sourceId: task.id, day, xp, factor })
  return {
    kind: 'task',
    title: task.title,
    label: `Tâche ${task.difficulty}`,
    base,
    xp,
    reductions,
    before,
    after: before + xp,
    streak: await fetchActiveStreak(day),
  }
}

/** Décocher une tâche : une ligne négative annule l'XP gagné. */
export async function revokeTask(task: Task): Promise<void> {
  const net = await netXp('tache', task.id)
  if (net !== 0) {
    await insertXp({ source: 'tache', sourceId: task.id, day: parisDay(), xp: -net, factor: 1 })
  }
}

/** XP d'une habitude validée ce jour-là (une seule fois par jour). */
export async function awardHabit(habit: Habit, day: string): Promise<Award | null> {
  if ((await netXp('habitude', habit.id, day)) > 0) return null
  const before = await fetchTotalXp()
  const xp = habitXp(habit.difficulty)
  await insertXp({ source: 'habitude', sourceId: habit.id, day, xp, factor: 1 })
  return {
    kind: 'habit',
    title: habit.name,
    label: `Habitude ${habit.difficulty}`,
    base: xp,
    xp,
    reductions: [],
    before,
    after: before + xp,
    streak: await fetchActiveStreak(day),
  }
}

/** Habitude dé-validée (case décochée ou compteur repassé sous l'objectif) : l'XP du jour est annulé. */
export async function revokeHabit(habit: Habit, day: string): Promise<void> {
  const net = await netXp('habitude', habit.id, day)
  if (net !== 0)
    await insertXp({ source: 'habitude', sourceId: habit.id, day, xp: -net, factor: 1 })
}
