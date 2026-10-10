import { describe, expect, it } from 'vitest'
import { searchExercises } from './searchExercises'

const list = [
  { name: 'Écarté couché haltères' },
  { name: 'Développé couché barre' },
  { name: 'Pompes' },
]

describe('searchExercises', () => {
  it('renvoie tout si la recherche est vide', () => {
    expect(searchExercises(list, '  ')).toEqual(list)
  })
  it('ignore accents et casse', () => {
    expect(searchExercises(list, 'ECARTE')).toEqual([list[0]])
  })
  it('exige tous les mots, dans n’importe quel ordre', () => {
    expect(searchExercises(list, 'couche barre')).toEqual([list[1]])
    expect(searchExercises(list, 'barre couche')).toEqual([list[1]])
  })
  it('renvoie une liste vide sans résultat', () => {
    expect(searchExercises(list, 'squat')).toEqual([])
  })
})
