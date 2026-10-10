import { describe, expect, it } from 'vitest'
import { addDays, parisDay, weekStart, weekStats } from './week'

describe('semaine lundi → dimanche', () => {
  it('weekStart : dimanche → lundi précédent', () => {
    expect(weekStart('2026-10-11')).toBe('2026-10-05')
    expect(weekStart('2026-10-05')).toBe('2026-10-05')
    expect(weekStart('2026-10-07')).toBe('2026-10-05')
  })
  it('addDays', () => expect(addDays('2026-10-05', 6)).toBe('2026-10-11'))
  it('parisDay : 23h30 UTC = lendemain à Paris', () => {
    expect(parisDay('2026-10-10T22:30:00Z')).toBe('2026-10-11')
  })
})

describe('weekStats', () => {
  const w = (startedAt: string) => ({ startedAt, durationSeconds: 3600, volume: 1000 })
  it('ne compte que la semaine demandée', () => {
    const stats = weekStats(
      [w('2026-10-05T17:00:00Z'), w('2026-10-11T10:00:00Z'), w('2026-10-04T10:00:00Z')],
      '2026-10-08'
    )
    expect(stats).toEqual({ count: 2, durationSeconds: 7200, volume: 2000 })
  })
})
