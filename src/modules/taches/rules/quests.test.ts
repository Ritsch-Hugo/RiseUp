import { describe, expect, it } from 'vitest'
import {
  hoursUntilMidnight,
  isActiveQuest,
  parseQuestParams,
  periodEnd,
  periodStart,
  questBonus,
  questProgress,
  suggestQuestTitle,
  validatedHabitDays,
  validateQuestForm,
  weekDaysLeft,
  type QuestContext,
  type QuestForm,
  type QuestLike,
} from './quests'

const today = '2026-10-07' // mercredi

describe('périodes', () => {
  it('jour = aujourd’hui ; semaine = lundi → dimanche', () => {
    expect(periodStart('jour', today)).toBe(today)
    expect(periodStart('semaine', today)).toBe('2026-10-05')
    expect(periodEnd('semaine', '2026-10-05')).toBe('2026-10-11')
    expect(periodEnd('jour', today)).toBe(today)
  })
  it('quête de la période en cours seulement', () => {
    expect(isActiveQuest({ period: 'jour', period_start: today }, today)).toBe(true)
    expect(isActiveQuest({ period: 'jour', period_start: '2026-10-06' }, today)).toBe(false)
    expect(isActiveQuest({ period: 'semaine', period_start: '2026-10-05' }, today)).toBe(true)
    expect(isActiveQuest({ period: 'semaine', period_start: '2026-09-28' }, today)).toBe(false)
  })
  it('jours restants dans la semaine, aujourd’hui compris', () => {
    expect(weekDaysLeft(today)).toBe(5)
    expect(weekDaysLeft('2026-10-11')).toBe(1)
    expect(weekDaysLeft('2026-10-05')).toBe(7)
  })
  it('heures avant minuit', () => {
    expect(hoursUntilMidnight(18 * 60)).toBe(6)
    expect(hoursUntilMidnight(23 * 60 + 59)).toBe(1)
  })
})

describe('bonus fixe', () => {
  it('+20 (jour) et +75 (semaine)', () => {
    expect(questBonus('jour')).toBe(20)
    expect(questBonus('semaine')).toBe(75)
  })
})

describe('parseQuestParams', () => {
  it('garde seulement les valeurs valides', () => {
    expect(
      parseQuestParams({ difficulty: 'difficile', moment: 'soir', category_id: 'c1', x: 1 })
    ).toEqual({
      difficulty: 'difficile',
      moment: 'soir',
      category_id: 'c1',
    })
    expect(parseQuestParams({ difficulty: 'énorme', moment: 3 })).toEqual({})
    expect(parseQuestParams(null)).toEqual({})
  })
})

describe('questProgress', () => {
  const ctx: QuestContext = {
    tasks: [
      { category_id: 'c1', difficulty: 'facile', completed_day: '2026-10-07' },
      { category_id: 'c1', difficulty: 'difficile', completed_day: '2026-10-07' },
      { category_id: 'c2', difficulty: 'difficile', completed_day: '2026-10-06' },
      { category_id: 'c1', difficulty: 'moyen', completed_day: '2026-10-01' },
    ],
    habitDays: [
      { moment: 'matin', day: '2026-10-07' },
      { moment: 'soir', day: '2026-10-07' },
      { moment: 'matin', day: '2026-10-06' },
      { moment: 'matin', day: '2026-09-30' },
    ],
  }
  const quest = (p: Partial<QuestLike>): QuestLike => ({
    period: 'jour',
    period_start: today,
    kind: 'n_taches',
    params: {},
    target: 3,
    manual_progress: 0,
    ...p,
  })

  it('N tâches du jour', () => expect(questProgress(quest({}), ctx)).toBe(2))
  it('N tâches de la semaine', () =>
    expect(questProgress(quest({ period: 'semaine', period_start: '2026-10-05' }), ctx)).toBe(3))
  it('filtre difficulté', () => {
    expect(questProgress(quest({ params: { difficulty: 'difficile' } }), ctx)).toBe(1)
    expect(
      questProgress(
        quest({
          period: 'semaine',
          period_start: '2026-10-05',
          params: { difficulty: 'difficile' },
        }),
        ctx
      )
    ).toBe(2)
  })
  it('tâches d’une catégorie', () => {
    expect(
      questProgress(quest({ kind: 'n_taches_categorie', params: { category_id: 'c1' } }), ctx)
    ).toBe(2)
  })
  it('habitudes d’un moment et du jour', () => {
    const week = { period: 'semaine' as const, period_start: '2026-10-05' }
    expect(
      questProgress(quest({ ...week, kind: 'habitudes_moment', params: { moment: 'matin' } }), ctx)
    ).toBe(2)
    expect(questProgress(quest({ ...week, kind: 'habitudes_jour' }), ctx)).toBe(3)
    expect(questProgress(quest({ kind: 'habitudes_jour' }), ctx)).toBe(2)
  })
  it('manuelle : valeur saisie', () => {
    expect(questProgress(quest({ kind: 'manuelle', manual_progress: 4 }), ctx)).toBe(4)
  })
})

describe('validatedHabitDays', () => {
  it('jours où l’habitude est faite (compteur : objectif atteint)', () => {
    const habits = [
      {
        id: 'a',
        moment: 'matin' as const,
        weekdays: [1],
        type: 'fait' as const,
        target: null,
        archived_at: null,
      },
      {
        id: 'b',
        moment: 'soir' as const,
        weekdays: [1],
        type: 'compteur' as const,
        target: 20,
        archived_at: null,
      },
    ]
    const logs = new Map([
      ['a', new Map([['2026-10-07', 1]])],
      [
        'b',
        new Map([
          ['2026-10-07', 12],
          ['2026-10-06', 20],
        ]),
      ],
    ])
    expect(validatedHabitDays(habits, logs)).toEqual([
      { moment: 'matin', day: '2026-10-07' },
      { moment: 'soir', day: '2026-10-06' },
    ])
  })
})

describe('suggestQuestTitle', () => {
  it('titres automatiques', () => {
    expect(suggestQuestTitle('n_taches', {}, 3, null)).toBe('Termine 3 tâches')
    expect(suggestQuestTitle('n_taches', { difficulty: 'difficile' }, 1, null)).toBe(
      'Termine une tâche difficile'
    )
    expect(suggestQuestTitle('n_taches', { difficulty: 'moyen' }, 2, null)).toBe(
      'Termine 2 tâches moyennes'
    )
    expect(suggestQuestTitle('n_taches_categorie', {}, 5, 'Études')).toBe(
      'Termine 5 tâches · Études'
    )
    expect(suggestQuestTitle('habitudes_moment', { moment: 'matin' }, 3, null)).toBe(
      'Valide 3 habitudes du matin'
    )
    expect(suggestQuestTitle('habitudes_jour', {}, 4, null)).toBe('Valide 4 habitudes')
    expect(suggestQuestTitle('manuelle', {}, 3, null)).toBe('')
  })
})

describe('validateQuestForm', () => {
  const form: QuestForm = {
    period: 'jour',
    kind: 'n_taches',
    difficulty: 'difficile',
    categoryId: null,
    moment: null,
    target: '2',
    title: '',
    recurring: true,
  }
  it('valeurs, titre automatique, bonus fixe', () => {
    expect(validateQuestForm(form, today, null)).toEqual({
      title: 'Termine 2 tâches difficiles',
      period: 'jour',
      period_start: today,
      kind: 'n_taches',
      params: { difficulty: 'difficile' },
      target: 2,
      bonus_xp: 20,
      recurring: true,
    })
  })
  it('titre saisi prioritaire ; semaine = +75', () => {
    const v = validateQuestForm(
      { ...form, period: 'semaine', title: ' Mon défi ' },
      '2026-10-05',
      null
    )!
    expect(v.title).toBe('Mon défi')
    expect(v.bonus_xp).toBe(75)
  })
  it('refuse objectif invalide, catégorie/moment manquants, manuelle sans titre', () => {
    expect(validateQuestForm({ ...form, target: '0' }, today, null)).toBeNull()
    expect(validateQuestForm({ ...form, target: '2,5' }, today, null)).toBeNull()
    expect(validateQuestForm({ ...form, kind: 'n_taches_categorie' }, today, null)).toBeNull()
    expect(validateQuestForm({ ...form, kind: 'habitudes_moment' }, today, null)).toBeNull()
    expect(validateQuestForm({ ...form, kind: 'manuelle' }, today, null)).toBeNull()
    expect(
      validateQuestForm({ ...form, kind: 'manuelle', title: 'Courir' }, today, null)
    ).not.toBeNull()
  })
  it('les paramètres qui ne concernent pas le type sont ignorés', () => {
    const v = validateQuestForm(
      { ...form, kind: 'habitudes_jour', difficulty: 'facile' },
      today,
      null
    )!
    expect(v.params).toEqual({})
  })
})
