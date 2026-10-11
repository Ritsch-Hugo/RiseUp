import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsPage } from './habits/HabitsPage'
import { TaskDetailPage } from './tasks/TaskDetailPage'
import { UpcomingPage } from './tasks/UpcomingPage'
import { TaskFormPage } from './tasks/TaskFormPage'
import { TodayPage } from './tasks/TodayPage'

const tabs: Tab[] = [
  { to: '/taches', label: 'Aujourd’hui', icon: 'checkSquare', end: true },
  { to: '/taches/a-venir', label: 'À venir', icon: 'calendar' },
  { to: '/taches/quetes', label: 'Quêtes', icon: 'flag' },
  { to: '/taches/progres', label: 'Progrès', icon: 'trophy' },
]

export const tachesRoute: RouteObject = {
  path: 'taches',
  element: <ModuleLayout title="Tâches" tabs={tabs} />,
  children: [
    { index: true, element: <TodayPage /> },
    { path: 'nouvelle', element: <TaskFormPage /> },
    { path: 'habitudes', element: <HabitsPage /> },
    { path: 'habitudes/nouvelle', element: <HabitFormPage /> },
    { path: 'habitudes/:id', element: <HabitFormPage /> },
    { path: ':id', element: <TaskDetailPage /> },
    { path: ':id/modifier', element: <TaskFormPage /> },
    { path: 'a-venir', element: <UpcomingPage /> },
    { path: 'quetes', element: <ComingSoon name="Quêtes" /> },
    { path: 'progres', element: <ComingSoon name="Progrès" /> },
  ],
}
