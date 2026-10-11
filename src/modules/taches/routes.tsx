import type { RouteObject } from 'react-router-dom'
import { ComingSoon } from '../../core/ui'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsPage } from './habits/HabitsPage'
import { TachesLayout } from './TachesLayout'
import { ProgressPage } from './xp/ProgressPage'
import { RewardPage } from './xp/RewardPage'
import { TaskDetailPage } from './tasks/TaskDetailPage'
import { UpcomingPage } from './tasks/UpcomingPage'
import { TaskFormPage } from './tasks/TaskFormPage'
import { TodayPage } from './tasks/TodayPage'

export const tachesRoute: RouteObject = {
  path: 'taches',
  element: <TachesLayout />,
  children: [
    { index: true, element: <TodayPage /> },
    { path: 'recompense', element: <RewardPage /> },
    { path: 'nouvelle', element: <TaskFormPage /> },
    { path: 'habitudes', element: <HabitsPage /> },
    { path: 'habitudes/nouvelle', element: <HabitFormPage /> },
    { path: 'habitudes/:id', element: <HabitFormPage /> },
    { path: ':id', element: <TaskDetailPage /> },
    { path: ':id/modifier', element: <TaskFormPage /> },
    { path: 'a-venir', element: <UpcomingPage /> },
    { path: 'quetes', element: <ComingSoon name="Quêtes" /> },
    { path: 'progres', element: <ProgressPage /> },
  ],
}
