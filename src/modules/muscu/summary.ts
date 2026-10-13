import type { ModuleSummary } from '../../core/module'
import { usePrograms } from './programs/programQueries'
import { nextSession } from './rules/nextSession'
import { parisDay, weekStats } from './rules/week'
import { WEEKLY_GOAL } from './config'
import { usePastWorkouts } from './workout/historyQueries'
import { useOpenWorkout } from './workout/workoutQueries'

/** Résumé de l'accueil : séance en cours, sinon prochaine séance (ou séance déjà faite aujourd'hui). */
export function useSummary(): ModuleSummary | null {
  const { data: open, isPending: openPending } = useOpenWorkout()
  const { data: past } = usePastWorkouts()
  const { data: programs } = usePrograms()
  if (openPending || !past || !programs) return null
  const today = parisDay(new Date())
  const count = weekStats(past, today).count
  const progress = Math.min(1, count / WEEKLY_GOAL)
  const stat = { value: `${count}/${WEEKLY_GOAL}`, unit: 'cette semaine' }

  if (open) return { text: `Séance en cours : ${open.name}`, active: true, progress, stat }

  const doneToday = past.find((w) => parisDay(new Date(w.startedAt)) === today)
  if (doneToday)
    return { text: `Séance faite aujourd’hui : ${doneToday.name}`, active: false, progress, stat }

  const lastSessionId = past.find((w) => w.sessionId)?.sessionId ?? null
  const next = nextSession(programs, lastSessionId)
  if (!next) return { text: 'Aucun programme pour l’instant', active: false, progress, stat }
  const program = programs.find((p) => p.id === next.programId)!
  const session = program.sessions.find((s) => s.id === next.sessionId)!
  return { text: `Prochaine séance : ${session.name}`, active: true, progress, stat }
}
