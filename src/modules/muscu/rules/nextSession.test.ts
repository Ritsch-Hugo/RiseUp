import { describe, expect, it } from 'vitest'
import { nextSession } from './nextSession'

const upperLower = {
  id: 'p1',
  sessions: [{ id: 'ua' }, { id: 'la' }, { id: 'ub' }, { id: 'lb' }],
}

describe('nextSession', () => {
  it('suit la dernière séance dans l’ordre du programme', () => {
    expect(nextSession([upperLower], 'ua')).toEqual({ programId: 'p1', sessionId: 'la' })
    expect(nextSession([upperLower], 'ub')).toEqual({ programId: 'p1', sessionId: 'lb' })
  })
  it('revient au début après la dernière', () => {
    expect(nextSession([upperLower], 'lb')).toEqual({ programId: 'p1', sessionId: 'ua' })
  })
  it('reste dans le programme de la dernière séance', () => {
    const other = { id: 'p0', sessions: [{ id: 'x' }] }
    expect(nextSession([other, upperLower], 'la')).toEqual({ programId: 'p1', sessionId: 'ub' })
  })
  it('sans historique ou séance supprimée : première séance du premier programme', () => {
    const empty = { id: 'p0', sessions: [] }
    expect(nextSession([empty, upperLower], null)).toEqual({ programId: 'p1', sessionId: 'ua' })
    expect(nextSession([upperLower], 'disparue')).toEqual({ programId: 'p1', sessionId: 'ua' })
  })
  it('null sans séance type', () => {
    expect(nextSession([], null)).toBeNull()
    expect(nextSession([{ id: 'p', sessions: [] }], null)).toBeNull()
  })
})
