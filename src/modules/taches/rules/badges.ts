import { BADGES, type BadgeMetric } from '../config'

export type BadgeStats = Record<BadgeMetric, number>

/** Clés des badges dont le seuil est atteint. */
export function reachedBadges(stats: BadgeStats): string[] {
  return BADGES.filter((b) => stats[b.metric] >= b.threshold).map((b) => b.key)
}

/** Badges atteints qui ne sont pas encore enregistrés comme débloqués. */
export function newBadges(stats: BadgeStats, unlocked: Iterable<string>): string[] {
  const have = new Set(unlocked)
  return reachedBadges(stats).filter((k) => !have.has(k))
}

export const badgeLabel = (key: string): string => BADGES.find((b) => b.key === key)?.label ?? key
