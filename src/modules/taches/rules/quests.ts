import { addDays } from '../../../core/dates'
import {
  HABIT_MOMENTS,
  QUEST_BONUS_XP,
  TASK_DIFFICULTIES,
  type HabitMoment,
  type QuestKind,
  type QuestPeriod,
  type TaskDifficulty,
} from '../config'
import { isDone, type HabitLike, type LogMap } from './habits'
import { endOfWeek } from './tasks'

export type QuestParams = {
  difficulty?: TaskDifficulty
  category_id?: string
  moment?: HabitMoment
}

export type QuestLike = {
  period: QuestPeriod
  period_start: string
  kind: QuestKind
  params: unknown
  target: number
  manual_progress: number
}

/** Lit les paramètres enregistrés (jsonb) en ignorant tout ce qui n'est pas valide. */
export function parseQuestParams(value: unknown): QuestParams {
  const v = (value ?? {}) as Record<string, unknown>
  const params: QuestParams = {}
  if (TASK_DIFFICULTIES.some((d) => d.key === v.difficulty))
    params.difficulty = v.difficulty as TaskDifficulty
  if (typeof v.category_id === 'string') params.category_id = v.category_id
  if (HABIT_MOMENTS.some((m) => m.key === v.moment)) params.moment = v.moment as HabitMoment
  return params
}

/** Premier jour de la période qui contient `today` (le jour même, ou le lundi de la semaine). */
export function periodStart(period: QuestPeriod, today: string): string {
  return period === 'jour' ? today : addDays(endOfWeek(today), -6)
}

export const periodEnd = (period: QuestPeriod, start: string): string =>
  period === 'jour' ? start : addDays(start, 6)

/** Quête de la période en cours (les autres sont de l'historique). */
export const isActiveQuest = (
  q: Pick<QuestLike, 'period' | 'period_start'>,
  today: string
): boolean => q.period_start === periodStart(q.period, today)

/** Jours restants dans la semaine, aujourd'hui compris. */
export const weekDaysLeft = (today: string): number =>
  Math.round(
    (new Date(`${endOfWeek(today)}T00:00:00Z`).getTime() -
      new Date(`${today}T00:00:00Z`).getTime()) /
      86_400_000
  ) + 1

/** Heures avant minuit (Paris), arrondies au-dessus ; `nowMinutes` = minutes depuis minuit. */
export const hoursUntilMidnight = (nowMinutes: number): number =>
  Math.max(1, Math.ceil((1440 - nowMinutes) / 60))

export type QuestContext = {
  /** Tâches terminées (jour de fin en heure de Paris). */
  tasks: { category_id: string | null; difficulty: TaskDifficulty; completed_day: string }[]
  /** Habitudes validées : une entrée par habitude et par jour. */
  habitDays: { moment: HabitMoment; day: string }[]
}

/** Jours où chaque habitude est validée (cochée ou objectif atteint), avec son moment. */
export function validatedHabitDays(
  habits: (HabitLike & { id: string; moment: HabitMoment })[],
  logsByHabit: Map<string, LogMap>
): QuestContext['habitDays'] {
  return habits.flatMap((h) =>
    [...(logsByHabit.get(h.id) ?? new Map<string, number>())]
      .filter(([, value]) => isDone(h, value))
      .map(([day]) => ({ moment: h.moment, day }))
  )
}

/** Progression d'une quête sur sa période. */
export function questProgress(q: QuestLike, ctx: QuestContext): number {
  if (q.kind === 'manuelle') return q.manual_progress
  const start = q.period_start
  const end = periodEnd(q.period, start)
  const inPeriod = (day: string) => day >= start && day <= end
  const p = parseQuestParams(q.params)
  switch (q.kind) {
    case 'n_taches':
      return ctx.tasks.filter(
        (t) => inPeriod(t.completed_day) && (!p.difficulty || t.difficulty === p.difficulty)
      ).length
    case 'n_taches_categorie':
      return ctx.tasks.filter((t) => inPeriod(t.completed_day) && t.category_id === p.category_id)
        .length
    case 'habitudes_moment':
      return ctx.habitDays.filter((h) => inPeriod(h.day) && h.moment === p.moment).length
    case 'habitudes_jour':
      return ctx.habitDays.filter((h) => inPeriod(h.day)).length
  }
}

export const questBonus = (period: QuestPeriod): number => QUEST_BONUS_XP[period]

const DIFFICULTY_ADJ: Record<TaskDifficulty, [string, string]> = {
  facile: ['facile', 'faciles'],
  moyen: ['moyenne', 'moyennes'],
  difficile: ['difficile', 'difficiles'],
}
const MOMENT_PHRASE: Record<HabitMoment, string> = {
  matin: 'du matin',
  aprem: 'de l’après-midi',
  soir: 'du soir',
  libre: 'à tout moment',
}

/** Titre proposé pour une quête automatique : « Termine 3 tâches difficiles »… ('' pour une manuelle). */
export function suggestQuestTitle(
  kind: QuestKind,
  params: QuestParams,
  target: number,
  categoryName: string | null
): string {
  const one = target === 1
  switch (kind) {
    case 'n_taches': {
      const adj = params.difficulty ? ` ${DIFFICULTY_ADJ[params.difficulty][one ? 0 : 1]}` : ''
      return `Termine ${one ? 'une tâche' : `${target} tâches`}${adj}`
    }
    case 'n_taches_categorie':
      return `Termine ${one ? 'une tâche' : `${target} tâches`}${categoryName ? ` · ${categoryName}` : ''}`
    case 'habitudes_moment':
      return `Valide ${one ? 'une habitude' : `${target} habitudes`} ${params.moment ? MOMENT_PHRASE[params.moment] : ''}`.trim()
    case 'habitudes_jour':
      return `Valide ${one ? 'une habitude' : `${target} habitudes`}`
    case 'manuelle':
      return ''
  }
}

export type QuestForm = {
  period: QuestPeriod
  kind: QuestKind
  difficulty: TaskDifficulty | null
  categoryId: string | null
  moment: HabitMoment | null
  target: string
  title: string
  recurring: boolean
}

/** Valeurs prêtes à écrire, ou null si le formulaire est incomplet. `periodStartDay` = début de la période en cours. */
export function validateQuestForm(
  f: QuestForm,
  periodStartDay: string,
  categoryName: string | null
) {
  const target = Number(f.target.trim())
  if (!Number.isInteger(target) || target < 1) return null
  const params: QuestParams = {}
  if (f.kind === 'n_taches' && f.difficulty) params.difficulty = f.difficulty
  if (f.kind === 'n_taches_categorie') {
    if (!f.categoryId) return null
    params.category_id = f.categoryId
  }
  if (f.kind === 'habitudes_moment') {
    if (!f.moment) return null
    params.moment = f.moment
  }
  const title = f.title.trim() || suggestQuestTitle(f.kind, params, target, categoryName)
  if (title === '') return null
  return {
    title,
    period: f.period,
    period_start: periodStartDay,
    kind: f.kind,
    params,
    target,
    bonus_xp: questBonus(f.period),
    recurring: f.recurring,
  }
}
