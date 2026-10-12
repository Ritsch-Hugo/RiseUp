import { backupDue, backupLabel, daysSinceBackup } from './backup'

describe('sauvegarde', () => {
  it('compte les jours depuis le dernier export', () => {
    expect(daysSinceBackup(null, '2026-10-12')).toBeNull()
    expect(daysSinceBackup('2026-10-12', '2026-10-12')).toBe(0)
    expect(daysSinceBackup('2026-10-01', '2026-10-12')).toBe(11)
    expect(daysSinceBackup('2026-12-30', '2027-01-02')).toBe(3)
  })

  it('rappelle quand jamais fait ou trop ancien', () => {
    expect(backupDue(null)).toBe(true)
    expect(backupDue(13)).toBe(false)
    expect(backupDue(14)).toBe(true)
  })

  it('formule le texte', () => {
    expect(backupLabel(null)).toBe('Jamais exporté')
    expect(backupLabel(0)).toBe('Exporté aujourd’hui')
    expect(backupLabel(5)).toBe('Dernier export il y a 5 j')
  })
})
