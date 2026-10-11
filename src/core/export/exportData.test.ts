import { describe, expect, it, vi } from 'vitest'
import { EXPORT_TABLES, buildExport, exportFileName } from './exportData'

describe('export des données', () => {
  it('toutes les tables sont lues, une seule fois, sans doublon dans la liste', async () => {
    expect(new Set(EXPORT_TABLES).size).toBe(EXPORT_TABLES.length)
    const fetchRows = vi.fn(async (t: string) => [{ id: `${t}-1` }])
    const file = await buildExport(fetchRows, new Date('2026-10-11T10:00:00Z'))
    expect(fetchRows).toHaveBeenCalledTimes(EXPORT_TABLES.length)
    expect(file).toMatchObject({
      app: 'riseup',
      version: 1,
      exported_at: '2026-10-11T10:00:00.000Z',
    })
    expect(Object.keys(file.tables)).toEqual([...EXPORT_TABLES])
    expect(file.tables.taches_tasks).toEqual([{ id: 'taches_tasks-1' }])
  })
  it('une table vide donne une liste vide', async () => {
    const file = await buildExport(async () => [])
    expect(file.tables.nutri_water).toEqual([])
  })
  it('un échec de lecture fait échouer l’export entier', async () => {
    await expect(
      buildExport(async (t) => {
        if (t === 'muscu_sets') throw new Error('boom')
        return []
      })
    ).rejects.toThrow('boom')
  })
  it('nom de fichier daté', () => {
    expect(exportFileName('2026-10-11')).toBe('riseup-export-2026-10-11.json')
  })
})
