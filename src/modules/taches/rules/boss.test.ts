import { describe, expect, it } from 'vitest'
import { bossDueDate, bossHealth, bossWeekOf, isCurrentBoss } from './boss'

const done = '2026-10-07T10:00:00Z'

describe('points de vie du boss', () => {
  it('barre = PV restants sur PV totaux', () => {
    const h = bossHealth([
      { hp: 20, done_at: done },
      { hp: 20, done_at: done },
      { hp: 20, done_at: null },
      { hp: 20, done_at: null },
      { hp: 20, done_at: null },
    ])
    expect(h).toMatchObject({ total: 100, remaining: 60, percent: 60, done: 2, steps: 5 })
    expect(h.defeated).toBe(false)
  })
  it('les étapes ont des PV différents', () => {
    const h = bossHealth([
      { hp: 10, done_at: done },
      { hp: 30, done_at: null },
    ])
    expect(h.percent).toBe(75)
  })
  it('battu quand toutes les étapes sont faites', () => {
    const h = bossHealth([{ hp: 5, done_at: done }])
    expect(h).toMatchObject({ remaining: 0, percent: 0, defeated: true })
  })
  it('sans étape : jamais battu', () => {
    expect(bossHealth([])).toMatchObject({ total: 0, percent: 0, defeated: false })
  })
})

describe('semaine du boss', () => {
  it('lundi → dimanche', () => {
    expect(bossWeekOf('2026-10-07')).toBe('2026-10-05')
    expect(bossDueDate('2026-10-07')).toBe('2026-10-11')
    expect(bossWeekOf('2026-10-11')).toBe('2026-10-05')
  })
  it('boss échappé quand sa semaine est passée', () => {
    expect(isCurrentBoss('2026-10-05', '2026-10-11')).toBe(true)
    expect(isCurrentBoss('2026-10-05', '2026-10-12')).toBe(false)
    expect(isCurrentBoss(null, '2026-10-12')).toBe(false)
  })
})
