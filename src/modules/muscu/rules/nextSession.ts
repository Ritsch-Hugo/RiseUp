type ProgramLike = { id: string; sessions: { id: string }[] }

export type NextSession = { programId: string; sessionId: string }

/**
 * Prochaine séance : celle qui suit, dans l'ordre du programme, la dernière séance type effectuée
 * (retour au début après la dernière). Sans historique exploitable → première séance du premier
 * programme qui en a une. `programs` et leurs séances sont déjà triés par position.
 */
export function nextSession(
  programs: ProgramLike[],
  lastSessionId: string | null
): NextSession | null {
  const program = lastSessionId
    ? programs.find((p) => p.sessions.some((s) => s.id === lastSessionId))
    : undefined
  if (program) {
    const i = program.sessions.findIndex((s) => s.id === lastSessionId)
    return {
      programId: program.id,
      sessionId: program.sessions[(i + 1) % program.sessions.length]!.id,
    }
  }
  const first = programs.find((p) => p.sessions.length > 0)
  return first ? { programId: first.id, sessionId: first.sessions[0]!.id } : null
}
