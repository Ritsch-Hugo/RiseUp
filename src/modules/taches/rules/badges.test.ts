import { describe, expect, it } from 'vitest'
import { BADGES } from '../config'
import { newBadges, reachedBadges, type BadgeStats } from './badges'

const none: BadgeStats = { tasks: 0, streak: 0, quests: 0, level: 1, boss: 0, habits: 0 }

describe('badges', () => {
  it('12 badges aux clés uniques', () => {
    expect(BADGES).toHaveLength(12)
    expect(new Set(BADGES.map((b) => b.key)).size).toBe(12)
  })
  it('rien au départ (niveau 1)', () => {
    expect(reachedBadges(none)).toEqual([])
  })
  it('seuil atteint = débloqué', () => {
    expect(reachedBadges({ ...none, tasks: 1 })).toEqual(['premiere_tache'])
    expect(reachedBadges({ ...none, tasks: 50 })).toEqual(['premiere_tache', 'taches_50'])
    expect(reachedBadges({ ...none, level: 5 })).toEqual(['niveau_5'])
    expect(reachedBadges({ ...none, boss: 1 })).toEqual(['boss_1'])
    expect(reachedBadges({ ...none, streak: 10 })).toEqual(['serie_5', 'serie_10'])
  })
  it('seulement les nouveaux', () => {
    expect(newBadges({ ...none, tasks: 50 }, ['premiere_tache'])).toEqual(['taches_50'])
    expect(newBadges({ ...none, tasks: 50 }, ['premiere_tache', 'taches_50'])).toEqual([])
  })
  it('un badge reste acquis même si la mesure retombe', () => {
    expect(newBadges(none, ['taches_50'])).toEqual([])
  })
})
