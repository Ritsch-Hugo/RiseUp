import { describe, expect, it } from 'vitest'
import {
  readyCount,
  rewardStatus,
  suggestRewardLevel,
  validateRewardForm,
  xpAtLevel,
} from './rewards'

describe('xpAtLevel', () => {
  it('somme des paliers : 100 par niveau jusqu’au 2, puis 100 × (n − 1)', () => {
    expect(xpAtLevel(1)).toBe(0)
    expect(xpAtLevel(2)).toBe(100)
    expect(xpAtLevel(3)).toBe(200)
    expect(xpAtLevel(4)).toBe(400)
    expect(xpAtLevel(5)).toBe(700)
  })
})

describe('rewardStatus', () => {
  it('verrouillée : XP restant et avancement', () => {
    expect(rewardStatus({ level: 4, claimed_at: null }, 300)).toEqual({
      state: 'locked',
      xpLeft: 100,
      progress: 0.75,
    })
  })
  it('réclamable dès que le niveau est atteint', () => {
    expect(rewardStatus({ level: 4, claimed_at: null }, 400)).toEqual({ state: 'ready' })
    expect(rewardStatus({ level: 4, claimed_at: null }, 900)).toEqual({ state: 'ready' })
  })
  it('réclamée reste réclamée', () => {
    expect(rewardStatus({ level: 4, claimed_at: '2026-10-11T10:00:00Z' }, 0)).toEqual({
      state: 'claimed',
    })
  })
  it('compte les réclamables', () => {
    const rewards = [
      { level: 2, claimed_at: null },
      { level: 3, claimed_at: '2026-10-11T10:00:00Z' },
      { level: 9, claimed_at: null },
    ]
    expect(readyCount(rewards, 250)).toBe(1)
  })
})

describe('niveau proposé et validation', () => {
  it('premier niveau libre au-dessus du niveau actuel', () => {
    expect(suggestRewardLevel(1, [])).toBe(2)
    expect(suggestRewardLevel(7, [8, 9])).toBe(10)
  })
  it('refuse titre vide, niveau hors bornes ou déjà pris', () => {
    expect(validateRewardForm({ level: '8', title: ' ' }, [])).toBeNull()
    expect(validateRewardForm({ level: '1', title: 'x' }, [])).toBeNull()
    expect(validateRewardForm({ level: '100', title: 'x' }, [])).toBeNull()
    expect(validateRewardForm({ level: '2.5', title: 'x' }, [])).toBeNull()
    expect(validateRewardForm({ level: '8', title: 'x' }, [8])).toBeNull()
  })
  it('valeurs nettoyées', () => {
    expect(validateRewardForm({ level: '8', title: '  Un resto  ' }, [])).toEqual({
      level: 8,
      title: 'Un resto',
    })
  })
})
