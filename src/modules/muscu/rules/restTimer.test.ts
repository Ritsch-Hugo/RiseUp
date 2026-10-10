import { describe, expect, it } from 'vitest'
import { adjustRest, elapsedSeconds, remainingSeconds, restProgress } from './restTimer'

describe('remainingSeconds', () => {
  it('arrondit au supérieur et ne descend pas sous 0', () => {
    expect(remainingSeconds(10_000, 0)).toBe(10)
    expect(remainingSeconds(10_000, 9_001)).toBe(1)
    expect(remainingSeconds(10_000, 12_000)).toBe(0)
  })
})

describe('adjustRest', () => {
  it('ajoute ou retire des secondes', () => {
    expect(adjustRest(60_000, 15, 0)).toBe(75_000)
    expect(adjustRest(60_000, -15, 0)).toBe(45_000)
  })
  it('ne passe jamais avant maintenant', () => {
    expect(adjustRest(10_000, -15, 5_000)).toBe(5_000)
  })
})

describe('restProgress', () => {
  it('va de 0 à 1', () => {
    expect(restProgress(90_000, 90, 0)).toBe(0)
    expect(restProgress(90_000, 90, 45_000)).toBe(0.5)
    expect(restProgress(90_000, 90, 100_000)).toBe(1)
  })
  it('1 si la durée est nulle', () => {
    expect(restProgress(0, 0, 0)).toBe(1)
  })
})

describe('elapsedSeconds', () => {
  it('compte les secondes entières', () => {
    expect(elapsedSeconds(1_000, 4_999)).toBe(3)
    expect(elapsedSeconds(5_000, 1_000)).toBe(0)
  })
})
