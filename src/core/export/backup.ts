import { addDays } from '../dates'

/** Au-delà de ce nombre de jours sans export, l'accueil le rappelle (le plan gratuit n'a pas de sauvegarde fiable). */
export const BACKUP_REMINDER_DAYS = 14

const KEY = 'riseup:last-export'

/** Nombre de jours depuis le dernier export (0 = aujourd'hui) ; null s'il n'y en a jamais eu. */
export function daysSinceBackup(lastDay: string | null, today: string): number | null {
  if (!lastDay) return null
  let n = 0
  for (let d = lastDay; d < today && n < 36500; d = addDays(d, 1)) n++
  return n
}

/** Vrai quand il faut rappeler de sauvegarder (jamais fait, ou trop ancien). */
export function backupDue(days: number | null): boolean {
  return days === null || days >= BACKUP_REMINDER_DAYS
}

export function readLastBackup(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function writeLastBackup(day: string) {
  try {
    localStorage.setItem(KEY, day)
  } catch {
    // stockage indisponible : le rappel reviendra, sans conséquence
  }
}

/** Texte court pour l'accueil. */
export function backupLabel(days: number | null): string {
  if (days === null) return 'Jamais exporté'
  if (days === 0) return 'Exporté aujourd’hui'
  return `Dernier export il y a ${days} j`
}
