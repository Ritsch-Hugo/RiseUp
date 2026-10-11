import { parisDay, supabase } from '../../../core'
import { ANTI_CHEAT_FETCH_HOURS } from '../config'
import type { Habit } from '../habits/habitQueries'
import { settleQuests } from '../quests/questAwards'
import { habitXp } from '../rules/habits'
import { taskXp } from '../rules/tasks'
import { applyFactor, taskFactor, type Award, type RecentTask } from '../rules/xp'
import type { Task } from '../tasks/taskQueries'
import { badgeLabel } from '../rules/badges'
import { syncBadges } from './badgeSync'
import { fetchActiveStreak, fetchTotalXp, insertXp, netXp } from './xpLedger'

/** Tâches terminées récemment (pour appliquer l'anti-triche), `exceptId` exclue. */
async function recentCompleted(exceptId: string): Promise<RecentTask[]> {
  const since = new Date(Date.now() - ANTI_CHEAT_FETCH_HOURS * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('taches_tasks')
    .select('id, title, difficulty, completed_at, recurrence, recurred_from')
    .gte('completed_at', since)
    .eq('is_boss', false)
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
 * Inscrit l'XP d'une tâche qu'on vient de terminer, anti-triche appliqué, puis valide les quêtes atteintes.
 * Renvoie le gain, ou null si l'XP de cette tâche a déjà été compté (décocher puis recocher ne double jamais l'XP).
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
  const { gained } = await settleQuests(day)
  return {
    kind: 'task',
    title: task.title,
    label: `Tâche ${task.difficulty}`,
    base,
    xp,
    reductions,
    bonuses: gained,
    before,
    after: before + xp + gained.reduce((t, b) => t + b.xp, 0),
    streak: await fetchActiveStreak(day),
    badges: (await syncBadges()).map(badgeLabel),
  }
}

/** Décocher une tâche : une ligne négative annule l'XP gagné, et une quête qui n'est plus atteinte est annulée. */
export async function revokeTask(task: Task): Promise<void> {
  const net = await netXp('tache', task.id)
  if (net !== 0) {
    await insertXp({ source: 'tache', sourceId: task.id, day: parisDay(), xp: -net, factor: 1 })
  }
  await settleQuests(parisDay())
}

/** XP d'une habitude validée ce jour-là (une seule fois par jour), puis quêtes atteintes. */
export async function awardHabit(habit: Habit, day: string): Promise<Award | null> {
  if ((await netXp('habitude', habit.id, day)) > 0) return null
  const before = await fetchTotalXp()
  const xp = habitXp(habit.difficulty)
  await insertXp({ source: 'habitude', sourceId: habit.id, day, xp, factor: 1 })
  const { gained } = await settleQuests(day)
  return {
    kind: 'habit',
    title: habit.name,
    label: `Habitude ${habit.difficulty}`,
    base: xp,
    xp,
    reductions: [],
    bonuses: gained,
    before,
    after: before + xp + gained.reduce((t, b) => t + b.xp, 0),
    streak: await fetchActiveStreak(day),
    badges: (await syncBadges()).map(badgeLabel),
  }
}

/** Habitude dé-validée (case décochée ou compteur repassé sous l'objectif) : l'XP du jour est annulé. */
export async function revokeHabit(habit: Habit, day: string): Promise<void> {
  const net = await netXp('habitude', habit.id, day)
  if (net !== 0)
    await insertXp({ source: 'habitude', sourceId: habit.id, day, xp: -net, factor: 1 })
  await settleQuests(parisDay())
}
