import { describe, expect, it } from 'vitest'
import { formatRepsRange, formatTarget, moveItem, nextPosition, parseRepsRange } from './programs'

describe('parseRepsRange', () => {
  it('lit une fourchette ou un nombre seul', () => {
    expect(parseRepsRange('6-8')).toEqual({ min: 6, max: 8 })
    expect(parseRepsRange(' 10 ')).toEqual({ min: 10, max: 10 })
    expect(parseRepsRange('8–12')).toEqual({ min: 8, max: 12 })
  })
  it('refuse le reste', () => {
    for (const bad of ['', 'abc', '0', '8-6', '6-', '1-2-3']) expect(parseRepsRange(bad)).toBeNull()
  })
})

describe('formatTarget', () => {
  it('formate séries × reps', () => {
    expect(formatTarget(4, 6, 8)).toBe('4 × 6-8')
    expect(formatTarget(3, 10, 10)).toBe('3 × 10')
  })
  it('sans répétitions cibles (exercice à la durée)', () => {
    expect(formatTarget(3, null, null)).toBe('3 séries')
    expect(formatTarget(1, null, null)).toBe('1 série')
  })
  it('formatRepsRange vide si une borne manque', () => {
    expect(formatRepsRange(null, 8)).toBe('')
  })
})

describe('moveItem', () => {
  it('échange avec le voisin', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })
  it('ne bouge pas aux bords et ne modifie pas la liste d’origine', () => {
    const list = ['a', 'b']
    expect(moveItem(list, 0, -1)).toBe(list)
    expect(moveItem(list, 1, 1)).toBe(list)
  })
})

describe('nextPosition', () => {
  it('0 si vide, sinon max + 1', () => {
    expect(nextPosition([])).toBe(0)
    expect(nextPosition([{ position: 0 }, { position: 4 }])).toBe(5)
  })
})
