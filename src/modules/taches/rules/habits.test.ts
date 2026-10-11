import { describe, expect, it } from 'vitest'
import {
  dueOn,
  habitStatus,
  habitStreak,
  habitSubtitle,
  isDone,
  isoWeekday,
  isPausedOn,
  pausedSince,
  validateHabitForm,
  weekdaysLabel,
  weekProgress,
  type HabitForm,
  type HabitLike,
  type LogMap,
} from './habits'

const today = '2026-10-11' // dimanche
const daily: HabitLike = {
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  type: 'fait',
  target: null,
  archived_at: null,
}
const logs = (entries: Record<string, number>): LogMap => new Map(Object.entries(entries))

describe('isoWeekday', () => {
  it('lundi = 1, dimanche = 7', () => {
    expect(isoWeekday('2026-10-05')).toBe(1)
    expect(isoWeekday('2026-10-11')).toBe(7)
  })
})

describe('isDone', () => {
  it('fait : au moins 1 ; compteur : objectif atteint', () => {
    expect(isDone(daily, 1)).toBe(true)
    expect(isDone(daily, 0)).toBe(false)
    const counter = { type: 'compteur' as const, target: 20 }
    expect(isDone(counter, 19)).toBe(false)
    expect(isDone(counter, 20)).toBe(true)
    expect(isDone(counter, 25)).toBe(true)
  })
})

describe('pauses', () => {
  const pauses = [
    { start_day: '2026-10-05', end_day: '2026-10-07' },
    { start_day: '2026-10-10', end_day: null },
  ]
  it('jour en pause (bornes incluses, pause ouverte)', () => {
    expect(isPausedOn(pauses, '2026-10-05')).toBe(true)
    expect(isPausedOn(pauses, '2026-10-07')).toBe(true)
    expect(isPausedOn(pauses, '2026-10-08')).toBe(false)
    expect(isPausedOn(pauses, '2026-10-11')).toBe(true)
  })
  it('statut et ancienneté de la pause', () => {
    expect(habitStatus({ archived_at: null }, pauses, today)).toBe('paused')
    expect(habitStatus({ archived_at: null }, [], today)).toBe('active')
    expect(habitStatus({ archived_at: 'x' }, pauses, today)).toBe('archived')
    expect(pausedSince(pauses, today)).toBe(1)
    expect(pausedSince([], today)).toBeNull()
  })
  it('à faire aujourd’hui seulement si prévue, active et pas en pause', () => {
    expect(dueOn(daily, [], today)).toBe(true)
    expect(dueOn(daily, pauses, today)).toBe(false)
    expect(dueOn({ ...daily, weekdays: [1] }, [], today)).toBe(false)
    expect(dueOn({ ...daily, archived_at: 'x' }, [], today)).toBe(false)
  })
})

describe('habitStreak', () => {
  it('jours consécutifs faits, aujourd’hui compris', () => {
    expect(
      habitStreak(daily, [], logs({ '2026-10-11': 1, '2026-10-10': 1, '2026-10-09': 1 }), today)
    ).toBe(3)
  })
  it('aujourd’hui pas encore fait ne casse pas', () => {
    expect(habitStreak(daily, [], logs({ '2026-10-10': 1, '2026-10-09': 1 }), today)).toBe(2)
  })
  it('un jour prévu manqué casse', () => {
    expect(habitStreak(daily, [], logs({ '2026-10-11': 1, '2026-10-09': 1 }), today)).toBe(1)
  })
  it('jours non prévus ignorés (lundi → vendredi)', () => {
    const weekdays = { ...daily, weekdays: [1, 2, 3, 4, 5] }
    // vendredi 9, jeudi 8 faits ; week-end ignoré ; aujourd'hui dimanche non prévu
    expect(habitStreak(weekdays, [], logs({ '2026-10-09': 1, '2026-10-08': 1 }), today)).toBe(2)
  })
  it('jours en pause ignorés : la série est gelée, pas perdue', () => {
    const pauses = [{ start_day: '2026-10-08', end_day: '2026-10-10' }]
    expect(habitStreak(daily, pauses, logs({ '2026-10-07': 1, '2026-10-06': 1 }), today)).toBe(2)
  })
  it('compteur : seulement si l’objectif est atteint', () => {
    const counter: HabitLike = { ...daily, type: 'compteur', target: 20 }
    expect(habitStreak(counter, [], logs({ '2026-10-10': 20, '2026-10-09': 12 }), today)).toBe(1)
  })
  it('0 sans historique', () => expect(habitStreak(daily, [], logs({}), today)).toBe(0))
})

describe('weekProgress', () => {
  it('jours prévus / faits sur la semaine lundi → dimanche', () => {
    expect(
      weekProgress(daily, [], logs({ '2026-10-05': 1, '2026-10-06': 1, '2026-10-12': 1 }), today)
    ).toEqual({
      planned: 7,
      done: 2,
    })
  })
  it('les jours en pause ne comptent pas', () => {
    const pauses = [{ start_day: '2026-10-05', end_day: '2026-10-06' }]
    expect(weekProgress(daily, pauses, logs({}), today).planned).toBe(5)
  })
})

describe('libellés', () => {
  it('jours', () => {
    expect(weekdaysLabel([1, 2, 3, 4, 5, 6, 7])).toBe('Tous les jours')
    expect(weekdaysLabel([5, 4, 3, 2, 1])).toBe('Du lundi au vendredi')
    expect(weekdaysLabel([6, 7])).toBe('Week-end')
    expect(weekdaysLabel([1, 3, 5])).toBe('lun., mer., ven.')
  })
  it('sous-titre', () => {
    expect(
      habitSubtitle({
        weekdays: [1, 2, 3, 4, 5],
        moment: 'soir',
        type: 'compteur',
        target: 20,
        archived_at: null,
      })
    ).toBe('Du lundi au vendredi · Soir · compteur')
  })
})

describe('validateHabitForm', () => {
  const form: HabitForm = {
    name: ' Lire 20 pages ',
    weekdays: [5, 1, 2, 3, 4],
    moment: 'soir',
    type: 'compteur',
    target: '20',
    unit: ' pages ',
    difficulty: 'facile',
    reminderOn: true,
    reminderTime: '21:00',
  }
  it('valeurs nettoyées, jours triés', () => {
    expect(validateHabitForm(form)).toEqual({
      name: 'Lire 20 pages',
      weekdays: [1, 2, 3, 4, 5],
      moment: 'soir',
      type: 'compteur',
      target: 20,
      unit: 'pages',
      difficulty: 'facile',
      reminder_time: '21:00',
    })
  })
  it('type « fait » : pas d’objectif ni d’unité ; rappel coupé → null', () => {
    const v = validateHabitForm({ ...form, type: 'fait', reminderOn: false })!
    expect(v.target).toBeNull()
    expect(v.unit).toBeNull()
    expect(v.reminder_time).toBeNull()
  })
  it('refuse nom vide, aucun jour, objectif invalide, heure de rappel vide', () => {
    expect(validateHabitForm({ ...form, name: ' ' })).toBeNull()
    expect(validateHabitForm({ ...form, weekdays: [] })).toBeNull()
    expect(validateHabitForm({ ...form, target: '0' })).toBeNull()
    expect(validateHabitForm({ ...form, target: '2,5' })).toBeNull()
    expect(validateHabitForm({ ...form, reminderTime: '' })).toBeNull()
  })
})
