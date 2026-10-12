import { fetchAll } from './fetchAll'

const rows = (n: number) => Array.from({ length: n }, (_, i) => i)
const source = (all: number[]) => (from: number, to: number) =>
  Promise.resolve({ data: all.slice(from, to + 1), error: null })

describe('fetchAll', () => {
  it('enchaîne les pages jusqu’à la dernière', async () => {
    expect(await fetchAll(source(rows(2500)))).toHaveLength(2500)
  })

  it('s’arrête sur une page pleine suivie d’une page vide', async () => {
    expect(await fetchAll(source(rows(1000)))).toHaveLength(1000)
  })

  it('gère le vide', async () => {
    expect(await fetchAll(source([]))).toEqual([])
  })

  it('propage l’erreur', async () => {
    const error = new Error('boom')
    await expect(fetchAll(() => Promise.resolve({ data: null, error }))).rejects.toBe(error)
  })
})
