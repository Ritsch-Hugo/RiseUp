import { describe, expect, it } from 'vitest'
import {
  choiceForDue,
  dueDateFor,
  dueLabel,
  endOfWeek,
  splitToday,
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
  }
  it('valeurs nettoyées', () => {
    expect(validateTaskForm(form, today)).toEqual({
      title: 'Rapport',
      category_id: 'c1',
      priority: 'haute',
      difficulty: 'difficile',
      due_date: today,
      due_time: '18:00',
    })
  })
  it('heure ignorée sans échéance', () => {
    expect(validateTaskForm({ ...form, due: 'none' }, today)!.due_time).toBeNull()
  })
  it('refuse titre vide et date « choisir » vide', () => {
    expect(validateTaskForm({ ...form, title: '  ' }, today)).toBeNull()
    expect(validateTaskForm({ ...form, due: 'custom' }, today)).toBeNull()
  })
})
