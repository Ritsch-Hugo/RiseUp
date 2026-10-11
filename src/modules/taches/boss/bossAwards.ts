import { parisDay, supabase } from '../../../core'
import { BOSS_STEP_XP, BOSS_VICTORY_XP } from '../config'
import { bossHealth } from '../rules/boss'
import type { Award } from '../rules/xp'
import type { Task } from '../tasks/taskQueries'
import { fetchActiveStreak, fetchTotalXp, insertXp, netXp } from '../xp/xpLedger'

/**
 * Coche / décoche une étape du boss. Cocher inscrit +10 XP (une seule fois par étape) ; battre la dernière
 * étape termine le boss et ajoute +150 XP (une seule fois). Décocher annule l'XP de l'étape et, si le boss
 * était vaincu, celui de la victoire. Renvoie le gain, ou null s'il n'y a rien de nouveau (ou en décochant).
 */
export async function toggleBossStep(
  task: Task,
  stepId: string,
  done: boolean
): Promise<Award | null> {
  const now = new Date().toISOString()
  const day = parisDay(now)
  const { error } = await supabase
    .from('taches_subtasks')
    .update({ done_at: done ? now : null })
    .eq('id', stepId)
  if (error) throw error

  if (!done) {
    const stepNet = await netXp('boss_etape', stepId)
    if (stepNet !== 0)
      await insertXp({ source: 'boss_etape', sourceId: stepId, day, xp: -stepNet, factor: 1 })
    if (task.completed_at) {
      const { error: reopenError } = await supabase
        .from('taches_tasks')
        .update({ completed_at: null })
        .eq('id', task.id)
      if (reopenError) throw reopenError
      const bossNet = await netXp('boss', task.id)
      if (bossNet !== 0)
        await insertXp({ source: 'boss', sourceId: task.id, day, xp: -bossNet, factor: 1 })
    }
    return null
  }

  const steps = task.subtasks.map((s) => (s.id === stepId ? { ...s, done_at: now } : s))
  const before = await fetchTotalXp()
  let base = 0
  if ((await netXp('boss_etape', stepId)) <= 0) {
    await insertXp({ source: 'boss_etape', sourceId: stepId, day, xp: BOSS_STEP_XP, factor: 1 })
    base += BOSS_STEP_XP
  }
  let victory = false
  if (bossHealth(steps).defeated) {
    const { error: winError } = await supabase
      .from('taches_tasks')
      .update({ completed_at: now })
      .eq('id', task.id)
    if (winError) throw winError
    if ((await netXp('boss', task.id)) <= 0) {
      await insertXp({ source: 'boss', sourceId: task.id, day, xp: BOSS_VICTORY_XP, factor: 1 })
      base += BOSS_VICTORY_XP
      victory = true
    }
  }
  if (base === 0) return null
  return {
    kind: victory ? 'boss' : 'task',
    title: task.title,
    label: victory ? 'Boss vaincu (victoire + dernière étape)' : 'Étape du boss',
    base,
    xp: base,
    reductions: [],
    bonuses: [],
    before,
    after: before + base,
    streak: await fetchActiveStreak(day),
  }
}
