import { describe, expect, it } from 'vitest'
import {
  applyFactor,
  levelFromXp,
  normalizeTitle,
  rankFor,
  summarizeAward,
  taskFactor,
  xpToNextLevel,
  type RecentTask,
} from './xp'

describe('xpToNextLevel', () => {
  it('max(100, 100 × (n − 1))', () => {
    expect(xpToNextLevel(1)).toBe(100)
    expect(xpToNextLevel(2)).toBe(100)
    expect(xpToNextLevel(3)).toBe(200)
    expect(xpToNextLevel(7)).toBe(600)
  })
})

describe('levelFromXp', () => {
  it('seuils cumulés : 100, 200, 400, 700…', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpInto: 0, xpForNext: 100 })
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(199).level).toBe(2)
    expect(levelFromXp(200).level).toBe(3)
    expect(levelFromXp(400).level).toBe(4)
    expect(levelFromXp(700).level).toBe(5)
  })
  it('reste dans le niveau et avancement', () => {
    const l = levelFromXp(1600 + 300) // niveau 7 atteint à 1600 XP, 600 pour le suivant
    expect(l).toMatchObject({ level: 7, xpInto: 300, xpForNext: 600 })
    expect(l.progress).toBe(0.5)
  })
  it('total négatif → niveau 1', () => expect(levelFromXp(-50).level).toBe(1))
})

describe('rankFor', () => {
  it('rangs tous les 5 niveaux puis plus larges', () => {
    expect(rankFor(1)).toBe('Débutant')
    expect(rankFor(4)).toBe('Débutant')
    expect(rankFor(5)).toBe('Régulier')
    expect(rankFor(9)).toBe('Régulier')
    expect(rankFor(10)).toBe('Discipliné')
    expect(rankFor(15)).toBe('Acharné')
    expect(rankFor(20)).toBe('Élite')
    expect(rankFor(29)).toBe('Élite')
    expect(rankFor(30)).toBe('Légende')
    expect(rankFor(99)).toBe('Légende')
  })
})

describe('normalizeTitle', () => {
  it('casse, accents, ponctuation, espaces', () => {
    expect(normalizeTitle('  Répondre  aux MAILS ! ')).toBe('repondre aux mails')
  })
})

describe('taskFactor', () => {
  const doneAt = '2026-10-11T10:00:00Z'
  const task = {
    title: 'Ranger',
    difficulty: 'moyen' as const,
    created_at: '2026-10-10T08:00:00Z',
    recurring: false,
  }
  const easy = (n: number): RecentTask[] =>
    Array.from({ length: n }, (_, i) => ({
      id: String(i),
      title: `facile ${i}`,
      difficulty: 'facile',
      completed_at: `2026-10-11T0${i % 9}:00:00Z`,
      recurring: false,
    }))

  it('aucune réduction normalement', () => {
    expect(taskFactor(task, doneAt, [])).toEqual({ factor: 1, reductions: [] })
  })

  it('tâches faciles : 5 pleines, 6e à 10e ×0,5, au-delà ×0', () => {
    const easyTask = { ...task, difficulty: 'facile' as const }
    expect(taskFactor(easyTask, doneAt, easy(4)).factor).toBe(1) // 5e
    expect(taskFactor(easyTask, doneAt, easy(5)).factor).toBe(0.5) // 6e
    expect(taskFactor(easyTask, doneAt, easy(9)).factor).toBe(0.5) // 10e
    expect(taskFactor(easyTask, doneAt, easy(10)).factor).toBe(0) // 11e
  })
  it('la règle des faciles ne concerne que les tâches faciles et que le jour même', () => {
    expect(taskFactor(task, doneAt, easy(9)).factor).toBe(1)
    const yesterday = easy(9).map((o) => ({ ...o, completed_at: '2026-10-09T10:00:00Z' }))
    expect(taskFactor({ ...task, difficulty: 'facile' }, doneAt, yesterday).factor).toBe(1)
  })

  it('créée et terminée en moins de 5 min ×0,5', () => {
    const quick = { ...task, created_at: '2026-10-11T09:57:00Z' }
    const r = taskFactor(quick, doneAt, [])
    expect(r.factor).toBe(0.5)
    expect(r.reductions[0]!.reason).toBe('fast')
    expect(taskFactor({ ...task, created_at: '2026-10-11T09:50:00Z' }, doneAt, []).factor).toBe(1)
  })

  it('même titre normalisé validé dans les 24 h ×0,5', () => {
    const same: RecentTask = {
      id: 'x',
      title: ' RANGER!',
      difficulty: 'moyen',
      completed_at: '2026-10-10T12:00:00Z',
      recurring: false,
    }
    expect(taskFactor(task, doneAt, [same]).factor).toBe(0.5)
    expect(
      taskFactor(task, doneAt, [{ ...same, completed_at: '2026-10-09T09:00:00Z' }]).factor
    ).toBe(1)
    expect(taskFactor(task, doneAt, [{ ...same, recurring: true }]).factor).toBe(1)
  })

  it('tâches récurrentes exclues de ces deux règles', () => {
    const rec = { ...task, recurring: true, created_at: '2026-10-11T09:59:00Z' }
    const same: RecentTask = {
      id: 'x',
      title: 'Ranger',
      difficulty: 'moyen',
      completed_at: '2026-10-11T08:00:00Z',
      recurring: false,
    }
    expect(taskFactor(rec, doneAt, [same]).factor).toBe(1)
  })

  it('facteurs cumulables', () => {
    const quick = { ...task, difficulty: 'facile' as const, created_at: '2026-10-11T09:58:00Z' }
    const r = taskFactor(quick, doneAt, easy(5)) // 6e facile ×0,5 et trop rapide ×0,5
    expect(r.factor).toBe(0.25)
    expect(r.reductions).toHaveLength(2)
  })
})

describe('applyFactor', () => {
  it('arrondi', () => {
    expect(applyFactor(25, 0.5)).toBe(13)
    expect(applyFactor(10, 0.25)).toBe(3)
    expect(applyFactor(50, 0)).toBe(0)
  })
})

describe('summarizeAward', () => {
  it('passage de niveau et de rang', () => {
    const s = summarizeAward({ before: 690, after: 705 })
    expect(s.levelUp).toBe(true)
    expect(s.after.level).toBe(5)
    expect(s.rankChanged).toBe(true)
  })
  it('XP restant avant le niveau suivant', () => {
    const s = summarizeAward({ before: 1600, after: 2100 }) // niveau 7 : 500 / 600
    expect(s.levelUp).toBe(false)
    expect(s.toNext).toBe(100)
  })
})
