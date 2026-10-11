import { REWARD_MAX_LEVEL, REWARD_MIN_LEVEL } from '../config'
import { xpToNextLevel } from './xp'

/** XP total à atteindre pour être au niveau `level`. */
export function xpAtLevel(level: number): number {
  let total = 0
  for (let n = 1; n < level; n++) total += xpToNextLevel(n)
  return total
}

export type RewardLike = { level: number; claimed_at: string | null }

export type RewardStatus =
  { state: 'claimed' } | { state: 'ready' } | { state: 'locked'; xpLeft: number; progress: number }

/** Réclamée, réclamable (niveau atteint) ou verrouillée (XP restant et avancement de 0 à 1). */
export function rewardStatus(r: RewardLike, totalXp: number): RewardStatus {
  if (r.claimed_at) return { state: 'claimed' }
  const needed = xpAtLevel(r.level)
  if (totalXp >= needed) return { state: 'ready' }
  return { state: 'locked', xpLeft: needed - totalXp, progress: Math.max(0, totalXp) / needed }
}

/** Plus petit niveau libre au-dessus du niveau actuel : valeur proposée à la création. */
export function suggestRewardLevel(currentLevel: number, taken: number[]): number {
  let level = Math.max(REWARD_MIN_LEVEL, currentLevel + 1)
  while (taken.includes(level)) level += 1
  return level
}

/** Valeurs prêtes à écrire, ou null (titre vide, niveau hors bornes ou déjà pris). */
export function validateRewardForm(
  f: { level: string; title: string },
  taken: number[]
): { level: number; title: string } | null {
  const title = f.title.trim()
  const level = Number(f.level)
  if (title === '' || !Number.isInteger(level)) return null
  if (level < REWARD_MIN_LEVEL || level > REWARD_MAX_LEVEL || taken.includes(level)) return null
  return { level, title }
}

/** Récompenses réclamables, pour signaler qu'il y en a une à prendre. */
export const readyCount = (rewards: RewardLike[], totalXp: number): number =>
  rewards.filter((r) => rewardStatus(r, totalXp).state === 'ready').length
