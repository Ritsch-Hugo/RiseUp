import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'
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
    { path: ':id/modifier', element: <TaskFormPage /> },
    { path: 'a-venir', element: <ComingSoon name="À venir" /> },
    { path: 'quetes', element: <ComingSoon name="Quêtes" /> },
    { path: 'progres', element: <ComingSoon name="Progrès" /> },
  ],
}
