import { describe, expect, it } from 'vitest'
import { effectiveSets, heatColor, recovery, weeklyLoad, type MuscleWorkout } from './muscles'

const bench: MuscleWorkout = {
  startedAt: '2026-10-08T16:00:00Z',
  endedAt: '2026-10-08T17:00:00Z',
  exercises: [{ primary: 'pecs', secondary: ['triceps', 'epaules'], workingSets: 4 }],
}

describe('effectiveSets', () => {
  it('1 pour le principal, 0,5 pour les secondaires', () => {
    const s = effectiveSets(bench)
    expect(s.pecs).toBe(4)
    expect(s.triceps).toBe(2)
    expect(s.dos).toBe(0)
  })
})

describe('weeklyLoad', () => {
  it('séries / 15, plafonné à 1, semaine en cours seulement', () => {
    const old = { ...bench, startedAt: '2026-09-20T16:00:00Z', endedAt: '2026-09-20T17:00:00Z' }
    const l = weeklyLoad([bench, bench, bench, bench, old], '2026-10-10')
    expect(l.pecs).toBe(1)
    expect(weeklyLoad([bench], '2026-10-10').pecs).toBeCloseTo(4 / 15)
    expect(weeklyLoad([old], '2026-10-10').pecs).toBe(0)
  })
})

describe('recovery', () => {
  const at = (iso: string) => recovery([bench], new Date(iso)).find((r) => r.group === 'pecs')!

  it('12 h + 4 h × séries : 28 h pour 4 séries', () => {
    const r = at('2026-10-08T18:00:00Z') // 1 h après la fin
    expect(r.remainingHours).toBeCloseTo(27)
    expect(r.progress).toBeCloseTo(1 / 28)
  })
  it('prêt une fois le temps écoulé', () => {
    const r = at('2026-10-10T00:00:00Z')
    expect(r.remainingHours).toBe(0)
    expect(r.progress).toBe(1)
  })
  it('plafonné à 48 h', () => {
    const big: MuscleWorkout = {
      ...bench,
      exercises: [{ primary: 'pecs', secondary: [], workingSets: 20 }],
    }
    const r = recovery([big], new Date('2026-10-08T17:00:00Z')).find((x) => x.group === 'pecs')!
    expect(r.remainingHours).toBe(48)
  })
  it('prêt sans historique', () => {
    expect(recovery([], new Date()).every((r) => r.progress === 1 && r.remainingHours === 0)).toBe(
      true
    )
  })
})

describe('heatColor', () => {
  it('bornes de l’échelle', () => {
    expect(heatColor(0)).toBe('#2e3846')
    expect(heatColor(0.4)).toBe('#3b82c4')
    expect(heatColor(1)).toBe('#e5484d')
  })
})
