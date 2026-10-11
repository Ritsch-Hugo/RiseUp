import { describe, expect, it } from 'vitest'
import {
  choiceForDue,
  dueDateFor,
  dueLabel,
  endOfWeek,
  groupUpcoming,
  nextOccurrence,
  parseRecurrence,
  relativeDue,
  splitToday,
  subtaskProgress,
  upcomingSubtitle,
  weekStrip,
  taskSubtitle,
  taskXp,
  validateTaskForm,
  type TaskForm,
  type TaskLike,
} from './tasks'

const today = '2026-10-11' // dimanche

const task = (p: Partial<TaskLike> & { title: string }): TaskLike => ({
  priority: 'normale',
  difficulty: 'facile',
  due_date: null,
  due_time: null,
  created_at: '2026-10-01T10:00:00Z',
  completed_at: null,
  ...p,
})

describe('taskXp', () => {
  it('10 / 25 / 50', () => {
    expect(taskXp('facile')).toBe(10)
    expect(taskXp('moyen')).toBe(25)
    expect(taskXp('difficile')).toBe(50)
  })
})

describe('endOfWeek', () => {
  it('dimanche de la semaine lundi → dimanche', () => {
    expect(endOfWeek('2026-10-05')).toBe('2026-10-11')
    expect(endOfWeek('2026-10-08')).toBe('2026-10-11')
    expect(endOfWeek('2026-10-11')).toBe('2026-10-11')
    expect(endOfWeek('2026-10-12')).toBe('2026-10-18')
  })
})

describe('splitToday', () => {
  const tasks = [
    task({ title: 'sans échéance' }),
    task({ title: 'en retard', due_date: '2026-10-09' }),
    task({ title: 'demain', due_date: '2026-10-12' }),
    task({ title: 'critique', priority: 'critique', due_date: today }),
    task({ title: 'basse', priority: 'basse', due_date: today }),
    task({ title: 'faite aujourd’hui', completed_at: '2026-10-11T09:00:00Z' }),
    task({ title: 'faite hier', completed_at: '2026-10-10T09:00:00Z' }),
    task({ title: 'faite plus tôt', completed_at: '2026-10-11T07:00:00Z' }),
  ]
  const { todo, done } = splitToday(tasks, today)
  it('à faire : sans échéance et échues, pas les futures, priorité d’abord', () => {
    expect(todo.map((t) => t.title)).toEqual(['critique', 'en retard', 'sans échéance', 'basse'])
    expect(todo.map((t) => t.title)).not.toContain('demain')
  })
  it('terminées : seulement aujourd’hui, la plus récente d’abord', () => {
    expect(done.map((t) => t.title)).toEqual(['faite aujourd’hui', 'faite plus tôt'])
  })
})

describe('dueLabel', () => {
  it('libellés', () => {
    expect(dueLabel({ due_date: null, due_time: null }, today)).toBe('sans échéance')
    expect(dueLabel({ due_date: today, due_time: '18:00:00' }, today)).toBe('aujourd’hui 18:00')
    expect(dueLabel({ due_date: '2026-10-12', due_time: null }, today)).toBe('demain')
    expect(dueLabel({ due_date: '2026-10-09', due_time: null }, today)).toBe('en retard')
    expect(dueLabel({ due_date: '2026-10-14', due_time: null }, today)).toBe('mer. 14 oct.')
  })
})

describe('taskSubtitle', () => {
  it('catégorie · échéance · priorité (sauf normale)', () => {
    expect(
      taskSubtitle({ due_date: today, due_time: '18:00:00', priority: 'haute' }, 'Études', today)
    ).toBe('Études · aujourd’hui 18:00 · priorité haute')
    expect(taskSubtitle({ due_date: null, due_time: null, priority: 'normale' }, null, today)).toBe(
      'sans échéance'
    )
  })
})

describe('échéance du formulaire', () => {
  it('dates selon le choix', () => {
    expect(dueDateFor('none', today, '')).toBeNull()
    expect(dueDateFor('today', today, '')).toBe(today)
    expect(dueDateFor('tomorrow', today, '')).toBe('2026-10-12')
    expect(dueDateFor('week', '2026-10-07', '')).toBe('2026-10-11')
    expect(dueDateFor('custom', today, '2026-11-02')).toBe('2026-11-02')
    expect(dueDateFor('custom', today, '')).toBeNull()
  })
  it('choix retrouvé depuis une date', () => {
    expect(choiceForDue(null, today)).toBe('none')
    expect(choiceForDue(today, today)).toBe('today')
    expect(choiceForDue('2026-10-12', today)).toBe('tomorrow')
    expect(choiceForDue('2026-10-20', today)).toBe('custom')
  })
})

describe('validateTaskForm', () => {
  const form: TaskForm = {
    title: '  Rapport  ',
    categoryId: 'c1',
    priority: 'haute',
    difficulty: 'difficile',
    due: 'today',
    customDate: '',
    time: '18:00',
    repeat: 'none',
    notes: '  ',
    subtasks: [],
  }
  it('valeurs nettoyées', () => {
    expect(validateTaskForm(form, today)).toEqual({
      title: 'Rapport',
      category_id: 'c1',
      priority: 'haute',
      difficulty: 'difficile',
      due_date: today,
      due_time: '18:00',
      recurrence: null,
      notes: null,
    })
  })
  it('récurrence et notes', () => {
    const v = validateTaskForm({ ...form, repeat: 'weekly', notes: ' à relire ' }, today)!
    expect(v.recurrence).toEqual({ type: 'weekly' })
    expect(v.notes).toBe('à relire')
  })
  it('refuse une récurrence sans échéance', () => {
    expect(validateTaskForm({ ...form, due: 'none', repeat: 'daily' }, today)).toBeNull()
  })
  it('heure ignorée sans échéance', () => {
    expect(validateTaskForm({ ...form, due: 'none' }, today)!.due_time).toBeNull()
  })
  it('refuse titre vide et date « choisir » vide', () => {
    expect(validateTaskForm({ ...form, title: '  ' }, today)).toBeNull()
    expect(validateTaskForm({ ...form, due: 'custom' }, today)).toBeNull()
  })
})

describe('récurrence', () => {
  it('lit la récurrence enregistrée', () => {
    expect(parseRecurrence({ type: 'daily' })).toEqual({ type: 'daily' })
    expect(parseRecurrence({ type: 'weekly' })).toEqual({ type: 'weekly' })
    expect(parseRecurrence({ type: 'monthly' })).toBeNull()
    expect(parseRecurrence(null)).toBeNull()
  })
  it('chaque jour : lendemain de l’échéance', () => {
    expect(nextOccurrence({ type: 'daily' }, '2026-10-11', '2026-10-11')).toBe('2026-10-12')
  })
  it('chaque semaine : même jour la semaine suivante', () => {
    expect(nextOccurrence({ type: 'weekly' }, '2026-10-11', '2026-10-11')).toBe('2026-10-18')
  })
  it('terminée en avance : on suit l’échéance, pas aujourd’hui', () => {
    expect(nextOccurrence({ type: 'daily' }, '2026-10-15', '2026-10-11')).toBe('2026-10-16')
  })
  it('terminée en retard : jamais d’occurrence dans le passé', () => {
    expect(nextOccurrence({ type: 'daily' }, '2026-10-05', '2026-10-11')).toBe('2026-10-12')
    expect(nextOccurrence({ type: 'weekly' }, '2026-10-01', '2026-10-11')).toBe('2026-10-15')
  })
})

describe('subtaskProgress', () => {
  it('terminées / total', () => {
    expect(subtaskProgress([{ done_at: 'x' }, { done_at: null }, { done_at: null }])).toEqual({
      done: 1,
      total: 3,
    })
    expect(subtaskProgress([])).toBeNull()
  })
})

describe('groupUpcoming', () => {
  const t = (title: string, due: string | null, extra: Partial<TaskLike> = {}) =>
    task({ title, due_date: due, ...extra })
  const sections = groupUpcoming(
    [
      t('demain 10h', '2026-10-12', { due_time: '10:00:00' }),
      t('demain journée', '2026-10-12'),
      t('mardi', '2026-10-13'),
      t('loin', '2026-10-30'),
      t('plus loin', '2026-11-20'),
      t('aujourd’hui', today),
      t('sans date', null),
      t('faite', '2026-10-12', { completed_at: '2026-10-11T08:00:00Z' }),
    ],
    today
  )
  it('demain, jours suivants, puis plus tard ; rien d’autre', () => {
    expect(sections.map((s) => s.key)).toEqual(['2026-10-12', '2026-10-13', 'later'])
    expect(sections[0]!.label).toBe('Demain · lundi 12 oct.')
    expect(sections[1]!.label).toBe('Mardi 13 oct.')
    expect(sections[2]!.label).toBe('Plus tard')
  })
  it('heure d’abord dans un jour ; plus tard trié par date', () => {
    expect(sections[0]!.tasks.map((x) => x.title)).toEqual(['demain journée', 'demain 10h'])
    expect(sections[2]!.tasks.map((x) => x.title)).toEqual(['loin', 'plus loin'])
  })
})

describe('upcomingSubtitle', () => {
  it('heure, journée entière, date dans « plus tard »', () => {
    expect(
      upcomingSubtitle(
        { due_date: '2026-10-12', due_time: '10:00:00', priority: 'normale' },
        'Études',
        false
      )
    ).toBe('Études · 10:00')
    expect(
      upcomingSubtitle(
        { due_date: '2026-10-12', due_time: null, priority: 'basse' },
        'Maison',
        false
      )
    ).toBe('Maison · toute la journée · priorité basse')
    expect(
      upcomingSubtitle(
        { due_date: '2026-10-30', due_time: null, priority: 'normale' },
        'Admin',
        true
      )
    ).toBe('Admin · 30 oct.')
  })
})

describe('weekStrip', () => {
  const strip = weekStrip(
    [
      task({ title: 'a', due_date: '2026-10-08', priority: 'basse' }),
      task({ title: 'b', due_date: '2026-10-08', priority: 'critique' }),
      task({ title: 'c', due_date: '2026-10-09', completed_at: '2026-10-09T10:00:00Z' }),
    ],
    today
  )
  it('7 jours lundi → dimanche, aujourd’hui repéré', () => {
    expect(strip.map((d) => d.number)).toEqual([5, 6, 7, 8, 9, 10, 11])
    expect(strip.map((d) => d.letter).join('')).toBe('LMMJVSD')
    expect(strip.find((d) => d.today)!.number).toBe(11)
  })
  it('pastille = priorité la plus haute des tâches ouvertes', () => {
    expect(strip[3]!.priority).toBe('critique')
    expect(strip[4]!.priority).toBeNull()
  })
})

describe('relativeDue', () => {
  it('même jour avec heure', () => {
    expect(relativeDue({ due_date: today, due_time: '18:00:00' }, today, 15 * 60)).toBe('dans 3 h')
    expect(relativeDue({ due_date: today, due_time: '18:00:00' }, today, 17 * 60 + 35)).toBe(
      'dans 25 min'
    )
    expect(relativeDue({ due_date: today, due_time: '09:00:00' }, today, 11 * 60)).toBe(
      'il y a 2 h'
    )
    expect(relativeDue({ due_date: today, due_time: null }, today, 600)).toBeNull()
  })
  it('autres jours', () => {
    expect(relativeDue({ due_date: '2026-10-14', due_time: null }, today, 0)).toBe('dans 3 jours')
    expect(relativeDue({ due_date: '2026-10-12', due_time: null }, today, 0)).toBe('dans 1 jour')
    expect(relativeDue({ due_date: '2026-10-09', due_time: null }, today, 0)).toBe(
      'en retard de 2 jours'
    )
    expect(relativeDue({ due_date: null, due_time: null }, today, 0)).toBeNull()
  })
})
